import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './components/webpages/home/home.component';
import { LoginComponent } from './components/login/login.component';
import { ScoutFieldComponent } from './components/webpages/scouting/scout-field/scout-field.component';
import { ScoutAdminComponent } from './components/webpages/scouting/scout-admin/scout-admin.component';
import { ScoutPitComponent } from './components/webpages/scouting/scout-pit/scout-pit.component';
import { ScoutFieldResultsComponent } from './components/webpages/scouting/scout-field-results/scout-field-results.component';
import { ScoutPitResultsComponent } from './components/webpages/scouting/scout-pit-results/scout-pit-results.component';
import { ScoutPortalComponent } from './components/webpages/scouting/scout-portal/scout-portal.component';
import { ContactComponent } from './components/webpages/contact/contact.component';
import { JoinComponent } from './components/webpages/join/join.component';
import { CommunityOutreachComponent } from './components/webpages/join/community-outreach/community-outreach.component';
import { ProgrammingComponent } from './components/webpages/join/programming/programming.component';
import { MechanicalComponent } from './components/webpages/join/mechanical/mechanical.component';
import { ElectricalComponent } from './components/webpages/join/electrical/electrical.component';




const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'scout-field', component: ScoutFieldComponent },
  { path: 'scout-pit', component: ScoutPitComponent },
  { path: 'scout-admin', component: ScoutAdminComponent },
  { path: 'scout-field-results', component: ScoutFieldResultsComponent },
  { path: 'scout-pit-results', component: ScoutPitResultsComponent },
  { path: 'scout-portal', component: ScoutPortalComponent },
  { path: 'contact', component: ContactComponent },
  { path: 'join', component: JoinComponent },
  { path: 'join/community-outreach', component: CommunityOutreachComponent },
  { path: 'join/programming', component: ProgrammingComponent },
  { path: 'join/mechanical', component: MechanicalComponent },
  { path: 'join/electrical', component: ElectricalComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
