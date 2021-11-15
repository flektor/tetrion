import { Component, Input, AfterViewInit, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { trigger, animate, transition, state, style } from '@angular/animations';
import { Sprite } from './sprite';

@Component({
  selector: 'message-sprite',
  animations: [
    trigger('hide', [
      state('visible', style({ opacity: 1 })),
      state('hidden', style({ opacity: 0 })),
      transition('visible => hidden', [animate('4s 3s ease-out')])
    ]),
  ],
  template: `
    <div class="message"
      [style.top.px]="sprite.x"
      [style.opacity]="sprite.opacity"
      [@hide]="doHide ? 'hidden' : 'visible'"
      (@hide.done)="onDestroy()"
    >
      {{ sprite.text }}
    </div>
  `,
  styles: [`
    .message {
      position: relative;
      width: 100%;
      font-size: 50px;
      text-align: center;
    }
  `]
})
export class MessageSpriteComponent implements AfterViewInit {

  @Output() destroy = new EventEmitter();

  public doHide: boolean = false;
  @Input('sprite') sprite: Sprite;

  constructor(private cdRef: ChangeDetectorRef) { }

  ngAfterViewInit(): void {
    this.doHide = true;
    this.cdRef.detectChanges();
  }

  onDestroy() {
    this.destroy.emit(null);
  }

}
