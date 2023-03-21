import { Component, OnDestroy, OnInit } from '@angular/core';
import { NetworkInterface } from '@awesome-cordova-plugins/network-interface/ngx';
import { VideoEditor } from '@awesome-cordova-plugins/video-editor/ngx';
import { App } from '@capacitor/app';
import { Capacitor, PluginListenerHandle } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Network } from '@capacitor/network';
import { Animation, StatusBar } from '@capacitor/status-bar';
import { Toast } from '@capacitor/toast';
import { AlertController, ModalController, Platform, PopoverController } from '@ionic/angular';
import { CameraSettingsComponent } from '../components/camera-settings/camera-settings.component';
import { ChooseCountdownComponent } from '../components/choose-countdown/choose-countdown.component';
import { ChooseDurationComponent } from '../components/choose-duration/choose-duration.component';
import { ChooseGatewayComponent } from '../components/choose-gateway/choose-gateway.component';
import { VideoInformationComponent } from '../components/video-information/video-information.component';
import { VideoRecorderComponent } from '../components/video-recorder/video-recorder.component';
import { DatabaseService } from '../services/database.service';
import { SharedService } from '../services/shared.service';
import { WebServerService } from '../services/web-server.service';
import { Video } from '../types/video.type';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit, OnDestroy {
  isLoading = true; // Initial loading indicator
  packageName?: string;

  gateway?: string;
  duration?: number;
  countdown?: number;

  search: {
    keywords: string; // Keyword used to search videos
    fields: ['name', 'path']; // Allowed field for searching
  } = {
    keywords: '',
    fields: ['name', 'path'],
  };

  path: {
    total: number[]; // Numbers of total directories and files in internal storage
    explored: string[]; // Explored path locations
  } = {
    total: [],
    explored: []
  };

  videos: {
    source: Video[], // Videos from filesystems
    cached: Video[], // Cached videos, stored on sqlite
    filtered: Video[], // Filtered videos by search keywords
    view: Video[], // Displayed videos on the screen
  } = {
    source: [],
    cached: [],
    filtered: [],
    view: [],
  };

  infiniteScroll = {
    iteration: 20,
    loaded: 20,
  };

  taskExecutor: {
    interval?: any;
    isAllowedToClearInterval: boolean;
    isPaused: boolean;
    tasks: (() => Promise<any>)[];
  } = {
    isAllowedToClearInterval: true,
    isPaused: false,
    tasks: []
  }

  networkListener?: PluginListenerHandle;

  constructor(
    private platform: Platform,
    private alertCtrl: AlertController,
    private modalCtrl: ModalController,
    private popoverCtrl: PopoverController,
    private networkInterface: NetworkInterface,
    private videoEditor: VideoEditor,
    private database: DatabaseService,
    private shared: SharedService,
    private webServer: WebServerService
  ) {}

  get ip() {
    return this.shared.ip;
  }

  get port() {
    return this.shared.port;
  }

  ngOnInit() {
    this.platform.ready().finally(async () => {
      this.getWiFiIPAddress();

      this.webServer.setStartCameraAction(() => this.recordVideo(true));
      this.startWebServer();

      await this.getCachedVideos();
      this.exploreVideos();
    });

    this.gateway = this.shared.gateways?.find(gateway => gateway.selected)?.gateway;
    this.duration = this.shared.durations?.find(duration => duration.selected)?.duration;
    this.countdown = this.shared.countdowns?.find(countdown => countdown.selected)?.countdown;

    App.getInfo()
      .then(info => this.packageName = info.id)
      .catch(error => console.error(error));

    Network
      .addListener('networkStatusChange', status => {
        console.log(status);
        this.getWiFiIPAddress().then(() => console.log(this.shared.ip));
      })
      .then(listener => this.networkListener = listener)
      .catch(error => console.error(error));
  }

  ngOnDestroy() {}

  formatSize(sizeInByte?: number) {
    return ((sizeInByte ?? 0) / 1000000).toFixed(2);
  }

  async doRefresh(event: any) {
    await this.exploreVideos();
    event?.target?.complete?.();
  }

  async doInfinite(event: any) {
    const start = this.videos.view.length;

    if (start < this.videos.filtered.length) {
      let end = start + this.infiniteScroll.iteration;

      if (end > this.videos.filtered.length) {
        end = this.videos.filtered.length;
      }

      this.videos.view.push(
        ...this.videos.filtered.slice(start, end)
      );

      if (this.infiniteScroll.loaded < this.videos.view.length) {
        this.infiniteScroll.loaded = this.videos.view.length;
      }
    } else {
      await Toast.show({
        text: 'All data has been loaded',
        duration: 'short',
        position: 'bottom'
      });
    }

    event?.target?.complete?.();
  }

  async onSearch() {
    this.videos.filtered = this.videos.cached
      .filter(document => this.search.fields.some(
        field => document?.[field]?.toLowerCase?.()?.includes?.(this.search.keywords?.toLowerCase?.())
      ));

    this.videos.view = this.videos.filtered.slice(0, this.infiniteScroll.loaded);
  }

  async chooseGateway() {
    const modal = await this.modalCtrl.create({
      component: ChooseGatewayComponent,
      swipeToClose: false,
      keyboardClose: false,
      presentingElement: await this.modalCtrl.getTop()
    });

    modal.onDidDismiss().then(value => {
      if (value?.data) {
        this.gateway = value?.data?.gateway;
      }
    });

    modal.present();
  }

  async chooseDuration() {
    const modal = await this.modalCtrl.create({
      component: ChooseDurationComponent,
      swipeToClose: false,
      keyboardClose: false,
      presentingElement: await this.modalCtrl.getTop()
    });

    modal.onDidDismiss().then(value => {
      if (value?.data) {
        this.duration = value?.data?.duration;
      }
    });

    modal.present();
  }

  async chooseCountdown() {
    const modal = await this.modalCtrl.create({
      component: ChooseCountdownComponent,
      swipeToClose: false,
      keyboardClose: false,
      presentingElement: await this.modalCtrl.getTop()
    });

    modal.onDidDismiss().then(value => {
      if (value?.data) {
        this.countdown = value?.data?.countdown;
      }
    });

    modal.present();
  }

  async recordVideo(autostart = false) {
    const videoRecorder = await this.modalCtrl.create({
      component: VideoRecorderComponent,
      cssClass: 'modal-fullscreen',
      backdropDismiss: false,
      componentProps: {
        autostart,
        close: (data: any) => videoRecorder.dismiss(data)
      }
    });

    videoRecorder.onDidDismiss().then(async result => {
      this.webServer.setStartCameraAction(() => this.recordVideo(true));

      if (result?.data) {
        try {
          const res = await this.database.insert('video', [result?.data]);
          this.generateThumbnail(result?.data)
          this.videos.cached.unshift(result?.data);
          this.onSearch();
        } catch (error) {
          console.error(error)
        }
      }
    });

    await videoRecorder.present();
    this.webServer.setStartCameraAction();
  }

  async openCameraSettings() {
    const cameraSettings = await this.modalCtrl.create({
      component: CameraSettingsComponent,
      cssClass: 'modal-fullscreen',
      componentProps: {
        close: (data: any) => cameraSettings.dismiss(data)
      }
    });

    cameraSettings.onDidDismiss().then(async result => {
      if (result?.data) {
        console.log(result?.data);
      }
    });

    await cameraSettings.present();
  }

  async getWiFiIPAddress() {
    try {
      const result = await this.networkInterface.getWiFiIPAddress();
      this.shared.setIP(result.ip);
    } catch (error) {
      this.shared.setIP();
      console.error(error)
    }
  }

  async startWebServer() {
    try {
      const result = await this.webServer.startWebServer(8089);
      this.shared.setPort(result.port);

      console.log(`Web server started: http://${this.shared.ip}:${this.shared.port}`);
    } catch (error) {
      console.error(error);
    }
  }

  async showVideoInformation(event: any, video: Video) {
    event?.stopPropagation?.();

    const popover = await this.popoverCtrl.create({
      component: VideoInformationComponent,
      cssClass: 'alert-popover center-popover',
      componentProps: {
        video,
        deleteable: this.packageName
          ? video.path.includes(this.packageName)
          : undefined,
        close: (data: any) => popover.dismiss(data)
      }
    });

    popover.onDidDismiss().then(async value => {
      if (value.data === 'delete-video') {
        try {
          await this.database.delete('video', {
            query: 'path=?',
            params: [video.path]
          });

          await Filesystem.deleteFile({ path: video.path });

          this.videos.cached = this.videos.cached.filter(v => v.path !== video.path);
          this.onSearch();

          if (video.thumbnailPath) {
            await Filesystem.deleteFile({ path: video.thumbnailPath });
          }
        } catch (error: any) {
          const alert = await this.alertCtrl.create({
            header: 'Error',
            message: error?.message ?? error,
            buttons: ['Close']
          });

          alert.present();
        }
      }
    });

    await popover.present();
  }

  async confirmDeleteVideo(video: Video) {
    const alert = await this.alertCtrl.create({
      header: 'Confirm',
      message: `Are you sure want to delete ${video.name}?`,
      buttons: [
        'Cancel',
        {
          text: 'Delete',
          role: 'destructive',
          handler: async () => {
            try {
              const result = await this.database.delete('video', {
                query: 'path=?',
                params: [video.path]
              });

              this.videos.cached = this.videos.cached.filter(v => v.path !== video.path);
              this.onSearch();

              await Filesystem.deleteFile({ path: video.path })
            } catch (error: any) {
              const alert = await this.alertCtrl.create({
                header: 'Error',
                message: error?.message ?? error,
                buttons: ['Close']
              });

              alert.present();
            }
          }
        }
      ]
    });

    alert.present();
  }

  async playVideo(url: string) {
    const videoContainer = document.getElementById('home-video-container') as HTMLDivElement;
    const videoElement = document.getElementById('home-video-element') as HTMLVideoElement;
    const videoSource = document.getElementById('home-video-source') as HTMLSourceElement;

    if (videoSource?.src !== url) {
      if (!videoElement?.paused) {
        videoElement?.pause();
      }

      if (videoSource) {
        videoSource.src = url;
        videoSource.type = 'video/mp4';
      }

      videoElement?.load();
    }

    videoContainer?.classList.remove('hidden');
    videoElement?.requestFullscreen?.();

    videoElement?.play().then(() => {
      window.screen.orientation.addEventListener('change', () => this.onOrientationChange());

      if (window.screen.orientation.type === 'landscape-primary' || window.screen.orientation.type === 'landscape-secondary') {
        this.setStatusBarVisibility('hidden');
      }
    });
  }

  hideVideoPlayer() {
    const videoElement = document.getElementById('home-video-element') as HTMLVideoElement;

    if (!videoElement.paused) {
      videoElement.pause();
    }

    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    }

    document.getElementById('home-video-container')?.classList.add('hidden');
    window.screen.orientation.removeEventListener('change', () => this.onOrientationChange());
    this.setStatusBarVisibility('visible');
  }

  onOrientationChange() {
    if (document.getElementById('home-video-container')?.classList.contains('hidden')) {
    } else if (window.screen.orientation.type === 'portrait-primary' || window.screen.orientation.type === 'portrait-secondary') {
      this.setStatusBarVisibility('visible');
    } else if (window.screen.orientation.type === 'landscape-primary' || window.screen.orientation.type === 'landscape-secondary') {
      this.setStatusBarVisibility('hidden');
    }
  }

  async setStatusBarVisibility(visibility: 'visible' | 'hidden') {
    try {
      const info = await StatusBar.getInfo();

      if (visibility === 'visible' && !info.visible) {
        await StatusBar.show({ animation: Animation.Fade });
      } else if (visibility === 'hidden' && info.visible) {
        await StatusBar.hide({ animation: Animation.Fade });
      }
    } catch (error) {
      console.error(error);
    }
  }

  async exploreVideos() {
    this.taskExecutor.isAllowedToClearInterval = false;

    this.taskExecutor.interval = setInterval(() => {
      if (this.taskExecutor.tasks.length) {
        this.taskExecutor.isPaused = true;

        this.taskExecutor.tasks.shift()?.()
          .catch(error => console.error(error))
          .finally(() => this.taskExecutor.isPaused = false);
      } else if (this.taskExecutor.isAllowedToClearInterval) {
        clearInterval(this.taskExecutor.interval);
        this.taskExecutor.interval = null;
      }
    }, 250);

    await new Promise<void>(async (resolve) => {
      this.path.total = [];
      this.path.explored = [];
      this.videos.source = [];

      const directories = [Directory.ExternalStorage, Directory.External];

      for (const directory of directories) {
        try {
          const result = await Filesystem.getUri({ directory, path: '' });
          this.path.total.push(1);
          await this.listDir(result.uri, resolve);
          this.path.explored.push(result.uri);
        } catch (error) {
          console.error(error);
        }
      }
    });

    const unusedThumbnails: string[] = [];

    const unusedVideos = this.videos.cached
      .filter(video => !this.path.explored.includes(video.path))
      .map(video => {
        if (video.thumbnailPath) {
          unusedThumbnails.push(video.thumbnailPath);
        }

        return video.path;
      });

    this.videos.cached = this.videos.source.sort((a, b) => a.mtime === b.mtime ? 0 : a.mtime > b.mtime ? -1 : 1);
    const markUnusedVideos = this.database.marks(unusedVideos.length);

    this.database
      .delete('video', {
        query: `path IN (${markUnusedVideos})`,
        params: unusedVideos
      })
      .catch(error => console.error(error));

    for (const path of unusedThumbnails) {
      Filesystem.deleteFile({ path })
        .catch(error => console.error(error));
    }

    this.onSearch();
    this.isLoading = false;
    this.taskExecutor.isAllowedToClearInterval = true;
  }

  private async getCachedVideos() {
    try {
      this.videos.cached = await this.database.fetch(
        'video',
        { orderBy: [{ column: 'mtime', desc: true }] },
        (video: Video) => {
          video.url = Capacitor.convertFileSrc(video.path);
          video.thumbnailUrl = video.thumbnailPath ? Capacitor.convertFileSrc(video.thumbnailPath) : undefined;
          return video;
        }
      );
    } catch (error) {
      console.error(error);
    } finally {
      this.onSearch();

      if (this.videos.cached.length) {
        this.isLoading = false;
      }
    }
  }

  private async generateThumbnail(video: Video) {
    try {
      video.thumbnailPath = await this.videoEditor.createThumbnail({
        fileUri: video.path,
        outputFileName: video.name,
        width: 1280,
        height: 720,
        quality: 100
      });

      video.thumbnailUrl = Capacitor.convertFileSrc(video.thumbnailPath);

      this.database
        .update('video', video, {
          query: 'path=?',
          params: [video.path]
        })
        .catch(console.error);
    } catch (error) {
      console.error(error);
    }
  }

  private listDir(path: string, onFinished: () => any = () => {}) {
    return new Promise<void>(resolve => {
      Filesystem.readdir({ path })
        .then(async result => {
          this.path.total.push(result.files.length);
          resolve();

          for (const file of result.files) {
            if (['.', 'Android'].some(name => file.name.startsWith(name))) {
              this.path.explored.push(file.uri);
              continue;
            }

            if (file.type === 'directory') {
              if (!this.path.explored.includes(file.uri)) {
                await this.listDir(file.uri, onFinished);
              }

              this.path.explored.push(file.uri);
            }

            if (file.type === 'file') {
              if (file.mimeType?.toLowerCase().startsWith('video')) {
                const video: Video = {
                  name: file.name,
                  path: file.uri,
                  url: Capacitor.convertFileSrc(file.uri),
                  ctime: file.ctime,
                  mtime: file.mtime,
                  size: file.size,
                };

                const videoIndex = this.videos.cached.findIndex(video => video.path === file.uri)

                if (videoIndex < 0) {
                  this.database.insert('video', [video])
                    ?.then(() => this.taskExecutor.tasks.push(() => this.generateThumbnail(video)))
                    .catch(error => console.error(error));
                } else if (!this.videos.cached[videoIndex].thumbnailPath) {
                  this.taskExecutor.tasks.push(() => this.generateThumbnail(video));
                } else  {
                  video.thumbnailPath = this.videos.cached[videoIndex].thumbnailPath;

                  if (video.thumbnailPath) {
                    video.thumbnailUrl = Capacitor.convertFileSrc(video.thumbnailPath);
                  }
                }

                this.videos.source.push(video);
              }

              this.path.explored.push(file.uri);
            }

            if (this.path.total.reduce((prev, curr) => prev + curr, 0) === this.path.explored.length) {
              onFinished();
            }
          }
        })
        .catch(error => {
          console.error(error);
          resolve();
        });
    });
  }
}
