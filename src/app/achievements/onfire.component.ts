import { Component, Input } from "@angular/core";


@Component({
  selector: 'onfire-achievment',
  template: `
    <img src="assets/svg/onfire.svg">
    <div class="text1">x{{value}}</div>
    <div class="text2">on fire</div>
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

export class OnfireAchievmentComponent   {

  @Input() public value: number = 1;

}
