import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ChooseCountdownComponent } from './choose-countdown.component';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule],
  exports: [ChooseCountdownComponent],
  declarations: [ChooseCountdownComponent],
})
export class ChooseCountdownComponentModule {}
