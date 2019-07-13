import { Injectable } from "@angular/core";
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthenticationService } from './app/authentication.service';

@Injectable()
export class AuthenticationInterceptor implements HttpInterceptor {
	constructor (private authenticationService: AuthenticationService) {
	}

	intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
		if (this.authenticationService.hasValidToken()) {
			request = request.clone({
				headers: new HttpHeaders({
					"Authorization": "Bearer " + this.authenticationService.getToken()
				})
			});
		}
		return next.handle(request);
	}
}
