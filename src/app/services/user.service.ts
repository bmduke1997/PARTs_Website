import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AuthGroup, AuthPermission, User } from './auth.service';
import { GeneralService, RetMessage } from './general.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private users = new BehaviorSubject<User[]>([]);
  currentUsers = this.users.asObservable();

  private groups = new BehaviorSubject<AuthGroup[]>([]);
  currentGroups = this.groups.asObservable();

  private permissions = new BehaviorSubject<AuthPermission[]>([]);
  currentPermissions = this.permissions.asObservable();

  constructor(private http: HttpClient, private gs: GeneralService) { }

  getUsers(is_active = 0, is_admin = 0) {
    this.gs.incrementOutstandingCalls();
    this.http.get(
      'user/users/',
      {
        params: {
          is_active: is_active,
          is_admin: is_admin
        }
      }
    ).subscribe(
      {
        next: (result: any) => {
          this.users.next(result as User[]);
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

  saveUser(u: User, groups?: AuthGroup[], fn?: Function): void {
    this.gs.incrementOutstandingCalls();

    let o: any = { user: u };

    if (groups) o['groups'] = groups;

    this.http.post(
      'user/save/', o
    ).subscribe(
      {
        next: (result: any) => {
          if (this.gs.checkResponse(result)) {
            this.gs.addBanner({ message: (result as RetMessage).retMessage, severity: 1, time: 5000 });
            if (fn) fn();
          }
        },
        error: (err: any) => {
          console.log('error', err);
          this.gs.triggerError(err);
        },
        complete: () => {
          this.gs.decrementOutstandingCalls();
        }
      }
    );
  }

  getGroups() {
    this.gs.incrementOutstandingCalls();
    this.http.get(
      'user/groups/'
    ).subscribe(
      {
        next: (result: any) => {
          this.groups.next(result as AuthGroup[]);
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

  getPermissions() {
    this.gs.incrementOutstandingCalls();
    this.http.get(
      'user/permissions/'
    ).subscribe(
      {
        next: (result: any) => {
          this.permissions.next(result as AuthPermission[]);
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
}
