import { Component, OnInit } from '@angular/core';
import { AlertController, ModalController } from '@ionic/angular';
import { SharedService } from 'src/app/services/shared.service';

@Component({
  selector: 'app-choose-gateway',
  templateUrl: './choose-gateway.component.html',
  styleUrls: ['./choose-gateway.component.scss'],
})
export class ChooseGatewayComponent  implements OnInit {
  gateways: {gateway: string, selected: boolean}[] = []

  constructor(
    private alertCtrl: AlertController,
    private modalCtrl: ModalController,
    private shared: SharedService
  ) { }

  ngOnInit() {
    this.gateways = this.shared.gateways;
  }

  dismiss() {
    return this.modalCtrl.dismiss();
  }

  selectGateway(index: number) {
    this.gateways.forEach((gateway, i) => {
      gateway.selected = i === index;
    });

    this.shared.setGateways(this.gateways);
    this.modalCtrl.dismiss(this.gateways[index]);
  }

  async addGateway() {
    const alert = await this.alertCtrl.create({
      header: 'Add',
      inputs: [
        {
          type: 'url',
          label: 'gateway',
          name: 'gateway',
          placeholder: 'Enter gateway here...'
        }
      ],
      buttons: [
        'Close',
        {
          text: 'Add',
          handler: value => {
            if (value?.gateway?.trim?.()) {
              this.gateways.push({
                gateway: value.gateway?.trim?.(),
                selected: false
              });

              this.shared.setGateways(this.gateways);
            }
          },
        }
      ]
    });

    return alert.present();
  }

  async deleteGateway(event: any, index: number) {
    event?.stopPropagation();

    if (this.gateways[index]?.selected) {
      const alert = await this.alertCtrl.create({
        header: 'Warning',
        message: 'Cannot delete selected gateway!',
        buttons: ['Close']
      });

      return alert.present();
    }

    this.gateways.splice(index, 1);
    this.shared.setGateways(this.gateways);
  }
}
