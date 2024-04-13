import { Injectable, Injector } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpInterceptor,
  HttpSentEvent,
  HttpHeaderResponse,
  HttpProgressEvent,
  HttpResponse,
  HttpUserEvent,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { GeneralService } from '../services/general.service';
import { User } from '../models/user.models';
import { AuthService, Token } from '../services/auth.service';

@Injectable()
export class HTTPInterceptor implements HttpInterceptor {
  private token: Token = new Token();
  private user: User = new User();

  constructor(private auth: AuthService, private gs: GeneralService) {
    this.auth.currentToken.subscribe((t) => (this.token = t));
    this.auth.currentUser.subscribe(u => this.user = u);
  }

  // function which will be called for all http calls
  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpSentEvent | HttpHeaderResponse | HttpProgressEvent | HttpResponse<any> | HttpUserEvent<any> | any> {
    //const baseURL = this.apiStatus === 'on' || this.apiStatus === 'prcs' ? environment.baseUrl : environment.backupBaseUrl;
    const baseURL = environment.baseUrl;
    this.gs.devConsoleLog('HTTP Interceptor access token may be below');
    if (request.url.includes('./assets')) { // this is for the icons used on the front end
      return next.handle(request);
    } else if (this.user && this.token && this.token.access && !this.auth.isTokenExpired(this.token.access)) {
      request = request.clone({
        url: baseURL + request.url,
        setHeaders: {
          Authorization: `Bearer ${this.token.access}`
        }
      });
    } else {
      let withCredentials = request.url.includes('user/token/refresh/');
      //console.log(request.url, withCredentials);
      request = request.clone({
        url: baseURL + request.url,
        //withCredentials: withCredentials,
      });
    }

    return next.handle(request);
  }
}
