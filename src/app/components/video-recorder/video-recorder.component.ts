import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { HTTP } from '@awesome-cordova-plugins/http/ngx';
import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { AlertController, LoadingController, NavParams, PopoverController } from '@ionic/angular';
import write_blob from 'capacitor-blob-writer';
import { formatDuration } from 'date-fns';
import { SharedService } from 'src/app/services/shared.service';
import { WebServerService } from 'src/app/services/web-server.service';
import { Video } from 'src/app/types/video.type';
import { v4 } from 'uuid';

@Component({
  selector: 'app-video-recorder',
  templateUrl: './video-recorder.component.html',
  styleUrls: ['./video-recorder.component.scss'],
})
export class VideoRecorderComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('video') video?: ElementRef;

  interval: any;
  durations?: string;

  autostart = false;
  aspectWidth = 16;
  aspectHeight = 9;
  countdown = 0;
  countdownInterval: any;

  private _isRecording = false;
  private ignoreVideo = false;

  private width = 1280;
  private height = 720;
  private frameRate = 30;
  private facing = 'environment';
  private duration = 30;

  private cameraStream?: MediaStream;
  private mediaRecorder?: MediaRecorder;
  private recordedBlobs: Blob[] = [];

  private close?: (data: any) => any;

  constructor(
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private navParams: NavParams,
    private popoverCtrl: PopoverController,
    private http: HTTP,
    private shared: SharedService,
    private webServer: WebServerService
  ) { }

  get isRecording() {
    return this._isRecording;
  }

  ngOnInit() {
    this.autostart = this.navParams.get('autostart') ?? false;
    const quality = this.shared.cameraQuality;

    this.width = quality?.width ?? this.width;
    this.height = quality?.height ?? this.height;
    this.aspectWidth = quality?.aspectWidth ?? this.aspectWidth;
    this.aspectHeight = quality?.aspectHeight ?? this.aspectHeight;
    this.frameRate = this.shared.cameraFps ?? this.frameRate;
    this.facing = this.shared.cameraFacing ?? this.facing;
    this.countdown = this.shared.countdowns?.find(countdown => countdown.selected)?.countdown ?? 0;

    this.close = this.navParams.get('close');
    this.duration = this.shared.durations?.find(duration => duration.selected)?.duration ?? 30;

    this.durations = formatDuration({ minutes: Math.floor(this.duration / 60), seconds: this.duration % 60 }, {
      delimiter: ':',
      format: ['minutes', 'seconds'],
      zero: true,
    })
    .split(':')
    .map(part => {
      part = part.split(' ').shift() ?? '0';
      part = part.length === 1 ? `0${part}` : part;

      return part;
    })
    .join(':');

    window.screen.orientation.lock('portrait-primary');
    this.webServer.setStopCameraAction(ignoreVideo => this.stopRecordVideo(ignoreVideo));
  }

  async ngAfterViewInit() {
    try {
      const constraints: MediaStreamConstraints = {
        audio: true,
        video: {
          width: this.width,
          height: this.height,
          aspectRatio: this.aspectWidth / this.aspectHeight,
          facingMode: this.facing,
          frameRate: this.frameRate,
        },
      };

      this.cameraStream = await navigator?.mediaDevices?.getUserMedia(constraints);

      if (this.video) {
        this.video.nativeElement.srcObject = this.cameraStream;
      }

      if (this.cameraStream && this.autostart) {
        this.startRecordVideo();
      }
    } catch (error: any) {
      console.error(error);

      const alert = await this.alertCtrl.create({
        header: 'Error',
        message: error?.message ?? error,
        buttons: ['Close']
      });

      alert.present();
    }
  }

  ngOnDestroy() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }

    this.cameraStream?.getTracks().forEach(track => track.stop());
    window.screen.orientation.unlock();
    this.webServer.setStopCameraAction();
  }

  async startRecordVideo() {
    try {
      if (!this.cameraStream) {
        throw new Error('Camera stream is not available');
      }

      if (this.countdown) {
        this.countdownInterval = setInterval(() => {
          this.countdown--;

          if (this.countdown === 0 && this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
          }
        }, 1000);

        await this.shared.delay(this.countdown * 1000);
      }

      this.setData();

      this.mediaRecorder = new MediaRecorder(this.cameraStream, { mimeType: 'video/webm' });
      this.mediaRecorder.addEventListener('dataavailable', event => this.recordedBlobs.push(event.data));
      this.mediaRecorder.addEventListener('stop', () => this.onRecorderStopped());

      let seconds = this.duration;
      this._isRecording = true;

      this.interval = setInterval(() => {
        seconds--;

        this.durations = formatDuration({ minutes: Math.floor(seconds / 60), seconds: seconds % 60 }, {
          delimiter: ':',
          format: ['minutes', 'seconds'],
          zero: true,
        })
        .split(':')
        .map(part => {
          part = part.split(' ').shift() ?? '0';
          part = part.length === 1 ? `0${part}` : part;

          return part;
        })
        .join(':');

        if (seconds <= 0) {
          this.stopRecordVideo();
        }
      }, 1000);

      this.mediaRecorder.start(1000);
    } catch (error: any) {
      console.error(error);

      const alert = await this.alertCtrl.create({
        header: 'Error',
        message: error?.message ?? error,
        buttons: ['Close']
      });

      alert.present();
    }
  }

  stopRecordVideo(ignoreVideo = false) {
    this.clearInterval();
    this.ignoreVideo = ignoreVideo;

    if (this.ignoreVideo && !this.isRecording) {
      return this.dismiss();
    }

    if (!this.mediaRecorder) {
      return this.dismiss();
    }

    return this.mediaRecorder?.stop();
  }

  private async onRecorderStopped() {
    this._isRecording = false;

    if (this.ignoreVideo) {
      return this.dismiss();
    }

    const loader = await this.loadingCtrl.create({ message: 'Saving video...' });
    await loader.present();

    try {
      const name = `${v4()}.webm`;
      const blob = new Blob(this.recordedBlobs, { type: 'video/webm' });

      const path = await write_blob({
        blob,
        path: name,
        directory: Directory.External,
      });

      const result = await Filesystem.stat({ path });

      const video: Video = {
        name, path,
        url: Capacitor.convertFileSrc(path),
        ctime: result.ctime,
        mtime: result.mtime,
        size: result.size
      };

      await loader.dismiss();
      this.dismiss(video);
    } catch (error: any) {
      console.error(error);
      await loader.dismiss();
      await this.dismiss();

      const alert = await this.alertCtrl.create({
        header: 'Error',
        message: error?.message ?? error,
        buttons: ['Close']
      });

      alert.present();
    }
  }

  private async setData() {
    try {
      const gateway = this.shared.gateways?.find(gateway => gateway.selected)?.gateway;
      const response = await this.http.get(`${gateway}/setdata`, { status: 1 }, {});
      console.log(response);
    } catch (error) {
      console.error(error);
    }
  }

  private clearInterval() {
    if (this.interval) {
      clearInterval(this.interval);
      this.durations = undefined;
      this.interval = null;
    }
  }

  private async dismiss(data?: any) {
    return (this.close ?? this.popoverCtrl.dismiss)(data);
  }
}
