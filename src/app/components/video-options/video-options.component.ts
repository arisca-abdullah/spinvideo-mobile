import { Component, OnInit } from '@angular/core';
import { NavParams, PopoverController } from '@ionic/angular';

@Component({
  selector: 'app-video-options',
  templateUrl: './video-options.component.html',
  styleUrls: ['./video-options.component.scss'],
})
export class VideoOptionsComponent  implements OnInit {
  close?: (data: any) => any;

  constructor(private navParams: NavParams, private popoverCtrl: PopoverController) { }

  ngOnInit() {
    this.close = this.navParams.get('close');
  }

  dismiss(data?: any) {
    return (this.close ?? this.popoverCtrl.dismiss)?.(data);
  }
}
