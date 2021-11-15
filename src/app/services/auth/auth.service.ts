import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { UserService } from "../user/user.service";

@Injectable()
export class AuthService {

  constructor(private router: Router, private user: UserService) {

  }

  async canActivate(route) {
    if(await this.user.isAuthenticated()) {
      return true;
    }
    this.router.navigate(['/login'])
    return false;
  }
}
