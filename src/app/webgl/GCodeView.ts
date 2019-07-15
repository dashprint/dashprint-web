import { GLView, ProgramInfo, LightingProgramInfo } from './GLView';
import { AnalyzedGCode, GCodeLayer } from '../gcode.service';
import { Renderable } from './Renderable';
import * as vec3 from "gl-matrix-vec3";
import { Triangles } from './Triangles';
import { Lines } from './Lines';

const mmScale = 200;

export class GCodeView extends GLView {
	private gcode: AnalyzedGCode = null;
	private layers: RenderableLayer[];
	private axes: Lines;

	constructor(canvas: HTMLCanvasElement) {
		super(canvas);
		this.camera.cameraRotateButton = 0; // left button
		this.camera.cameraMoveButton = 2; // right button
		this.camera.lookAt[0] = 1.5/2;
		this.camera.lookAt[1] = 0;
		this.camera.lookAt[2] = -1.5/2;
		this.camera.xAngle = 0;
	}

	fillScene() {
		let basePlane = Triangles.createPlane();
		basePlane.color = new Float32Array([0.95, 0.95, 0.95, 1]);

		let scale = new Float32Array([1.5, 1.5, 1.5]);

		basePlane.setScale(scale);
		basePlane.position[0] = scale[0]/2;
		basePlane.position[2] = -scale[2]/2;
		
		this.addRenderable(basePlane);

		this.axes = new Lines([], [], 2);
        this.axes.addLine(0, 0, 0, 0.1, 0, 0, GLView.glColor(255, 0, 0, 255));
        this.axes.addLine(0, 0, 0, 0, 0, -0.1, GLView.glColor(0, 255, 0, 255));
        this.axes.addLine(0, 0, 0, 0, 0.1, 0, GLView.glColor(0, 0, 255, 255));
        this.addRenderable(this.axes);
	}

	public show(gcode: AnalyzedGCode) {
		this.gcode = gcode;

		if (this.layers) {
			this.layers.forEach(l => this.removeRenderable(l));
			this.layers = null;
		}

		if (gcode) {
			let scale = new Float32Array([1/mmScale, 1/mmScale, 1/mmScale]);
			let segmentCount = 0;

			// Update the renderable list
			this.layers = gcode.layers.map<RenderableLayer>(l => {
				let r = new RenderableLayer(l, 0.4);
				r.setScale(scale);
				segmentCount += l.lines.length;
				this.addRenderable(r);
				return r;
			});

			console.debug("Segment count: " + segmentCount);
		}

		this.requestRender();
	}
}

// How many subdivisions in RenderableLayer circles
const CIRCLE_FN = 10;

class RenderableLayer extends Renderable {
	private vertices: Float32Array;
	private normals: Float32Array;
	private indicesTriangleFans: Uint16Array;
	private indicesTriangleStrips: Uint16Array;

	private vertexBuffer: WebGLBuffer;
	private indexFanBuffer: WebGLBuffer;
	private indexStripBuffer: WebGLBuffer;
	private normalBuffer: WebGLBuffer;

	// Next positions during vertex generation
	private verticesIndex = 0;
	private fanIndicesIndex = 0;
	private stripIndicesIndex = 0;

	public color: Float32Array = new Float32Array([0.3, 0.3, 1, 1]);

	constructor(private layer: GCodeLayer, private thickness: number) {
		super();

		let separateExtrusionCount = this.countSeparateExtrusions();

		this.vertices = new Float32Array((CIRCLE_FN+1)*3 * (layer.lines.length*2));
		this.normals = new Float32Array(this.vertices.length);

		this.indicesTriangleFans = new Uint16Array(2*layer.lines.length*(CIRCLE_FN+3)); // +1 for primitive restart
		this.indicesTriangleStrips = new Uint16Array((layer.lines.length*2-separateExtrusionCount)*(CIRCLE_FN+3)*2); // +1 for primitive restart

		let normal = vec3.create();
		let tmp1 = vec3.create();
		let tmp2 = vec3.create();
		
		for (let i = 0; i < layer.lines.length; i++) {
			this.lineNormal(normal, tmp1, tmp2, i);
			this.produceCircle(tmp1, normal, false);

			this.produceConnectingLines();

			this.produceCircle(tmp2, normal, true);

			if (i+1 < layer.lines.length) {
				if (layer.lines[i][2] === layer.lines[i+1][0] && layer.lines[i][3] === layer.lines[i+1][1]) {
					this.produceConnectingLines();
				}
			}
		}
	}

	// Primitives restart in WebGL: https://github.com/KhronosGroup/glTF/issues/1142

	private produceConnectingLines() {
		const prevCircleIndex = this.verticesIndex/3 - CIRCLE_FN;
		const nextCircleIndex = this.verticesIndex/3 + 1; // +1 to skip the center point

		// CCW order
		for (let i = 0; i <= CIRCLE_FN; i++) {
			this.indicesTriangleStrips[this.stripIndicesIndex++] = prevCircleIndex + i % CIRCLE_FN;
			this.indicesTriangleStrips[this.stripIndicesIndex++] = nextCircleIndex + (CIRCLE_FN-i) % CIRCLE_FN;
		}

		// Primitives restart
		this.indicesTriangleStrips[this.stripIndicesIndex++] = 0xffff;
	}

	// Count the number of separate lines, where the start of the next line segment
	// doesn't match the end of the previous one).
	private countSeparateExtrusions(): number {
		let lastX, lastY;
		let count = 0;

		for (let i = 0; i < this.layer.lines.length; i++) {
			if (this.layer.lines[i][0] !== lastX || this.layer.lines[i][1] !== lastY)
				count++;
			
			lastX = this.layer.lines[i][2];
			lastY = this.layer.lines[i][3];
		}

		return count;
	}

	// center and normal define the plane
	// index points into this.vertices
	private produceCircle(center, normal, endCircle: boolean) {
		if (this.verticesIndex % 3 !== 0)
			throw new Error("Invalid verticesIndex!");

		let tmp1 = vec3.create();
		let tmp2 = vec3.create();

		// Make a perpendicular vector to our plane normal
		//RenderableLayer.findPerpendicular(tmp1, normal);
		// Make another orthogonal vector
		//vec3.cross(tmp2, tmp1, normal);
		tmp1[0] = 0;
		tmp1[1] = 1;
		tmp1[2] = 0;

		tmp2[0] = normal[2];
		tmp2[1] = normal[1];
		tmp2[2] = normal[0];

		// Generate a circle
		const r = this.thickness/2;
		let initialVertexIndex = this.verticesIndex;

		// center point
		this.indicesTriangleFans[this.fanIndicesIndex++] = this.verticesIndex / 3;

		this.normals[this.verticesIndex] = endCircle ? normal[0] : -normal[0];
		this.vertices[this.verticesIndex++] = center[0];
		this.normals[this.verticesIndex] = endCircle ? normal[1] : -normal[1];
		this.vertices[this.verticesIndex++] = center[1];
		this.normals[this.verticesIndex] = endCircle ? normal[2] : -normal[2];
		this.vertices[this.verticesIndex++] = center[2];

		let vertexNormal = vec3.create();
		let vertexDiff = vec3.create();

		for (let i = 0; i < CIRCLE_FN; i++) {
			let fi = (2*Math.PI)/CIRCLE_FN*i; // CCW direction
			if (!endCircle)
				fi = -fi;

			let c = r * Math.cos(fi);
			let s = r * Math.sin(fi);

			this.indicesTriangleFans[this.fanIndicesIndex++] = this.verticesIndex / 3;

			vertexDiff[0] = -(c*tmp1[0] + s*tmp2[0]);
			vertexDiff[1] = c*tmp1[1] + s*tmp2[1];
			vertexDiff[2] = c*tmp1[2] + s*tmp2[2];

			vec3.normalize(vertexNormal, vertexDiff);

			this.normals[this.verticesIndex] = vertexNormal[0];
			this.vertices[this.verticesIndex++] = center[0] + vertexDiff[0];
			this.normals[this.verticesIndex] = vertexNormal[1];
			this.vertices[this.verticesIndex++] = center[1] + vertexDiff[1];
			this.normals[this.verticesIndex] = vertexNormal[2];
			this.vertices[this.verticesIndex++] = center[2] + vertexDiff[2];
		}

		this.indicesTriangleFans[this.fanIndicesIndex++] = this.verticesIndex / 3 - CIRCLE_FN;
		// primitives restart
		this.indicesTriangleFans[this.fanIndicesIndex++] = 0xffff;
	}

	private lineNormal(normal, vecStart, vecEnd, index: number, index2?: number) {
		let line = this.layer.lines[index];

		// Create plane normal out of a flat line on this layer
		// swapping/inverting YZ as we go.
		vecStart[0] = line[0];
		vecStart[1] = this.layer.z;
		vecStart[2] = -line[1];

		if (index2 === undefined) {
			vecEnd[0] = line[2];
			vecEnd[1] = this.layer.z;
			vecEnd[2] = -line[3];
		} else {
			let line2 = this.layer.lines[index2];
			vecEnd[0] = line2[2];
			vecEnd[1] = this.layer.z;
			vecEnd[2] = -line2[3];
		}

		vec3.sub(normal, vecEnd, vecStart);
		vec3.normalize(normal, normal);
	}

	public renderWithLighting(gl: WebGLRenderingContext, programInfo: LightingProgramInfo) {
		super.render(gl, programInfo);

		gl.enable(gl.CULL_FACE);

		gl.enableVertexAttribArray(programInfo.vertexPosition);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
		gl.vertexAttribPointer(programInfo.vertexPosition, 3, gl.FLOAT, false, 0, 0);
		
		gl.enableVertexAttribArray(programInfo.normal);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.vertexAttribPointer(programInfo.normal, 3, gl.FLOAT, false, 0, 0);

		gl.vertexAttrib4fv(programInfo.vertexColor, this.color);
		gl.uniform4f(programInfo.lightColor, 1, 1, 1, 1);

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexFanBuffer);
		gl.drawElements(gl.TRIANGLE_FAN, this.indicesTriangleFans.length, gl.UNSIGNED_SHORT, 0);
		// if (gl.getError() != gl.NO_ERROR)
		//	console.error("WebGL error #1");

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexStripBuffer);
		gl.drawElements(gl.TRIANGLE_STRIP, this.indicesTriangleStrips.length, gl.UNSIGNED_SHORT, 0);
		//if (gl.getError() != gl.NO_ERROR)
		//	console.error("WebGL error #2");
		
		gl.bindBuffer(gl.ARRAY_BUFFER, null);
		gl.disable(gl.CULL_FACE);
	}

	allocate(gl: WebGLRenderingContext) {
		super.allocate(gl);

        if (!this.vertexBuffer)
			this.vertexBuffer = gl.createBuffer();
		if (!this.normalBuffer)
            this.normalBuffer = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.normals, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

		if (!this.indexFanBuffer) {
			this.indexFanBuffer = gl.createBuffer();
			this.indexStripBuffer = gl.createBuffer();
		}

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexFanBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indicesTriangleFans, gl.STATIC_DRAW);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexStripBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indicesTriangleStrips, gl.STATIC_DRAW);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
	}

	deallocate(gl: WebGLRenderingContext) {
		if (this.vertexBuffer) {
            gl.deleteBuffer(this.vertexBuffer);
            this.vertexBuffer = null;
		}
		if (this.normalBuffer) {
            gl.deleteBuffer(this.normalBuffer);
            this.normalBuffer = null;
		}
		
		if (this.indexFanBuffer) {
			gl.deleteBuffer(this.indexFanBuffer);
			gl.deleteBuffer(this.indexStripBuffer);
			this.indexFanBuffer = null;
			this.indexStripBuffer = null;
		}
	}
}
