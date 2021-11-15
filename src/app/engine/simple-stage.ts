import { Scene, PerspectiveCamera, WebGLRenderer, Object3D, Fog, WebGLRendererParameters, Camera, ShadowMapType } from 'three';

import { World } from 'cannon-es';
import debug from 'cannon-es-debugger';
import { Tweens } from './tweens';


export class SimpleStage {

  // renderer: ExtendedWebGLRenderer;
  // private composer: ExtendedEffectComposer; 
  // private composer: EffectComposer; 
  // private renderable: Renderable;
  renderer: WebGLRenderer;
  camera: PerspectiveCamera;
  scene: Scene;


  constructor(
    private rendererParams?: WebGLRendererParameters,
    public cameras?: Map<string, PerspectiveCamera>
  ) {

    this.scene = new Scene();

    if (cameras) {

      // this.camera = cameras.entries().next().value[1];
      for (const item of cameras.entries()) {
        const camera = item[1]; 
        this.cameras.set(camera.name, camera);
      }

      if(!this.camera) {
        this.camera = this.cameras.entries().next().value[1];
      }

    } else {
      this.camera = new PerspectiveCamera(1000, 1, 1, 100);
      this.camera.name = 'Camera';
      this.camera.position.z = 4;
      this.cameras = new Map();
      this.cameras.set("Camera", this.camera);
    }


    this.updateCameraAspects();
    // if(rendererParams.preserveDrawingBuffer) {
    //   rendererParams.canvas =
    // } 
    this.initRenderer();
    this.render();
    // this.initComposer();


  }


  setShadowMapType(type: ShadowMapType) {
    this.shadowMapType = type;
    this.renderer.shadowMap.type = type;
  }


  setShadowMapEnable(isTrue: boolean) {
    this.isShadowMapEnabled = isTrue;
    this.renderer.shadowMap.enabled = isTrue;
  }


  updateCameraAspects() {

    for (const item of this.cameras.entries()) {
      const camera = item[1];
      camera.aspect = this.getAspect();
      camera.updateProjectionMatrix();
    }

  }


  setCamera(name: string): void {

    // if (!this.cameras) return;

    // for (let item of this.cameras.entries()) {

    //   console.log(item[0])
    // }

    // const camera = this.cameras.get(name);

    // console.log('Camera: ', camera)


    // if (!camera) return;

    // this.camera = camera;
  }


  async captureToBlob(): Promise<Blob> {
    this.render();

    const canvas = this.rendererParams.canvas;

    if (canvas instanceof OffscreenCanvas) {
      return canvas.convertToBlob();

    } else if (canvas instanceof HTMLCanvasElement) {

      return new Promise(resolve => {
        (canvas as HTMLCanvasElement)
          .toBlob(blob => resolve(blob));
      });
    }

    // return this.renderer.domElement.toDataURL();
  }

  // setBlur(isTrue: boolean) {
  //   if (isTrue) {
  //     this.renderable = this.composer;
  //   } else {
  //     this.renderable = this.renderer;
  //   }
  // }


  setFog(isTrue: boolean) {
    if (isTrue && !this.scene.fog) {
      const near = Math.floor(Math.random() * 400);
      const diff1 = Math.abs(2200 - near);
      const far = Math.floor(Math.random() * diff1) + near;

      this.scene.fog = new Fog(0xdddddd, near, far);
      this.loopFogEffect();
    } else {
      if (this.fogTween) {
        this.fogTween.stop();
        this.fogTween = null;
      }
      this.scene.fog = null;
    }
    this.render();
  }


  hasFog(): boolean {
    return this.scene.fog ? true : false;
  }


  setAntialias(isTrue: boolean): void {
    this.rendererParams.antialias = isTrue;
    this.initRenderer();
    this.render();
  }


  setDebugRenderer(world: World | false) {
    this.world = world;
    if (!world) return;

    debug(this.scene, world.bodies)
  }


  render() {
    this.renderer.render(this.scene, this.camera);
    // this.renderable.render(this.scene, this.camera);

  }


  setSize(width: number, height: number) {
    this.rendererParams.canvas.width = width;
    this.rendererParams.canvas.height = height;

    this.initRenderer();

    this.updateCameraAspects();
    this.render();
  }


  getAspect(): number {
    return this.rendererParams.canvas.width / this.rendererParams.canvas.height;
  }


  getCanvasWidth(): number {
    return this.rendererParams.canvas.width;
  }


  getCanvasHeight(): number {
    return this.rendererParams.canvas.height;
  }


  add(...object: Object3D[]): void {
    this.scene.add(...object);
  }


  remove(...object: Object3D[]): void {
    this.scene.remove(...object);
  }


  private async loopFogEffect() {
    if (this.scene.fog) {
      this.fogTween = Tweens.fogEffect(this.scene.fog);
      await Tweens.playTween(this.fogTween);
      this.loopFogEffect()
    }
  }


  private initRenderer(): void {
    this.renderer = new WebGLRenderer(this.rendererParams);
    this.updateCameraAspects();
    this.renderer.shadowMap.enabled = this.isShadowMapEnabled;
    this.renderer.shadowMap.type = this.shadowMapType;


    // this.renderer = new ExtendedWebGLRenderer({ antialias: this.antialias, alpha: this.alpha, canvas: this.canvas });


    // this.renderer.setPixelRatio(this.rendererParams.canvas.width / this.rendererParams.canvas.height);

    // this.renderer.gammaFactor = 2.2;

    // this.element.nativeElement.appendChild(this.renderer.domElement);

    // this.renderable = this.renderer;
    // this.render();

  }

  // private initComposer(): void {

  //   this.composer = new ExtendedEffectComposer(this.renderer);
  //   this.composer.addPass(new RenderPass(this.scene, this.camera));

  //   const hblur = new ShaderPass(HorizontalBlurShader);
  //   this.composer.addPass(hblur);

  //   const vblur = new ShaderPass(VerticalBlurShader);
  //   vblur.renderToScreen = true;
  //   this.composer.addPass(vblur);
  // }


  private world: World | false;
  private fogTween: any;


  private isShadowMapEnabled: boolean;
  private shadowMapType: ShadowMapType;


}


export class FogRenderer extends WebGLRenderer {

  render(scene: Scene, camera: Camera): void {
    (scene.fog as Fog).far++;
    super.render(scene, camera);
  }

}

// interface Renderable {
//   render(scene?: Scene, camera?: any);
// }

// class ExtendedEffectComposer extends EffectComposer implements Renderable {
//   render() {
//     super.render();
//   }
// }

// class ExtendedWebGLRenderer extends WebGLRenderer implements Renderable {
//   render(scene: Scene, camera: any) {
//     super.render(scene, camera);
//   }
// }


