import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(),
    provideAnimations()
  ]
}).catch((err) => {
  console.error(err);
  // Дэлгэц дээр алдааг харуулах
  document.body.innerHTML = `<h1 style='color:red; padding:20px'>Алдаа гарлаа: ${err.message}</h1>`;
});
