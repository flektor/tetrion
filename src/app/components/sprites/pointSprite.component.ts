import { Component, Input, AfterViewInit, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { trigger, animate, transition, state, style, keyframes } from '@angular/animations';
import { HitPoints } from './sprite';

@Component({
  selector: 'point-sprite',
  animations: [

    trigger('move', [
      state('start', style({ position: 'absolute', left: '{{x}}px', transform: 'translateY({{y1}}px)' }), { params: { x: 0, y1: 0 } }),
      state('end', style({ transform: 'translateY({{y2}}px)' }), { params: { y2: 0 } }),
      transition('start => end', [
        animate(4000,
          keyframes([
            style({ transform: 'translateY({{y1}}px)', offset: 0 }),
            style({ transform: 'translateY({{y2}}px)', offset: 1.0 })
          ])
        )])
    ]),

    trigger('hide', [
      state('visible', style({ opacity: 1 })),
      state('hidden', style({ opacity: 0 })),
      transition('visible => hidden', [animate('2s 1s ease-out')])
    ]),

  ],
  template: `
    <div class="hit-points"
      [style.color]="points.color"
      [@move]="{value:doHide ? 'end' : 'start', params:{x: points.y+offsetY, y1: points.x+offsetX, y2: points.x}}"
      [@hide]="doHide ? 'hidden' : 'visible'"
      (@hide.done)="onDestroy()"
      >
      {{ points.value }}
    </div>
  `,
  styles: [`
    .hit-points {
      font-size: 32px;
      position: absolute;
    }
  `]
})
export class PointSpriteComponent implements AfterViewInit {

  @Output() destroy = new EventEmitter();
  @Input('hitPoints') points: HitPoints;
  public doHide: boolean = false;
  public offsetX: number;
  public offsetY: number;

  constructor(private cdRef: ChangeDetectorRef) {
    this.offsetX = Math.floor((Math.random() * 50) - 25) + 100;
    this.offsetY = Math.floor((Math.random() * 50) - 25);
  }

  ngAfterViewInit(): void {
    if (this.points.value < 9) {
      this.offsetY += 50;
    } else if (this.points.value < 100) {
      this.offsetY += 25;
    }

    this.points.x -= 100;
    this.doHide = true;
    this.cdRef.detectChanges();
  }

  onDestroy() {
    this.destroy.emit(null);
  }

}
