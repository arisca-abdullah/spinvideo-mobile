import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { HTTP } from '@awesome-cordova-plugins/http/ngx';
import { NetworkInterface } from '@awesome-cordova-plugins/network-interface/ngx';
import { SQLite } from '@awesome-cordova-plugins/sqlite/ngx';
import { VideoEditor } from '@awesome-cordova-plugins/video-editor/ngx';
import { WebServer } from '@awesome-cordova-plugins/web-server/ngx';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { CameraSettingsComponentModule } from './components/camera-settings/camera-settings.component.module';
import { ChooseCountdownComponentModule } from './components/choose-countdown/choose-countdown.component.module';
import { ChooseDurationComponentModule } from './components/choose-duration/choose-duration.component.module';
import { ChooseGatewayComponentModule } from './components/choose-gateway/choose-gateway.component.module';
import { VideoInformationComponentModule } from './components/video-information/video-information.component.module';
import { VideoOptionsComponentModule } from './components/video-options/video-options.component.module';
import { VideoRecorderComponentModule } from './components/video-recorder/video-recorder.component.module';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    IonicModule.forRoot({
      mode: 'ios',
      swipeBackEnabled: false
    }),
    AppRoutingModule,
    CameraSettingsComponentModule,
    ChooseCountdownComponentModule,
    ChooseDurationComponentModule,
    ChooseGatewayComponentModule,
    VideoInformationComponentModule,
    VideoOptionsComponentModule,
    VideoRecorderComponentModule,
  ],
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    HTTP,
    NetworkInterface,
    SQLite,
    VideoEditor,
    WebServer
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
