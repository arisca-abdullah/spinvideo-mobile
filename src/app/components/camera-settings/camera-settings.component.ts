import { Component, OnInit } from '@angular/core';
import { ModalController, NavParams } from '@ionic/angular';
import { SharedService } from 'src/app/services/shared.service';

@Component({
  selector: 'app-camera-settings',
  templateUrl: './camera-settings.component.html',
  styleUrls: ['./camera-settings.component.scss'],
})
export class CameraSettingsComponent  implements OnInit {
  close?: (data: any) => any;

  quality: any;
  fps = 30;
  facing = 'environment';
  qualities: any[] = [];

  constructor(
    private navParams: NavParams,
    private modalCtrl: ModalController,
    private shared: SharedService
  ) { }

  ngOnInit() {
    this.close = this.navParams.get('close');
    this.quality = this.shared.cameraQuality;
    this.fps = this.shared.cameraFps ?? 30;
    this.facing = this.shared.cameraFacing ?? 'environment';
    this.qualities = this.shared.cameraQualities ?? [];
  }

  onQualityChanged(event: any) {
    const quality = this.qualities.find(q => q.key === event?.detail?.value);

    if (quality) {
      this.quality = quality;
      this.shared.setCameraQuality(quality.key);
    }
  }

  onFpsChanged(event: any) {
    this.fps = event?.detail?.value;

    if (this.fps != null) {
      this.shared.setCameraFps(this.fps);
    }
  }

  onFacingModeChanged(event: any) {
    this.facing = event?.detail?.value;

    if (this.facing != null) {
      this.shared.setCameraFacing(this.facing);
    }
  }

  dismiss(data?: any) {
    return (this.close ?? this.modalCtrl.dismiss)(data);
  }
}
