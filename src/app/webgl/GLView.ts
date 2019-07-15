import * as mat4 from "gl-matrix-mat4";
import {Renderable} from "./Renderable";
import {Camera} from "./Camera";

export interface ProgramInfo {
    program: WebGLProgram;

    vertexPosition: GLint;
    vertexColor: GLint;

    projectionMatrix: WebGLUniformLocation;
    modelViewMatrix: WebGLUniformLocation;
    cameraMatrix: WebGLUniformLocation;
}

export interface LightingProgramInfo extends ProgramInfo {
    normal: GLint;

    lightPos: WebGLUniformLocation;
    lightColor: WebGLUniformLocation;
}

export class GLView {
    protected gl: WebGL2RenderingContext;
    protected programInfo: ProgramInfo;
    protected programInfoLight: LightingProgramInfo;
    private scene: Renderable[] = [];
    public camera: Camera;

    constructor(private canvas: HTMLCanvasElement) {

        this.canvas.addEventListener("webglcontextlost", (event: Event) => event.preventDefault(), false);
        this.canvas.addEventListener("webglcontextrestored", () => this.initialize(), false);

        this.camera = new Camera(canvas);

        this.camera.xAngle = 20;
        this.camera.yAngle = 20;
        this.camera.distance = 2.5;
        this.camera.onCameraChange = () => this.requestRender();
    }

    initialize() {
        this.setup();
        this.createBuffers();
        this.drawScene();
    }

    setup() {
        let hadGl = !!this.gl;

        this.gl = this.canvas.getContext('webgl2', { alpha: false });

        if (!this.gl)
            throw new Error("WebGL is not available");

        this.setupSimpleShaders();
        this.setupLightingShaders();
        
        if (!hadGl)
            this.fillScene();
    }

    private setupSimpleShaders() {
        const vsSource = `#version 300 es
            precision mediump float;

            layout(location = 0) in vec4 aVertexPosition;
            layout(location = 1) in vec4 aVertexColor;
            
            uniform mat4 uModelViewMatrix;
            uniform mat4 uProjectionMatrix;
            uniform mat4 uCameraMatrix;
            
            out vec4 vColor;

            void main(void) {
              gl_Position = uProjectionMatrix * uCameraMatrix * uModelViewMatrix * aVertexPosition;
              vColor = aVertexColor;
            }
          `;

        const fsSource = `#version 300 es
            precision mediump float;

            in vec4 vColor;
            out vec4 fragColor;

            void main(void) {
              fragColor = vColor;
            }
          `;

        let shaderProgram = this.initShaderProgram(vsSource, fsSource);

        let gl = this.gl;
        this.programInfo = {
            program: shaderProgram,

            vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
            vertexColor: gl.getAttribLocation(shaderProgram, 'aVertexColor'),

            projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
            modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
            cameraMatrix: gl.getUniformLocation(shaderProgram, 'uCameraMatrix'),
        };
    }

    private setupLightingShaders() {
        const vsSource = `#version 300 es
            precision mediump float;

            layout(location = 0) in vec4 aVertexPosition;
            layout(location = 1) in vec4 aVertexColor;
            layout(location = 2) in vec4 aNormal;
            
            uniform mat4 uModelViewMatrix;
            uniform mat4 uProjectionMatrix;
            uniform mat4 uCameraMatrix;
            
            out vec4 vColor;
            out vec4 vNormal;
            out vec4 vFragPos;

            void main(void) {
              vFragPos = uModelViewMatrix * aVertexPosition;
              gl_Position = uProjectionMatrix * uCameraMatrix * vFragPos;
              vColor = aVertexColor;
              vNormal = aNormal;
            }
          `;

          // https://learnopengl.com/Lighting/Basic-Lighting
          // https://github.com/JoeyDeVries/LearnOpenGL/blob/master/src/2.lighting/2.1.basic_lighting_diffuse/2.1.basic_lighting.fs
          // TODO: Add specular light
          // https://github.com/JoeyDeVries/LearnOpenGL/blob/master/src/2.lighting/2.2.basic_lighting_specular/2.2.basic_lighting.fs
        const fsSource = `#version 300 es
            precision mediump float;

            out vec4 fragColor;

            in vec4 vColor;
            in vec4 vNormal;
            in vec4 vFragPos;

            uniform vec4 uLightPos;
            uniform vec4 uLightColor;

            void main(void) {
                // Ambient light
                float ambientStrength = 0.25;
                vec4 ambient = ambientStrength * uLightColor;

                // Diffuse light
                vec4 norm = normalize(vNormal);
                vec4 lightDir = normalize(uLightPos - vFragPos);
                float diff = max(dot(norm, lightDir), 0.0);
                vec4 diffuse = diff * uLightColor;

                vec4 result = (ambient + diffuse) * vColor;
                result.w = vColor.w;
                fragColor = result;
            }
        `;

        let shaderProgram = this.initShaderProgram(vsSource, fsSource);

        let gl = this.gl;
        this.programInfoLight = {
            program: shaderProgram,

            vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
            vertexColor: gl.getAttribLocation(shaderProgram, 'aVertexColor'),
            normal: gl.getAttribLocation(shaderProgram, 'aNormal'),

            projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
            modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
            cameraMatrix: gl.getUniformLocation(shaderProgram, 'uCameraMatrix'),

            lightPos: gl.getUniformLocation(shaderProgram, 'uLightPos'),
            lightColor: gl.getUniformLocation(shaderProgram, 'uLightColor'),
        };
    }

    // addRenderable() can be called now
    protected fillScene() {
    }

    public requestRender() {
        requestAnimationFrame(this.drawScene.bind(this));
    }

    createBuffers() {
    }

    initShaderProgram(vsSource, fsSource) {
        let gl = this.gl;

        const vertexShader = this.loadShader(gl.VERTEX_SHADER, vsSource);
        const fragmentShader = this.loadShader(gl.FRAGMENT_SHADER, fsSource);

        // Create the shader program

        const shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);

        // If creating the shader program failed, abort

        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS))
            throw new Error("Cannot compile GL shaders!");

        return shaderProgram;
    }

    loadShader(type, source) {
        let gl = this.gl;

        const shader = gl.createShader(type);

        // Send the source to the shader object

        gl.shaderSource(shader, source);

        // Compile the shader program

        gl.compileShader(shader);

        // See if it compiled successfully

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            //gl.deleteShader(shader);
            throw new Error('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
        }

        return shader;
    }

    drawScene() {
        let gl = this.gl;

        gl.clearColor(1.0, 1.0, 1.0, 1.0);
        gl.clearDepth(1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.enable(gl.BLEND);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const fieldOfView = 45 * Math.PI / 180;   // in radians
        var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        const zNear = 0.001;
        const zFar = 10.0;
        const projectionMatrix = mat4.create();

        // FIXME: Use this: http://marcj.github.io/css-element-queries/
        if (isNaN(aspect))
            aspect = 1;

        mat4.perspective(projectionMatrix,
            fieldOfView,
            aspect,
            zNear,
            zFar);

        // Non-lighted
        gl.useProgram(this.programInfo.program);

        gl.uniformMatrix4fv(
            this.programInfo.projectionMatrix,
            false,
            projectionMatrix);

        this.camera.apply(this.gl, this.programInfo);

        this.scene.forEach(r => {
             if (r.shouldRender(this.camera))
                r.render(this.gl, this.programInfo)
        });

        // Lighted
        gl.useProgram(this.programInfoLight.program);

        gl.uniformMatrix4fv(
            this.programInfoLight.projectionMatrix,
            false,
            projectionMatrix);

        let camPos = this.camera.position();
        gl.uniform4f(this.programInfoLight.lightPos, camPos[0], camPos[1], camPos[2], 1);
        // gl.uniform4f(this.programInfoLight.lightPos, 1.2, 1, 2, 1);

        this.camera.apply(this.gl, this.programInfoLight);

        this.scene.forEach(r => {
             if (r.shouldRender(this.camera))
                r.renderWithLighting(this.gl, this.programInfoLight)
        });
    }

    public addRenderable(r: Renderable, prepend: boolean = false) {
        if (prepend)
            this.scene.unshift(r);
        else
            this.scene.push(r);

        r.allocate(this.gl);
    }

    public removeRenderable(r: Renderable) {
        let index = this.scene.indexOf(r);
        if (index != -1)
            this.scene.splice(index, 1);

        r.deallocate(this.gl);
    }

    static glColor(r: number, g: number, b: number, a: number): number[] {
        return [r/255, g/255, b/255, a/255];
    }
}
