import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-programming',
  templateUrl: './programming.component.html',
  styleUrls: ['./programming.component.scss']
})
export class ProgrammingComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

  openURL(url: string): void {
    window.open(url, '_blank');
  }

}
