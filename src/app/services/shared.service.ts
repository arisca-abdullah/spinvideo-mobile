import { Injectable, Injector } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
// import { SplashScreen } from '@capacitor/splash-screen';
import { Storage } from '@capacitor/storage';
import { environment } from 'src/environments/environment';
import { DatabaseService } from './database.service';

@Injectable({
  providedIn: 'root'
})
export class SharedService {
  private _isInitialCheck = true;

  private _ip?: string;
  private _port?: number;
  private _cameraQuality?: string;
  private _cameraFps?: number;
  private _cameraFacing?: string;

  private _gateways: {gateway: string; selected: boolean}[] = [];
  private _durations: {duration: number; selected: boolean}[] = [];
  private _countdowns: {countdown: number; selected: boolean}[] = [];
  private _videoSchemaVersion?: number;

  constructor(private injector: Injector) { }

  get database() {
    return this.injector.get(DatabaseService);
  }

  get isInitialCheck() {
    return this._isInitialCheck;
  }

  get ip() {
    return this._ip;
  }

  get port() {
    return this._port;
  }

  get gateways() {
    return this._gateways;
  }

  get durations() {
    return this._durations;
  }

  get countdowns() {
    return this._countdowns;
  }

  get cameraQuality() {
    return this.cameraQualities.find(quality => quality.key === this._cameraQuality);
  }

  get cameraFps() {
    return this._cameraFps;
  }

  get cameraFacing() {
    return this._cameraFacing;
  }

  get cameraQualities() {
    return [
      {
        key: 'SD',
        label: 'SD (Standard Definition)',
        width: 640,
        height: 480,
        aspectWidth: 4,
        aspectHeight: 3,
      },
      {
        key: 'HD',
        label: 'HD (High Definition)',
        width: 1280,
        height: 720,
        aspectWidth: 16,
        aspectHeight: 9,
      },
      {
        key: 'FHD',
        label: 'Full HD (FHD)',
        width: 1920,
        height: 1080,
        aspectWidth: 16,
        aspectHeight: 9,
      },
      {
        key: '2K',
        label: '2K video (Quad HD)',
        width: 2560,
        height: 1440,
        aspectWidth: 16,
        aspectHeight: 9,
      },
      {
        key: '4K',
        label: '4K video',
        width: 2840,
        height: 2160,
        aspectWidth: 16,
        aspectHeight: 9,
      }
    ];
  }

  get videoSchemaVersion() {
    return this._videoSchemaVersion;
  }

  async getAppData() {
    const { value: gateways } = await Storage.get({
      key: 'app__gateways'
    });

    this._gateways = gateways ? JSON.parse(gateways) : [
      { gateway: 'http://192.168.4.6', selected: true }
    ];

    const { value: durations } = await Storage.get({
      key: 'app__durations'
    });

    this._durations = durations ? JSON.parse(durations) : [
      { duration: 120, selected: false },
      { duration: 90, selected: false },
      { duration: 60, selected: true },
      { duration: 30, selected: false },
    ];

    const { value: countdowns } = await Storage.get({
      key: 'app__countdowns'
    });

    this._countdowns = countdowns ? JSON.parse(countdowns) : [
      { countdown: 0, selected: false },
      { countdown: 3, selected: true },
      { countdown: 5, selected: false },
      { countdown: 10, selected: false },
      { countdown: 15, selected: false },
    ];

    const { value: cameraQuality } = await Storage.get({
      key: 'app__cameraQuality'
    });

    this._cameraQuality = cameraQuality ? JSON.parse(cameraQuality) : 'HD';

    const { value: cameraFps } = await Storage.get({
      key: 'app__cameraFps'
    });

    this._cameraFps = cameraFps ? JSON.parse(cameraFps) : 30;

    const { value: cameraFacing } = await Storage.get({
      key: 'app__cameraFacing'
    });

    this._cameraFacing = cameraFacing ? JSON.parse(cameraFacing) : 'environment';

    const { value: videoSchemaVersion } = await Storage.get({
      key: 'app__videoSchemaVersion'
    });

    this._videoSchemaVersion = videoSchemaVersion ? JSON.parse(videoSchemaVersion) : undefined;

    if (this._isInitialCheck) {
      if (Capacitor.isNativePlatform()) {
        await this.initializeTable();

        SplashScreen
          .hide()
          .catch(error => console.error(error));
      }

      this._isInitialCheck = false;
    }
  }

  async clearAppData() {
  }

  setIP(ip?: string) {
    this._ip = ip;
  }

  setPort(port: number) {
    this._port = port;
  }

  setDurations(durations: {duration: number; selected: boolean}[]) {
    this._durations = durations;

    Storage.set({
      key: 'app__durations',
      value: JSON.stringify(durations)
    });
  }

  setCountdowns(countdowns: {countdown: number; selected: boolean}[]) {
    this._countdowns = countdowns;

    Storage.set({
      key: 'app__countdowns',
      value: JSON.stringify(countdowns)
    });
  }

  setGateways(gateways: {gateway: string; selected: boolean}[]) {
    this._gateways = gateways;

    Storage.set({
      key: 'app__gateways',
      value: JSON.stringify(gateways)
    });
  }

  setCameraQuality(quality: string) {
    this._cameraQuality = quality;

    Storage.set({
      key: 'app__cameraQuality',
      value: JSON.stringify(quality)
    });
  }

  setCameraFps(fps: number) {
    this._cameraFps = fps;

    Storage.set({
      key: 'app__cameraFps',
      value: JSON.stringify(fps)
    });
  }

  setCameraFacing(facing: string) {
    this._cameraFacing = facing;

    Storage.set({
      key: 'app__cameraFacing',
      value: JSON.stringify(facing)
    });
  }

  setVideoSchemaVersion(videoSchemaVersion: number) {
    this._videoSchemaVersion = videoSchemaVersion;

    Storage.set({
      key: 'app__videoSchemaVersion',
      value: JSON.stringify(videoSchemaVersion)
    });
  }

  delay(time: number) {
    return new Promise<void>(resolve => {
      setTimeout(() => resolve(), time);
    });
  }

  private async initializeTable() {
    try {
      if (this.videoSchemaVersion == null) {
        await this.database.executeSQL({ query: environment.schema.video.query, params: [] });
        return this.setVideoSchemaVersion(environment.schema.video.version);
      }

      if (this.videoSchemaVersion < environment.schema.video.version) {
        const mapFunc = this.generateMapFunc(this.videoSchemaVersion, environment.schema.video.version);
        const documentReferences = await this.database.fetch('docRef', {}, mapFunc);

        await this.database.executeSQL({ query: 'DROP TABLE IF EXISTS docRef', params: [] });
        await this.database.executeSQL({ query: environment.schema.video.query, params: [] });      
        await this.database.insert('docRef', documentReferences);

        this.setVideoSchemaVersion(environment.schema.video.version);
      }
    } catch (error) {
      console.error(error);
    }
  }

  private generateMapFunc(from: number, to: number): ((item: any) => any) | undefined {
    return undefined;
  }
}
