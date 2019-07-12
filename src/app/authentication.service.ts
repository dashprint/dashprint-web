import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';

@Injectable()
export class AuthenticationService {

  constructor(private cookieService: CookieService) { }

  public hasValidToken(): boolean {
    return false;
  }
}
