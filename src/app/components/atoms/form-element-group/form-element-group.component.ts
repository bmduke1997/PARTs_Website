import { Component, Input, ContentChildren, QueryList, AfterViewInit } from '@angular/core';
import { FormElementComponent } from '../form-element/form-element.component';

@Component({
  selector: 'app-form-element-group',
  templateUrl: './form-element-group.component.html',
  styleUrls: ['./form-element-group.component.scss']
})
export class FormElementGroupComponent implements AfterViewInit {
  @Input() Inline = false;
  @Input() MaxWidth = false;
  @Input() LabelText = '';
  @Input() InlineElements = false;
  @Input() WrapElements = false;
  @ContentChildren(FormElementComponent) formElements = new QueryList<FormElementComponent>();

  constructor() {
    this.formElements.changes.subscribe(() => {
      this.setFormGroup();
    });
  }


  ngAfterViewInit() {
    this.setFormGroup();
  }

  setFormGroup() {
    if (!this.InlineElements)
      window.setTimeout(() => {

        for (let i = 0; i <= this.formElements.length - 1; i++) {
          let fe = this.formElements.get(i);

          if (fe && i < this.formElements.length - 1) {
            fe.FormGroup = true;
          }
        }
      }, 1);
  }
}
