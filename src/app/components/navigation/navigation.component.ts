import { Component, OnInit, HostListener, ViewChild, ElementRef, Renderer2, AfterViewInit } from '@angular/core';
import { Router, NavigationEnd, Event as NavigationEvent, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';
import { Banner } from '../../models/api.models';
import { Link, SubLink } from '../../models/navigation.models';
import { User } from '../../models/user.models';
import { APIService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { CacheService } from '../../services/cache.service';
import { GeneralService, AppSize } from '../../services/general.service';
import { NavigationService, NavigationState } from '../../services/navigation.service';
import { Alert, NotificationsService } from '../../services/notifications.service';
import { PwaService } from '../../services/pwa.service';
import { CompetitionInit } from '../webpages/event-competition/event-competition.component';
import { ButtonComponent } from '../atoms/button/button.component';
import { FormElementComponent } from '../atoms/form-element/form-element.component';
import { SubNavigationComponent } from '../atoms/sub-navigation/sub-navigation.component';
import { ClickOutsideDirective } from '../../directives/click-outside/click-outside.directive';
import { ClickInsideDirective } from '../../directives/click-inside/click-inside.directive';
import { DateToStrPipe } from '../../pipes/date-to-str.pipe';

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [CommonModule, RouterLink, ButtonComponent, FormElementComponent, SubNavigationComponent, RouterLinkActive, ClickOutsideDirective, ClickInsideDirective, DateToStrPipe],
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss']
})
export class NavigationComponent implements OnInit, AfterViewInit {

  private resizeTimeout: any;
  private scrollResizeTimer: any;
  private scrollPosition = 0;
  private userScrolling = false;

  urlEnd = '';
  //page = 'Members';
  //pages: string[] = []; //['Devices', 'Firmware', 'Support']

  @ViewChild('thisHeader', { read: ElementRef, static: true }) header!: ElementRef;
  @ViewChild('thisMain', { read: ElementRef, static: true }) main!: ElementRef;
  @ViewChild('thisWrapper', { read: ElementRef, static: true }) wrapper!: ElementRef;

  subNav = '';
  pageIDs: any = {};
  pagesWithNavs = ['admin', 'scouting admin', 'match planning'];
  navExpanded = true;
  manualNavExpander = false;
  hideNavExpander = false;
  showNav = true;
  screenXs = false;
  xsShowSearch = false;
  showNotificationModalVisible = false;
  showMessageModalVisible = false;
  showUserModalVisible = false;

  //TODO this is a wip
  rightHandNav = false;

  user: User = new User();

  appMenu: Link[] = [];
  userLinks: Link[] = [];

  siteHeaderHeight = 7;
  siteBannerHeight = 0;
  siteBanners: Banner[] = [];

  removeHeader = false;

  tokenString = '';

  notifications: Alert[] = [];
  messages: Alert[] = [];

  frontendEnv = "";
  backendEnv = "";

  constructor(private gs: GeneralService,
    private renderer: Renderer2,
    private auth: AuthService,
    private cs: CacheService,
    private router: Router,
    private api: APIService,
    private pwa: PwaService,
    private ns: NotificationsService,
    private navigationService: NavigationService) {

    this.auth.user.subscribe(u => this.user = u);

    this.auth.userLinks.subscribe((ul) => {
      this.userLinks = this.gs.cloneObject(ul);

      this.appMenu.forEach(mi => {
        if (mi.menu_name == 'Members') {
          let index = this.gs.arrayObjectIndexOf(mi.menu_items, 'menu_name', 'Install');

          mi.menu_items = index !== -1 ? [...this.userLinks, new Link('Install', '')] : [...this.userLinks];
          //if (!this.gs.strNoE(this.user.id)) mi.menu_items.push(new SubLink('Logout', ''));
          //else mi.menu_items.push(new SubLink('Login', 'login'))
        }
      });

      this.userLinks.forEach(ul => {
        this.removeHeader = false;

        this.appMenu.forEach(mi => {
          mi.menu_items.forEach(mii => {
            this.checkActiveMenuItem(this.urlEnd, mi, mii);
          });
        });
      });
    });

    this.pwa.installEligible.subscribe(e => {
      window.setTimeout(() => {
        this.appMenu.forEach(mi => {
          if (mi.menu_name === 'Members') {
            let index = this.gs.arrayObjectIndexOf(mi.menu_items, 'menu_name', 'Install');

            if (e && index === -1) {
              mi.menu_items.push(new Link('Install', ''));
            }
            else if (!e && index !== -1) {
              mi.menu_items.splice(index, 1);
            }
          }
        });
      }, 1);
    });

    this.router.events.subscribe(
      (event: NavigationEvent) => {
        if (event instanceof NavigationEnd) {
          this.urlEnd = event.url;

          this.navigationService.setSubPages(this.urlEnd);

          this.resetActiveMenuItem();
          this.appMenu.forEach(mi => {
            mi.menu_items.forEach(mii => {
              this.checkActiveMenuItem(this.urlEnd, mi, mii);
            });
          });


          if (this.gs.getAppSize() < AppSize.LG) this.setNavCollapsedHidden(false);

        }
      });

    this.ns.notifications.subscribe(n => this.notifications = n);
    this.ns.messages.subscribe(m => this.messages = m);

    this.gs.siteBanners.subscribe(psb => {
      this.siteBanners = psb;
      this.siteBannerHeight = 4 * this.siteBanners.length;
    });

    this.gs.scrollPosition$.subscribe(scrollY => {
      this.scrollEvents(scrollY, true);
    });
  }

  ngOnInit(): void {
    this.frontendEnv = environment.environment;

    if (!this.gs.strNoE(this.frontendEnv)) this.api.getAPIStatus().then(result => {
      this.backendEnv = result;
    });

    this.setNavExpandedCollapsed(this.gs.getAppSize() >= AppSize.LG);

    this.hideNavExpander = this.gs.getAppSize() < AppSize.LG;

    if (this.hideNavExpander) this.setNavCollapsedHidden(false);

    this.screenXs = this.gs.getAppSize() === AppSize.XS;

    this.appMenu = [
      new Link('Join PARTs', '', 'account-supervisor', [
        new Link('Mechanical', 'join/mechanical'),
        new Link('Electrical', 'join/electrical'),
        new Link('Programming', 'join/programming'),
        new Link('Impact', 'join/impact'),
        new Link('Application Form', 'join/team-application'),
      ], 'Our Subteams'),
      new Link('Contact Us', 'contact', 'card-account-details'),
      new Link('Sponsoring', 'sponsor', 'account-child-circle'),
      new Link('About', 'about', 'information'),
      new Link('Media', 'media', 'image-multiple'),
      new Link('Resources', 'resources', 'archive'), //book clipboard-text-outline folder-open-outline
      new Link('FIRST', 'first', 'first'),
      new Link('Members', '', 'folder', [
        new Link('Login', 'login'),
      ], 'Members Area'),
    ];

    // Check if comp page is available
    this.api.get(false, 'public/competition/init/', undefined, (result: any) => {
      if ((result as CompetitionInit).event) {
        this.gs.triggerChange(() => {
          this.appMenu.unshift(new Link('Competition', 'competition', 'robot-excited-outline'));
        });
      }
    });

    this.tokenString = environment.tokenString;

    let token = localStorage.getItem(this.tokenString) || '';
    let loggedInBefore = localStorage.getItem(environment.loggedInHereBefore) || '';

    if (this.gs.strNoE(token) && this.gs.strNoE(loggedInBefore) && !this.hideNavExpander) {
      this.removeHeader = true;
    }
  }

  ngAfterViewInit(): void {
    this.scrollPosition = window.scrollY;
  }

  @HostListener('window:scroll', ['$event']) // for window scroll events
  onScroll(event: any) {
    this.scrollEvents(window.scrollY);

  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    if (this.resizeTimeout != null) {
      window.clearTimeout(this.resizeTimeout);
    }

    this.resizeTimeout = window.setTimeout(() => {
      if (!this.manualNavExpander || this.gs.getAppSize() < AppSize.LG) {
        this.setNavExpandedCollapsed(this.gs.getAppSize() >= AppSize.LG);
        this.manualNavExpander = false;
        this.hideNavExpander = this.gs.getAppSize() < AppSize.LG;

        if (!this.hideNavExpander) {
          this.setNavCollapsedHidden(true);
          this.renderer.setStyle(this.header.nativeElement, 'top', '0');
        }
      }

      this.screenXs = this.gs.getAppSize() === AppSize.XS;
    }, 200);
  }

  scrollEvents(scrollY: number, innerScrollElement = false): void {
    this.subNav = '';

    if (this.hideNavExpander) {
      //if (!environment.production) console.log('--start--');

      //if (!environment.production) console.log('scroll pos: ' + this.scrollPosition);

      if (this.gs.strNoE(this.scrollPosition.toString())) {
        // wasn't set yet
        this.scrollPosition = 0;
      }

      //if (!environment.production) console.log('scroll y: ' + scrollY);

      const up = scrollY - this.scrollPosition < 0;

      //if (!environment.production) console.log('up ? ' + up);

      this.scrollPosition = scrollY;

      const delta = up ? 3 : -6;
      //if (!environment.production) console.log('delta : ' + delta);

      let top = parseInt(this.header.nativeElement.style.top.replace('px', ''), 10);

      if (isNaN(top)) {
        top = 0;
      }

      //if (!environment.production) console.log(this.header);
      //if (!environment.production) console.log('top: ' + top);
      top = top + delta;

      if (this.isBottomInView(this.wrapper)) {
        //if (!environment.production) console.log('bottom in view');
        top = -70;
      }
      else if (!innerScrollElement && this.isTopInView(this.wrapper)) {
        //if (!environment.production) console.log('top in view');
        top = 0;
      }

      // Keeps the top from going out of range
      if (top <= -70) {
        top = -70;
      } else if (top >= 0) {
        top = 0;
      }

      //if (!environment.production) console.log('top + delta: ' + top);
      this.setHeaderPosition(top);
      //if (!environment.production) console.log('--end--');
      /*
      //In chrome and some browser scroll is given to body tag
let pos = (document.documentElement.scrollTop || document.body.scrollTop) + document.documentElement.offsetHeight;
let max = document.documentElement.scrollHeight;
// pos/max will give you the distance between scroll bottom and and bottom of screen in percentage.
 if(pos == max )   {
 //Do your action here
 }
      
      if (!this.userScrolling) {
        this.scrollPosition = window.scrollY;
        this.userScrolling = true;
      }

      if (window.scrollY <= 70 && window.scrollY - this.scrollPosition >= 0) {
        this.renderer.setStyle(this.header.nativeElement, 'top', '-' + window.scrollY + 'px');
        this.renderer.setStyle(this.header.nativeElement, 'transition', 'width 0.15s ease');
      } else if (window.scrollY - this.scrollPosition >= 5) {
        this.renderer.setStyle(this.header.nativeElement, 'top', '-7rem');
        this.renderer.setStyle(this.header.nativeElement, 'transition', 'width 0.15s ease, top 0.15s linear');
      } else if (window.scrollY - this.scrollPosition < -5) {
        this.renderer.setStyle(this.header.nativeElement, 'top', '0');
        this.renderer.setStyle(this.header.nativeElement, 'transition', 'width 0.15s ease, top 0.15s linear');
      }

      if (this.scrollResizeTimer != null) {
        window.clearTimeout(this.scrollResizeTimer);
      }

      this.scrollResizeTimer = window.setTimeout(() => {
        this.userScrolling = false;
        this.scrollPosition = window.scrollY;
      }, 200);*/
    }
  }

  setHeaderPosition(top: number): void {
    this.renderer.setStyle(this.header.nativeElement, 'top', top + 'px');
    this.renderer.setStyle(this.main.nativeElement, 'paddingTop', (top + 70) + 'px');
  }

  openSubNav(pgID: string, elemID: string): void {
    if (this.gs.strNoE(this.subNav) || this.subNav !== elemID) {
      this.closeSubNav();

      const parent = document.getElementById(pgID);
      const child = document.getElementById(elemID);

      this.subNav = elemID;

      if (!this.navExpanded && parent && child) {
        let parentRect = parent.getBoundingClientRect();
        let childRect = child.getBoundingClientRect();
        let winHeight = window.innerHeight;

        if (childRect.bottom > winHeight) {
          let offScreen = childRect.bottom - winHeight;
          child.style.top = winHeight - child.offsetHeight - (25 / 2) + 'px';//parentRect.top - offScreen + 'px';
        }
        else child.style.top = parentRect.top + 'px';
      }
      else {
        if (parent && child) parent.style.height = 'calc(6.8rem + ' + child.offsetHeight + 'px + 32px)';
      }
    } else {
      this.closeSubNav(); // close on second click
    }
  }

  closeSubNav(resetNames = false): void {
    if (!this.gs.strNoE(this.subNav)) {
      this.gs.devConsoleLog('navigation.component/closeSubNav', this.subNav);
      const id = this.subNav.substring(0, this.subNav.length - 2);
      const parent = document.getElementById(id);
      if (parent) parent.style.height = '6.8rem';
      this.subNav = '';
      if (resetNames) this.resetActiveMenuItem();
    }
  }

  toggleForceNavExpanded(): void {
    this.manualNavExpander = true;
    this.setNavExpandedCollapsed(!this.navExpanded);
  }

  setNavExpandedCollapsed(b: boolean): void {
    this.navExpanded = b;
    if (this.navExpanded) this.navigationService.setNavigationState(NavigationState.expanded);
    else this.navigationService.setNavigationState(NavigationState.collapsed);
  }

  toggleShowNav(): void {
    this.setHeaderPosition(0);
    this.setNavCollapsedHidden(!this.showNav);
  }

  setNavCollapsedHidden(b: boolean): void {
    this.showNav = b;
    if (this.showNav) this.navigationService.setNavigationState(NavigationState.collapsed);
    else this.navigationService.setNavigationState(NavigationState.hidden);
  }

  closeNavOnMobile(): void {
    if (this.hideNavExpander) {
      this.setNavCollapsedHidden(false);
    }
  }

  xsToggleSearch(): void {
    this.xsShowSearch = !this.xsShowSearch;
  }

  dismissBanners(): void {
    console.log('remove banners');
    console.log(JSON.stringify(this.gs.getBanners()));
    this.gs.getBanners().forEach(b => this.gs.removeBanner(b));
  }

  showNotificationModal(): void {
    if (this.showNotificationModalVisible) this.showNotificationModalVisible = false;
    else this.showNotificationModalVisible = true;

    this.dismissBanners();
    this.hideMessageModal();
    this.hideUserModal();
  }

  hideNotificationModal(): void {
    this.showNotificationModalVisible = false;
  }

  dismissNotification(n: Alert): void {
    this.ns.dismissAlert(n);
  }

  showMessageModal(): void {
    if (this.showMessageModalVisible) this.showMessageModalVisible = false;
    else this.showMessageModalVisible = true;

    this.dismissBanners();
    this.hideNotificationModal();
    this.hideUserModal();
  }

  hideMessageModal(): void {
    this.showMessageModalVisible = false;
  }


  showUserModal(): void {
    if (this.showUserModalVisible) this.showUserModalVisible = false;
    else this.showUserModalVisible = true;

    this.dismissBanners();
    this.hideNotificationModal();
    this.hideMessageModal();
  }

  hideUserModal(): void {
    this.showUserModalVisible = false;
  }

  isBottomInView(er: ElementRef): boolean {
    if (er) {
      const rect = er.nativeElement.getBoundingClientRect();
      //const topShown = rect.top >= 0;
      const bottomShown = rect.bottom <= window.innerHeight + 2;
      return bottomShown;
    }
    return false;
  }

  isTopInView(er: ElementRef): boolean {
    if (er) {
      const rect = er.nativeElement.getBoundingClientRect();
      const topShown = rect.top >= 0;
      //const bottomShown = rect.bottom <= window.innerHeight;
      return topShown;
    }
    return false;
  }

  logOut(): void {
    this.auth.logOut();
    //this.page = 'Members';
    //this.resetMenuItemNames();
  }

  getNavPageID(key: string): string {
    if (!this.pageIDs[key]) this.pageIDs[key] = this.gs.getNextGsId();
    return this.pageIDs[key];
  }

  checkActiveMenuItem(urlEnd: string, mi: Link, mii: SubLink): void {
    if (!this.gs.strNoE(mii.routerlink) && urlEnd.includes(mii.routerlink)) this.setActiveMenuSubmenuAndItem(mi, mii, urlEnd);
  }

  setActiveMenuSubmenuAndItem(parent: Link, child: SubLink, routerLink: string): void {
    this.resetActiveMenuItem();
    if (child.menu_name.toLocaleLowerCase() === 'logout') this.auth.logOut();
    else if (child.menu_name.toLocaleLowerCase() === 'install') this.pwa.installPwa();
    else {
      parent.menu_name_active_item = child.menu_name;
      this.navigationService.setSubPages(routerLink);
    }

    /*else this.appMenu.forEach(mi => {
      if (mi.menu_name === parent.menu_name) {
        mi.menu_name_active_item = child.menu_name;
      }
    });*/
  }

  resetActiveMenuItem(): void {
    this.appMenu.forEach(mi => mi.menu_name_active_item = '');
  }

  isActiveMenuItem(): boolean {
    let active = false;
    this.appMenu.forEach(mi => { active = active || !this.gs.strNoE(mi.menu_name_active_item) });
    return active;
  }

  getActiveMenuItemName(): string {
    let active = '';
    this.appMenu.forEach(mi => { if (!this.gs.strNoE(mi.menu_name_active_item)) active = mi.menu_name_active_item.toLowerCase() });
    return active;
  }

  openURL(url: string): void {
    this.gs.openURL(url);
  }

  dismissSiteBanner(b: Banner): void {
    this.gs.removeSiteBanner(b);
  }
}

export class PageSpecificNavOption {
  optionName!: string;
  optionFunction!: () => void;
}