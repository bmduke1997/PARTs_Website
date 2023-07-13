import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { AuthCallStates, AuthService } from 'src/app/services/auth.service';
import { GeneralService } from 'src/app/services/general.service';
import { Question } from '../../elements/question-admin-form/question-admin-form.component';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss']
})
export class ContactComponent implements OnInit {

  questions: Question[] = [];

  constructor(private gs: GeneralService, private http: HttpClient, private authService: AuthService) { }

  ngOnInit() {
    this.authService.authInFlight.subscribe(r => AuthCallStates.comp ? this.contactInit() : null);
  }

  contactInit(): void {
    this.gs.incrementOutstandingCalls();
    this.http.get(
      'form/get-questions/', {
      params: {
        form_typ: 'team-cntct'
      }
    }
    ).subscribe(
      {
        next: (result: any) => {
          if (this.gs.checkResponse(result)) {
            this.questions = result as Question[];
            this.gs.devConsoleLog(this.questions);
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
