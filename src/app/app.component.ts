import { Component, OnInit } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Platform } from '@ionic/angular';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit {
  constructor(private platform: Platform) {}

  ngOnInit() {
    this.platform
      .ready()
      .finally(() => {
        StatusBar
          .setStyle({ style: Style.Light })
          .catch(error => console.error(error));

        if (Capacitor.getPlatform() === 'android') {
          StatusBar
            .setBackgroundColor({ color: '#ffffff' })
            .catch(error => console.error(error));
        }
      });
  }
}
