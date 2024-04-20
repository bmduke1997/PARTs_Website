import { Component, Input, OnInit } from '@angular/core';
import { GeneralService, RetMessage } from 'src/app/services/general.service';
import { ScoutPitImage, ScoutPitResponse } from '../../webpages/scouting/scout-pit-results/scout-pit-results.component';
import * as LoadImg from 'blueimp-load-image';
import { HttpClient } from '@angular/common/http';
import { APIService } from 'src/app/services/api.service';

@Component({
  selector: 'app-scout-pic-display',
  templateUrl: './scout-pic-display.component.html',
  styleUrls: ['./scout-pic-display.component.scss']
})
export class ScoutPicDisplayComponent {
  @Input()
  set ScoutPitResult(spr: ScoutPitResponse) {
    this._ScoutPitResult = spr;
    this.preview(this._ScoutPitResult);
  }
  _ScoutPitResult = new ScoutPitResponse();

  constructor(private gs: GeneralService, private api: APIService) { }

  prevImage(sp: ScoutPitResponse): void {
    if (sp.pic - 1 < 0) sp.pic = sp.pics.length - 1;
    else sp.pic--;

    this.preview(sp, sp.pic)
  }

  nextImage(sp: ScoutPitResponse): void {
    if (sp.pic + 1 > sp.pics.length - 1) sp.pic = 0;
    else sp.pic++;

    this.preview(sp, sp.pic)
  }

  preview(sp: ScoutPitResponse, index?: number): void {
    if (sp && sp.pics.length > 0) {
      let link = '';

      if (index !== undefined) {
        link = sp.pics[index].pic;
        sp.pic = index;
      }
      else {
        for (let i = 0; i < sp.pics.length; i++) {
          if (sp.pics[i].default) {
            sp.pic = i;
            link = sp.pics[i].pic;
            break;
          }
        }

        if (this.gs.strNoE(link)) {
          link = sp.pics[0].pic;
          sp.pic = 0;
        }
      }

      let el = document.getElementById(sp.teamNo);

      if (el) el.replaceChildren();

      LoadImg(
        link,
        (img: any) => {
          img.style.width = '100%';
          img.style.height = 'auto';
          document.getElementById(sp.teamNo)!.appendChild(img);
        },
        {
          //maxWidth: 600,
          //maxHeight: 300,
          //minWidth: 100,
          //minHeight: 50,
          //canvas: true,
          orientation: true
        }
      );
    }
  }

  setDefaultPic(spi: ScoutPitImage): void {
    this.api.get(true, 'scouting/pit/set-default-pit-image/', {
      scout_pit_img_id: spi.scout_pit_img_id
    }, (result: any) => {
      this.gs.successfulResponseBanner(result);
      // TODO: need to emit this this.search();
      this._ScoutPitResult.pics.forEach(p => p.default = false);
      spi.default = true;
    }, (err: any) => {
      this.gs.triggerError(err);
    });
  }
}
