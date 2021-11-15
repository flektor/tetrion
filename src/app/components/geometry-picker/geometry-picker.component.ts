import { Component, Input, HostListener } from '@angular/core';
import { Material } from 'three'; 
import { PopoverController } from '@ionic/angular';
import { UserService } from 'src/app/services/user/user.service';

@Component({
  selector: 'app-geometry-picker',
  templateUrl: './geometry-picker.component.html',
  styleUrls: ['./geometry-picker.component.scss'],
})
export class GeometryPickerComponent {

  @Input('skinSize') skinSize: number;
  @Input('rows') rows: number;
  @Input('columns') columns: number;
  @Input('materials') materials: Array<Material>;

  private geometryIndex: number;

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    event.stopPropagation();
    if (event.code === this.user.config.keys.back) {
      this.close();
    }
  }

  constructor(
    private user: UserService,
    private popCtrl: PopoverController
  ) { }

  public changeComplete(index: any) {
    this.geometryIndex = index;
  }

  public pick(): void {
    this.popCtrl.dismiss(this.geometryIndex);
  }
  public close(): void {
    this.popCtrl.dismiss();
  }

  ngOnInit() { }

}
