import { Component, Input } from '@angular/core';
import { QRCode } from 'qrcode';


@Component({
  selector: 'app-qr-generator',
  standalone: true,
  imports: [],
  templateUrl: './qr-generator.component.html',
  styleUrl: './qr-generator.component.scss'
})
export class QrGeneratorComponent {
  @Input()
  set Data(s: string) {

  }

}
