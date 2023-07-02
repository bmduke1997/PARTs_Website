import { Component, OnInit, Input } from '@angular/core';
import { GeneralService, RetMessage } from 'src/app/services/general.service';
import { HttpClient } from '@angular/common/http';
import { AuthCallStates, AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-question-admin-form',
  templateUrl: './question-admin-form.component.html',
  styleUrls: ['./question-admin-form.component.scss']
})
export class QuestionAdminFormComponent implements OnInit {

  @Input()
  questionType!: string;
  @Input()
  public set runInit(val: boolean) {
    if (val) {
      this.questionInit();
    }
  }

  init: Init = new Init();
  scoutQuestion: Question = new Question();

  optionsTableCols: object[] = [
    { PropertyName: 'option', ColLabel: 'Option', Type: 'area' },
    { PropertyName: 'active', ColLabel: 'Active' }
  ];

  constructor(private gs: GeneralService, private http: HttpClient, private authService: AuthService) { }

  ngOnInit() {
    this.authService.authInFlight.subscribe(r => r === AuthCallStates.comp ? this.questionInit() : null);
  }

  questionInit(): void {
    this.gs.incrementOutstandingCalls();
    this.http.get(
      'scouting/admin/scout-question-init/', {
      params: {
        sq_typ: this.questionType
      }
    }
    ).subscribe(
      {
        next: (result: any) => {
          if (this.gs.checkResponse(result)) {
            this.init = result as Init;
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

  saveScoutQuestion(): void {
    this.gs.incrementOutstandingCalls();
    this.scoutQuestion.form_typ = this.questionType;
    this.http.post(
      'scouting/admin/save-scout-question/', this.scoutQuestion
    ).subscribe(
      {
        next: (result: any) => {
          if (this.gs.checkResponse(result)) {
            this.gs.addBanner({ message: (result as RetMessage).retMessage, severity: 1, time: 5000 });
            this.scoutQuestion = new Question();
            this.questionInit();
            console.log(this.scoutQuestion);
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

  updateScoutQuestion(q: Question): void {
    this.gs.incrementOutstandingCalls();
    this.http.post(
      'scouting/admin/update-scout-question/', q
    ).subscribe(
      {
        next: (result: any) => {
          if (this.gs.checkResponse(result)) {
            this.gs.addBanner({ message: (result as RetMessage).retMessage, severity: 1, time: 5000 });
            this.scoutQuestion = new Question();
            this.questionInit();
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

  toggleScoutQuestion(q: Question): void | null {
    if (!confirm('Are you sure you want to toggle this question?')) {
      return null;
    }

    this.gs.incrementOutstandingCalls();
    this.http.get(
      'scouting/admin/toggle-scout-question/', {
      params: {
        sq_id: q.question_id?.toString() || '-1'
      }
    }
    ).subscribe(
      {
        next: (result: any) => {
          if (this.gs.checkResponse(result)) {
            this.gs.addBanner({ message: (result as RetMessage).retMessage, severity: 1, time: 5000 });
            this.questionInit();
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

  addOption(list: any): void {
    list.push(new QuestionOption());
  }

  toggleOption(op: QuestionOption): void | null {
    if (!confirm('Are you sure you want to toggle this option?')) {
      return null;
    }

    this.gs.incrementOutstandingCalls();
    this.http.get(
      'scouting/admin/toggle-option/', {
      params: {
        q_opt_id: op.question_opt_id.toString()
      }
    }
    ).subscribe(
      {
        next: (result: any) => {
          if (this.gs.checkResponse(result)) {
            this.gs.addBanner({ message: (result as RetMessage).retMessage, severity: 1, time: 5000 });
            this.questionInit();
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

export class Question {
  question_id: number | null = null;
  season!: number;
  form_typ!: string;
  form_sub_typ!: string;
  form_sub_nm!: string;
  question_typ!: string;
  question!: string;
  order!: number;
  active = 'y';
  void_ind = 'n';
  answer: string | number = '';
  display_value = '';

  questionoptions_set: QuestionOption[] = [];
  scoutpitanswer_set: QuestionAnswer[] = [];
}

export class QuestionOption {
  question_opt_id!: number;
  sfq_id!: number;
  spq_id!: number;
  option!: string;
  active = 'y';
  void_ind = 'n';
}

export class QuestionAnswer {
  question_answer_id!: number;
  scout_field!: any;
  scout_pit!: any;
  response!: any;
  question!: Question;
  answer = '';
  void_ind = 'n'
}
export class QuestionType {
  question_typ!: string;
  question_typ_nm!: string;
  void_ind = 'n';
}

export class FormSubType {
  form_sub_typ = ''
  form_sub_nm = ''
  form_typ_id = ''
}

export class Init {
  questionTypes: QuestionType[] = [];
  scoutQuestions: Question[] = [];
  scoutQuestionSubTypes: FormSubType[] = [];
}
