import { GLView, ProgramInfo } from './GLView';
import { AnalyzedGCode, GCodeLayer } from '../gcode.service';
import { Renderable } from './Renderable';
import * as vec3 from "gl-matrix-vec3";
import { Triangles } from './Triangles';

const mmScale = 200;

export class GCodeView extends GLView {
	private gcode: AnalyzedGCode = null;
	private layers: RenderableLayer[];

	constructor(canvas: HTMLCanvasElement) {
		super(canvas);
		this.camera.cameraMoveButton = 0; // left button
	}

	fillScene() {
		let basePlane = Triangles.createPlane();
		basePlane.color = new Float32Array([0.95, 0.95, 0.95, 1]);

		let scale = new Float32Array([1.5, 1.5, 1.5]);

		basePlane.setScale(scale);
		
		this.addRenderable(basePlane);
	}

	public show(gcode: AnalyzedGCode) {
		this.gcode = gcode;

		if (this.layers) {
			this.layers.forEach(l => this.removeRenderable(l));
			this.layers = null;
		}

		if (gcode) {
			let scale = new Float32Array([1/mmScale, 1/mmScale, 1/mmScale]);

			// Update the renderable list
			this.layers = gcode.layers.map<RenderableLayer>(l => {
				let r = new RenderableLayer(l, 0.4);
				r.setScale(scale);
				this.addRenderable(r);
				return r;
			});
		}

		this.requestRender();
	}
}

// How many subdivisions in RenderableLayer circles
const CIRCLE_FN = 10;

class RenderableLayer extends Renderable {
	private vertices: Float32Array;
	private indicesTriangleFans: Uint16Array;
	private indicesTriangleStrips: Uint16Array;

	private vertexBuffer: WebGLBuffer;
	private indexFanBuffer: WebGLBuffer;
	private indexStripBuffer: WebGLBuffer;

	// Next positions during vertex generation
	private verticesIndex = 0;
	private fanIndicesIndex = 0;
	private stripIndicesIndex = 0;

	public color: Float32Array = new Float32Array([0, 0, 0, 1]);

	constructor(private layer: GCodeLayer, private thickness: number) {
		super();

		let separateExtrusionCount = this.countSeparateExtrusions();

		this.vertices = new Float32Array((CIRCLE_FN+1)*3 * (layer.lines.length*2));
		this.indicesTriangleFans = new Uint16Array(2*layer.lines.length*(CIRCLE_FN+2)); // +1 for primitive restart
		this.indicesTriangleStrips = new Uint16Array((layer.lines.length*2-separateExtrusionCount)*(CIRCLE_FN+1)*2); // +1 for primitive restart

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
		for (let i = 0; i < CIRCLE_FN; i++) {
			this.indicesTriangleStrips[this.stripIndicesIndex++] = nextCircleIndex + i;
			this.indicesTriangleStrips[this.stripIndicesIndex++] = prevCircleIndex + i;
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
		RenderableLayer.findPerpendicular(tmp1, normal);
		// Make another orthogonal vector
		vec3.cross(tmp2, tmp1, normal);

		// Generate a circle
		const r = this.thickness/2;
		let initialVertexIndex = this.verticesIndex;

		// center point
		this.indicesTriangleFans[this.fanIndicesIndex++] = this.verticesIndex / 3;
		this.vertices[this.verticesIndex++] = center[0];
		this.vertices[this.verticesIndex++] = center[1];
		this.vertices[this.verticesIndex++] = center[2];

		for (let i = 0; i < CIRCLE_FN; i++) {
			let fi = -(2*Math.PI)/CIRCLE_FN*i; // CCW direction
			if (!endCircle)
				fi = -fi;

			let c = r * Math.cos(fi);
			let s = r * Math.sin(fi);

			this.indicesTriangleFans[this.fanIndicesIndex++] = this.verticesIndex / 3;
			this.vertices[this.verticesIndex++] = center[0] + c*tmp1[0] + s*tmp2[0];
			this.vertices[this.verticesIndex++] = center[1] + c*tmp1[1] + s*tmp2[1];
			this.vertices[this.verticesIndex++] = center[2] + c*tmp1[2] + s*tmp2[2];
		}

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

	private static findPerpendicular(vecOut, vecIn) {
		vecOut[0] = 1;
		vecOut[1] = 1;
		vecOut[2] = vecIn[0] + vecIn[1];
		vec3.normalize(vecOut, vecOut);
	}

	public render(gl: WebGLRenderingContext, programInfo: ProgramInfo) {
		super.render(gl, programInfo);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);

		gl.enableVertexAttribArray(programInfo.vertexPosition);
        gl.vertexAttribPointer(programInfo.vertexPosition, 3, gl.FLOAT, false, 0, 0);

		gl.vertexAttrib4fv(programInfo.vertexColor, this.color);

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexFanBuffer);
		gl.drawElements(gl.TRIANGLE_FAN, this.indicesTriangleFans.length, gl.UNSIGNED_SHORT, 0);
		if (gl.getError() != gl.NO_ERROR)
			console.error("WebGL error #1");

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexStripBuffer);
		gl.drawElements(gl.TRIANGLE_STRIP, this.indicesTriangleStrips.length, gl.UNSIGNED_SHORT, 0);
		if (gl.getError() != gl.NO_ERROR)
			console.error("WebGL error #2");
		
		gl.bindBuffer(gl.ARRAY_BUFFER, null);
	}

	allocate(gl: WebGLRenderingContext, programInfo: ProgramInfo) {
		super.allocate(gl, programInfo);

        if (!this.vertexBuffer)
            this.vertexBuffer = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);
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
		
		if (this.indexFanBuffer) {
			gl.deleteBuffer(this.indexFanBuffer);
			gl.deleteBuffer(this.indexStripBuffer);
			this.indexFanBuffer = null;
			this.indexStripBuffer = null;
		}
	}
}
