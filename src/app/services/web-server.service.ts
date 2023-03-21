import { Injectable, Injector } from '@angular/core';
import { Request, WebServer } from '@awesome-cordova-plugins/web-server/ngx';
import { Filesystem } from '@capacitor/filesystem';

import { Subscription } from 'rxjs';
import { DatabaseService } from './database.service';
import { SharedService } from './shared.service';

@Injectable({
  providedIn: 'root'
})
export class WebServerService {
  private subscription?: Subscription;
  private startCamera?: () => any;
  private stopCamera?: (ignoreVideo: boolean) => any;

  constructor(private injector: Injector, private webServer: WebServer) {}

  get database() {
    return this.injector.get(DatabaseService);
  }

  get shared() {
    return this.injector.get(SharedService);
  }

  setStartCameraAction(action?: () => any) {
    this.startCamera = action;
  }

  setStopCameraAction(action?: (ignoreVideo: boolean) => any) {
    this.stopCamera = action;
  }

  startWebServer(port?: number) {
    if (!this.subscription) {
      this.subscription = this.webServer.onRequest()
        .subscribe(request => this.handleRequest(request));
    }

    return new Promise<any>(async (resolve, reject) => {
      try {
        const result = await this.webServer.start(port);
        this.shared.setPort(result.port);
        resolve(result);
      } catch (error) {
        if (error === 'Server already running') {
          try {
            const status = await this.webServer.stop();
            console.log(status);

            const result = await this.webServer.start(port);
            this.shared.setPort(result.port);
            resolve(result);
          } catch (error) {
            reject(error)
          }
        } else {
          reject(error);
        }
      }
    })
  }

  private async handleRequest(request: Request) {
    switch (request.path) {
      case '/':
        this.responsePaths(request);
        break;
      case '/get_files':
        this.responseFiles(request);
        break;
      case '/get_file':
        this.responseFile(request);
        break;
      case '/start_camera':
        this.responseStartCamera(request);
        break;
      case '/stop_camera':
        this.responseStopCamera(request);
        break;
      default:
        this.responseNotFound(request)
    }
  }

  private async responsePaths(request: Request) {
    this.webServer.sendResponse(request.requestId, {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: 'Information',
        message: 'Success access webserver!',
        data: [
          {
            path: '/get_files',
            queries: [
              { query: 'offset', type: 'number', example: 'offset=10' },
              { query: 'limit', type: 'number', example: 'limit=10' },
              { query: 'sortBy', type: 'string', example: 'sortBy=mtime:desc' },
            ],
            desccription: 'Use this path to get list of videos'
          }
        ]
      })
    });
  }

  private async responseFiles(request: Request) {
    const searchParams = new URLSearchParams(request.query ?? '');
    let offset = searchParams.get('offset') ? Number(searchParams.get('offset')) : 0;
    let limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : 20;

    if (isNaN(offset)) {
      offset = 0;
    }

    if (isNaN(limit)) {
      limit = 20;
    }

    const orderBy = (searchParams.get('sortBy') ?? 'ctime:desc').split(',')
      .map(column => column.split(':'))
      .filter(([column]) => ['name', 'ctime', 'mtime'].includes(column))
      .map(([column, option]) => ({ column, desc: option === 'desc' }));

      const body: any = {
        title: 'Information',
        message: 'Success get files',
        data: []
      };

    try {
      body.data = await this.database.fetch('video', { offset, limit, orderBy }, video => ({
        name: video.name,
        url: this.shared.ip ? `http://${this.shared.ip}:${this.shared.port}/get_file?path=${encodeURIComponent(video.path)}` : '',
        img_url: this.shared.ip && video.thumbnailPath ? `http://${this.shared.ip}:${this.shared.port}/get_file?path=${encodeURIComponent(video.thumbnailPath)}` : '',
      }));

      this.webServer.sendResponse(request.requestId, {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
    } catch (error: any) {
      body.title = 'Error';
      body.message = error?.message ?? error;

      this.webServer.sendResponse(request.requestId, {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
    }
  }

  private async responseFile(request: Request) {
    const searchParams = new URLSearchParams(request.query ?? '');
    let path = searchParams.get('path') ?? undefined;

    if (!path) {
      this.responseNotFound(request);
    } else {
      try {
        const stat = await Filesystem.stat({ path });

        this.webServer.sendResponse(request.requestId, {
          status: 200,
          path: stat.uri.slice(6),
          headers: {}
        });
      } catch (error) {
        this.responseNotFound(request);
      }
    }
  }

  private async responseStartCamera(request: Request) {
    try {
      if (!this.startCamera) {
        throw new Error('Camera is already recording!');
      }

      await this.startCamera();

      this.webServer.sendResponse(request.requestId, {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: 'Information',
          message: 'Recording has started.'
        })
      });
    } catch (error: any) {
      this.webServer.sendResponse(request.requestId, {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: 'Error',
          message: error?.message ?? error
        })
      });
    }
  }

  private async responseStopCamera(request: Request) {
    try {
      if (!this.stopCamera) {
        throw new Error('Camera is not recording!');
      }

      const searchParams = new URLSearchParams(request.query ?? '');
      let ignoreVideo = searchParams.get('ignoreVideo') ?? undefined;
      await this.stopCamera(ignoreVideo != null);

      this.webServer.sendResponse(request.requestId, {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: 'Information',
          message: 'Recording has stopped.'
        })
      });
    } catch (error: any) {
      this.webServer.sendResponse(request.requestId, {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: 'Error',
          message: error?.message ?? error
        })
      });
    }
  }

  private async responseNotFound(request: Request) {
    this.webServer.sendResponse(request.requestId, {
      status: 404,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: 'Not Found',
        message: 'Resource not found',
      })
    });
  }
}
