import { Component, OnInit } from '@angular/core';
import { AuthGroup, AuthPermission, User } from 'src/app/models/user.models';
import { APIService } from 'src/app/services/api.service';
import { AuthCallStates, AuthService } from 'src/app/services/auth.service';
import { GeneralService } from 'src/app/services/general.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-security',
  templateUrl: './security.component.html',
  styleUrls: ['./security.component.scss']
})
export class SecurityComponent implements OnInit {

  groupsTableCols: object[] = [
    { PropertyName: 'name', ColLabel: 'Group' },
    { PropertyName: 'permissions', ColLabel: 'Permissions', Type: 'function', ColValueFn: this.getPermissionDisplayValue },
  ];
  groupModalVisible = false;
  groups: AuthGroup[] = [];
  activeGroup = new AuthGroup();
  availablePermissions: AuthPermission[] = [];

  permissionsTableCols: object[] = [
    { PropertyName: 'codename', ColLabel: 'Code' },
    { PropertyName: 'name', ColLabel: 'Permission' },
  ];
  permissionsModalVisible = false;
  permissions: AuthPermission[] = [];
  activePermission = new AuthPermission();

  scoutAuthGroups: AuthGroup[] = [];
  availableScoutAuthGroups: AuthGroup[] = [];
  selectedScoutAuthGroup = new AuthGroup();
  scoutAuthGroupsModalVisible = false;

  userAudit: User[] = [];
  userAuditTableCols = [
    { PropertyName: 'name', ColLabel: 'User' },
    { PropertyName: 'username', ColLabel: 'Username' },
    { PropertyName: 'email', ColLabel: 'Email' },
    { PropertyName: 'groups', ColLabel: 'Groups', Type: 'function', ColValueFn: this.getGroupTableValue },
  ];

  constructor(private api: APIService, private gs: GeneralService, private us: UserService, private authService: AuthService) {
  }

  ngOnInit(): void {
    this.authService.authInFlight.subscribe((r) => {
      if (r === AuthCallStates.comp) {
        this.getGroups();
        this.getPermissions();
        this.runSecurityAudit();
      }
    });
  }

  getGroups(): void {
    this.us.getGroups().then(result => {
      if (result)
        this.groups = result;
    });
  }

  getPermissions(): void {
    this.us.getPermissions().then(result => {
      if (result)
        this.permissions = result;
    });
  }

  getPermissionDisplayValue(prmsns: AuthPermission[]): string {
    let codename = prmsns.reduce((pV: AuthPermission, cV: AuthPermission, i: number) => {
      return { id: -1, codename: `${pV.codename}, ${cV.codename}`, content_type: -1, name: '' };
    }, { id: -1, codename: '', content_type: -1, name: '' }).codename;

    return codename.substring(2, codename.length);
  }

  showGroupModal(group?: AuthGroup): void {
    this.activeGroup = group ? this.gs.cloneObject(group) : new AuthGroup();
    this.activePermission = new AuthPermission();
    this.buildAvailablePermissions();
    this.groupModalVisible = true;
  }

  buildAvailablePermissions(): void {
    let prmsns: AuthPermission[] = this.gs.cloneObject(this.permissions);
    let grpPrmsns: AuthPermission[] = this.gs.cloneObject(this.activeGroup.permissions);

    for (let i = 0; i < prmsns.length; i++) {
      for (let j = 0; j < grpPrmsns.length; j++) {
        if (prmsns[i].id === grpPrmsns[j].id) {
          prmsns.splice(i--, 1);
          grpPrmsns.splice(j--, 1);
          break;
        }
      }
    }

    this.availablePermissions = prmsns;
  }

  addPermissionToGroup(): void {
    this.activeGroup.permissions.push(this.activePermission);
    this.activePermission = new AuthPermission();
    this.buildAvailablePermissions();
  }

  removePermissionFromGroup(prmsn: AuthPermission): void {
    for (let i = 0; i < this.activeGroup.permissions.length; i++) {
      if (this.activeGroup.permissions[i].id === prmsn.id) {
        this.activeGroup.permissions.splice(i, 1);
        break;
      }
    }

    this.buildAvailablePermissions();
  }

  resetGroup(): void {
    this.activeGroup = new AuthGroup();
    this.activePermission = new AuthPermission();
    this.availablePermissions = [];
    this.groupModalVisible = false;
    this.getGroups();
  }

  saveGroup(): void {
    this.us.saveGroup(this.activeGroup, () => {
      this.resetGroup();
    });
  }

  deleteGroup(group: AuthGroup): void {
    this.gs.triggerConfirm('Are you sure you would like to delete this group?', () => {
      this.us.deleteGroup(group.id, () => {
        this.resetGroup();
      });
    });
  }

  showPermissionModal(permisson?: AuthPermission): void {
    this.activePermission = permisson ? this.gs.cloneObject(permisson) : new AuthPermission();
    this.permissionsModalVisible = true;
  }

  resetPermission(): void {
    this.activePermission = new AuthPermission();
    this.permissionsModalVisible = false;
    this.getPermissions();
  }

  savePermission(): void {
    this.us.savePermission(this.activePermission, () => {
      this.resetPermission();
    });
  }

  deletePermission(prmsn: AuthPermission): void {
    this.gs.triggerConfirm('Are you sure you would like to delete this group?', () => {
      this.us.deletePermission(prmsn.id, () => {
        this.resetPermission();
      });
    });
  }

  runSecurityAudit() {
    this.us.runSecurityAudit((result: User[]) => {
      this.userAudit = result;
    });
  }

  getGroupTableValue(groups: AuthGroup[]): string {
    let name = groups.reduce((pV: AuthGroup, cV: AuthGroup, i: number) => {
      return { id: -1, name: `${pV.name}, ${cV.name}`, permissions: [] };
    }, { id: -1, name: '', permissions: [] }).name;

    return name.substring(2, name.length);
  }

  getScoutAuthGroups(visible: boolean) {
    this.api.get(true, 'admin/scout-auth-groups/', undefined, (result: any) => {
      this.scoutAuthGroups = result as AuthGroup[];
      this.buildAvailableScoutAuthGroups();
    });
  }

  private buildAvailableScoutAuthGroups(): void {
    this.availableScoutAuthGroups = this.groups.filter(g => {
      return this.scoutAuthGroups.map(el => el.id).indexOf(g.id) < 0;
    });
  }

  addScoutAuthGroup() {
    if (this.selectedScoutAuthGroup.id) {
      this.scoutAuthGroups.push(this.selectedScoutAuthGroup);
      this.selectedScoutAuthGroup = new AuthGroup();
      this.buildAvailableScoutAuthGroups()
    }
    else
      this.gs.triggerError('Cannot add empty group.');
  }

  removeScoutAuthGroup(ag: AuthGroup) {
    for (let i = 0; i < this.scoutAuthGroups.length; i++) {
      if (this.scoutAuthGroups[i].id === ag.id) {
        this.scoutAuthGroups.splice(i, 1);
        break;
      }
    }
    this.buildAvailableScoutAuthGroups();
  }

  saveScoutAuthGroups() {
    this.api.post(true, 'admin/scout-auth-groups/', this.scoutAuthGroups, (result: any) => {
      this.gs.successfulResponseBanner(result);
      this.selectedScoutAuthGroup = new AuthGroup();
      this.scoutAuthGroupsModalVisible = false;
    });
  }
}
