import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { VideoRecorderComponent } from './video-recorder.component';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule],
  exports: [VideoRecorderComponent],
  declarations: [VideoRecorderComponent],
})
export class VideoRecorderComponentModule {}
