import { Component, EventEmitter, Input, OnChanges, OnInit, Output, QueryList, SimpleChanges } from '@angular/core';
import { FormElementComponent } from '../../atoms/form-element/form-element.component';
import { Question, QuestionAnswer } from '../../../models/form.models';
import { GeneralService } from '../../../services/general.service';
import { FormElementGroupComponent } from '../../atoms/form-element-group/form-element-group.component';
import { QuestionFormElementComponent } from '../question-form-element/question-form-element.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-question-display-form',
  standalone: true,
  imports: [FormElementGroupComponent, QuestionFormElementComponent, CommonModule],
  templateUrl: './question-display-form.component.html',
  styleUrls: ['./question-display-form.component.scss']
})
export class QuestionDisplayFormComponent implements OnInit, OnChanges {

  @Input() LabelText = '';
  @Input() Disabled = false;
  @Input()Question: Question | undefined = undefined;
  @Input()
  set Questions(questions: Question[]) {
    if (questions) {
      this.allQuestions = questions;
      this.questionsWithConditions = questions.filter(q => this.gs.strNoE(q.question_conditional_on)).map(q => new QuestionWithConditions(q));

      questions.filter(q => !this.gs.strNoE(q.question_conditional_on)).forEach(q => {
        this.questionsWithConditions.find(qwc => qwc.question.question_id === q.question_conditional_on)?.conditions.push(q);
      });

      let qs = this.questionsWithConditions.map(qwc => qwc.question);
      let ids = [...qs.map(q => q.question_id), ...this.questionsWithConditions.map(qwc => qwc.conditions.map(c => c))]

      let leftOvers = this.allQuestions.filter(q => !ids.includes(q.question_id));
      let p = 0;
    }
  }
  @Output() QuestionsChange: EventEmitter<Question[]> = new EventEmitter();
  allQuestions: Question[] = [];
  questionsWithConditions: QuestionWithConditions[] = [];
  

  @Input() QuestionAnsers: QuestionAnswer[] = [];

  @Input() FormElements: QueryList<FormElementComponent> = new QueryList<FormElementComponent>();
  @Output() FormElementsChange: EventEmitter<QueryList<FormElementComponent>> = new EventEmitter();

  constructor(private gs: GeneralService) { }

  ngOnInit(): void {
    //this.setFormElements();
    //this.formElements.changes.subscribe(fe => {
    //this.setFormElements();
    //console.log('changes');
    //});
  }

  ngOnChanges(changes: SimpleChanges) {
    for (const propName in changes) {
      if (changes.hasOwnProperty(propName)) {
        switch (propName) {
          case 'Questions':
            this.QuestionsChange.emit(this.allQuestions);
            break;
          case 'Question':
            //this.QuestionsChange.emit(this.allQuestions);
            break;
        }
      }
    }
  }

  setQuestionsWithConditions() {
    if (this.Question){
      const q = this.Questions.find(q => q.question_id === this.Question?.question_id)

    }
  }

  setFormElements(fes: QueryList<FormElementComponent>): void {
    this.FormElements = fes;
    this.FormElementsChange.emit(this.FormElements);
  }

  setQuestionAnswer(i: number, question: Question): void {
    this.allQuestions[i] = question;

    if (question.has_conditions === 'y') {
      const qwcs = this.questionsWithConditions.find(qwc => qwc.question.question_id === question.question_id);
      if (qwcs)
        for (let i = 0; i < qwcs.conditions.length; i++) {
          if (qwcs.conditions[i].question_condition_value.toLowerCase() === JSON.stringify(question.answer).toLowerCase()) {
            qwcs.activeConditionQuestion = qwcs.conditions[i];
          }
        }
    }
  }
}

class QuestionWithConditions {
  question = new Question();
  conditions: Question[] = [];
  activeConditionQuestion = new Question();

  constructor(question: Question) {
    this.question = question;
    this.conditions = [];
    this.activeConditionQuestion = new Question();
  }
}