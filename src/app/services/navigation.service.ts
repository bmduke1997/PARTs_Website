import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { GeneralService } from './general.service';
import { Link } from '../models/navigation.models';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class NavigationService {

  /* Active sub Page */
  private subPageBS = new BehaviorSubject<string>('');
  subPage = this.subPageBS.asObservable();

  /* Sub Pages */
  private subPagesBS = new BehaviorSubject<Link[]>([]);
  subPages = this.subPagesBS.asObservable();

  /* State of navigation expander */
  private navigationState = new BehaviorSubject<NavigationState>(NavigationState.expanded);
  currentNavigationState = this.navigationState.asObservable();

  constructor(private gs: GeneralService, private router: Router) { }

  setSubPage(routerLink: string): void {
    this.gs.scrollTo(0);
    this.subPageBS.next(routerLink);

    //if (this.router.url !== routerLink && routerLink.includes('/'))
    //this.router.navigate([routerLink]);
  }

  setSubPages(routerLink: string): void {
    const area = routerLink.split('/');
    let subPages: Link[] = [];
    switch (area[1]) {
      case 'admin':
        subPages = [
          new Link('Users', '/admin/admin-users', 'account-group'),
          new Link('Security', '/admin/security', 'security'),
          new Link('Team Application Form', '/admin/team-application-form', 'chat-question-outline'),
          new Link('Team Contact Form', '/admin/team-contact-form', 'chat-question-outline'),
          new Link('Phone Types', '/admin/phone-types', 'phone'),
          new Link('Error Log', '/admin/error-log', 'alert-circle-outline'),
        ];
        if (!environment.production) subPages.push(new Link('Requested Items', '/admin/requested-items', 'view-grid-plus'));
        break;
      case 'scouting':
        switch (area[2]) {
          case 'scouting-admin':
            subPages = [
              new Link('Users', '/scouting/scouting-admin/scouting-users', 'account-group'),
              new Link('Season', '/scouting/scouting-admin/manage-season', 'card-bulleted-settings-outline'),
              new Link('Schedule', '/scouting/scouting-admin/schedule', 'clipboard-text-clock'),
              new Link('Scouting Activity', '/scouting/scouting-admin/activity', 'account-reactivate'),
              new Link('Field Questions', '/scouting/scouting-admin/manage-field-questions', 'chat-question-outline'),
              new Link('Field Question Aggregates', '/scouting/scouting-admin/manage-field-question-aggregates', 'sigma'),
              new Link('Field Question Conditions', '/scouting/scouting-admin/manage-field-question-conditions', 'code-equal'),
              new Link('Field Responses', '/scouting/scouting-admin/manage-field-responses', 'table-edit'),
              new Link('Pit Questions', '/scouting/scouting-admin/manage-pit-questions', 'chat-question-outline'),
              new Link('Pit Question Conditions', '/scouting/scouting-admin/manage-pit-question-conditions', 'code-equal'),
              new Link('Pit Responses', '/scouting/scouting-admin/manage-pit-responses', 'table-edit'),
            ];
            break;
          case 'match-planning':
            subPages = [
              new Link('Matches', '/scouting/match-planning/plan-matches', 'soccer-field'),
              new Link('Team Notes', '/scouting/match-planning/team-notes', 'note-multiple'),
            ];
            break;
        }
        break;
    }

    let match = subPages.filter(sp => sp.routerlink === routerLink);

    this.setSubPage(match.length > 0 ? match[0].routerlink : subPages.length > 0 ? subPages[0].routerlink : '');

    // this handles when someone click on a sub group of pages routing them to the default page
    if (match.length <= 0 && subPages.length > 0) {
      this.router.navigate([subPages[0].routerlink]);
    }

    this.subPagesBS.next(subPages);
  }

  setNavigationState(n: NavigationState): void {
    this.navigationState.next(n);
  }
}

export enum NavigationState {
  expanded,
  collapsed,
  hidden
}
