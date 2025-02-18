import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  ViewChild,
  Renderer2,
  DoCheck,
  OnChanges,
  HostListener,
  RendererStyleFlags2
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GeneralService } from '../../../services/general.service';
import { HeaderComponent } from '../header/header.component';
import { FormElementComponent } from '../form-element/form-element.component';
import { ButtonComponent } from '../button/button.component';
import { ObjectWildCardFilterPipe, OrderByPipe, RemovedFilterPipe } from '../../../pipes/ObjectWildcardFilter';
import { DateToStrPipe } from '../../../pipes/date-to-str.pipe';


//import * as $ from 'jquery';

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, FormElementComponent, ButtonComponent, RemovedFilterPipe, OrderByPipe, ObjectWildCardFilterPipe, DateToStrPipe],
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss']
})
export class TableComponent implements OnInit, OnChanges {

  private screenSizeWide = 1175;
  private resizeTimer: number | null | undefined;

  TableDisplayValue = "";

  @Input() TableData: any[] = [];
  @Input() TableCols: TableColType[] = [];
  @Input() TableDataButtons: any[] = [];

  @Input() TableTitle!: string;

  @Input() EnableFilter = false;
  @Input() DisableSort = false;

  @Output() RemoveRecordCallBack: EventEmitter<any> = new EventEmitter();
  @Input() ShowRemoveButton = false;

  @Output() ViewRecordCallBack: EventEmitter<any> = new EventEmitter();
  @Input() ShowViewButton = false;

  @Output() EditRecordCallBack: EventEmitter<any> = new EventEmitter();
  @Input() ShowEditButton = false;

  @Output() AddRecordCallBack: EventEmitter<any> = new EventEmitter();
  @Input() ShowAddButton = false;

  @Output() ArchiveRecordCallBack: EventEmitter<any> = new EventEmitter();
  @Input() ShowArchiveButton = false;


  @Output() RecordClickCallBack: EventEmitter<any> = new EventEmitter();
  @Output() DblClkRecordClickCallBack: EventEmitter<any> = new EventEmitter();

  @Input() EnableRemovedFilter = false;
  @Input() RemovedFilterProperty = 'Removed';
  @Input() RemovedFilterPropertyValue: any = true;

  @Input() ApplyRemovedFilter = true;

  @Input() Stripes = false;
  @Input() Borders = false;
  @Input() Highlighting = false;
  @Input() Scrollable = false;
  @Input() ScrollHeight = '20em';
  @Input() Responsive = false;
  @Input() AllowActiveRecord = false;
  @Input() DisplayRecordInfo = false;
  @Input() Resizable = false;
  @Input() ButtonsFirstCol = false;
  @Input() CursorPointer = false;

  @Input() DisableInputs = false;
  @Input() StrikeThroughFn: ((rec: any) => boolean) | null = null;

  @Input() Width = '';


  @Input() FilterText = '';
  @Output() FilterTextChange = new EventEmitter();

  @Input() OrderByProperty = '';
  @Input() OrderByReverse = false;
  ActiveRec: object | null = null;
  @Input()
  set SetActiveRec(rec: object) {
    this.ActiveRec = rec;
    this.SetTableContainerWidth();
  }
  FixedTableScrollColWidth = '0px';
  @ViewChild('InfoContainer', { read: ElementRef, static: true }) InfoContainer?: ElementRef;

  @ViewChild('TableContainer', { read: ElementRef, static: true }) TableContainer?: ElementRef;
  @ViewChild('MainTableBody', { read: ElementRef, static: true }) MainTableBody?: ElementRef;

  @ViewChild('Table', { read: ElementRef, static: true }) Table?: ElementRef;

  buttonCellWidth = 'auto';

  constructor(private gs: GeneralService, private renderer: Renderer2) { }

  ngOnInit() {
    if (this.Width !== '' && this.Table) {
      this.renderer.setStyle(this.Table.nativeElement, 'width', this.Width, RendererStyleFlags2.DashCase | RendererStyleFlags2.Important);
    }

    this.SetTableContainerWidth();

    /*
      If the table header is set to fixed, need width of scrollbar
      to add a col to fix spacing
    */
    if (this.Scrollable && this.MainTableBody) {
      this.FixedTableScrollColWidth = this.getScrollbarWidth() + 'px';
      this.renderer.setStyle(
        this.MainTableBody.nativeElement,
        'max-height',
        this.ScrollHeight
      );
    }

    /*$(function () {
      var startX,
        startWidth,
        $handle,
        $table,
        pressed = false;

      $(document)
        .on({
          mousemove: function (event) {
            if (pressed) {
              $handle.width(startWidth + (event.pageX - startX));
            }
          },
          mouseup: function () {
            if (pressed) {
              $table.removeClass('resizing');
              pressed = false;
            }
          }
        })
        .on('mousedown', '.table-resizable th', function (event) {
          $handle = $(this);
          pressed = true;
          startX = event.pageX;
          startWidth = $handle.width();

          $table = $handle.closest('.table-resizable').addClass('resizing');
        })
        .on('dblclick', '.table-resizable thead', function () {
          // Reset column sizes on double click
          $(this)
            .find('th[style]')
            .css('width', '');
        });
    });*/

  }

  ngOnChanges() {
    this.toType();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    if (this.resizeTimer != null) {
      window.clearTimeout(this.resizeTimer);
    }

    this.resizeTimer = window.setTimeout(() => {
      this.SetTableContainerWidth();
    }, 200);
  }

  private toType() {
    for (let obj of this.TableData) {
      for (const property in obj) {
        if (obj.hasOwnProperty(property)) {
          const numPatt = new RegExp('^[0-9]+(\.[0-9]+)?$');
          const datePatt = new RegExp('^[0-2][0-9]\/[0-9][0-9]\/[0-9]{4}$');
          /*if (numPatt.test(obj[property])) {
            obj[property] = parseFloat(obj[property]);
          } else */
          if (datePatt.test(obj[property])) {
            const dt = obj[property].split(/\/|\-|\s/);
            // obj[property] = new Date(dt[0] + '-' + dt[1] + '-' + dt[2]); // fixed format dd-mm-yyyy
          }
        }
      }
    }
  }

  RecordClick(Rec: any) {
    this.RecordClickCallBack.emit(Rec);
    if (this.AllowActiveRecord) {
      this.ActiveRec = Rec;
      this.SetTableContainerWidth();
    }
  }

  DblClkRecordClick(Rec: any) {
    this.DblClkRecordClickCallBack.emit(Rec);
  }

  SetTableContainerWidth() {
    if (this.InfoContainer && this.DisplayRecordInfo && this.ActiveRec != null) {
      this.renderer.setStyle(
        this.InfoContainer.nativeElement,
        'display',
        'inline-block'
      );
      const infopixels = this.InfoContainer.nativeElement.offsetWidth;
      const FinalCssVal = 'calc(100% - ' + infopixels + 'px)';

      if (this.TableContainer &&
        window.innerWidth >= this.screenSizeWide &&
        (window.innerWidth - (infopixels + 300) > 0)
      ) {
        this.renderer.setStyle(
          this.TableContainer.nativeElement,
          'width',
          FinalCssVal
        );
      } else if (this.TableContainer) {
        this.renderer.setStyle(
          this.TableContainer.nativeElement,
          'width',
          '100%'
        );
        this.renderer.setStyle(
          this.InfoContainer.nativeElement,
          'display',
          'block'
        );
      }

    } else if (this.InfoContainer) {
      this.renderer.setStyle(
        this.InfoContainer.nativeElement,
        'display',
        'none'
      );
    }
  }

  SetOrder(PropertyName: string) {
    // console.log(this.EnableRemovedFiter + " | " + this.RemovedFiterProperty + " | " + this.RemovedFiterPropertyValue)
    if (this.DisableSort) {
      this.OrderByReverse = false;
      this.OrderByProperty = '';
    } else {
      if (PropertyName === this.OrderByProperty) {
        this.OrderByReverse = !this.OrderByReverse;
      } else {
        this.OrderByReverse = false;
      }

      this.OrderByProperty = PropertyName;
    }
  }

  GetTableDisplayValue(rec: any, property: string) {
    return this.gs.getDisplayValue(rec, property);
  }

  IsPropertyInColumnSettings(PropertyName: any) {
    return true;
  }

  ShowButtonColumn() {
    const buttonWidth = 3.2;
    let colWidth = 0;

    if (this.ShowAddButton) {
      colWidth += buttonWidth;
    }

    if (this.ShowEditButton) {
      colWidth += buttonWidth;
    }

    if (this.ShowRemoveButton) {
      colWidth += buttonWidth;
    }

    if (this.ShowViewButton) {
      colWidth += buttonWidth;
    }

    if (this.ShowArchiveButton) {
      colWidth += buttonWidth;
    }

    this.TableDataButtons.forEach(t => {
      if (['main', 'success', 'danger', 'warning'].includes(t.ButtonType))
        colWidth += 6;
      else
        colWidth += buttonWidth;
    });

    if (colWidth > 0) {
      this.buttonCellWidth = colWidth + 0.6 + 'rem';
    }

    if (
      this.ShowAddButton ||
      this.ShowRemoveButton ||
      this.ShowEditButton ||
      this.ShowViewButton ||
      this.ShowArchiveButton ||
      this.TableDataButtons.length > 0
    ) {
      return true;
    }

    return false;
  }

  Remove(rec: any) {
    this.RemoveRecordCallBack.emit(rec);
  }

  View(rec: any) {
    this.ViewRecordCallBack.emit(rec);
  }

  Edit(rec: any) {
    this.EditRecordCallBack.emit(rec);
  }

  Add() {
    this.AddRecordCallBack.emit();
  }

  Archive(rec: any) {
    this.ArchiveRecordCallBack.emit(rec);
  }

  private getScrollbarWidth() {
    // Creating invisible container
    const outer = document.createElement('div');
    outer.style.visibility = 'hidden';
    outer.style.overflow = 'scroll'; // forcing scrollbar to appear
    //outer.style.msOverflowStyle = 'scrollbar'; // needed for WinJS apps
    document.body.appendChild(outer);

    // Creating inner element and placing it in the container
    const inner = document.createElement('div');
    outer.appendChild(inner);

    // Calculating difference between container's full width and the child width
    const scrollbarWidth = outer.offsetWidth - inner.offsetWidth;

    // Removing temporary elements from the DOM
    outer.parentNode?.removeChild(outer);

    return scrollbarWidth;
  }

  filterTextChange(text: any): void {
    this.FilterText = text;
    this.FilterTextChange.emit(text);
  }

  previewImage(link: string, id: string): void {
    this.gs.previewImage(link, id);
  }
}

export class TableColType {
  ColLabel = '';
  PropertyName?: string;
  Width?: string;
  Alignment?: string;
  SelectList?: [];
  BindingProperty?: string;
  DisplayProperty?: string;
  TrueValue?: any;
  FalseValue?: any;
  Type?: string;
  FieldSize?: number;
  MinValue?: number;
  MaxValue?: number;
  Rows?: number;
  ColValueFunction?: (arg: any) => any;
  FunctionCallBack?: (arg: any) => any;
  ColorFunction?: (arg: any) => string;
  FontColorFunction?: (arg: any) => string;
  UnderlineFn?: (arg0: any, arg1: any) => boolean;
}
