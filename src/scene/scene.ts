
import { Curtains, Plane, } from "curtainsjs";
import dat from "dat.gui"
import { Ripples } from "./ripples/ripples";
import fragGLSL from "./frag.glsl"
import vertGLSL from "./vert.glsl"


class RipplesScene {

    constructor({
        viscosity = 5,
        speed = 3.5,
        size = 1,

        displacementStrength = 4,
        lightIntensity = 5,
        shadowIntensity = 2.5,
    } = {}) {

        this.params = {
            viscosity: viscosity,
            speed: speed,
            size: size,

            displacementStrength: displacementStrength,
            lightIntensity: lightIntensity,
            shadowIntensity: shadowIntensity,
        };

        this.init();
    }

    debug() {
        this.sceneGui = this.gui.addFolder('Scene');
        this.sceneGui.open();

        this.guiDisplacement = this.sceneGui.add(this.guiParams, 'displacement', 0, 5);
        this.guiLights = this.sceneGui.add(this.guiParams, 'lights', 0.1, 10);
        this.guiShadows = this.sceneGui.add(this.guiParams, 'shadows', 0.1, 10);

        this.guiBlurRipples = this.sceneGui.add(this.guiParams, 'blurRipples', true);
        this.guiShowTexture = this.sceneGui.add(this.guiParams, 'showTexture', true);
        this.guiTitleColor = this.sceneGui.addColor(this.guiParams, 'titleColor');

        this.guiDisplacement.onChange((value) => {
            if (this.scenePlane) {
                this.scenePlane.uniforms.displacementStrength.value = value;
            }
        });

        this.guiLights.onChange((value) => {
            if (this.scenePlane) {
                this.scenePlane.uniforms.lightIntensity.value = value;
            }
        });

        this.guiShadows.onChange((value) => {
            if (this.scenePlane) {
                this.scenePlane.uniforms.shadowIntensity.value = value;
            }
        });

        this.guiBlurRipples.onChange((value) => {
            if (this.scenePlane) {
                this.scenePlane.uniforms.blurRipples.value = value ? 1 : 0;
            }
        });

        this.guiShowTexture.onChange((value) => {
            if (this.scenePlane) {
                this.scenePlane.uniforms.showTexture.value = value ? 1 : 0;
            }
        });

        this.guiTitleColor.onChange((value) => {
            if (this.scenePlane) {
                this.scenePlane.uniforms.titleColor.value = value;
            }
        });
    }

    init() {
        // set up the webgl context
        this.curtains = new Curtains({
            container: "canvas",
            alpha: false, // we don't need alpha, and setting it to false will improve our text canvas texture rendering
        }).onError(() => {
            console.log("error")
            // we will add a class to the document body to display original image and title
            document.body.classList.add("no-curtains");
        }).onContextLost(() => {
            console.log("context lost")
            // on context lost, try to restore the context
            this.curtains.restoreContext();
        });

        this.setSceneShaders();

        // we'll be using this html element to create 2 planes
        this.sceneElement = document.getElementById("water-ripples");

        // debugging
        // DAT gui
        this.guiParams = {
            displacement: this.params.displacementStrength,
            lights: this.params.lightIntensity,
            shadows: this.params.shadowIntensity,

            blurRipples: true,
            showTexture: true,
            titleColor: [255, 255, 255],
        };

        this.gui = new dat.GUI();

        this.ripples = new Ripples({
            curtains: this.curtains,
            container: this.sceneElement,
            viscosity: this.params.viscosity || null,
            speed: this.params.speed || null,
            size: this.params.size || null,
            callback: (texture) => {
                this.createScenePlane(texture);
            },

            gui: this.gui || null,
            guiParams: this.guiParams || null,
        });

        // dat gui
        this.debug();
    }

    setSceneShaders() {
        this.sceneVs = vertGLSL;
        this.sceneFs = fragGLSL;
    }

    writeTitleCanvas(canvas) {
        const title = document.getElementById("water-ripples-title").querySelector("h1");
        const titleStyle = window.getComputedStyle(title);

        let titleTopPosition = title.offsetTop * this.curtains.pixelRatio;
        // adjust small offset due to font interpretation?
        titleTopPosition += title.clientHeight * this.curtains.pixelRatio * 0.1;

        const planeBoundinRect = this.scenePlane.getBoundingRect();

        const htmlPlaneWidth = planeBoundinRect.width;
        const htmlPlaneHeight = planeBoundinRect.height;

        // set sizes
        canvas.width = htmlPlaneWidth;
        canvas.height = htmlPlaneHeight;
        let context = canvas.getContext("2d");

        context.width = htmlPlaneWidth;
        context.height = htmlPlaneHeight;

        // draw our title with the original style
        context.fillStyle = titleStyle.color;
        context.font = parseFloat(titleStyle.fontWeight) + " " + parseFloat(titleStyle.fontSize) * this.curtains.pixelRatio + "px " + titleStyle.fontFamily;
        context.fontStyle = titleStyle.fontStyle;

        context.textAlign = "center";

        // vertical alignment
        context.textBaseline = "top";
        context.fillText(title.innerText, htmlPlaneWidth / 2, titleTopPosition);

        if (this.scenePlane.textures && this.scenePlane.textures.length > 1) {
            this.scenePlane.textures[1].resize();
            this.scenePlane.textures[1].needUpdate();
        }
    }

    createScenePlane(rippleTexture) {
        // next we will create the plane that will display our result
        let curtainsBBox = this.curtains.getBoundingRect();

        const params = {
            vertexShader: this.sceneVs,
            fragmentShader: this.sceneFs,
            uniforms: {
                resolution: {
                    name: "uResolution",
                    type: "2f",
                    value: [curtainsBBox.width, curtainsBBox.height],
                },

                displacementStrength: {
                    name: "uDisplacementStrength",
                    type: "1f",
                    value: this.params.displacementStrength,
                },
                lightIntensity: {
                    name: "uLightIntensity",
                    type: "1f",
                    value: this.params.lightIntensity,
                },
                shadowIntensity: {
                    name: "uShadowIntensity",
                    type: "1f",
                    value: this.params.shadowIntensity,
                },

                blurRipples: {
                    name: "uBlurRipples",
                    type: "1f",
                    value: 1,
                },

                showTexture: {
                    name: "uShowTexture",
                    type: "1f",
                    value: 1,
                },
                titleColor: {
                    name: "uTitleColor",
                    type: "3f",
                    value: [255, 255, 255],
                },
            }
        };

        this.scenePlane = this.curtains.addPlane(this.sceneElement, params);
        // this.scenePlane = new Plane(this.curtains, this.sceneElement, params);

        // if the plane has been created
        if (this.scenePlane) {
            const canvas = document.createElement("canvas");

            canvas.setAttribute("data-sampler", "titleTexture");
            canvas.style.display = "none";

            this.scenePlane.loadCanvas(canvas);

            this.scenePlane.onLoading((texture) => {
                texture.shouldUpdate = false;
                if (this.scenePlane.canvases && this.scenePlane.canvases.length > 0) {
                    // title
                    if (document.fonts) {
                        document.fonts.ready.then(() => {
                            this.writeTitleCanvas(canvas);
                        });
                    }
                    else {
                        setTimeout(() => {
                            this.writeTitleCanvas(canvas);
                        }, 750);
                    }
                }

            }).onReady(() => {

                // create a texture that will hold our flowmap
                this.scenePlane.createTexture({
                    sampler: "uRippleTexture",
                    fromTexture: rippleTexture // set it based on our ripples plane's texture
                });

            }).onAfterResize(() => {
                curtainsBBox = this.curtains.getBoundingRect();
                this.scenePlane.uniforms.resolution.value = [curtainsBBox.width, curtainsBBox.height];

                this.writeTitleCanvas(canvas);
            });
        }
    }
}




export default RipplesScene;