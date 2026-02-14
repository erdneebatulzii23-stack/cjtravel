console.log("!!! JAVASCRIPT ЭХЭЛЛЭЭ !!!"); // <--- Энийг нэм
import 'zone.js';
import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(),
    provideAnimations()
  ]
}).catch((err) => {
  console.error("BOOTSTRAP ERROR:", err);
  document.body.innerHTML = `
    <div style="background:white; color:red; padding:20px; font-family:sans-serif;">
      <h1>App Failed to Start</h1>
      <pre>${err.message}</pre>
      <pre>${err.stack}</pre>
    </div>
  `;
});
