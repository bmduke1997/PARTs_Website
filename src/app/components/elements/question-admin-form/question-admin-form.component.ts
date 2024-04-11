import { Component, OnInit, Input } from '@angular/core';
import { GeneralService } from 'src/app/services/general.service';
import { HttpClient } from '@angular/common/http';
import { AuthCallStates, AuthService } from 'src/app/services/auth.service';
import { QuestionWithConditions, QuestionOption, QuestionType, FormSubType } from 'src/app/models/form.models';

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
  questionModalVisible = false
  activeQuestion: QuestionWithConditions = new QuestionWithConditions();
  //editQuestion: Question = new Question();

  questionTableCols: object[] = [
    { PropertyName: 'form_sub_nm', ColLabel: 'Form Sub Type' },
    { PropertyName: 'order', ColLabel: 'Order' },
    { PropertyName: 'question', ColLabel: 'Question' },
    { PropertyName: 'question_typ.question_typ_nm', ColLabel: 'Type' },
    { PropertyName: 'is_condition', ColLabel: 'Is Condition' },
    { PropertyName: 'active', ColLabel: 'Active' },
  ];

  optionsTableCols: object[] = [
    { PropertyName: 'option', ColLabel: 'Option', Type: 'area' },
    { PropertyName: 'active', ColLabel: 'Active', Type: 'checkbox', TrueValue: 'y', FalseValue: 'n' }
  ];

  constructor(private gs: GeneralService, private http: HttpClient, private authService: AuthService) { }

  ngOnInit() {
    this.authService.authInFlight.subscribe(r => r === AuthCallStates.comp ? this.questionInit() : null);
  }

  questionInit(): void {
    this.gs.incrementOutstandingCalls();
    this.http.get(
      'form/form-init/', {
      params: {
        form_typ: this.questionType
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

  showQuestionModal(q?: QuestionWithConditions): void {
    this.activeQuestion = q ? this.gs.cloneObject(q) : new QuestionWithConditions();
    this.questionModalVisible = true;
  }

  saveQuestion(): void {
    this.gs.incrementOutstandingCalls();
    this.activeQuestion.form_typ = this.questionType;


    let save = this.activeQuestion;

    for (let i = 0; i < save.questionoption_set.length; i++) {
      if (this.gs.strNoE(save.questionoption_set[i].question_opt_id) && this.gs.strNoE(save.questionoption_set[i].option)) {
        save.questionoption_set.splice(i, 1);
        i--;
      }
    }

    this.http.post(
      'form/save-question/', save
    ).subscribe(
      {
        next: (result: any) => {
          if (this.gs.checkResponse(result)) {
            this.gs.successfulResponseBanner(result);
            this.activeQuestion = new QuestionWithConditions();
            this.questionModalVisible = false;
            this.questionInit();
            //console.log(this.question);
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

  compareQuestionTypeObjects(qt1: QuestionType, qt2: QuestionType): boolean {
    if (qt1 && qt2 && qt1.question_typ && qt2.question_typ) {
      return qt1.question_typ === qt2.question_typ;
    }
    return false;
  }
}

class Init {
  question_types: QuestionType[] = [];
  questions: QuestionWithConditions[] = [];
  form_sub_types: FormSubType[] = [];
}