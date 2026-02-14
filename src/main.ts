import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router'; // 1. Router import хийх
import { routes } from './app.routes'; // 2. Routes файлаа дуудах (файлын нэр өөр байж магадгүй)
import { provideAnimations } from '@angular/platform-browser/animations'; // 3. Animation хэрэгтэй байдаг

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(),
    provideRouter(routes), // <-- Энийг нэмэх ёстой
    provideAnimations()    // <-- Энийг бас нэмбэл зүгээр (Material design ашиглаж байгаа бол)
  ]
}).catch((err) => {
  console.error(err);
  // Алдаа гарвал дэлгэц дээр харуулах хэсэг
  const root = document.querySelector('app-root');
  if (root) {
    root.innerHTML = `<div style="color:red; padding:20px;">
      <h2>Bootstrap Error!</h2>
      <pre>${err.message || err}</pre>
    </div>`;
  }
});
