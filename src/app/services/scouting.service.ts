import { Injectable } from '@angular/core';
import { APIService } from './api.service';
import { CacheService } from './cache.service';
import { Match, ScoutFieldResponse, ScoutFieldSchedule, ScoutPitResponse, Team } from '../models/scouting.models';
import { BehaviorSubject } from 'rxjs';
import { QuestionCondition, QuestionWithConditions } from '../models/form.models';
import { ScoutPitInit } from '../components/webpages/scouting/scout-pit/scout-pit.component';
import { Banner, GeneralService } from './general.service';
import { PromiseExtended } from 'dexie';

@Injectable({
  providedIn: 'root'
})
export class ScoutingService {

  private teamsBS = new BehaviorSubject<Team[]>([]);
  teams = this.teamsBS.asObservable();

  private matchesBS = new BehaviorSubject<Match[]>([]);
  matches = this.matchesBS.asObservable();

  private scoutFieldScheduleBS = new BehaviorSubject<ScoutFieldSchedule>(new ScoutFieldSchedule());
  scoutFieldSchedule = this.scoutFieldScheduleBS.asObservable();

  private fieldScoutingQuestionsBS = new BehaviorSubject<QuestionWithConditions[]>([]);
  fieldScoutingQuestions = this.fieldScoutingQuestionsBS.asObservable();

  private completedPitScoutingTeamsBS = new BehaviorSubject<Team[]>([]);
  completedPitScoutingTeams = this.completedPitScoutingTeamsBS.asObservable();

  private pitScoutingQuestionsBS = new BehaviorSubject<QuestionWithConditions[]>([]);
  pitScoutingQuestions = this.pitScoutingQuestionsBS.asObservable();

  private outstandingResponsesTimeout: number | undefined;

  private outstandingInitFieldScoutingCall = false;
  private outstandingInitPitScoutingCall = false;

  constructor(private api: APIService,
    private cs: CacheService,
    private gs: GeneralService) { }

  startUploadOutstandingResponsesTimeout(): void {
    if (this.outstandingResponsesTimeout != null) window.clearTimeout(this.outstandingResponsesTimeout);

    this.outstandingResponsesTimeout = window.setTimeout(() => {
      this.uploadOutstandingResponses();
    }, 1000 * 60 * 3); // try to send again after 3 mins

  }

  async uploadOutstandingResponses() {
    let count = 1;

    await this.cs.ScoutFieldResponse.getAll().then(sfrs => {
      sfrs.forEach(s => {
        window.setTimeout(() => {
          //console.log(s);
          this.saveFieldScoutingResponse(s, s.id);
        }, 1000 * count++);
      });
    });

    this.cs.ScoutPitResponse.getAll().then(sprs => {
      sprs.forEach(s => {
        window.setTimeout(() => {
          this.savePitScoutingResponse(s, s.id);
        }, 1000 * count++);
      });
    });
  }

  // Field Scouting -----------------------------------------------------------
  initFieldScouting(loadingScreen = true, callbackFn?: (result: any) => void) {
    if (!this.outstandingInitFieldScoutingCall) {
      this.outstandingInitFieldScoutingCall = true;
      this.api.get(loadingScreen, 'scouting/field/init/', undefined, async (result: any) => {
        /** 
         * On success load results and store in db 
         **/
        const res = (result['teams'] as Team[]);
        this.teamsBS.next(res);
        await this.cs.Team.RemoveAllAsync();
        await this.cs.Team.AddBulkAsync(this.teamsBS.value);

        this.scoutFieldScheduleBS.next(result['scoutFieldSchedule'] || new ScoutFieldSchedule());
        await this.cs.ScoutFieldSchedule.RemoveAllAsync();
        if (!Number.isNaN(this.scoutFieldScheduleBS.value.scout_field_sch_id)) await this.cs.ScoutFieldSchedule.AddAsync(this.scoutFieldScheduleBS.value);


        this.fieldScoutingQuestionsBS.next(result['scoutQuestions'] as QuestionWithConditions[]);
        let ids = this.fieldScoutingQuestionsBS.value.map(q => { return q.question_id || 0 });

        await this.cs.QuestionWithConditions.RemoveRangeAsync(ids);
        await this.cs.QuestionWithConditions.AddBulkAsync(this.fieldScoutingQuestionsBS.value);

        this.matchesBS.next(result['matches'] as Match[]);
        await this.cs.Match.RemoveAllAsync();
        await this.cs.Match.AddBulkAsync(this.matchesBS.value);

        if (callbackFn) callbackFn(result);
      }, (error: any) => {
        /** 
         * On fail load results from db
         **/
        let allLoaded = true;

        this.getTeams().then((ts: Team[]) => {
          this.teamsBS.next(ts);
          if (ts.length <= 0) allLoaded = false;
        }).catch((reason: any) => {
          console.log(reason);
          allLoaded = false;
        });

        this.cs.Match.getAll().then((ms: Match[]) => {
          this.matchesBS.next(ms);
        }).catch((reason: any) => {
          console.log(reason);
          allLoaded = false;
        });

        this.cs.ScoutFieldSchedule.getAll().then((sfss: ScoutFieldSchedule[]) => {
          sfss.forEach(sfs => this.scoutFieldScheduleBS.next(sfs));
        }).catch((reason: any) => {
          console.log(reason);
          allLoaded = false;
        });

        this.getScoutingQuestions('field').then((sfqs: QuestionWithConditions[]) => {
          this.fieldScoutingQuestionsBS.next(sfqs);
          if (sfqs.length <= 0) allLoaded = false;
        }).catch((reason: any) => {
          console.log(reason);
          allLoaded = false;
        });

        if (!allLoaded) {
          this.gs.addBanner(new Banner('Error loading field scouting form from cache.'));
        }

        this.outstandingInitFieldScoutingCall = false;
      }, () => {
        this.outstandingInitFieldScoutingCall = false;
      });
    }
  }

  saveFieldScoutingResponse(sfr: ScoutFieldResponse, id?: number): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      let response = this.gs.cloneObject(sfr.question_answers) as QuestionWithConditions[];

      response.forEach(r => {
        r.answer = this.gs.formatQuestionAnswer(r.answer);

        r.conditions.forEach((c: QuestionCondition) => {
          if (c.question_to) c.question_to.answer = this.gs.formatQuestionAnswer(c.question_to?.answer);
        });
      });

      sfr.question_answers = response;

      this.api.post(true, 'form/save-answers/', { question_answers: sfr.question_answers, team: sfr.team, match_id: sfr.match?.match_id, form_typ: sfr.form_typ }, async (result: any) => {
        this.gs.successfulResponseBanner(result);

        if (id) {
          await this.cs.ScoutFieldResponse.RemoveAsync(id)
        }

        resolve(true);
      }, (err: any) => {
        if (!id) this.cs.ScoutFieldResponse.AddAsync(sfr).then(() => {
          this.gs.addBanner(new Banner('Failed to save, will try again later.', 3500));
          this.startUploadOutstandingResponsesTimeout();
          resolve(true);
        }).catch((reason: any) => {
          console.log(reason);
          resolve(false);
        });
        else {
          resolve(false);
        }
      });
    });

  }


  // Pit Scouting --------------------------------------------------------------
  initPitScouting(loadingScreen = true, callbackFn?: (result: any) => void): void {
    if (!this.outstandingInitPitScoutingCall) {
      this.outstandingInitPitScoutingCall = true;
      this.api.get(loadingScreen, 'scouting/pit/init/', undefined, (result: any) => {
        /** 
         * On success load results and store in db 
         **/
        const init = (result as ScoutPitInit);
        this.completedPitScoutingTeamsBS.next(init.comp_teams);

        init.comp_teams.forEach(t => {
          this.cs.Team.getById(t.team_no).then(t => {
            if (t) {
              t.pitResult = 1;
              this.cs.Team.AddOrEditAsync(t);
            }
          });
        });

        this.pitScoutingQuestionsBS.next(init.scoutQuestions);

        let ids = this.pitScoutingQuestionsBS.value.map(q => { return q.question_id || 0 });
        this.cs.QuestionWithConditions.RemoveRangeAsync(ids).then(() => {
          this.cs.QuestionWithConditions.AddBulkAsync(this.pitScoutingQuestionsBS.value);
        });

        if (callbackFn) callbackFn(result);
      }, (err: any) => {
        /** 
         * On fail load results from db
         **/
        let allLoaded = true;

        this.cs.Team.getAll((t) => t.where({ pitResult: 1 })).then(ts => {
          this.completedPitScoutingTeamsBS.next(ts);
        }).catch((reason: any) => {
          console.log(reason);
          allLoaded = false;
        });

        this.getScoutingQuestions('pit').then((spqs: QuestionWithConditions[]) => {
          this.pitScoutingQuestionsBS.next(spqs);
          if (spqs.length <= 0) allLoaded = false;
        }).catch((reason: any) => {
          console.log(reason);
          allLoaded = false;
        });

        if (!allLoaded) {
          this.gs.addBanner(new Banner('Error loading pit scouting form from cache.'));
        }

        this.outstandingInitPitScoutingCall = false;
      }, () => {
        this.outstandingInitPitScoutingCall = false;
      });
    }

  }

  savePitScoutingResponse(spr: ScoutPitResponse, id?: number): Promise<boolean> {
    return new Promise(resolve => {
      let scoutQuestions = this.gs.cloneObject(spr.question_answers) as QuestionWithConditions[];

      scoutQuestions.forEach(r => {
        r.answer = this.gs.formatQuestionAnswer(r.answer);
      });

      spr.question_answers = scoutQuestions;
      spr.form_typ = 'pit';

      const sprPost = this.gs.cloneObject(spr);
      sprPost.robotPics = []; // we don't want to upload the images here

      this.api.post(true, 'form/save-answers/', sprPost, async (result: any) => {
        this.gs.successfulResponseBanner(result);

        this.gs.incrementOutstandingCalls();

        let count = 0;

        spr?.robotPics.forEach(pic => {
          if (pic && pic.size >= 0) {
            const team_no = spr?.team;

            window.setTimeout(() => {
              this.gs.incrementOutstandingCalls();

              this.gs.resizeImageToMaxSize(pic).then(resizedPic => {
                if (resizedPic) {
                  const formData = new FormData();
                  formData.append('file', resizedPic);
                  formData.append('team_no', team_no?.toString() || '');

                  this.api.post(true, 'scouting/pit/save-picture/', formData, (result: any) => {
                    this.gs.successfulResponseBanner(result);
                  }, (err: any) => {
                    this.gs.triggerError(err);
                  });
                }
              }).finally(() => {
                this.gs.decrementOutstandingCalls();
              });
            }, 1500 * ++count);
          }
        });

        window.setTimeout(() => { this.gs.decrementOutstandingCalls(); }, 1500 * count)

        if (id) {
          await this.cs.ScoutPitResponse.RemoveAsync(id);
        }

        resolve(true);
      }, (err: any) => {
        if (!id) this.cs.ScoutPitResponse.AddAsync(spr).then(() => {
          this.gs.addBanner(new Banner('Failed to save, will try again later.', 3500));
          this.startUploadOutstandingResponsesTimeout();
          resolve(true);
        }).catch((reason: any) => {
          console.log(reason);
          resolve(false);
        });
        else
          resolve(false);
      });
    });
  }

  getScoutingQuestions(form_typ: string): PromiseExtended<any[]> {
    return this.cs.QuestionWithConditions.getAll((q) => q.where({ 'form_typ': form_typ }));
  }

  getTeams(): PromiseExtended<any[]> {
    return this.cs.Team.getAll();
  }
}
