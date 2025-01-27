import { Component, OnInit, Input, HostListener, Output, EventEmitter } from '@angular/core';
import { Question, QuestionOption, QuestionType, FormInitialization, QuestionFlow, FormSubType } from '../../../models/form.models';
import { APIService } from '../../../services/api.service';
import { AuthService, AuthCallStates } from '../../../services/auth.service';
import { AppSize, GeneralService } from '../../../services/general.service';
import { ModalComponent } from '../../atoms/modal/modal.component';
import { FormComponent } from '../../atoms/form/form.component';
import { FormElementComponent } from '../../atoms/form-element/form-element.component';
import { ButtonComponent } from '../../atoms/button/button.component';
import { ButtonRibbonComponent } from '../../atoms/button-ribbon/button-ribbon.component';
import { TableComponent, TableColType } from '../../atoms/table/table.component';
import { CommonModule } from '@angular/common';
import { Banner } from '../../../models/api.models';
import { FormElementGroupComponent } from "../../atoms/form-element-group/form-element-group.component";

@Component({
  selector: 'app-question-admin-form',
  imports: [TableComponent, ModalComponent, FormComponent, FormElementComponent, ButtonComponent, ButtonRibbonComponent, CommonModule, FormElementGroupComponent],
  templateUrl: './question-admin-form.component.html',
  styleUrls: ['./question-admin-form.component.scss']
})
export class QuestionAdminFormComponent implements OnInit {
  questionOptions = [{ property: 'Active', value: 'y' }, { property: 'Inactive', value: 'n' }];
  questionOption = 'y';
  filterText = '';

  @Input()
  formType!: string;
  @Input()
  public set runInit(val: boolean) {
    if (val) {
      this.questionInit();
    }
  }

  @Input() AllowFlows = false;
  @Input() FormMetadata: FormInitialization = new FormInitialization();
  @Output() FormMetadataChange: EventEmitter<FormInitialization> = new EventEmitter();
  questionModalVisible = false;
  activeQuestion: Question = new Question();
  availableQuestionFlows: QuestionFlow[] = [];

  questionTableTriggerUpdate = false;
  questionTableCols: TableColType[] = [];
  private _questionTableCols: TableColType[] = [
    { PropertyName: 'order', ColLabel: 'Order' },
    { PropertyName: 'question', ColLabel: 'Question' },
    { PropertyName: 'question_typ.question_typ_nm', ColLabel: 'Type' },
  ];

  selectedQuestionFlow: QuestionFlow | undefined = undefined;
  selectedQuestionFlows: QuestionFlow[] = [];
  flowTableCols: TableColType[] = [
    { PropertyName: 'name', ColLabel: 'Flow' },
  ];

  optionsTableCols: TableColType[] = [
    { PropertyName: 'option', ColLabel: 'Option', Type: 'area', Required: true },
    { PropertyName: 'active', ColLabel: 'Active', Type: 'checkbox', TrueValue: 'y', FalseValue: 'n', Required: true }
  ];

  questionFlowModalVisible = false;
  newQuestionFlow = new QuestionFlow();

  constructor(private gs: GeneralService, private api: APIService, private authService: AuthService) { }

  ngOnInit() {
    this.authService.authInFlight.subscribe(r => r === AuthCallStates.comp ? this.questionInit() : null);
    this.setQuestionTableCols();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.setQuestionTableCols();
  }

  questionInit(): void {
    this.api.get(true, 'form/form-editor/', {
      form_typ: this.formType
    }, (result: FormInitialization) => {
      this.FormMetadata = result;
      this.setQuestionTableCols();
      this.questionTableTriggerUpdate = !this.questionTableTriggerUpdate;
      this.buildQuestionFlowOptions();
    }, (err: any) => {
      this.gs.triggerError(err);
    });
  }

  setQuestionTableCols(): void {
    if (this.gs.getAppSize() >= AppSize.LG) {
      this.questionTableCols = [
        ...this._questionTableCols,
        { PropertyName: 'required', ColLabel: 'Required', Type: 'function', ColValueFunction: this.ynToYesNo },
        { PropertyName: 'has_conditions', ColLabel: 'Has Conditions', Type: 'function', ColValueFunction: this.ynToYesNo },
        { PropertyName: 'question_conditional_on', ColLabel: 'Is Condition', Type: 'function', ColValueFunction: this.isConditional },
      ];

      if (this.AllowFlows)
        this.questionTableCols = this.questionTableCols.concat([{ PropertyName: 'question_flow_id_set', ColLabel: 'Flows', Type: 'function', ColValueFunction: this.decodeFlowIds.bind(this) } as TableColType]);

      if (this.AllowFlows && this.FormMetadata.form_sub_types.length > 0)
        this.questionTableCols = [{ PropertyName: 'form_sub_typ.form_sub_nm', ColLabel: 'Form Sub Type' } as TableColType].concat(this.questionTableCols);
    }
    else {
      this.questionTableCols = [...this._questionTableCols];
    }
  }

  showQuestionModal(q?: Question): void {
    this.activeQuestion = q ? this.gs.cloneObject(q) : new Question();
    this.selectedQuestionFlow = undefined;
    this.selectedQuestionFlows = [];
    this.selectedQuestionFlows = this.FormMetadata.question_flows.filter(qf => this.activeQuestion.question_flow_id_set.includes(qf.id));

    this.buildQuestionFlowOptions();

    this.questionModalVisible = true;
  }

  showQuestionFlowModal(): void {
    this.questionFlowModalVisible = true;
  }

  buildQuestionFlowOptions(): void {
    this.availableQuestionFlows = this.FormMetadata.question_flows.filter(qf =>
      (this.activeQuestion &&
        !this.gs.strNoE(this.activeQuestion.form_sub_typ) && qf.form_sub_typ) ?
        qf.form_sub_typ.form_sub_typ === this.activeQuestion.form_sub_typ.form_sub_typ : false);
  }

  saveQuestionFlow(): void {
    this.newQuestionFlow.form_typ.form_typ = this.formType;
    this.api.post(true, 'form/question-flow/', this.newQuestionFlow, (result: any) => {
      this.gs.successfulResponseBanner(result);
      this.newQuestionFlow = new QuestionFlow();
      this.questionFlowModalVisible = false;
      this.questionInit();
    }, (err: any) => {
      this.gs.triggerError(err);
    });
  }

  saveQuestion(): void {
    this.activeQuestion.form_typ.form_typ = this.formType;

    if (this.activeQuestion.question_typ.is_list === 'y' && this.activeQuestion.questionoption_set.filter(qo => qo.active === 'y').length <= 0) {
      this.gs.addBanner(new Banner(0, `Must have one active option for list element.\n`, 3500));
      return;
    }

    this.selectedQuestionFlows.forEach(qf => this.activeQuestion.question_flow_id_set.push(qf.id));

    this.api.post(true, 'form/question/', this.activeQuestion, (result: any) => {
      this.gs.successfulResponseBanner(result);
      this.activeQuestion = new Question();
      this.questionModalVisible = false;
      this.questionInit();
    }, (err: any) => {
      this.gs.triggerError(err);
    });
  }

  addOption(): void {
    this.activeQuestion.questionoption_set.push(new QuestionOption());
  }

  compareQuestionTypeObjects(qt1: QuestionType, qt2: QuestionType): boolean {
    if (qt1 && qt2 && qt1.question_typ && qt2.question_typ) {
      return qt1.question_typ === qt2.question_typ;
    }
    return false;
  }

  compareFormSubTypeObjects(qt1: FormSubType, qt2: FormSubType): boolean {
    if (qt1 && qt2) {
      //console.log(qt1.form_sub_typ === qt2.form_sub_typ);
      return qt1.form_sub_typ === qt2.form_sub_typ;
    }
    return false;
  }

  ynToYesNo(s: string): string {
    return s === 'y' ? 'Yes' : '';
  }

  isConditional(n: number): string {
    return n > 0 ? 'Yes' : '';
  }

  getQuestionFlowName(id: number): string {
    return this.FormMetadata.question_flows.find(qf => qf.id === id)?.name || '';
  }

  addQuestionFlow(): void {
    if (this.selectedQuestionFlow)
      this.selectedQuestionFlows.push(this.selectedQuestionFlow);
    this.selectedQuestionFlow = undefined;
  }

  decodeFlowIds(ids: number[]): string {
    return this.FormMetadata.question_flows.filter(qf => ids.includes(qf.id)).sort((qf1, qf2) => qf1.name.localeCompare(qf2.name)).map(qf => qf.name).join(', ');
  }
}