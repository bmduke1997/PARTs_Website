import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { SwPush } from '@angular/service-worker';
import { Banner, GeneralService, RetMessage } from './general.service';
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
        this.gs.devConsoleLog('subscribeToNotifications - message', m);
        this.getUserAlerts('notification');
      });

      /*this.swPush.subscription.subscribe(s => {
        console.log('subscription');
        console.log(s);
      });*/

      this.swPush.notificationClicks.subscribe(n => {
        this.gs.devConsoleLog('subscribeToNotifications - notificationClicks', n);
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
              this.gs.addBanner(new Banner('Couldn\'t subscribe to push notifications.', 0));
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
    this.gs.addBanner(new Banner(`New Notificaiton:\n${n.alert_subject}`, 3500));
    this.notificationsBS.next(this.notifications_);
  }

  removeNotification(i: number): void {
    this.notifications_.splice(i, 1);
    this.notificationsBS.next(this.notifications_);
  }

  pushMessage(m: Alert): void {
    this.messages_.push(m);
    this.gs.addBanner(new Banner(`New Message:\n${m.alert_subject}`, 3500));
    this.messagesBS.next(this.messages_);
  }

  removeMessage(i: number): void {
    this.messages_.splice(i, 1);
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
            for (let r of result as Alert[]) {
              let found = false;
              this.notifications_.forEach(n => {
                if (n.alert_channel_send_id === r.alert_channel_send_id)
                  found = true;
              });
              if (!found) this.pushNotification(r);
            }
          }

          if (alert_comm_typ_id === 'message') {
            for (let r of result as Alert[]) {
              let found = false;
              this.messages_.forEach(m => {
                if (m.alert_channel_send_id === r.alert_channel_send_id)
                  found = true;
              });
              if (!found) this.pushMessage(r);
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
            let index = this.gs.arrayObjectIndexOf(this.notifications_, a.alert_channel_send_id, 'alert_channel_send_id');
            if (index >= 0) this.removeNotification(index);
            index = this.gs.arrayObjectIndexOf(this.messages_, a.alert_channel_send_id, 'alert_channel_send_id')
            if (index >= 0) this.removeMessage(index);
            this.getUserAlerts('notification');
            this.getUserAlerts('message');
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