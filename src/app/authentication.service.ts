import { Injectable, Output, EventEmitter } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs/observable/of';

@Injectable()
export class AuthenticationService {
  private token: string;
  private username: string;
  private refreshTimer: number;

  @Output() loggedOut = new EventEmitter<void>();

  constructor(private cookieService: CookieService, private http: HttpClient) { }

  public hasValidToken(): boolean {
    return !!this.token;
  }

  public getToken(): string {
    return this.token;
  }

  public getUsername(): string {
    return this.username;
  }

  public authenticate(username: string, password: string): Observable<string> {
    let body = {
      username: username,
      password: password
    };

    return this.http.post('/api/v1/auth/login', body).pipe(map(result => {
      this.token = result['token'];
      this.username = username;

      if (this.refreshTimer)
        window.clearInterval(this.refreshTimer);
      
      // Refresh token every 10 minutes
      this.refreshTimer = window.setInterval(() => this.refreshToken(), 1000*60*10);

      console.debug("Got a new token: " + this.token);

      return this.token;
    }), catchError(err => {
      console.debug("Authentication failed: " + JSON.stringify(err));
      return of(<string>null);
    }));
  }

  public getUserData(username: string): Observable<object> {
    return this.http.get<object>('/api/v1/auth/user/' + username);
  }

  private refreshToken(): void {
    this.http.post<object>('/api/v1/auth/refreshToken', '', { observe: 'response' })
      .catch(err => {
        return of(null);
      }).subscribe(obj => {
        if (obj) {
          this.token = obj['token'];
        } else {
          this.token = null;
          window.clearInterval(this.refreshTimer);
          this.refreshTimer = 0;
          this.loggedOut.emit();
        }
    });
  }
}
