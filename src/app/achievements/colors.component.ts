import { Component, Input } from "@angular/core";


@Component({
  selector: 'colors-achievment',
  template: `
    <img src="assets/svg/colors.svg">
    <div class="text1">x{{value}}</div>
    <div class="text2">colors</div>
  `,

  styles: [`


.text1 {
	position:relative;
	font-size: 50px;
	text-align: center;
	width:100%;
	top:-125px;
}

.text2 {
	position:relative;
	font-size: 25px;
	text-align: center;
	width:100%;
	top:-130px;
}

.text3 {
	position:relative;
	font-size: 25px;
	text-align: center;
	width:100%;
	top:-130px;
}


  `]
})

export class ColorsAchievmentComponent   {

  @Input() public value: number = 1;

}
