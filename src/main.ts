import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { provideHttpClient } from '@angular/common/http';

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient()
  ]
}).catch((err) => {
  console.error(err);
  // Алдаа гарвал дэлгэц дээр харуулна (Утсан дээр оношлоход хэрэгтэй)
  const root = document.querySelector('app-root');
  if (root) {
    root.innerHTML = `<div style="color:red; padding:20px;">
      <h2>Bootstrap Error!</h2>
      <pre>${err.message || err}</pre>
    </div>`;
  }
});
