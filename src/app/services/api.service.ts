import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Banner, GeneralService } from './general.service';
import { APIStatus } from '../models/api.models';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthCallStates } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class APIService {
  private apiStatusBS = new BehaviorSubject<APIStatus>(APIStatus.on);
  apiStatus = this.apiStatusBS.asObservable();

  private persistentSiteBanners: Banner[] = [];

  private outstandingApiStatusCheck = false;

  constructor(private http: HttpClient, private gs: GeneralService) {
    this.gs.persistentSiteBanners.subscribe(psb => this.persistentSiteBanners = psb);

    // Bindings for app status to set banner
    this.apiStatus.subscribe(s => {
      let message = "Application is running in offline mode.";

      switch (s) {
        case APIStatus.on:
          this.gs.removePersistentBanner(new Banner(message));
          break;
        case APIStatus.off:
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

  private getAPIStatus(): void {
    if (!this.outstandingApiStatusCheck) {
      this.outstandingApiStatusCheck = true;
      this.http.get(
        'public/api-status/'
      ).subscribe(
        {
          next: (result: any) => {
            if (this.apiStatusBS.value !== APIStatus.on) this.apiStatusBS.next(APIStatus.on);
          },
          error: (err: any) => {
            console.log('error', err);
            if (this.apiStatusBS.value !== APIStatus.off) this.apiStatusBS.next(APIStatus.off);
            this.outstandingApiStatusCheck = false;
          }, complete: () => {
            this.outstandingApiStatusCheck = false;
          },
        }
      );
    }
  }

  get(loadingScreen: boolean, endpoint: string, params?: { [param: string]: string | number | boolean | ReadonlyArray<string | number | boolean> },
    onNext?: (result: any) => void, onError?: (error: any) => void, onComplete?: () => void,
  ): Promise<any> {
    if (loadingScreen) this.gs.incrementOutstandingCalls();

    return this.subscriptionToPromise(this.http.get(
      endpoint,
      {
        params: params
      }
    ), loadingScreen, onNext, onError, onComplete);
  }

  post(loadingScreen: boolean, endpoint: string, obj: any,
    onNext?: (result: any) => void, onError?: (error: any) => void, onComplete?: () => void,
  ): Promise<any> {
    if (loadingScreen) this.gs.incrementOutstandingCalls();

    return this.subscriptionToPromise(this.http.post(
      endpoint, obj
    ), loadingScreen, onNext, onError, onComplete);
  }

  delete(loadingScreen: boolean, endpoint: string, params?: { [param: string]: string | number | boolean | ReadonlyArray<string | number | boolean> },
    onNext?: (result: any) => void, onError?: (error: any) => void, onComplete?: () => void,
  ): Promise<any> {
    if (loadingScreen) this.gs.incrementOutstandingCalls();

    return this.subscriptionToPromise(this.http.delete(
      endpoint,
      {
        params: params
      }
    ), loadingScreen, onNext, onError, onComplete);
  }

  put(loadingScreen: boolean, endpoint: string, obj: any,
    onNext?: (result: any) => void, onError?: (error: any) => void, onComplete?: () => void,
  ): Promise<any> {
    if (loadingScreen) this.gs.incrementOutstandingCalls();

    return this.subscriptionToPromise(this.http.put(
      endpoint, obj
    ), loadingScreen, onNext, onError, onComplete);
  }

  private onNext(result: any, onNext?: (result: any) => void, onError?: (error: any) => void): void {
    // On successful calls set api status to on if it was off
    if (this.apiStatusBS.value === APIStatus.off) {
      this.apiStatusBS.next(APIStatus.on);
    }

    if (this.gs.checkResponse(result)) {
      if (onNext) onNext(result);
    }
    else
      if (onError) onError(result);
  }

  private onError(loadingScreen: boolean, err: any, onError?: (error: any) => void): void {
    if (loadingScreen) this.gs.decrementOutstandingCalls();

    // This means connection is down error, check
    if (err.status === 0) {
      this.getAPIStatus();
    }
    if (onError) onError(err);
  }

  private onComplete(loadingScreen: boolean, onComplete?: () => void): void {
    if (loadingScreen) this.gs.decrementOutstandingCalls();
    if (onComplete) onComplete();
  }

  private subscriptionToPromise(obs: Observable<any>, loadingScreen: boolean, onNext?: (result: any) => void, onError?: (error: any) => void, onComplete?: () => void): Promise<any> {
    return new Promise<any>(resolve => {
      obs.subscribe(
        {
          next: (result: any) => {
            this.onNext(result, onNext, onError);
            resolve(result);
          },
          error: (err: any) => {
            this.onError(loadingScreen, err, onError);
            resolve(err);
          },
          complete: () => {
            this.onComplete(loadingScreen, onComplete);
          }
        }
      );
    });
  }

}
