import { Component, OnInit, ViewChild } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { IonInput } from '@ionic/angular';
import { UserService } from '../../services/user/user.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {

  message: string = "";

  @ViewChild("input1", { static: false }) input1: IonInput;
  @ViewChild("input2", { static: false }) input2: IonInput;

  constructor(public afAuth: AngularFireAuth,
    public router: Router,
    public user: UserService,
  ) { }


  public validationsForm: FormGroup;
  // private formBuilder: FormBuilder;

  // public validationsForm: FormControl

  ngOnInit() {

    // this.validationsForm = new FormGroup({
    //   username: new FormControl('', Validators.required),
    //   password: new FormControl('', Validators.compose([
    //     Validators.required,
    //     Validators.pattern('^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+.[a-zA-Z0-9-.]+$')
    //   ]))
    // });


    // this.validationsForm.statusChanges.subscribe(status => {
    //   console.log(status);
    // });

  }

  goToRegisterPage(): void {
    this.router.navigateByUrl('/register');
  }

  // offline(): void {
  //   this.user.offline();
  // }


  public async login(asGuest?: boolean): Promise<void> {
    try {

      const response: any = await this.user.login(this.input1.value.toString(), this.input2.value.toString());
      // const response: any = asGuest
      //   ? await this.user.login("Guest", "Guest")
      //   : await this.user.login(this.input1.value.toString(), this.input2.value.toString());



      if (response.code) {
        switch (response.code) {
          case "auth/user-not-found":
          case "auth/wrong-password":
            this.message = "*Invalid username or password.";
            break;
          default:
            this.message = "*Invalid input values.";
            console.log(response);
        }
        return;
      }
      this.message = "";
      this.input1.value = "";
      this.input2.value = ""; 
      
    } catch (error) {
      console.log(error.code);
    }
  }




}
