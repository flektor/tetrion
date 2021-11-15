import { Component, Input, ViewChild, AfterViewInit, ElementRef } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { BoxGeometry, MeshPhongMaterial, FrontSide, Mesh, SpotLight, DirectionalLight, AmbientLight, Object3D, Group, Texture, ExtrudeBufferGeometry, Shape, WebGLRendererParameters } from 'three';
import { SimpleStage } from "../engine/simple-stage";
import { UserService } from '../services/user/user.service';

@Component({
  selector: 'rank-achievment',
  template: `
  <canvas #rank></canvas>
  `
  // <canvas #canvas></canvas>
})

export class RankAchievmentComponent implements AfterViewInit {
  @Input() public data: RankData;
  // imgsrc: string;
  @ViewChild("rank", { static: false }) canvas: ElementRef<HTMLCanvasElement>;
  // @ViewChild("canvas") canvas: ElementRef;
  stage: SimpleStage;
  object: Object3D;
  private imgsrc: string;



  constructor(
    private httpClient: HttpClient,
    private user: UserService
  ) { }

  ngAfterViewInit(): void {

    let filepath = "assets/svg/rank.svg";
    this.httpClient.get(filepath, { responseType: "text" }).subscribe((text: any) => {
      let parser = new DOMParser();
      let svg = parser.parseFromString(text, "text/xml").children[0];

      let colors = this.getColors();

      this.setRank(svg, colors);


      text = new XMLSerializer().serializeToString(svg);

      this.imgsrc = 'data:image/svg+xml;base64,' + btoa(text);
      this.initSimpleStage();

      this.addBox(colors['box']);

      // console.log(this.image)-
      //this.image.nativeElement.append(svg);
    });
  }

  private setRank(svg, colors): void {
    if (this.data.level > 3) {
      this.data.level = 3;
    } else if (this.data.level < 0) {
      this.data.level = 0;
    }

    if (!colors) return;

    let defs = svg.children[0];
    let g = svg.children[1].children[0];

    g.children[0].children[0].setAttribute("fill", colors['basic']); // outline
    g.children[1].children[0].setAttribute("fill", colors['background']); // background
    g.children[2].children[0].setAttribute("fill", colors['body']); // body
    g.children[3].children[0].setAttribute("fill", colors['basic']); // arrow1
    g.children[4].children[0].setAttribute("fill", colors['basic']); // arrow2
    g.children[5].children[0].setAttribute("fill", colors['basic']); // arrow3
    g.children[6].children[0].setAttribute("fill", colors['basic']); // star

    switch (this.data.level) {
      case 1:
        g.children[5].children[0].setAttribute("opacity", "0"); // arrow3
        g.children[4].children[0].setAttribute("opacity", "0"); // arrow2
        const level1 = "M72.22 48.32L74.16 58.77L64 53.84L53.85 58.77L55.79 48.32L47.57 40.92L58.93 39.4L64 29.89L69.08 39.4L80.44 40.92L72.22 48.32Z";
        defs.children[6].setAttribute("d", level1);
        break;
      case 2:
        g.children[5].children[0].setAttribute("opacity", "0"); // arrow3
        const level2 = "M72.22 40.74L74.16 51.19L64 46.26L53.85 51.19L55.79 40.74L47.57 33.34L58.93 31.82L64 22.31L69.08 31.82L80.44 33.34L72.22 40.74Z";
        defs.children[6].setAttribute("d", level2);
        break;

    }

  }


  private getColors(): any {
    switch (this.data.division) {
      case "bronze":
        return {
          "basic": "#cd7f32",
          "background": "#90571f",
          "body": "#512f0d",
          "box": "#c1752a"
        };
      case "silver":
        return {
          "basic": "#c0c0c0",
          "background": "#909090",
          "body": "#4a4a4a",
          "box": "#a8a8a8"
        };
      case "gold":
        return {
          "basic": "#ffd700",
          "background": "#daa520",
          "body": "#8b4513",
          "box": "#c1921d"
        };
    }
  }


  private render(): void {

    this.stage.render();

    // this.object.rotateX(Math.PI * 0.0015);
    this.object.rotateY(Math.PI * 0.002);

    // this.object.rotateZ(Math.PI* 0.002);
    // this.object.rotateX(Math.PI* 0.002);

    // this.object.rotateZ(Math.PI * 0.005);

    requestAnimationFrame(() => this.render());


  }

  private addBox(color): void {

    let image = new Image();

    //  this.imgElem.nativeElement.onload = ()=> {
    image.onload = () => {

      let materials = new Array();
      materials.push(this.getMaterial(image, 3 * Math.PI / 4));
      materials.push(this.getMaterial(image, 5 * Math.PI / 4));
      materials.push(this.getMaterial(image, Math.PI / 4));
      materials.push(this.getMaterial(image, 3 * Math.PI / 4));
      materials.push(this.getMaterial(image, 3 * Math.PI / 4));
      materials.push(this.getMaterial(image, 5 * Math.PI / 4));

      let geometry1 = new BoxGeometry(2, 2, 2);
      let geometry2 = this.createBoxWithRoundedEdges(1.999, 1.999, 1.999, 0.17, 8);
      let mesh1 = new Mesh(geometry1, materials);
      let mesh2 = new Mesh(geometry2, new MeshPhongMaterial({ color: color }));

      mesh1.rotation.set(45, 35.264, 0);
      mesh2.rotation.set(45, 35.264, 0);

      this.object = new Group();
      this.object.add(mesh1);
      this.object.add(mesh2);
      this.stage.add(this.object);

      this.stage.camera.position.z = 3;
      this.stage.renderer.setClearColor(0xffffff);

      this.render();

    }
    image.src = this.imgsrc;

  }

  initSimpleStage(): void {

    const rendererParams: WebGLRendererParameters = {
      canvas: this.canvas.nativeElement,
      antialias: this.user.config.video.hasAntialias
    };

    this.stage = new SimpleStage(rendererParams);
    this.stage.setSize(128, 128);

    // Ambient light
    let light1 = new AmbientLight(0x404040); // soft white light
    this.stage.add(light1);
    // Directional Light
    let directionalLight = new DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 0, 10).normalize();
    this.stage.add(directionalLight);
    // white spotlight shining from the side, casting a shadow
    let spotLight = new SpotLight(0xffffff, 0.8);
    spotLight.position.set(100, 1000, 100);
    spotLight.castShadow = true;
    spotLight.shadow.mapSize.width = 1024;
    spotLight.shadow.mapSize.height = 1024;
    spotLight.shadow.camera.near = 500;
    spotLight.shadow.camera.far = 4500;
    spotLight.shadow.camera.fov = 30;
    // this.stage.add(spotLight);
  }

  private getMaterial(image, angle: number): MeshPhongMaterial {
    let canvas = document.createElement("canvas");
    let ctx = canvas.getContext("2d");
    canvas.width = 128;
    canvas.height = 128;

    // ctx.imageSmoothingEnabled = true;

    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(angle);
    ctx.drawImage(image, -100 / 2, -90 / 2, 100, 90);

    let texture = new Texture(canvas);
    texture.anisotropy = this.stage.renderer.capabilities.getMaxAnisotropy();
    texture.needsUpdate = true;

    return new MeshPhongMaterial({ map: texture, side: FrontSide, transparent: true });
  }



  //source:  https://discourse.threejs.org/t/round-edged-box/1402
  private createBoxWithRoundedEdges(width: number, height: number, depth: number, radius0: number, smoothness: number): ExtrudeBufferGeometry {
    let shape = new Shape();
    let eps = 0.00001;
    let radius = radius0 - eps;
    shape.absarc(eps, eps, eps, -Math.PI / 2, -Math.PI, true);
    shape.absarc(eps, height - radius * 2, eps, Math.PI, Math.PI / 2, true);
    shape.absarc(width - radius * 2, height - radius * 2, eps, Math.PI / 2, 0, true);
    shape.absarc(width - radius * 2, eps, eps, 0, -Math.PI / 2, true);
    let geometry = new ExtrudeBufferGeometry(shape, {
      depth: depth - radius0 * 2,
      bevelEnabled: true,
      bevelSegments: smoothness * 2,
      steps: 1,
      bevelSize: radius,
      bevelThickness: radius0,
      curveSegments: smoothness
    });
    geometry.center();
    return geometry;
  }
}

export class RankData {
  public level: number;
  public division: string;
}
