import { Component, OnDestroy, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { GeneralService, RetMessage } from 'src/app/services/general.service';
import { Question } from 'src/app/components/elements/question-admin-form/question-admin-form.component';
import { AuthCallStates, AuthService } from 'src/app/services/auth.service';
import { ScoutFieldSchedule } from '../scout-admin/scout-admin.component';
import { Match } from '../match-planning/match-planning.component';

@Component({
  selector: 'app-scout-field',
  templateUrl: './scout-field.component.html',
  styleUrls: ['./scout-field.component.scss']
})
export class ScoutFieldComponent implements OnInit, OnDestroy {
  teams: Team[] = [];
  team!: number;
  private matches: Match[] = [];
  teamMatches: Match[] = [];
  teamMatchId!: string;
  scoutQuestions: Question[] = [];
  scoutFieldSchedule: ScoutFieldSchedule = new ScoutFieldSchedule();
  scoutAutoQuestions: Question[] = [];
  scoutTeleopQuestions: Question[] = [];
  scoutOtherQuestions: Question[] = [];
  private checkScoutInterval: number | undefined;

  constructor(private http: HttpClient, private gs: GeneralService, private authService: AuthService) { }

  ngOnInit() {
    this.authService.authInFlight.subscribe(r => AuthCallStates.comp ? this.scoutFieldInit() : null);

    this.checkScoutInterval = window.setInterval(() => {
      this.http.get(
        'scouting/field/questions/'
      ).subscribe(
        {
          next: (result: any) => {
            if (this.gs.checkResponse(result)) {
              this.scoutFieldSchedule = result['scoutFieldSchedule'] || new ScoutFieldSchedule();
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
    }, 30000);
  }

  ngOnDestroy(): void {
    window.clearInterval(this.checkScoutInterval);
  }

  scoutFieldInit(): void {
    this.gs.incrementOutstandingCalls();
    this.http.get(
      'scouting/field/questions/'
    ).subscribe(
      {
        next: (result: any) => {
          if (this.gs.checkResponse(result)) {
            this.teams = result['teams'];
            this.scoutFieldSchedule = result['scoutFieldSchedule'] || new ScoutFieldSchedule();
            this.scoutQuestions = result['scoutQuestions'];
            this.matches = result['matches'];
            this.sortQuestions();
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

  sortQuestions(): void {
    this.scoutAutoQuestions = [];
    this.scoutTeleopQuestions = [];
    this.scoutOtherQuestions = [];
    this.scoutQuestions.forEach(sq => {
      let sqCopy = JSON.parse(JSON.stringify(sq)) as Question;
      if (sqCopy.form_sub_typ === 'auto') {
        this.scoutAutoQuestions.push(sqCopy);
      }
      else if (sqCopy.form_sub_typ === 'teleop') {
        this.scoutTeleopQuestions.push(sqCopy);
      }
      else {
        this.scoutOtherQuestions.push(sqCopy);
      }
    });
  }

  buildMatchList(): void {
    this.teamMatches = [];
    this.matches.forEach((m) => {
      if ([m.red_one_id, m.red_two_id, m.red_three_id, m.blue_one_id, m.blue_two_id, m.blue_three_id].includes(this.team))
        this.teamMatches.push(m);
    })
  }

  save(): void | null {
    if (this.gs.strNoE(this.team)) {
      this.gs.triggerError('Must select a team to scout!');
      return null;
    }

    this.gs.incrementOutstandingCalls();

    let response: any[] = [];
    this.scoutAutoQuestions.forEach(sq => {
      response.push(sq);
    });
    this.scoutTeleopQuestions.forEach(sq => {
      response.push(sq);
    });
    this.scoutOtherQuestions.forEach(sq => {
      response.push(sq);
    });

    this.http.post(
      //'scouting/field/save-answers/',
      'form/save-answers/',
      { question_answers: response, team: this.team, match: this.teamMatchId, form_typ: 'field' }
    ).subscribe(
      {
        next: (result: any) => {
          if (this.gs.checkResponse(result)) {
            this.gs.addBanner({ message: (result as RetMessage).retMessage, severity: 1, time: 3500 });

            this.sortQuestions();

            this.matches.forEach(m => {
              if (m.match_id === this.teamMatchId) {
                if (m.red_one_id as number || 0 === this.team) m.red_one_id = 0;
                if (m.red_two_id as number || 0 === this.team) m.red_two_id = 0;
                if (m.red_three_id as number || 0 === this.team) m.red_three_id = 0;
                if (m.blue_one_id as number || 0 === this.team) m.blue_one_id = 0;
                if (m.blue_two_id as number || 0 === this.team) m.blue_two_id = 0;
                if (m.blue_three_id as number || 0 === this.team) m.blue_three_id = 0;
              }
            });

            this.team = 0;
            this.teamMatchId = '';
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

  increment(sq: Question): void {
    if (!sq.answer || this.gs.strNoE(sq.answer.toString())) sq.answer = 0;
    sq.answer = parseInt(sq.answer.toString()) + 1;
  }

  decrement(sq: Question): void {
    if (!sq.answer || this.gs.strNoE(sq.answer.toString())) sq.answer = 0;
    if (parseInt(sq.answer.toString()) > 0) sq.answer = parseInt(sq.answer.toString()) - 1;
  }

}

/*export class ScoutAnswer {
  scoutQuestions: ScoutQuestion[] = [];
  teams: Team[] = [];
  team!: string;
}*/

export class Team {
  team_no!: string;
  team_nm!: string;
  void_ind = 'n'
  checked = false;
}
