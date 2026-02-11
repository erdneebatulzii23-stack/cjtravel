import { Component, inject, signal } from '@angular/core';
import { DataService, AppLang } from '../services/data.service';
import { UserRole } from '../types';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  imports: [FormsModule, CommonModule],
  template: `
    <div class="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      
      <div class="absolute inset-0 z-0">
         <img src="https://picsum.photos/seed/travel_login/1920/1080" class="w-full h-full object-cover animate-[pulse_20s_infinite_alternate] scale-110">
         <div class="absolute inset-0 bg-gradient-to-tr from-black/80 via-black/40 to-blue-900/30"></div>
      </div>

      <div class="absolute top-6 right-6 z-20">
        <div class="relative group">
            <select [ngModel]="dataService.currentLang()" (ngModelChange)="dataService.currentLang.set($event)" class="appearance-none bg-black/30 backdrop-blur-md text-white border border-white/20 rounded-full pl-4 pr-10 py-2 text-sm focus:ring-2 focus:ring-white/50 focus:border-white/50 cursor-pointer hover:bg-black/50 transition-colors font-bold uppercase tracking-wider">
              <option value="en" class="text-black">🇺🇸 English</option>
              <option value="mn" class="text-black">🇲🇳 Монгол</option>
              <option value="zh" class="text-black">🇨🇳 中文</option>
              <option value="de" class="text-black">🇩🇪 Deutsch</option>
              <option value="ru" class="text-black">🇷🇺 Русский</option>
              <option value="ko" class="text-black">🇰🇷 한국어</option>
              <option value="ja" class="text-black">🇯🇵 日本語</option>
            </select>
            <span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-white/80 pointer-events-none text-lg">language</span>
        </div>
      </div>

      <div class="w-full max-w-md p-8 relative z-10 animate-in fade-in zoom-in-95 duration-500">
        <div class="text-center mb-8 drop-shadow-lg">
           <div class="inline-flex p-3 rounded-2xl bg-white/10 backdrop-blur-lg border border-white/20 mb-4 shadow-xl">
               <span class="material-symbols-outlined text-white text-5xl">explore</span>
           </div>
           <h1 class="text-4xl font-extrabold text-white tracking-tight mb-2">{{dataService.text().appName}}</h1>
           <p class="text-white/80 text-sm font-medium tracking-wide">{{dataService.text().slogan}}</p>
        </div>

        <div class="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl overflow-hidden relative">
             <div class="absolute -top-24 -right-24 size-48 bg-blue-500/30 rounded-full blur-3xl pointer-events-none"></div>
             <div class="absolute -bottom-24 -left-24 size-48 bg-purple-500/30 rounded-full blur-3xl pointer-events-none"></div>

             @if (verificationStep() !== 'none') {
                 <div class="absolute inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
                     <span class="material-symbols-outlined text-green-500 text-5xl mb-4">mark_email_read</span>
                     <h2 class="text-xl font-bold text-white mb-2">Verification Code</h2>
                     <p class="text-white/70 text-sm mb-6">We sent a 4-digit code to <br> <span class="text-white font-bold">{{regEmail}}</span></p>
                     
                     <div class="relative w-full max-w-[200px] mb-6">
                        <input type="text" [(ngModel)]="verificationCode" maxlength="4" class="w-full bg-white/10 border border-white/30 rounded-xl text-center text-2xl font-bold tracking-[1em] text-white py-3 focus:border-primary focus:ring-1 focus:ring-primary" placeholder="0000">
                     </div>
                     
                     <button (click)="verifyAndRegister()" class="w-full bg-primary text-white font-bold py-3 rounded-xl mb-3">Verify & Create Account</button>
                     <button (click)="verificationStep.set('none')" class="text-white/50 text-xs hover:text-white">Cancel</button>
                 </div>
             }

             <div class="flex mb-8 bg-black/20 p-1 rounded-xl relative z-10">
               <button (click)="isRegister.set(false)" 
                 class="flex-1 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2"
                 [class]="!isRegister() ? 'bg-white text-primary shadow-lg' : 'text-white/70 hover:text-white hover:bg-white/10'">
                 {{dataService.text().signIn}}
               </button>
               <button (click)="isRegister.set(true)" 
                 class="flex-1 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2"
                 [class]="isRegister() ? 'bg-white text-primary shadow-lg' : 'text-white/70 hover:text-white hover:bg-white/10'">
                 {{dataService.text().register}}
               </button>
             </div>

             <div class="relative z-10 min-h-[320px]">
                @if (!isRegister()) {
                  <form (submit)="onLogin($event)" class="space-y-5 animate-in slide-in-from-left-4 fade-in duration-300">
                     <div class="space-y-1">
                        <label class="text-xs font-bold text-white/80 uppercase tracking-wider ml-1">{{dataService.text().email}}</label>
                        <div class="relative">
                            <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/50">mail</span>
                            <input type="email" [(ngModel)]="loginEmail" name="email" class="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-white/30 focus:ring-2 focus:ring-white/50 focus:border-white/50 focus:bg-black/30 transition-all text-sm" placeholder="you@example.com">
                        </div>
                     </div>
                     
                     <div class="space-y-1">
                        <label class="text-xs font-bold text-white/80 uppercase tracking-wider ml-1">{{dataService.text().password}}</label>
                        <div class="relative">
                            <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/50">lock</span>
                            <input [type]="showLoginPass() ? 'text' : 'password'" [(ngModel)]="loginPass" name="pass" class="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-12 pr-10 text-white placeholder:text-white/30 focus:ring-2 focus:ring-white/50 focus:border-white/50 focus:bg-black/30 transition-all text-sm" placeholder="••••••••">
                            <button type="button" (click)="showLoginPass.set(!showLoginPass())" class="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white">
                                <span class="material-symbols-outlined text-lg">{{showLoginPass() ? 'visibility' : 'visibility_off'}}</span>
                            </button>
                        </div>
                     </div>

                     @if (errorMsg()) {
                       <div class="bg-red-500/20 border border-red-500/50 rounded-lg p-2 text-center">
                           <p class="text-red-200 text-xs font-bold">{{errorMsg()}}</p>
                       </div>
                     }

                     <button type="submit" class="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-500/30 active:scale-95 mt-4">
                       {{dataService.text().signIn}}
                     </button>
                     
                     <div class="text-center mt-6">
                       <p class="text-xs text-white/40 mb-2 font-medium">DEMO ACCOUNTS</p>
                       <div class="flex flex-wrap justify-center gap-2">
                           <button type="button" (click)="fillDemo('guide')" class="px-3 py-1 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 text-[10px] text-white/70 transition-colors">Guide</button>
                           <button type="button" (click)="fillDemo('traveler')" class="px-3 py-1 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 text-[10px] text-white/70 transition-colors">Traveler</button>
                           <button type="button" (click)="fillDemo('provider')" class="px-3 py-1 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 text-[10px] text-white/70 transition-colors">Provider</button>
                       </div>
                     </div>
                  </form>
                }

                @if (isRegister()) {
                  <form (submit)="initiateRegister($event)" class="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300">
                     <div class="relative">
                        <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/50">person</span>
                        <input type="text" [(ngModel)]="regName" name="name" class="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-white/30 focus:ring-2 focus:ring-white/50 focus:border-white/50 focus:bg-black/30 transition-all text-sm" [placeholder]="dataService.text().fullName" required>
                     </div>
                     
                     <div class="relative">
                        <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/50">mail</span>
                        <input type="email" [(ngModel)]="regEmail" name="email" class="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-white/30 focus:ring-2 focus:ring-white/50 focus:border-white/50 focus:bg-black/30 transition-all text-sm" [placeholder]="dataService.text().email" required>
                     </div>

                     <div class="relative">
                        <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/50">key</span>
                        <input [type]="showRegPass() ? 'text' : 'password'" [(ngModel)]="regPass" name="pass" class="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-12 pr-10 text-white placeholder:text-white/30 focus:ring-2 focus:ring-white/50 focus:border-white/50 focus:bg-black/30 transition-all text-sm" [placeholder]="dataService.text().password" required>
                        <button type="button" (click)="showRegPass.set(!showRegPass())" class="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white">
                                <span class="material-symbols-outlined text-lg">{{showRegPass() ? 'visibility' : 'visibility_off'}}</span>
                        </button>
                     </div>
                     
                     <div class="relative">
                        <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/50">lock_reset</span>
                        <input [type]="showConfirmPass() ? 'text' : 'password'" [(ngModel)]="regConfirmPass" name="confirmpass" class="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-12 pr-10 text-white placeholder:text-white/30 focus:ring-2 focus:ring-white/50 focus:border-white/50 focus:bg-black/30 transition-all text-sm" placeholder="Confirm Password" required>
                        <button type="button" (click)="showConfirmPass.set(!showConfirmPass())" class="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white">
                                <span class="material-symbols-outlined text-lg">{{showConfirmPass() ? 'visibility' : 'visibility_off'}}</span>
                        </button>
                     </div>
                     
                     <div class="pt-2">
                       <label class="block text-xs font-bold text-white/80 mb-3 uppercase tracking-wider text-center">{{dataService.text().iAmA}}</label>
                       <div class="grid grid-cols-3 gap-2">
                         <button type="button" (click)="regRole = 'traveler'" [class]="regRole === 'traveler' ? 'bg-blue-500 text-white border-blue-400' : 'bg-black/20 text-white/60 border-transparent hover:bg-black/30'" class="border py-2 rounded-lg text-xs font-bold transition-all flex flex-col items-center gap-1">
                            <span class="material-symbols-outlined text-lg">flight</span>
                            {{dataService.text().roles.traveler}}
                         </button>
                         <button type="button" (click)="regRole = 'guide'" [class]="regRole === 'guide' ? 'bg-green-500 text-white border-green-400' : 'bg-black/20 text-white/60 border-transparent hover:bg-black/30'" class="border py-2 rounded-lg text-xs font-bold transition-all flex flex-col items-center gap-1">
                            <span class="material-symbols-outlined text-lg">map</span>
                            {{dataService.text().roles.guide}}
                         </button>
                         <button type="button" (click)="regRole = 'provider'" [class]="regRole === 'provider' ? 'bg-purple-500 text-white border-purple-400' : 'bg-black/20 text-white/60 border-transparent hover:bg-black/30'" class="border py-2 rounded-lg text-xs font-bold transition-all flex flex-col items-center gap-1">
                            <span class="material-symbols-outlined text-lg">storefront</span>
                            {{dataService.text().roles.provider}}
                         </button>
                       </div>
                     </div>

                     @if (errorMsg()) {
                       <div class="bg-red-500/20 border border-red-500/50 rounded-lg p-2 text-center">
                           <p class="text-red-200 text-xs font-bold">{{errorMsg()}}</p>
                       </div>
                     }

                     <button type="submit" class="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-500/30 active:scale-95 mt-2">
                       {{dataService.text().createAccount}}
                     </button>
                  </form>
                }
             </div>
        </div>
        
        <p class="text-center text-white/40 text-xs mt-6 font-medium">© 2024 CJ Travel Platform</p>
      </div>
    </div>
  `
})
export class LoginComponent {
  dataService = inject(DataService);
  isRegister = signal(false);
  errorMsg = signal('');

  showLoginPass = signal(false);
  showRegPass = signal(false);
  showConfirmPass = signal(false);

  verificationStep = signal<'none' | 'email_code'>('none');
  verificationCode = '';

  loginEmail = '';
  loginPass = '';

  regName = '';
  regEmail = '';
  regPass = '';
  regConfirmPass = ''; 
  regRole: UserRole = 'traveler';

  onLogin(e: Event) {
    e.preventDefault();
    if (!this.loginEmail || !this.loginPass) {
      this.errorMsg.set('Please fill in all fields');
      return;
    }
    const success = this.dataService.login(this.loginEmail, this.loginPass);
    if (!success) {
      this.errorMsg.set('Invalid credentials');
    }
  }

  initiateRegister(e: Event) {
    e.preventDefault();
    this.errorMsg.set('');

    if (!this.regName || !this.regEmail || !this.regPass || !this.regConfirmPass) {
      this.errorMsg.set('Please fill in all fields');
      return;
    }

    if (this.regPass !== this.regConfirmPass) {
        this.errorMsg.set('Passwords do not match');
        return;
    }

    this.verificationCode = '';
    this.verificationStep.set('email_code');
    alert(`Verification code sent to ${this.regEmail}: 1234`); 
  }

  verifyAndRegister() {
      if (this.verificationCode === '1234') {
          const success = this.dataService.register(this.regName, this.regEmail, this.regPass, this.regRole);
          if (!success) {
            this.verificationStep.set('none');
            this.errorMsg.set('Email already registered');
          }
      } else {
          alert('Invalid code. Try 1234.');
      }
  }

  fillDemo(type: 'guide' | 'traveler' | 'provider') {
      if(type === 'guide') {
          this.loginEmail = 'alex@cjtravel.com';
          this.loginPass = '123';
      } else if (type === 'traveler') {
          this.loginEmail = 'sarah@gmail.com';
          this.loginPass = '123';
      } else {
          this.loginEmail = 'contact@nomadcamp.mn';
          this.loginPass = '123';
      }
      
      setTimeout(() => {
          this.onLogin(new Event('submit'));
      }, 100);
  }
}