import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { CameraSettingsComponent } from './camera-settings.component';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule],
  exports: [CameraSettingsComponent],
  declarations: [CameraSettingsComponent],
})
export class CameraSettingsComponentModule {}
