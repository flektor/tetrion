import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore } from '@angular/fire/firestore';
import { Router } from '@angular/router'; 
import { UserService } from '../../services/user/user.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})
export class RegisterPage implements OnInit {

  public username: string = "";
  public password: string = "";
  public cpassword: string = "";

  constructor(public afAuth: AngularFireAuth,
    public afstore:AngularFirestore,
    public router: Router,
    public user: UserService,
  ) { }

  ngOnInit() {
  }

  public async register() {
    const { username, password, cpassword } = this;
    if (password !== cpassword) {
      return console.error("Passwords do not match");
    }

    let res = await this.user.register(username, password);
    console.log(res);
  }

  public goToLoginPage() : void {
    this.router.navigate(['/login']);
  }


}
