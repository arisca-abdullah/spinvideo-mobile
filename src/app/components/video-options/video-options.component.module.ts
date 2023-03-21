import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { VideoOptionsComponent } from './video-options.component';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule],
  exports: [VideoOptionsComponent],
  declarations: [VideoOptionsComponent],
})
export class VideoOptionsComponentModule {}
