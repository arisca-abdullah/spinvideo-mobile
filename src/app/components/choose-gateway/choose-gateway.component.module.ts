import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ChooseGatewayComponent } from './choose-gateway.component';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule],
  exports: [ChooseGatewayComponent],
  declarations: [ChooseGatewayComponent],
})
export class ChooseGatewayComponentModule {}
