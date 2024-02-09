import { Plane, RenderTarget, } from "curtainsjs";
import fragGLSL from "./frag.glsl"
import vertGLSL from "./vert.glsl"

export class Ripples {

    constructor({
        callback = null,
        curtains = null,
        container = null,
        viscosity = 2,
        speed = 3.5,
        size = 1,
        // debug
        gui = null,
        guiParams = null,
    } = {}) {

        if (!curtains) return;

        this.curtains = curtains;

        this.params = {
            container: this.curtains.container,
            callback: callback,

            viscosity: viscosity,
            speed: speed,
            size: size,

            gui: gui,
            guiParams: guiParams,
        };

        this.mouse = {
            current: {
                x: 0,
                y: 0,
            },
            last: {
                x: 0,
                y: 0,
            },
            velocity: {
                x: 0,
                y: 0,
            },
        };

        this.debug();

        this.init();
    }

    init() {
        // create 2 render targets
        this.readPass = this.curtains.addRenderTarget({
            clear: false,
        });
        this.writePass = this.curtains.addRenderTarget({
            clear: false,
        });
        // this.readPass = new RenderTarget(this.curtains, { clear: false });
        // this.writePass = new RenderTarget(this.curtains, { clear: false });

        this.setRipplesShaders();

        let boundingRect = this.getCanvasSizes();

        this.ripplesParams = {
            vertexShader: this.ripplesVs,
            fragmentShader: this.ripplesFs,
            autoloadSources: false, // dont load our webgl canvas!!
            depthTest: false, // we need to disable the depth test in order for the ping pong shading to work
            watchScroll: false,
            uniforms: {
                mousePosition: {
                    name: "uMousePosition",
                    type: "2f",
                    value: [this.mouse.current.x, this.mouse.current.y],
                },
                lastMousePosition: {
                    name: "uLastMousePosition",
                    type: "2f",
                    value: [this.mouse.current.x, this.mouse.current.y],
                },
                velocity: {
                    name: "uVelocity",
                    type: "2f",
                    value: [this.mouse.velocity.x, this.mouse.velocity.y],
                },

                // window aspect ratio to draw a circle
                resolution: {
                    name: "uResolution",
                    type: "2f",
                    value: [boundingRect.width, boundingRect.height],
                },

                time: {
                    name: "uTime",
                    type: "1i",
                    value: -1,
                },

                viscosity: {
                    name: "uViscosity",
                    type: "1f",
                    value: this.params.viscosity,
                },
                speed: {
                    name: "uSpeed",
                    type: "1f",
                    value: this.params.speed,
                },
                size: {
                    name: "uSize",
                    type: "1f",
                    value: this.params.size,
                },
            },
        };

        this.ripples = this.curtains.addPlane(this.params.container, this.ripplesParams);

        // this.ripples = new Plane(this.curtains, this.params.container, this.ripplesParams)
        if (this.ripples) {
            this.createRipplesTexture().then(() => {
                if (this.params.callback) {
                    this.params.callback(this.ripplesTexture);
                }
            });

            this.ripples.onReady(() => {
                // add event listeners
                window.addEventListener("mousemove", (e) => this.onMouseMove(e));
                window.addEventListener("touchmove", (e) => this.onMouseMove(e));
            }).onRender(() => {
                this.ripples.uniforms.velocity.value = [this.mouse.velocity.x, this.mouse.velocity.y];

                this.mouse.velocity = {
                    x: this.lerp(this.mouse.velocity.x, 0, 0.1),
                    y: this.lerp(this.mouse.velocity.y, 0, 0.1),
                };

                this.ripples.uniforms.velocity.value = [this.mouse.velocity.x, this.mouse.velocity.y];

                this.ripples.uniforms.time.value++;

                // update the render target
                this.writePass && this.ripples.setRenderTarget(this.writePass);
            }).onAfterRender(() => {
                // swap FBOs and update texture
                if (this.readPass && this.writePass) {
                    this.swapPasses();
                }

            }).onAfterResize(() => {
                // update our window aspect ratio uniform
                boundingRect = this.getCanvasSizes();
                this.ripples.uniforms.resolution.value = [boundingRect.width, boundingRect.height];
            });
        }
    }

    debug() {
        if (this.params.gui && this.params.guiParams) {

            this.params.guiParams.viscosity = this.params.viscosity;
            this.params.guiParams.speed = this.params.speed;
            this.params.guiParams.size = this.params.size;

            this.ripplesGui = this.params.gui.addFolder('Render targets');
            this.ripplesGui.open();

            this.guiViscosity = this.ripplesGui.add(this.params.guiParams, 'viscosity', 1, 15);
            this.guiSpeed = this.ripplesGui.add(this.params.guiParams, 'speed', 1, 15);
            this.guiSize = this.ripplesGui.add(this.params.guiParams, 'size', 0.5, 2.5).step(0.025);

            this.guiViscosity.onChange((value) => {
                if (this.ripples) {
                    this.ripples.uniforms.viscosity.value = value;
                }
            });

            this.guiSpeed.onChange((value) => {
                if (this.ripples) {
                    this.ripples.uniforms.speed.value = value;
                }
            });

            this.guiSize.onChange((value) => {
                if (this.ripples) {
                    this.ripples.uniforms.size.value = value;
                }
            });
        }
    }

    getCanvasSizes() {
        return this.curtains.getBoundingRect();
    }

    lerp(start, end, amt) {
        return (1 - amt) * start + amt * end;
    }

    onMouseMove(e) {
        if (this.ripples) {
            // velocity is our mouse position minus our mouse last position
            this.mouse.last.x = this.mouse.current.x;
            this.mouse.last.y = this.mouse.current.y;

            let weblgMouseCoords = this.ripples.mouseToPlaneCoords(this.mouse.last.x, this.mouse.last.y);
            this.ripples.uniforms.lastMousePosition.value = [weblgMouseCoords.x, weblgMouseCoords.y];

            let updateVelocity = true;
            if (
                this.mouse.last.x === 0
                && this.mouse.last.y === 0
                && this.mouse.current.x === 0
                && this.mouse.current.y === 0
            ) {
                updateVelocity = false;
            }

            // touch event
            if (e.targetTouches) {
                this.mouse.current.x = e.targetTouches[0].clientX;
                this.mouse.current.y = e.targetTouches[0].clientY;
            }
            // mouse event
            else {
                this.mouse.current.x = e.clientX;
                this.mouse.current.y = e.clientY;
            }

            weblgMouseCoords = this.ripples.mouseToPlaneCoords(this.mouse.current.x, this.mouse.current.y);
            this.ripples.uniforms.mousePosition.value = [weblgMouseCoords.x, weblgMouseCoords.y];

            // divided by a frame duration (roughly)
            if (updateVelocity) {
                this.mouse.velocity = {
                    x: (this.mouse.current.x - this.mouse.last.x) / 16,
                    y: (this.mouse.current.y - this.mouse.last.y) / 16
                };
            }
        }
    }

    setRipplesShaders() {
        this.ripplesVs = vertGLSL;
        this.ripplesFs = fragGLSL;
    }

    swapPasses() {
        // swap read and write passes
        var tempFBO = this.readPass;
        this.readPass = this.writePass;
        this.writePass = tempFBO;

        // apply new texture
        // this.ripplesTexture.copy(this.readPass.textures[0]);
        this.ripplesTexture.setFromTexture(this.readPass.textures[0]);
    }

    createRipplesTexture() {
        // create a texture where we'll draw our ripples
        this.ripplesTexture = this.ripples.createTexture({
            sampler: "uTargetTexture"
        });

        return new Promise((resolve) => {
            if (this.ripplesTexture) {
                resolve();
            }
        });
    }


}

