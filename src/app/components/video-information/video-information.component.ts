import { Component, OnInit } from '@angular/core';
import { NavParams, PopoverController } from '@ionic/angular';
import { format } from 'date-fns';

@Component({
  selector: 'app-video-information',
  templateUrl: './video-information.component.html',
  styleUrls: ['./video-information.component.scss'],
})
export class VideoInformationComponent  implements OnInit {
  deleteable = false;
  video: any;
  close?: (data: any) => any;

  constructor(
    private navParams: NavParams,
    private popoverCtrl: PopoverController
  ) { }

  ngOnInit() {
    this.deleteable = this.navParams.get('deleteable') ?? false;
    this.video = this.navParams.get('video');
    this.close = this.navParams.get('close');
  }

  formatSize(sizeInByte?: number) {
    return ((sizeInByte ?? 0) / 1000000).toFixed(2);
  }

  formatDate(time: number) {
    return format(time, 'd MMMM yyyy, HH:mm:ss');
  }

  dismiss(data?: any) {
    return (this.close ?? this.popoverCtrl.dismiss)(data);
  }
}
