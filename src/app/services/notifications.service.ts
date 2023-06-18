import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { SwPush } from '@angular/service-worker';
import { GeneralService, RetMessage } from './general.service';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NotificationsService {

  readonly VAPID_PUBLIC_KEY = 'BLVq-lZnTul8qRwtujYKBwWOqiqh7d60JTrL7RRjPvneBDPO5lkY7Gq_c5cSbAhkZ-wdKXUaYS17L6_V7WrTQHU';

  private notifications_: Alert[] = [];
  private notificationsBS = new BehaviorSubject<Alert[]>(this.notifications_);
  notifications = this.notificationsBS.asObservable();

  private messages_: Alert[] = [];
  private messagesBS = new BehaviorSubject<Alert[]>(this.messages_);
  messages = this.messagesBS.asObservable();

  constructor(private swPush: SwPush, private gs: GeneralService, private http: HttpClient, private router: Router) { }

  subscribeToNotifications() {
    if (this.swPush.isEnabled) {
      console.log('pwa push available')
      this.requestSubscription();
      // Below i was worried it would try to resub each time the user logs in.
      /*console.log('push: ' + this.swPush.isEnabled);
      console.log(this.swPush.subscription);
      this.swPush.subscription.subscribe(s => {
        console.log(s?.endpoint);
        console.log(s?.expirationTime);
  
        if (!s?.endpoint) this.requestSubscription();
      });
  
      if (!this.swPush.subscription) this.requestSubscription();*/

      this.swPush.messages.subscribe(m => {
        this.gs.devConsoleLog('message');
        this.gs.devConsoleLog(m);
        this.getUserAlerts('notification');
      });

      /*this.swPush.subscription.subscribe(s => {
        console.log('subscription');
        console.log(s);
      });*/

      this.swPush.notificationClicks.subscribe(n => {
        this.gs.devConsoleLog('notificationClicks');
        this.gs.devConsoleLog(n);
        if (n.action === 'field-scouting') this.router.navigateByUrl('scout/scout-field');
      });
    }
  }

  requestSubscription(): void {
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
                //this.gs.addBanner({ message: (result as RetMessage).retMessage, severity: 1, time: 5000 });
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

  pushNotification(n: Alert): void {
    this.notifications_.push(n);
    this.notificationsBS.next(this.notifications_);
  }

  removeNotification(i: number): void {
    this.notifications_.splice(i, 1);
    this.notificationsBS.next(this.notifications_);
  }

  pusMessage(m: Alert): void {
    this.messages_.push(m);
    this.messagesBS.next(this.messages_);
  }

  getUserAlerts(alert_comm_typ_id: string) {
    this.gs.incrementOutstandingCalls();
    this.http.get(
      'user/alerts/', {
      params: {
        alert_comm_typ_id: alert_comm_typ_id
      }
    }
    ).subscribe(
      {
        next: (result: any) => {
          if (alert_comm_typ_id === 'notification') {
            this.notifications_ = [];
            this.notificationsBS.next(this.notifications_);
            for (let n of result as Alert[]) {
              this.pushNotification(n);
            }
          }

          if (alert_comm_typ_id === 'message') {
            this.messages_ = [];
            this.messagesBS.next(this.messages_);
            for (let m of result as Alert[]) {
              this.pusMessage(m);
            }
          }
        },
        error: (err: any) => {
          this.gs.decrementOutstandingCalls();
          console.log('error', err);
        },
        complete: () => {
          this.gs.decrementOutstandingCalls();
        }
      }
    );
  }

  dismissAlert(a: Alert): void {
    this.gs.incrementOutstandingCalls();
    this.http.get(
      'alerts/dismiss/', {
      params: {
        alert_channel_send_id: a.alert_channel_send_id.toString()
      }
    }
    ).subscribe(
      {
        next: (result: any) => {
          if (this.gs.checkResponse(result)) {
            let index = this.gs.arrayObjectIndexOf(this.notifications_, 'alert_channel_send_id', a.alert_channel_send_id.toString());
            this.notifications_.splice(index, 1);
            this.notificationsBS.next(this.notifications_);
          }
        },
        error: (err: any) => {
          console.log('error', err);
          this.gs.triggerError(err);
          this.gs.decrementOutstandingCalls();
        },
        complete: () => {
          this.gs.decrementOutstandingCalls();
        }
      }
    );
  }
}

export class UserPushNotificationSubscriptionObject {
  endpoint = '';
  p256dh = '';
  auth = '';
}

export class Alert {
  alert_id = 0;
  alert_channel_send_id = 0;
  alert_body = '';
  alert_subject = '';
  staged_time = new Date();
}