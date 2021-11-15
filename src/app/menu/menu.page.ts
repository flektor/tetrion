import { Component, AfterViewInit, ViewChild } from '@angular/core';
import { Router, RouterOutlet, ActivationStart } from '@angular/router';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.page.html',
  styleUrls: ['./menu.pages.scss'],
})
export class MenuPage implements AfterViewInit {

  @ViewChild(RouterOutlet) private outlet: RouterOutlet;

  constructor(
    private router: Router,
    private modal: ModalController
  ) { 
    
  }

  ngAfterViewInit(): void { 
    this.router.events.subscribe(e => {
      if (e instanceof ActivationStart && e.snapshot.outlet === "menu") {
        if (this.outlet) {
          this.outlet.deactivate();
        }
      }
    }); 
    this.router.navigate([{ outlets: { menu: 'options' } }]);
  }

  public close() {
    this.modal.dismiss({ 'dismissed': true });
  }
}
