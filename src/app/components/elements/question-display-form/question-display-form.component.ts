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

      // Push questions into the one they are conditinoal on
      questions.filter(q => !this.gs.strNoE(q.question_conditional_on)).forEach(q => {
        this.questionsWithConditions.find(qwc => qwc.question.question_id === q.question_conditional_on)?.conditionalQuestions.push(q);
      });

      // find questions who are not a top level question or their direct child conditional queston
      // these will be passed down on any question with a list of conditions 
      // to see if there is a depper recursive conditional question
      let qs = this.questionsWithConditions.map(qwc => qwc.question);
      let qsc =  this.questionsWithConditions.map(qwc => qwc.conditionalQuestions.map(c => c)).flatMap(q => q);
      let ids = [...qs.map(q => q.question_id), ...qsc.map(q => q.question_id)]

      let leftOvers = this.allQuestions.filter(q => !ids.includes(q.question_id));
      this.questionsWithConditions.forEach(qwc => {
        if (qwc.conditionalQuestions.length > 0) {
          qwc.deeperConditionalQuestions = leftOvers;
        }
      });
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
            this.setQuestionsWithConditions(this.allQuestions);
            break;
          case 'Question':
            this.setQuestionsWithConditions(this.allQuestions);
            break;
        }
      }
    }
  }

  setQuestionsWithConditions(questions: Question[] | undefined) {
    if (questions) {
      this.allQuestions = questions;
      if (this.Question)
        this.questionsWithConditions = [new QuestionWithConditions(this.Question)];
      else 
        this.questionsWithConditions = questions.filter(q => this.gs.strNoE(q.question_conditional_on)).map(q => new QuestionWithConditions(q));

      // Push questions into the one they are conditinoal on
      questions.filter(q => !this.gs.strNoE(q.question_conditional_on)).forEach(q => {
        this.questionsWithConditions.find(qwc => qwc.question.question_id === q.question_conditional_on)?.conditionalQuestions.push(q);
      });

      // find questions who are not a top level question or their direct child conditional queston
      // these will be passed down on any question with a list of conditions 
      // to see if there is a depper recursive conditional question
      let qs = this.questionsWithConditions.map(qwc => qwc.question);
      let qsc =  this.questionsWithConditions.map(qwc => qwc.conditionalQuestions.map(c => c)).flatMap(q => q);
      let ids = [...qs.map(q => q.question_id), ...qsc.map(q => q.question_id)]

      let leftOvers = this.allQuestions.filter(q => !ids.includes(q.question_id));
      this.questionsWithConditions.forEach(qwc => {
        if (qwc.conditionalQuestions.length > 0) {
          qwc.deeperConditionalQuestions = leftOvers;
        }
      });
    }
  }

  setFormElements(fes: QueryList<FormElementComponent>): void {
    this.FormElements = fes;
    this.FormElementsChange.emit(this.FormElements);
  }

  setQuestionAnswer(i: number, question: Question): void {
    this.allQuestions[i] = question;

    const qwcs = this.questionsWithConditions.find(qwc => qwc.question.question_id === question.question_id);
    if (qwcs)
      for (let i = 0; i < qwcs.conditionalQuestions.length; i++) {
        if (this.gs.isQuestionConditionMet(question.answer, question,qwcs.conditionalQuestions[i])) {
          qwcs.activeConditionQuestion = qwcs.conditionalQuestions[i];
        }
      }
  }
}

class QuestionWithConditions {
  question = new Question();
  conditionalQuestions: Question[] = [];
  deeperConditionalQuestions: Question[] = [];
  activeConditionQuestion = new Question();

  constructor(question: Question) {
    this.question = question;
    this.conditionalQuestions = [];
    this.activeConditionQuestion = new Question();
    this.deeperConditionalQuestions = []
  }
}