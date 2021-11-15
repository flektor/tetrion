import { Component, Input } from "@angular/core";


@Component({
  selector: 'tetrion-achievment',
  template: `
    <img src="assets/svg/tetrion.svg">
    <div class="text1">x{{value}}</div>
    <div class="text2">tetrion</div>
  `,

  styles: [`

    .text1 {
    	position:relative;
    	font-size: 25px;
    	top:-123px;
    	right:11px;
    	text-align: right;
    }

    .text2 {
    	font-size: 32px;
    	position:relative;
    	text-align: center;
    	top:-108px;
    }

  `]
})

export class TetrionAchievmentComponent   {

  @Input() public value: number = 1;

}
