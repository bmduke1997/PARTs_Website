import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Banner, GeneralService } from './general.service';
import { APIStatus } from '../models/api.models';
import { BehaviorSubject } from 'rxjs';
import { AuthCallStates } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class APIService {
  private apiStatusBS = new BehaviorSubject<APIStatus>(APIStatus.prcs);
  apiStatus = this.apiStatusBS.asObservable();

  private persistentSiteBanners: Banner[] = [];

  constructor(private http: HttpClient, private gs: GeneralService) {
    this.gs.persistentSiteBanners.subscribe(psb => this.persistentSiteBanners = psb);

    this.apiStatus.subscribe(s => {
      let message = "Application is running in offline mode.";

      switch (s) {
        case APIStatus.on:
          console.log('on event');
          this.gs.removePersistentBanner(new Banner(message));
          break;
        case APIStatus.off:
          console.log('off event');
          let found = false;
          this.persistentSiteBanners.forEach((b: Banner) => {
            if (b.message === message) found = true;


          });

          if (!found) {
            this.gs.addPersistentBanner(new Banner(message));
          }
          break;
      }
    });
  }

  getAPIStatus(): void {
    this.http.get(
      'public/api-status/'
    ).subscribe(
      {
        next: (result: any) => {
          console.log('on');
          this.apiStatusBS.next(APIStatus.on);
        },
        error: (err: any) => {
          console.log('off');
          console.log('error', err);
          this.apiStatusBS.next(APIStatus.off);
        }
      }
    );
  }

  get(loadingScreen: boolean, endpoint: string, params?: { [param: string]: string | number | boolean | ReadonlyArray<string | number | boolean> },
    onNext?: (result: any) => void, onError?: (error: any) => void, onComplete?: () => void,
  ) {
    if (loadingScreen) this.gs.incrementOutstandingCalls();
    console.log(endpoint);
    this.http.get(
      endpoint,
      {
        params: params
      }
    ).subscribe(
      {
        next: (result: any) => {
          if (this.apiStatusBS.value === APIStatus.off) {
            console.log('on');
            this.apiStatusBS.next(APIStatus.on);
          }
          if (this.gs.checkResponse(result))
            if (onNext) onNext(result);
        },
        error: (err: any) => {
          if (loadingScreen) this.gs.decrementOutstandingCalls();
          if (err.status === 0) {
            this.getAPIStatus();
          }
          if (onError) onError(err);
        },
        complete: () => {
          if (loadingScreen) this.gs.decrementOutstandingCalls();
          if (onComplete) onComplete();
        }
      }
    );
  }

  post(loadingScreen: boolean, endpoint: string, obj: any,
    onNext?: (result: any) => void, onError?: (error: any) => void, onComplete?: () => void,
  ) {
    if (loadingScreen) this.gs.incrementOutstandingCalls();
    this.http.post(
      endpoint, obj
    ).subscribe(
      {
        next: (result: any) => {
          if (this.gs.checkResponse(result))
            if (onNext) onNext(result);
        },
        error: (err: any) => {
          if (loadingScreen) this.gs.decrementOutstandingCalls();
          console.log('error', err);
          if (onError) onError(err);
        },
        complete: () => {
          if (loadingScreen) this.gs.decrementOutstandingCalls();
          if (onComplete) onComplete();
        }
      }
    );
  }


}
