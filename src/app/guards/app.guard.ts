import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot } from '@angular/router';
import { SharedService } from '../services/shared.service';

@Injectable({
  providedIn: 'root'
})
export class AppGuard implements CanActivate {
  constructor(private shared: SharedService) {}

  async canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Promise<true> {
    if (this.shared.isInitialCheck) {
      await this.shared.getAppData();
    }

    return true;
  }
}
