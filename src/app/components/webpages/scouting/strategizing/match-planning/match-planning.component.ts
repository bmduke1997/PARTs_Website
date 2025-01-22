import { Component, OnInit } from '@angular/core';
import { FieldForm, Match, MatchStrategy, Team } from '../../../../../models/scouting.models';
import { AuthService, AuthCallStates } from '../../../../../services/auth.service';
import { GeneralService } from '../../../../../services/general.service';
import { ScoutingService } from '../../../../../services/scouting.service';
import { User } from '../../../../../models/user.models';
import { BoxComponent } from "../../../../atoms/box/box.component";
import { FormElementGroupComponent } from "../../../../atoms/form-element-group/form-element-group.component";
import { FormElementComponent } from "../../../../atoms/form-element/form-element.component";
import { WhiteboardComponent } from "../../../../atoms/whiteboard/whiteboard.component";
import { ButtonComponent } from "../../../../atoms/button/button.component";
import { FormComponent } from "../../../../atoms/form/form.component";
import { Banner } from '../../../../../models/api.models';
import { ButtonRibbonComponent } from "../../../../atoms/button-ribbon/button-ribbon.component";

@Component({
  selector: 'app-match-planning',
  standalone: true,
  imports: [BoxComponent, FormElementGroupComponent, FormElementComponent, WhiteboardComponent, ButtonComponent, FormComponent, ButtonRibbonComponent],
  templateUrl: './match-planning.component.html',
  styleUrl: './match-planning.component.scss'
})
export class MatchPlanningComponent implements OnInit {

  private user: User | undefined = undefined;
  matches: Match[] = [];
  teams: Team[] = [];
  fieldForm: FieldForm | undefined = undefined;

  match: Match | undefined = undefined;

  matchStrategies: MatchStrategy[] = [];
  activeMatchStrategies: MatchStrategy[] = [];
  activeMatchStrategy: MatchStrategy | undefined = undefined;
  activeTeams: string[] = [];

  constructor(private gs: GeneralService, private ss: ScoutingService, private authService: AuthService) {
    this.authService.user.subscribe(u => this.user = u);
  }

  ngOnInit(): void {
    this.activeMatchStrategy = new MatchStrategy();

    this.authService.authInFlight.subscribe(r => {
      if (r === AuthCallStates.comp) {
        this.init();
      }
    });
  }

  init(): void {
    this.ss.loadAllScoutingInfo().then(result => {
      if (result) {
        this.teams = result.teams;

        const ourMatches = result.matches.filter(m => m.blue_one_id === 3492 || m.blue_two_id === 3492 || m.blue_three_id === 3492 || m.red_one_id === 3492 || m.red_two_id === 349 || m.red_three_id === 3492);
        this.matches = ourMatches;

        this.fieldForm = result.field_form_form.field_form;

        this.matchStrategies = result.match_strategies;
      }
    });
  }

  setMatchStrategies(): void {
    if (!this.activeMatchStrategy) this.activeMatchStrategy = new MatchStrategy();
    this.activeMatchStrategies = this.matchStrategies.filter(ms => ms.match?.match_id === this.match?.match_id);
    if (this.match?.blue_one_id)
      this.activeTeams = [this.match?.blue_one_id.toString() || '', this.match?.blue_two_id.toString() || '', this.match?.blue_three_id.toString() || '', this.match?.red_one_id.toString() || '', this.match?.red_two_id.toString() || '', this.match?.red_three_id.toString() || ''];
    else
      this.activeTeams = [];
  }


  setMatchStrategy(ms?: MatchStrategy): void {
    this.activeMatchStrategy = ms ? this.gs.cloneObject(ms) : new MatchStrategy();
  }

  setImage(f: File): void {
    if (this.activeMatchStrategy)
      this.activeMatchStrategy.img = f;
  }

  clearImageUrl(): void {
    if (this.activeMatchStrategy)
      this.activeMatchStrategy.img_url = '';
  }

  async saveMatchStrategy(): Promise<void> {
    if (this.activeMatchStrategy) {
      const fd = new FormData();
      if (this.activeMatchStrategy.img)
        fd.append('img', this.activeMatchStrategy.img);
      if (!this.gs.strNoE(this.activeMatchStrategy.id))
        fd.append('id', this.activeMatchStrategy.id.toString());

      fd.append('match_id', this.match?.match_id.toString() || '');
      fd.append('user_id', this.user?.id.toString() || '');
      fd.append('strategy', this.activeMatchStrategy.strategy);

      if (!(await this.ss.saveMatchStrategy(fd))) {
        this.gs.addBanner(new Banner(undefined, `Error saving match strategy`, 5000));
        return;
      }

      this.activeMatchStrategy = new MatchStrategy();

      this.ss.loadMatchStrategies().then(result => {
        if (result)
          this.matchStrategies = result;
        this.setMatchStrategies();
      });
    }
  }
}
