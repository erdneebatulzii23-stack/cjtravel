import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app.component'; // <-- Энд ./app/app.component биш ./app.component байх магадлалтай
// Хэрэв таны файл src/app.component.ts гэж байгаа бол дээрх зам зөв.
// Хэрэв src/components/app.component.ts гэж байгаа бол замыг нь засаарай.

import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(),
    provideAnimations()
  ]
}).catch((err) => {
  console.error("Bootstrap Error:", err);
  document.body.innerHTML = `
    <div style="color: red; padding: 20px; font-family: sans-serif;">
      <h1>Critical Error</h1>
      <pre>${err.message}</pre>
      <pre>${err.stack}</pre>
    </div>`;
});
