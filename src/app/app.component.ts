import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContactFormComponent } from './form/form.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ContactFormComponent],
  template: `
    <app-form></app-form>
  `
})
export class AppComponent { }