import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="height: 100vh; display: flex; justify-content: center; align-items: center; background: green; color: white;">
      <h1>ANGULAR АЖИЛЛАЖ БАЙНА! (TEST)</h1>
    </div>
  `
})
export class AppComponent {}
