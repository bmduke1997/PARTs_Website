import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { HTTPInterceptor } from './providers/http-interceptor';

import { HomeComponent } from './components/webpages/home/home.component';
import { NavigationComponent } from './components/navigation/navigation.component';
import { FooterComponent } from './components/footer/footer.component';
import { LoginComponent } from './components/login/login.component';
import { LoadingScreenComponent } from './components/loading-screen/loading-screen.component';
import { ScoutFieldComponent } from './components/webpages/scouting/scout-field/scout-field.component';
import { BoxComponent } from './components/atoms/box/box.component';
import { ButtonComponent } from './components/atoms/button/button.component';
import { ButtonRibbonComponent } from './components/atoms/button-ribbon/button-ribbon.component';
import { FormElementComponent } from './components/atoms/form-element/form-element.component';
import { FormElementGroupComponent } from './components/atoms/form-element-group/form-element-group.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    NavigationComponent,
    FooterComponent,
    LoginComponent,
    LoadingScreenComponent,
    BoxComponent,
    ScoutFieldComponent,
    ButtonComponent,
    ButtonRibbonComponent,
    FormElementComponent,
    FormElementGroupComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HTTPInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
