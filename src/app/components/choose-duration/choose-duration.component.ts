import { Component, OnInit } from '@angular/core';
import { AlertController, ModalController } from '@ionic/angular';
import { SharedService } from 'src/app/services/shared.service';

@Component({
  selector: 'app-choose-duration',
  templateUrl: './choose-duration.component.html',
  styleUrls: ['./choose-duration.component.scss'],
})
export class ChooseDurationComponent  implements OnInit {
  durations: {duration: number, selected: boolean}[] = []

  constructor(
    private alertCtrl: AlertController,
    private modalCtrl: ModalController,
    private shared: SharedService
  ) { }

  ngOnInit() {
    this.durations = this.shared.durations;
  }

  dismiss() {
    return this.modalCtrl.dismiss();
  }

  selectDuration(index: number) {
    this.durations.forEach((duration, i) => {
      duration.selected = i === index;
    });

    this.shared.setDurations(this.durations);
    this.modalCtrl.dismiss(this.durations[index]);
  }

  async addDuration() {
    const alert = await this.alertCtrl.create({
      header: 'Add',
      inputs: [
        {
          type: 'number',
          label: 'duration',
          name: 'duration',
          placeholder: 'Enter duration in seconds...'
        }
      ],
      buttons: [
        'Close',
        {
          text: 'Add',
          handler: value => {
            if (value?.duration?.trim?.()) {
              this.durations.push({
                duration: value.duration?.trim?.(),
                selected: false
              });

              this.shared.setDurations(this.durations);
            }
          },
        }
      ]
    });

    return alert.present();
  }

  async deleteDuration(event: any, index: number) {
    event?.stopPropagation();

    if (this.durations[index]?.selected) {
      const alert = await this.alertCtrl.create({
        header: 'Warning',
        message: 'Cannot delete selected duration!',
        buttons: ['Close']
      });

      return alert.present();
    }

    this.durations.splice(index, 1);
    this.shared.setDurations(this.durations);
  }
}
