import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ChooseDurationComponent } from './choose-duration.component';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule],
  exports: [ChooseDurationComponent],
  declarations: [ChooseDurationComponent],
})
export class ChooseDurationComponentModule {}
