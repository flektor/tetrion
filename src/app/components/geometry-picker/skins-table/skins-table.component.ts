import { Component, Input, Output, EventEmitter } from '@angular/core';
import { GameService } from 'src/app/services/game/game.service';
import { ThemeService } from 'src/app/services/theme/theme.service';

@Component({
  selector: 'skins-table',
  templateUrl: './skins-table.component.html',
  styleUrls: ['./skins-table.component.scss']
})
export class SkinsTableComponent {

  @Input('size') size: number;
  @Input('materials') matParams: Array<any>;
  @Output() onChangeComplete: EventEmitter<any> = new EventEmitter();

  skins: Array<string>;
  indices: Array<number>;

  constructor(
    private game: GameService,
    public theme: ThemeService
  ) { }

  async ngOnInit(): Promise<void> {

    await this.game.onReady();

    this.skins = new Array();
    this.indices = new Array();
    

    for (let i = 0; i < await this.game.getSkinsNumber(); i++) {
      this.indices.push(i);
    }

    for (let index of this.indices) {
      const blob = await this.game.getSkin(index, this.size, this.matParams);
      const reader = new FileReader();
      reader.onload = (e: any) => this.skins.push(e.target.result);
      reader.readAsDataURL(blob);
    }

  }


  pick(params: { element: any, index: number }): void {

    if (this.element) {
      this.element.classList.remove('active-skin');
    }

    params.element.classList.add('active-skin');
    this.element = params.element;
    this.onChangeComplete.emit(params.index);
  }


  private element: any;

}
