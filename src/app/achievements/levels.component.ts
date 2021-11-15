import { Component, Input, ViewChild, OnInit, AfterViewInit } from "@angular/core";
import { HttpClient } from "@angular/common/http";


@Component({
  selector: 'levels-achievment',
  template: `
  <div #img (click)="animate()"></div>

  <div class="center">
    <ion-spinner *ngIf="showSpinner" name="crescent" color='light'></ion-spinner>
    <div *ngIf="!showSpinner" (click)="animate()">{{level}} </div>
  </div>
  `,

  styles: [`
  .center {
    	position:relative;
    	font-size: 64px;
    	text-align: center;
    	font-weight: 1000;
    	margin-top:-108px;
  }
 


  `]
})

export class LevelsAchievmentComponent implements AfterViewInit {


  @Input() public level: number = 1;
  @ViewChild("img", { static: false }) image;

  constructor(private httpClient: HttpClient) { }

  showSpinner: boolean = true;

  ngAfterViewInit(): void {
    if (this.level > 25) {
      this.level = 25;
    } else if (this.level < 1) {
      this.level = 1;
    }

    const filepath = "assets/svg/levels.svg";
    this.httpClient.get(filepath, { responseType: "text" }).subscribe((text: any) => {
      const parser = new DOMParser();
      const svg = parser.parseFromString(text, "text/xml").children[0];
      this.image.nativeElement.append(svg);
      this.reset();
    });

  }

  enableShowSpinner(isTrue: boolean): void {
    this.showSpinner = isTrue;
  }



  reset() {
    for (let i = 0; i < 25; i++) {
      document.getElementById("brick-" + (i + 1)).setAttribute("opacity", "0.2");
    }
  }

  animate(i = 1) {
    const pauseTime = 20 * 25 / this.level;
    setTimeout(() => {
      if (i <= this.level && document.getElementById("brick-" + i)) {
        document.getElementById("brick-" + i).setAttribute("opacity", "1");
        this.animate(++i);
      } else {
        this.animate(i);
      }
    }, pauseTime)
  }

}
