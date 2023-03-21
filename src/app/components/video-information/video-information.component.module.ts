import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { VideoInformationComponent } from './video-information.component';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule],
  exports: [VideoInformationComponent],
  declarations: [VideoInformationComponent],
})
export class VideoInformationComponentModule {}
