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
  private apiStatusBS = new BehaviorSubject<APIStatus>(APIStatus.prcs);
  apiStatus = this.apiStatusBS.asObservable();

  private persistentSiteBanners: Banner[] = [];

  constructor(private http: HttpClient, private gs: GeneralService) {
    this.gs.persistentSiteBanners.subscribe(psb => this.persistentSiteBanners = psb);

    // Bindings for apt status to set banner
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

  getAPIStatus(): void {
    this.http.get(
      'public/api-status/'
    ).subscribe(
      {
        next: (result: any) => {
          this.apiStatusBS.next(APIStatus.on);
        },
        error: (err: any) => {
          console.log('error', err);
          this.apiStatusBS.next(APIStatus.off);
        }
      }
    );
  }

  get(loadingScreen: boolean, endpoint: string, params?: { [param: string]: string | number | boolean | ReadonlyArray<string | number | boolean> },
    onNext?: (result: any) => void, onError?: (error: any) => void, onComplete?: () => void,
  ): Observable<object> {
    if (loadingScreen) this.gs.incrementOutstandingCalls();

    const obs =
      this.http.get(
        endpoint,
        {
          params: params
        }
      );

    obs.subscribe(
      {
        next: (result: any) => {
          this.onNext(result, onNext);
        },
        error: (err: any) => {
          this.onError(loadingScreen, err, onError);
        },
        complete: () => {
          this.onComplete(loadingScreen, onComplete);
        }
      }
    );

    return obs;
  }

  post(loadingScreen: boolean, endpoint: string, obj: any,
    onNext?: (result: any) => void, onError?: (error: any) => void, onComplete?: () => void,
  ): Observable<object> {
    if (loadingScreen) this.gs.incrementOutstandingCalls();

    const obs = this.http.post(
      endpoint, obj
    );

    obs.subscribe(
      {
        next: (result: any) => {
          this.onNext(result, onNext);
        },
        error: (err: any) => {
          this.onError(loadingScreen, err, onError);
        },
        complete: () => {
          this.onComplete(loadingScreen, onComplete);
        }
      }
    );

    return obs;
  }

  delete(loadingScreen: boolean, endpoint: string, params?: { [param: string]: string | number | boolean | ReadonlyArray<string | number | boolean> },
    onNext?: (result: any) => void, onError?: (error: any) => void, onComplete?: () => void,
  ): Observable<object> {
    if (loadingScreen) this.gs.incrementOutstandingCalls();

    const obs = this.http.delete(
      endpoint,
      {
        params: params
      }
    );

    obs.subscribe(
      {
        next: (result: any) => {
          this.onNext(result, onNext);
        },
        error: (err: any) => {
          this.onError(loadingScreen, err, onError);
        },
        complete: () => {
          this.onComplete(loadingScreen, onComplete);
        }
      }
    );

    return obs;
  }

  put(loadingScreen: boolean, endpoint: string, obj: any,
    onNext?: (result: any) => void, onError?: (error: any) => void, onComplete?: () => void,
  ): Observable<object> {
    if (loadingScreen) this.gs.incrementOutstandingCalls();

    const obs = this.http.put(
      endpoint, obj
    )

    obs.subscribe(
      {
        next: (result: any) => {
          this.onNext(result, onNext);
        },
        error: (err: any) => {
          this.onError(loadingScreen, err, onError);
        },
        complete: () => {
          this.onComplete(loadingScreen, onComplete);
        }
      }
    );

    return obs;
  }

  private onNext(result: any, onNext?: (result: any) => void): void {
    // On successful calls set api status to on if it was off
    if (this.apiStatusBS.value === APIStatus.off) {
      this.apiStatusBS.next(APIStatus.on);
    }

    if (this.gs.checkResponse(result))
      if (onNext) onNext(result);
  }

  private onError(loadingScreen: boolean, err: any, onError?: (error: any) => void): void {
    if (loadingScreen) this.gs.decrementOutstandingCalls();
    if (err.status === 0) {
      this.getAPIStatus();
    }
    if (onError) onError(err);
  }

  private onComplete(loadingScreen: boolean, onComplete?: () => void): void {
    if (loadingScreen) this.gs.decrementOutstandingCalls();
    if (onComplete) onComplete();
  }

}
