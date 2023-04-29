import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { SwPush } from '@angular/service-worker';
import { GeneralService, RetMessage } from './general.service';

@Injectable({
  providedIn: 'root'
})
export class PushService {

  readonly VAPID_PUBLIC_KEY = 'BLVq-lZnTul8qRwtujYKBwWOqiqh7d60JTrL7RRjPvneBDPO5lkY7Gq_c5cSbAhkZ-wdKXUaYS17L6_V7WrTQHU';

  constructor(private swPush: SwPush, private gs: GeneralService, private http: HttpClient) { }

  subscribeToNotifications() {

    this.swPush.requestSubscription({
      serverPublicKey: this.VAPID_PUBLIC_KEY
    })
      .then(sub => {
        this.gs.incrementOutstandingCalls();
        const detected = window.navigator.userAgent.match(/(firefox|msie|chrome|safari|trident)/ig);
        const browser = detected && (detected.length || 0) > 0 ? detected[0].toLowerCase() : 'undetectable';
        const data = {
          status_type: 'subscribe',
          subscription: sub.toJSON(),
          browser: browser,
          user_agent: window.navigator.userAgent
        };
        this.http.post(
          'user/webpush-save/',
          data
        ).subscribe(
          {
            next: (result: any) => {
              if (this.gs.checkResponse(result)) {
                this.gs.addBanner({ message: (result as RetMessage).retMessage, severity: 1, time: 5000 });
              }
            },
            error: (err: any) => {
              this.gs.decrementOutstandingCalls();
              console.log('error', err);
              this.gs.addBanner({ message: 'Couldn\'t subscribe to push notifications.', severity: 1, time: 0 });
            },
            complete: () => {
              this.gs.decrementOutstandingCalls();
            }
          }
        );
      })
      .catch(err => console.error("Could not subscribe to notifications", err));
  }
}

export class UserPushNotificationSubscriptionObject {
  endpoint = '';
  p256dh = '';
  auth = '';
}
