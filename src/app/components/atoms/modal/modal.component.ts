import { Component, OnInit, Input, EventEmitter, Output, ViewChild, DoCheck, Renderer2, ContentChildren, QueryList, HostListener } from '@angular/core';
import { ModalService } from 'src/app/services/modal.service';
import { ButtonComponent } from '../button/button.component';
import { FormComponent } from '../form/form.component';
import { AppSize, GeneralService } from 'src/app/services/general.service';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss']
})
export class ModalComponent implements OnInit {
  private resizeTimer: number | null | undefined;

  @Input() ButtonType = '';
  @Input() ButtonText = '';
  @Input() Title = '';

  @Input() Width = '80%';
  @Input() MinWidth = 'auto';
  @Input() MaxWidth = 'auto';

  @Input()
  set visible(v: boolean) {
    this._visible = v;
    this.ms.setModalVisible(this._visible);
    this.clickOutsideCapture = true;

    if (this._visible) {
      window.setTimeout(() => {
        this.clickOutsideCapture = false;
      }, 500);
    }
  }
  @Output() visibleChange = new EventEmitter();
  _visible = false;

  @Input() zIndex = 16;

  private clickOutsideCapture = true;

  @ViewChild('thisButton', { read: ButtonComponent, static: false }) button: ButtonComponent = new ButtonComponent;
  @ContentChildren(FormComponent) form = new QueryList<FormComponent>();

  constructor(private ms: ModalService, private gs: GeneralService) { }

  ngOnInit() {
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    if (this.resizeTimer != null) {
      window.clearTimeout(this.resizeTimer);
    }

    this.resizeTimer = window.setTimeout(() => {
      if (this.gs.screenSize() >= AppSize._3XLG) {
        this.Width = '90%';
      }
      else {
        this.Width = '80%';
      }

    }, 200);
  }

  open() {
    this._visible = true;
    this.ms.setModalVisible(this._visible);
    this.visibleChange.emit(this._visible);
    this.clickOutsideCapture = true;

    window.setTimeout(() => {
      this.clickOutsideCapture = false;
    }, 500);
  }

  close() {
    this._visible = false;
    this.ms.setModalVisible(this._visible);
    this.visibleChange.emit(this._visible);
    this.form.forEach(elem => {
      elem.reset();
    });
  }

  clickOutsideClose() {
    if (!this.clickOutsideCapture) {
      //this.close();
      this.clickOutsideCapture = true;
    }
  }
}
