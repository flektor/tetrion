import { Component, OnInit, HostListener } from '@angular/core'; 
import { PopoverController, NavParams } from '@ionic/angular';
import { UserService } from 'src/app/services/user/user.service';

@Component({
  selector: 'app-color-picker',
  templateUrl: './color-picker.component.html',
  styleUrls: ['./color-picker.component.scss'],
})
export class ColorPickerComponent implements OnInit {
  public colors: Array<string>;
  public color: string;

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    event.stopPropagation();
    if (event.code === this.user.config.keys.back) {
      this.close();
    }
  }

  constructor(
    private user: UserService,
    private popCtrl: PopoverController,
    navParams: NavParams
  ) {
    this.color = navParams.data.color;
    this.colors = navParams.data.colors;
  }

  public changeComplete(event: any) {
    this.color = event.color.hex;
  }

  public pick(): void {
    this.popCtrl.dismiss(this.color);
  }
  public close(): void {
    this.popCtrl.dismiss();
  }

  ngOnInit() { }

}
