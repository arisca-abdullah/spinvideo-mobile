import { Component, OnInit } from '@angular/core';
import { AlertController, ModalController } from '@ionic/angular';
import { SharedService } from 'src/app/services/shared.service';

@Component({
  selector: 'app-choose-countdown',
  templateUrl: './choose-countdown.component.html',
  styleUrls: ['./choose-countdown.component.scss'],
})
export class ChooseCountdownComponent  implements OnInit {
  countdowns: {countdown: number, selected: boolean}[] = []

  constructor(
    private alertCtrl: AlertController,
    private modalCtrl: ModalController,
    private shared: SharedService
  ) { }

  ngOnInit() {
    this.countdowns = this.shared.countdowns;
  }

  dismiss() {
    return this.modalCtrl.dismiss();
  }

  selectCountdown(index: number) {
    this.countdowns.forEach((countdown, i) => {
      countdown.selected = i === index;
    });

    this.shared.setCountdowns(this.countdowns);
    this.modalCtrl.dismiss(this.countdowns[index]);
  }

  async addCountdown() {
    const alert = await this.alertCtrl.create({
      header: 'Add',
      inputs: [
        {
          type: 'number',
          label: 'countdown',
          name: 'countdown',
          placeholder: 'Enter countdown in seconds...'
        }
      ],
      buttons: [
        'Close',
        {
          text: 'Add',
          handler: value => {
            if (value?.countdown?.trim?.()) {
              this.countdowns.push({
                countdown: value.countdown?.trim?.(),
                selected: false
              });

              this.shared.setCountdowns(this.countdowns);
            }
          },
        }
      ]
    });

    return alert.present();
  }

  async deleteCountdown(event: any, index: number) {
    event?.stopPropagation();

    if (this.countdowns[index]?.selected) {
      const alert = await this.alertCtrl.create({
        header: 'Warning',
        message: 'Cannot delete selected countdown!',
        buttons: ['Close']
      });

      return alert.present();
    }

    this.countdowns.splice(index, 1);
    this.shared.setCountdowns(this.countdowns);
  }
}
