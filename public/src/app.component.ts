import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from './services/data.service';
import { LoginComponent } from './components/login.component';
import { HomeComponent } from './components/home.component';
import { ProfileComponent } from './components/profile.component';
import { CreatePostComponent } from './components/create-post.component';
import { FormsModule } from '@angular/forms';
import { GoogleGenAI } from "@google/genai";
import { AppNotification } from './types';

// Declare Leaflet global
declare const L: any;

@Component({
  selector: 'app-root',
  imports: [CommonModule, LoginComponent, HomeComponent, ProfileComponent, CreatePostComponent, FormsModule],
  template: `
    @if (!dataService.currentUser()) {
      <app-login></app-login>
    } @else {
      <!-- OFFLINE BANNER -->
      @if (!dataService.isOnline()) {
          <div class="bg-red-500 text-white text-xs font-bold text-center py-2 sticky top-0 z-[100] animate-pulse">
              {{dataService.text().offlineMode}}: {{dataService.text().offlineDesc}}
          </div>
      }

      <!-- Top Navigation Bar -->
      <header class="sticky z-40 bg-white/95 dark:bg-[#101922]/95 border-b border-gray-200 dark:border-gray-800 transition-colors backdrop-blur-md" [style.top]="dataService.isOnline() ? '0' : '32px'">
        <div class="max-w-xl mx-auto flex flex-col">
            <!-- Top Row: Logo & Actions -->
            <div class="flex items-center px-4 py-3 justify-between">
              <div class="flex items-center gap-2" (click)="switchView('feed')">
                <div class="bg-primary/10 p-1.5 rounded-lg cursor-pointer">
                    <span class="material-symbols-outlined text-primary text-2xl">explore</span>
                </div>
                <h1 class="text-gray-900 dark:text-white text-xl font-bold tracking-tight cursor-pointer">{{dataService.text().appName}}</h1>
              </div>
              
              <div class="flex gap-1 items-center relative">
                 <button (click)="openTranslator()" [class.opacity-50]="!dataService.isOnline()" class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 dark:text-gray-400 transition-colors">
                    <span class="material-symbols-outlined text-[24px]">translate</span>
                 </button>
                 <button (click)="dataService.toggleOverlay('chat')" class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 dark:text-gray-400 transition-colors relative">
                    <span class="material-symbols-outlined text-[24px]">chat_bubble</span>
                    <span class="absolute top-1.5 right-1.5 size-2 bg-green-500 rounded-full border border-white dark:border-[#101922]"></span>
                 </button>
                 <button (click)="dataService.toggleOverlay('notifications')" [class.text-primary]="dataService.activeOverlay() === 'notifications'" [class.bg-gray-100]="dataService.activeOverlay() === 'notifications'" class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 dark:text-gray-400 transition-colors relative">
                    <span class="material-symbols-outlined text-[24px]">notifications</span>
                    @if (dataService.hasUnreadNotifications()) {
                        <span class="absolute top-2 right-2 size-2 bg-red-500 rounded-full border border-white dark:border-[#101922] animate-pulse"></span>
                    }
                 </button>
              </div>
            </div>

            <!-- Integrated Search Bar (Only visible on Feed) -->
            @if (currentView() === 'feed' && !dataService.viewingUser()) {
                <div class="px-4 pb-3 animate-in slide-in-from-top-2 duration-200">
                    <div class="flex w-full items-center rounded-xl h-10 bg-gray-100 dark:bg-slate-800 border border-transparent focus-within:border-primary/30 focus-within:bg-white dark:focus-within:bg-slate-900 transition-all">
                        <div class="text-gray-400 flex items-center justify-center pl-3">
                            <span class="material-symbols-outlined text-lg">search</span>
                        </div>
                        <input class="w-full bg-transparent border-none text-gray-900 dark:text-white focus:ring-0 placeholder:text-gray-400 px-2 text-sm font-medium h-full" [placeholder]="dataService.text().search" />
                    </div>
                </div>
            }
        </div>
      </header>

      <!-- OVERLAYS CONTAINER -->
      <div class="relative z-[100]">

         <!-- ADMIN APPROVALS & REPORTS OVERLAY -->
         @if (dataService.activeOverlay() === 'approvals') {
           <div class="fixed inset-0 bg-white dark:bg-[#101922] z-[150] flex flex-col animate-in slide-in-from-bottom duration-200">
              <div class="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-[#101922] sticky top-0 z-10">
                 <h2 class="text-lg font-bold dark:text-white">{{dataService.text().approvals}}</h2>
                 <button (click)="dataService.activeOverlay.set(null)" class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800">
                    <span class="material-symbols-outlined dark:text-white">close</span>
                 </button>
              </div>
              
              <!-- Tabs -->
              <div class="px-4 mt-2">
                 <div class="flex bg-gray-100 dark:bg-slate-800 rounded-lg p-1">
                     <button (click)="adminTab.set('users')" [class.bg-white]="adminTab() === 'users'" [class.dark:bg-slate-700]="adminTab() === 'users'" class="flex-1 py-2 rounded-md text-sm font-bold transition-all relative">
                         {{dataService.text().pendingUsers}}
                         @if (dataService.pendingUsers().length > 0) {
                            <span class="ml-1 bg-red-500 text-white rounded-full px-1.5 py-0.5 text-[10px]">{{dataService.pendingUsers().length}}</span>
                         }
                     </button>
                     <button (click)="adminTab.set('reports')" [class.bg-white]="adminTab() === 'reports'" [class.dark:bg-slate-700]="adminTab() === 'reports'" class="flex-1 py-2 rounded-md text-sm font-bold transition-all relative">
                         {{dataService.text().reportedPosts}}
                         @if (dataService.reportedPosts().length > 0) {
                            <span class="ml-1 bg-orange-500 text-white rounded-full px-1.5 py-0.5 text-[10px]">{{dataService.reportedPosts().length}}</span>
                         }
                     </button>
                 </div>
              </div>

              <div class="flex-1 overflow-y-auto p-4 space-y-4">
                 <!-- USERS TAB -->
                 @if (adminTab() === 'users') {
                     @if (dataService.pendingUsers().length === 0) {
                         <div class="flex flex-col items-center justify-center py-20 text-gray-400">
                             <span class="material-symbols-outlined text-6xl mb-4 opacity-30">verified_user</span>
                             <p class="font-medium">{{dataService.text().noApprovals}}</p>
                         </div>
                     }
                     @for (user of dataService.pendingUsers(); track user.id) {
                         <div class="bg-gray-50 dark:bg-slate-800 p-4 rounded-2xl flex items-start gap-4 border border-gray-100 dark:border-gray-700">
                             <img [src]="user.avatar" class="size-14 rounded-full object-cover shrink-0">
                             <div class="flex-1 min-w-0">
                                 <div class="flex justify-between items-start">
                                     <div>
                                         <h3 class="font-bold text-gray-900 dark:text-white">{{user.name}}</h3>
                                         <p class="text-xs text-gray-500 dark:text-gray-400">{{user.email}}</p>
                                     </div>
                                     <span class="px-2 py-1 rounded bg-yellow-100 text-yellow-700 text-[10px] font-bold uppercase">{{user.role}}</span>
                                 </div>
                                 
                                 <div class="flex gap-2 mt-4">
                                     <button (click)="dataService.rejectUser(user.id)" class="flex-1 py-2 bg-white dark:bg-slate-700 text-red-500 border border-red-100 dark:border-red-900/30 rounded-lg text-sm font-bold hover:bg-red-50 dark:hover:bg-red-900/10">{{dataService.text().reject}}</button>
                                     <button (click)="dataService.approveUser(user.id)" class="flex-1 py-2 bg-primary text-white rounded-lg text-sm font-bold shadow-lg shadow-primary/30 hover:bg-blue-600">{{dataService.text().approve}}</button>
                                 </div>
                             </div>
                         </div>
                     }
                 }

                 <!-- REPORTS TAB -->
                 @if (adminTab() === 'reports') {
                     @if (dataService.reportedPosts().length === 0) {
                         <div class="flex flex-col items-center justify-center py-20 text-gray-400">
                             <span class="material-symbols-outlined text-6xl mb-4 opacity-30">gavel</span>
                             <p class="font-medium">{{dataService.text().noReports}}</p>
                         </div>
                     }
                     @for (post of dataService.reportedPosts(); track post.id) {
                         <div class="bg-gray-50 dark:bg-slate-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
                             <div class="flex items-center gap-2 mb-3">
                                 <span class="material-symbols-outlined text-orange-500">flag</span>
                                 <span class="text-sm font-bold text-gray-900 dark:text-white">Reported by {{post.reports.length}} users</span>
                             </div>
                             
                             <!-- REASONS LIST -->
                             <div class="mb-3 pl-2 border-l-2 border-orange-200 dark:border-orange-900">
                                 @for (report of post.reports; track report.reporterId) {
                                     <div class="text-xs text-gray-500 dark:text-gray-400">
                                         • <span class="font-medium">{{report.reason}}</span>
                                     </div>
                                 }
                             </div>

                             <!-- Post Preview -->
                             <div class="flex gap-3 mb-4 bg-white dark:bg-black/20 p-2 rounded-lg">
                                 @if (post.mediaUrl) {
                                     <img [src]="post.mediaUrl" class="size-16 rounded-lg object-cover shrink-0">
                                 }
                                 <div class="flex-1 min-w-0">
                                     <p class="text-xs text-gray-500 dark:text-gray-400 font-bold">{{post.userName}}</p>
                                     <p class="text-sm text-gray-800 dark:text-gray-200 line-clamp-2">{{post.content}}</p>
                                 </div>
                             </div>

                             <div class="flex gap-2">
                                 <button (click)="dataService.warnPost(post.id, dataService.text().warningIssued)" class="flex-1 py-2 bg-yellow-100 text-yellow-700 rounded-lg text-sm font-bold hover:bg-yellow-200">{{dataService.text().warn}}</button>
                                 <button (click)="dataService.deletePost(post.id)" class="flex-1 py-2 bg-red-100 text-red-600 rounded-lg text-sm font-bold hover:bg-red-200">{{dataService.text().delete}}</button>
                                 <button (click)="dataService.dismissReports(post.id)" class="flex-1 py-2 bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-gray-300 rounded-lg text-sm font-bold">{{dataService.text().dismiss}}</button>
                             </div>
                         </div>
                     }
                 }
              </div>
           </div>
         }

         <!-- LANG SELECTOR -->
         @if (dataService.activeOverlay() === 'lang_selector') {
           <div class="fixed inset-0 bg-white dark:bg-[#101922] z-[150] flex flex-col animate-in slide-in-from-bottom duration-200">
              <div class="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
                 <button (click)="dataService.activeOverlay.set('translator')" class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800">
                    <span class="material-symbols-outlined dark:text-white">arrow_back</span>
                 </button>
                 <input type="text" [(ngModel)]="langSearchQuery" class="flex-1 bg-gray-100 dark:bg-slate-800 border-none rounded-xl p-3 focus:ring-2 focus:ring-primary dark:text-white" [placeholder]="dataService.text().searchLanguage" autofocus>
              </div>
              <div class="flex-1 overflow-y-auto">
                 @for (lang of filteredLanguages(); track lang.code) {
                   <button (click)="selectLanguage(lang.code)" class="w-full text-left px-6 py-4 border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-900 dark:text-white font-medium flex justify-between items-center">
                      {{lang.name}}
                      @if (lang.code === (dataService.langSelectorContext() === 'source' ? sourceLang() : targetLang())) {
                          <span class="material-symbols-outlined text-primary">check</span>
                      }
                   </button>
                 }
              </div>
           </div>
         }

         <!-- STORY VIEWER -->
         @if (dataService.activeOverlay() === 'story_viewer' && dataService.activeStory(); as story) {
            <div (touchstart)="onTouchStart($event)" (touchend)="onTouchEnd($event)" class="fixed inset-0 bg-black z-[150] flex flex-col items-center justify-center animate-in fade-in duration-300">
                <div class="absolute top-4 left-4 right-4 h-1 bg-gray-700 rounded-full overflow-hidden z-20">
                    <div class="h-full bg-white animate-[progress_3s_linear_forwards]"></div>
                </div>
                <div class="absolute top-8 left-4 right-4 flex justify-between items-center z-50">
                   <div class="flex items-center gap-2 cursor-pointer group" (click)="navigateToProfileFromStory(story.userId, $event)">
                       <img [src]="story.avatar" class="size-8 rounded-full border border-white/50 group-hover:border-white transition-colors">
                       <div class="flex flex-col">
                           <span class="text-white font-bold text-sm shadow-sm leading-none group-hover:underline">{{story.userName}}</span>
                           <span class="text-white/60 text-[10px]">{{story.createdAt | date:'shortTime'}}</span>
                       </div>
                   </div>
                   <button (click)="closeStory($event)" class="text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors">
                       <span class="material-symbols-outlined text-3xl font-bold">close</span>
                   </button>
                </div>
                <div (click)="prevStory()" class="absolute left-0 top-0 bottom-0 w-1/4 z-30"></div>
                <div (click)="nextStory()" class="absolute right-0 top-0 bottom-0 w-1/4 z-30"></div>
                <img [src]="story.image" [style.filter]="story.filter" class="w-full h-full object-contain">
                <div class="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent z-40 flex flex-col gap-3 pointer-events-auto">
                    <div class="flex justify-between items-end w-full">
                        <div class="flex items-center gap-2">
                            @if (story.userId === dataService.currentUser()?.id || story.isPublicViews) {
                                <div class="flex items-center gap-1 text-white/90 bg-black/40 px-3 py-1.5 rounded-full">
                                    <span class="material-symbols-outlined text-sm">visibility</span>
                                    <span class="text-xs font-bold">{{story.views}}</span>
                                </div>
                            }
                        </div>
                    </div>
                    <div class="flex items-center gap-3 w-full">
                        <div class="flex-1 relative h-12">
                            <input #storyReplyInput type="text" placeholder="Send message..." class="w-full h-full rounded-full bg-transparent border border-white/50 text-white placeholder:text-white/70 px-4 pr-12 focus:ring-2 focus:ring-white/50 focus:border-white text-sm" (keyup.enter)="sendStoryReply(story.id, storyReplyInput)">
                            <button (click)="sendStoryReply(story.id, storyReplyInput)" class="absolute right-1 top-1 bottom-1 text-white hover:text-primary hover:bg-white p-2 rounded-full transition-all">
                                <span class="material-symbols-outlined text-xl">send</span>
                            </button>
                        </div>
                        <button (click)="dataService.toggleStoryLike(story.id)" class="group flex items-center justify-center shrink-0">
                            <div class="p-3 rounded-full transition-all active:scale-95 border border-white/30" [class]="story.likedByViewer ? 'bg-red-500 text-white border-red-500' : 'bg-transparent text-white hover:bg-white/20'">
                                <span class="material-symbols-outlined text-2xl" [class.fill-current]="story.likedByViewer">favorite</span>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
         }
          
         <!-- TRANSLATOR OVERLAY WITH OCR -->
         @if (dataService.activeOverlay() === 'translator') {
           <div class="fixed inset-0 bg-gray-50 dark:bg-[#0b1219] flex flex-col animate-in slide-in-from-bottom duration-300">
              <div class="p-4 flex items-center justify-between bg-white dark:bg-[#101922] shadow-sm">
                  <button (click)="dataService.activeOverlay.set(null)" class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
                      <span class="material-symbols-outlined text-2xl dark:text-white">close</span>
                  </button>
                  <h2 class="text-lg font-bold dark:text-white">{{dataService.text().translatorTitle}}</h2>
                  <button (click)="toggleAutoSpeak()" [class.text-primary]="autoSpeak()" class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
                      <span class="material-symbols-outlined text-2xl">{{autoSpeak() ? 'volume_up' : 'volume_off'}}</span>
                  </button>
              </div>

              <div class="flex-1 flex flex-col p-4 gap-4 overflow-y-auto">
                  @if (!dataService.isOnline()) {
                      <div class="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl text-center text-red-500 dark:text-red-300">
                          <span class="material-symbols-outlined text-3xl mb-2">wifi_off</span>
                          <p class="font-bold">Offline</p>
                          <p class="text-xs">Translator requires internet connection.</p>
                      </div>
                  } @else {
                      <div class="bg-white dark:bg-[#101922] p-2 rounded-full shadow-sm flex items-center justify-between mx-auto w-full max-w-sm border border-gray-100 dark:border-gray-800">
                          <button (click)="dataService.openLangSelector('source')" class="flex-1 text-center font-bold text-gray-900 dark:text-white text-sm py-2 px-4 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 truncate">
                              {{getLangName(sourceLang())}}
                          </button>
                          <button (click)="swapLanguages()" class="p-2 rounded-full bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors text-primary">
                            <span class="material-symbols-outlined">sync_alt</span>
                          </button>
                          <button (click)="dataService.openLangSelector('target')" class="flex-1 text-center font-bold text-gray-900 dark:text-white text-sm py-2 px-4 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 truncate">
                              {{getLangName(targetLang())}}
                          </button>
                      </div>

                      <!-- Source Input -->
                      <div class="bg-white dark:bg-[#101922] rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col min-h-[160px] relative">
                          <div class="flex justify-between items-center mb-2">
                              <span class="text-xs font-bold text-gray-400 uppercase tracking-wider">{{getLangName(sourceLang())}}</span>
                              <button *ngIf="sourceText()" (click)="sourceText.set('')" class="text-gray-400 hover:text-red-500">
                                  <span class="material-symbols-outlined text-lg">close</span>
                              </button>
                          </div>
                          
                          <!-- Image Preview if translation is from Image -->
                          @if (ocrImagePreview()) {
                              <div class="w-24 h-24 mb-2 rounded-lg overflow-hidden border border-gray-200 relative group">
                                  <img [src]="ocrImagePreview()" class="w-full h-full object-cover">
                                  <button (click)="ocrImagePreview.set(null)" class="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1"><span class="material-symbols-outlined text-xs">close</span></button>
                              </div>
                          }

                          <textarea 
                              [(ngModel)]="sourceText" 
                              (keyup.enter)="translateWithGemini()"
                              [placeholder]="dataService.text().typeToTranslate" 
                              class="w-full bg-transparent border-none resize-none text-2xl p-0 focus:ring-0 text-gray-900 dark:text-white placeholder:text-gray-300 h-full font-medium"
                          ></textarea>

                          <!-- Action Buttons Inside Text Area -->
                          <div class="absolute bottom-4 right-4 flex gap-2">
                              <!-- IMAGE UPLOAD / CAMERA -->
                              <label class="p-2 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-blue-100 hover:text-blue-600 cursor-pointer transition-colors" title="Translate from Image">
                                  <input type="file" accept="image/*" class="hidden" (change)="handleImageTranslation($event)">
                                  <span class="material-symbols-outlined text-xl">add_a_photo</span>
                              </label>
                          </div>
                      </div>

                      <!-- Target Output -->
                      <div class="bg-primary text-white rounded-3xl p-6 shadow-lg shadow-primary/20 flex flex-col min-h-[160px] relative overflow-hidden transition-all" [class.opacity-50]="!translatedText()">
                          <div class="absolute top-0 right-0 p-8 opacity-10">
                              <span class="material-symbols-outlined text-9xl">translate</span>
                          </div>
                          <div class="flex justify-between items-center mb-2 relative z-10">
                              <span class="text-xs font-bold text-white/80 uppercase tracking-wider">{{getLangName(targetLang())}}</span>
                          </div>
                          <div class="flex-1 flex items-center relative z-10">
                              @if (isTranslating()) {
                                  <div class="flex items-center gap-2">
                                      <span class="material-symbols-outlined animate-spin text-2xl">refresh</span>
                                      <span class="text-xl font-medium">{{dataService.text().translating}}</span>
                                  </div>
                              } @else if (translatedText()) {
                                  <p class="text-3xl font-bold leading-tight">{{translatedText()}}</p>
                              } @else {
                                  <p class="text-white/40 text-xl font-medium italic">Translation...</p>
                              }
                          </div>
                          <div class="flex justify-end mt-2 relative z-10 items-center gap-2">
                            <button (click)="playTranslation()" [disabled]="!translatedText()" class="bg-white/20 hover:bg-white/30 p-3 rounded-full transition-colors disabled:opacity-50">
                                <span class="material-symbols-outlined text-2xl">volume_up</span>
                            </button>
                          </div>
                      </div>

                      <!-- Controls -->
                      <div class="mt-auto pb-6 flex items-center justify-center gap-6">
                          <button (click)="toggleRecording()" class="size-20 rounded-full flex items-center justify-center shadow-xl transition-transform hover:scale-105 active:scale-95" [class]="isListening() ? 'bg-red-500 animate-pulse text-white' : 'bg-white dark:bg-[#101922] text-primary'">
                              <span class="material-symbols-outlined text-4xl">{{isListening() ? 'mic_off' : 'mic'}}</span>
                          </button>

                          <button (click)="translateWithGemini()" [disabled]="!sourceText() && !ocrImagePreview()" class="h-16 px-8 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold text-lg shadow-xl hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 flex items-center gap-2">
                              <span>Translate</span>
                              <span class="material-symbols-outlined">arrow_forward</span>
                          </button>
                      </div>
                  }
              </div>
           </div>
         }

         <!-- CALL, CHAT, NOTIFICATIONS OVERLAYS (Keep Existing) -->
         @if (dataService.activeOverlay() === 'call') {
            <div class="fixed inset-0 bg-gray-900 z-[200] flex flex-col items-center justify-between py-12 animate-in fade-in duration-300">
                @if (dataService.callType() === 'video') {
                     <img [src]="dataService.activeChatUser()?.avatar" class="absolute inset-0 w-full h-full object-cover opacity-50">
                     <div class="absolute inset-0 bg-black/30"></div>
                }
                <div class="relative z-10 flex flex-col items-center mt-12">
                     <div class="size-32 rounded-full border-4 border-white/20 p-1 mb-6 relative">
                        <img [src]="dataService.activeChatUser()?.avatar" class="w-full h-full rounded-full object-cover">
                        <span class="absolute bottom-2 right-2 size-5 bg-green-500 border-2 border-gray-900 rounded-full"></span>
                     </div>
                     <h2 class="text-3xl font-bold text-white mb-2">{{dataService.activeChatUser()?.name}}</h2>
                     @if (dataService.callStatus() === 'calling') { <p class="text-gray-300 animate-pulse">{{dataService.text().calling}}</p> } 
                     @else { <p class="text-green-400 font-bold text-xl">{{formatCallTime()}}</p> }
                </div>
                <div class="relative z-10 flex items-center gap-8 mb-8">
                     <button (click)="endCall()" class="size-20 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 shadow-xl hover:scale-105 transition-transform">
                        <span class="material-symbols-outlined text-4xl">call_end</span>
                     </button>
                </div>
            </div>
         }

         @if (dataService.activeOverlay() === 'chat') {
           <div class="fixed inset-0 bg-white dark:bg-[#101922] flex flex-col animate-in slide-in-from-right duration-300">
              <div class="p-3 flex items-center justify-between border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-[#101922] sticky top-0 z-20">
                  <div class="flex items-center gap-2">
                    <button (click)="closeChatOverlay()" class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
                        <span class="material-symbols-outlined text-2xl dark:text-white">arrow_back</span>
                    </button>
                    @if (dataService.activeChatUser(); as chatUser) {
                       <div class="flex items-center gap-2 cursor-pointer hover:opacity-80">
                          <img [src]="chatUser.avatar" class="size-9 rounded-full object-cover border border-gray-100 dark:border-gray-700">
                          <div class="flex flex-col">
                            <h2 class="text-sm font-bold dark:text-white leading-tight">{{chatUser.name}}</h2>
                            <p class="text-[10px] text-green-500 font-bold">Online</p>
                          </div>
                       </div>
                    } @else { <h2 class="text-xl font-bold dark:text-white">{{dataService.text().chatTitle}}</h2> }
                  </div>
              </div>
              <div class="flex-1 overflow-y-auto bg-gray-50 dark:bg-[#151f2b] relative" [style.background-image]="dataService.chatBackground()" [style.background-size]="'cover'">
                @if (dataService.activeChatUser(); as chatUser) {
                    <div class="p-4 space-y-4 pb-20 min-h-full">
                        @for (msg of currentChatMessages(); track msg.id) {
                            @let isMe = msg.senderId === dataService.currentUser()?.id;
                            <div class="flex items-end gap-2 group" [class.justify-end]="isMe">
                                @if (!isMe) { <img [src]="chatUser.avatar" class="size-8 rounded-full object-cover mb-1 border border-white dark:border-gray-700 shadow-sm"> }
                                <div [class]="isMe ? 'bg-primary text-white rounded-br-none shadow-md shadow-primary/20' : 'bg-white dark:bg-surface-dark rounded-bl-none shadow-sm border border-gray-100 dark:border-gray-800'" class="p-3 rounded-2xl max-w-[80%] min-w-[60px]">
                                    @if (msg.type === 'text') { <p class="text-sm" [class.text-gray-800]="!isMe" [class.dark:text-white]="!isMe">{{msg.text}}</p> }
                                    @else if (msg.type === 'image') { <img [src]="msg.mediaUrl" class="rounded-lg max-w-full h-auto max-h-48 cursor-pointer"> }
                                    <span class="text-[9px] opacity-60 block text-right mt-1">{{msg.timestamp | date:'shortTime'}}</span>
                                </div>
                            </div>
                        }
                    </div>
                    <div class="fixed bottom-0 left-0 right-0 p-3 bg-white dark:bg-[#101922] border-t border-gray-100 dark:border-gray-800 bg-opacity-95">
                        <div class="flex items-center gap-2">
                            <div class="flex-1 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center px-4 py-2 border border-transparent focus-within:border-primary/30 transition-all">
                                <input type="text" [(ngModel)]="chatInput" (keyup.enter)="sendMessage()" [placeholder]="dataService.text().message + '...'" class="flex-1 bg-transparent border-none focus:ring-0 text-sm dark:text-white p-0">
                            </div>
                            <button (click)="sendMessage()" class="p-3 bg-primary text-white rounded-full flex items-center justify-center shadow-lg shadow-primary/30 hover:scale-105 transition-transform disabled:opacity-50">
                                <span class="material-symbols-outlined text-xl block">send</span>
                            </button>
                        </div>
                    </div>
                }
              </div>
           </div>
         }

         @if (dataService.activeOverlay() === 'notifications') {
           <div class="absolute top-[60px] right-4 w-80 bg-white dark:bg-[#101922] rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden z-[101] animate-in fade-in slide-in-from-top-2 duration-200">
              <div class="p-3 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-slate-800">
                <h3 class="font-bold text-sm dark:text-white">{{dataService.text().notifications}}</h3>
                <button class="text-gray-400 hover:text-gray-600" (click)="dataService.activeOverlay.set(null)"><span class="material-symbols-outlined text-lg">close</span></button>
              </div>
              <div class="max-h-80 overflow-y-auto">
                 @for (notif of dataService.myNotifications(); track notif.id) {
                     <div (click)="handleNotificationClick(notif)" class="p-3 hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer flex gap-3 items-start border-b border-gray-50 dark:border-gray-700/50 relative" [class.bg-blue-50]="!notif.isRead">
                        @if (!notif.isRead) { <div class="absolute top-4 right-3 size-2 bg-blue-500 rounded-full"></div> }
                        <div class="shrink-0 relative">
                            <img [src]="notif.triggerUserAvatar" class="size-10 rounded-full object-cover">
                        </div>
                        <div class="flex-1 min-w-0">
                           <p class="text-sm dark:text-gray-200 leading-tight">
                               <span class="font-bold">{{notif.triggerUserName}}</span> {{notif.text}}
                           </p>
                           <span class="text-[10px] text-gray-400 mt-1 block">{{notif.createdAt | date:'shortTime'}}</span>
                        </div>
                     </div>
                 }
              </div>
           </div>
         }
      </div>

      <!-- Main Content -->
      <main class="flex-1 pb-24 max-w-xl mx-auto w-full min-h-screen" (click)="closeOverlay()">
        @if (dataService.viewingUser()) {
          <app-profile></app-profile>
        } @else {
            @if (currentView() === 'feed') {
                <app-home (onUserSelect)="handleUserNavigation($event)"></app-home>
            }
            @if (currentView() === 'guides') {
               <div class="pb-4 min-h-screen">
                  <div class="pt-4 px-4 sticky top-[60px] z-20 bg-background-light/95 dark:bg-background-dark/95 pb-2">
                      <div class="flex items-center justify-between pb-3">
                        <h2 class="text-primary dark:text-primary text-lg font-bold flex items-center gap-2">
                             <span class="material-symbols-outlined">map</span>
                             {{dataService.text().topGuides}}
                        </h2>
                        <!-- LIST / MAP TOGGLE -->
                        <div class="flex bg-gray-200 dark:bg-slate-800 rounded-lg p-1">
                            <button (click)="viewMode.set('list')" [class.bg-white]="viewMode() === 'list'" [class.dark:bg-surface-dark]="viewMode() === 'list'" [class.shadow-sm]="viewMode() === 'list'" class="px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1">
                                <span class="material-symbols-outlined text-sm">list</span> {{dataService.text().viewList}}
                            </button>
                            <button (click)="viewMode.set('map')" [class.bg-white]="viewMode() === 'map'" [class.dark:bg-surface-dark]="viewMode() === 'map'" [class.shadow-sm]="viewMode() === 'map'" class="px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1">
                                <span class="material-symbols-outlined text-sm">map</span> {{dataService.text().viewMap}}
                            </button>
                        </div>
                      </div>
                  </div>

                  @if (viewMode() === 'list') {
                      <div class="grid grid-cols-2 gap-4 px-4">
                        @for (guide of guidesList(); track guide.id) {
                            <div (click)="handleUserNavigation(guide.id)" class="bg-white dark:bg-surface-dark p-4 rounded-2xl text-center shadow-sm border border-gray-100 dark:border-gray-800 cursor-pointer hover:border-primary transition-colors relative group overflow-hidden">
                                <img [src]="guide.avatar" class="size-20 rounded-full mx-auto mb-3 border-4 border-gray-50 dark:border-[#1a2634] object-cover shadow-sm">
                                <h3 class="font-bold dark:text-white text-sm mb-1 truncate">{{guide.name}}</h3>
                                <p class="text-xs text-gray-400 flex items-center justify-center gap-1 mb-2">
                                    <span class="material-symbols-outlined text-[10px]">location_on</span> {{guide.location}}
                                </p>
                                <span class="text-[10px] text-primary bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Guide</span>
                            </div>
                        }
                      </div>
                  } @else {
                      <!-- REAL LEAFLET MAP VIEW -->
                      <div class="px-4 h-[70vh] relative">
                          <div id="guides-map" class="w-full h-full rounded-3xl overflow-hidden relative border border-gray-200 dark:border-gray-700 shadow-inner z-0"></div>
                          
                          <!-- MAP SEARCH BAR -->
                          <div class="absolute top-4 left-4 right-16 z-10">
                              <div class="bg-white dark:bg-surface-dark rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 flex items-center p-2">
                                  <span class="material-symbols-outlined text-gray-400 ml-2">search</span>
                                  <input type="text" [(ngModel)]="mapSearchQuery" (keyup.enter)="searchMap()" placeholder="Find place..." class="w-full bg-transparent border-none text-sm focus:ring-0">
                              </div>
                          </div>

                          <!-- Locate Me Button -->
                          <button (click)="locateMe()" class="absolute bottom-6 right-6 z-10 bg-white dark:bg-surface-dark p-3 rounded-full shadow-lg border border-gray-100 dark:border-gray-600 text-primary hover:bg-gray-50 active:scale-95 transition-transform">
                             <span class="material-symbols-outlined">my_location</span>
                          </button>
                      </div>
                  }
               </div>
            }
            @if (currentView() === 'providers') {
               <div class="pb-4 min-h-screen">
                  <div class="pt-4 px-4 sticky top-[60px] z-20 bg-background-light/95 dark:bg-background-dark/95 pb-2">
                      <div class="flex items-center justify-between pb-3">
                        <h2 class="text-[#0d141b] dark:text-white text-lg font-bold flex items-center gap-2">
                             <span class="material-symbols-outlined text-purple-500">storefront</span>
                             {{dataService.text().providers}}
                        </h2>
                        <!-- LIST / MAP TOGGLE -->
                        <div class="flex bg-gray-200 dark:bg-slate-800 rounded-lg p-1">
                            <button (click)="viewMode.set('list')" [class.bg-white]="viewMode() === 'list'" [class.dark:bg-surface-dark]="viewMode() === 'list'" [class.shadow-sm]="viewMode() === 'list'" class="px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1">
                                <span class="material-symbols-outlined text-sm">list</span> {{dataService.text().viewList}}
                            </button>
                            <button (click)="viewMode.set('map')" [class.bg-white]="viewMode() === 'map'" [class.dark:bg-surface-dark]="viewMode() === 'map'" [class.shadow-sm]="viewMode() === 'map'" class="px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1">
                                <span class="material-symbols-outlined text-sm">map</span> {{dataService.text().viewMap}}
                            </button>
                        </div>
                      </div>
                  </div>

                  @if (viewMode() === 'list') {
                      <div class="grid grid-cols-2 gap-4 px-4">
                        @for (provider of providersList(); track provider.id) {
                          <div (click)="handleUserNavigation(provider.id)" class="bg-white dark:bg-surface-dark p-4 rounded-2xl text-center shadow-sm border border-gray-100 dark:border-gray-800 cursor-pointer hover:border-purple-500 transition-colors relative group overflow-hidden">
                                <img [src]="provider.avatar" class="size-20 rounded-full mx-auto mb-3 border-4 border-gray-50 dark:border-[#1a2634] object-cover shadow-sm">
                                <h3 class="font-bold dark:text-white text-sm mb-1 truncate">{{provider.name}}</h3>
                                <p class="text-xs text-gray-400 flex items-center justify-center gap-1 mb-2">
                                    <span class="material-symbols-outlined text-[10px]">location_on</span> {{provider.location}}
                                </p>
                                <span class="text-[10px] text-purple-600 bg-purple-50 dark:bg-purple-900/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Provider</span>
                          </div>
                        }
                      </div>
                  } @else {
                      <!-- REAL LEAFLET MAP VIEW FOR PROVIDERS -->
                       <div class="px-4 h-[70vh] relative">
                          <div id="providers-map" class="w-full h-full rounded-3xl overflow-hidden relative border border-gray-200 dark:border-gray-700 shadow-inner z-0"></div>
                          
                          <!-- MAP SEARCH BAR -->
                          <div class="absolute top-4 left-4 right-16 z-10">
                              <div class="bg-white dark:bg-surface-dark rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 flex items-center p-2">
                                  <span class="material-symbols-outlined text-gray-400 ml-2">search</span>
                                  <input type="text" [(ngModel)]="mapSearchQuery" (keyup.enter)="searchMap()" placeholder="Find place..." class="w-full bg-transparent border-none text-sm focus:ring-0">
                              </div>
                          </div>

                          <!-- Locate Me Button -->
                          <button (click)="locateMe()" class="absolute bottom-6 right-6 z-10 bg-white dark:bg-surface-dark p-3 rounded-full shadow-lg border border-gray-100 dark:border-gray-600 text-purple-600 hover:bg-gray-50 active:scale-95 transition-transform">
                             <span class="material-symbols-outlined">my_location</span>
                          </button>
                       </div>
                  }
               </div>
            }
        }
      </main>

      @if (showCreatePost()) { <app-create-post (close)="showCreatePost.set(false)" (postCreated)="showCreatePost.set(false)"></app-create-post> }

      <nav class="fixed bottom-6 left-4 right-4 z-50">
        <div class="max-w-md mx-auto bg-white/95 dark:bg-[#1a2634]/95 rounded-2xl shadow-2xl shadow-blue-900/10 border border-white/20 dark:border-gray-700/50 p-2 flex justify-between items-center px-6">
          <button (click)="switchView('feed')" [class.text-primary]="currentView() === 'feed' && !dataService.viewingUser()" class="flex flex-col items-center gap-1 transition-colors text-gray-400 p-2 hover:text-primary">
            <span class="material-symbols-outlined text-3xl" [class.fill-current]="currentView() === 'feed' && !dataService.viewingUser()">newspaper</span>
          </button>
          <button (click)="switchView('guides')" [class.text-primary]="currentView() === 'guides' && !dataService.viewingUser()" class="flex flex-col items-center gap-1 transition-colors text-gray-400 p-2 hover:text-primary">
            <span class="material-symbols-outlined text-3xl" [class.fill-current]="currentView() === 'guides' && !dataService.viewingUser()">map</span>
          </button>
          
          <!-- ADMIN APPROVALS BUTTON (Replaces Add Post) -->
          @if (dataService.currentUser()?.role === 'admin') {
              <button (click)="dataService.toggleOverlay('approvals')" class="bg-gradient-to-tr from-yellow-500 to-orange-500 text-white rounded-xl size-12 flex items-center justify-center shadow-lg shadow-orange-500/40 hover:scale-105 active:scale-95 transition-all relative">
                 <span class="material-symbols-outlined text-3xl">admin_panel_settings</span>
                 @if (dataService.pendingUsers().length + dataService.reportedPosts().length > 0) {
                     <span class="absolute -top-1 -right-1 size-5 bg-red-600 rounded-full text-[10px] font-bold flex items-center justify-center border-2 border-white dark:border-gray-900 animate-pulse">
                         {{dataService.pendingUsers().length + dataService.reportedPosts().length}}
                     </span>
                 }
              </button>
          } @else {
              <!-- ORIGINAL ADD POST BUTTON -->
              <button (click)="openCreatePost()" [class.opacity-50]="dataService.currentUser()?.status === 'pending'" class="bg-gradient-to-tr from-primary to-blue-400 text-white rounded-xl size-12 flex items-center justify-center shadow-lg shadow-blue-500/40 hover:scale-105 active:scale-95 transition-all">
                <span class="material-symbols-outlined text-3xl">add</span>
              </button>
          }

          <button (click)="switchView('providers')" [class.text-primary]="currentView() === 'providers' && !dataService.viewingUser()" class="flex flex-col items-center gap-1 transition-colors text-gray-400 p-2 hover:text-primary">
            <span class="material-symbols-outlined text-3xl" [class.fill-current]="currentView() === 'providers' && !dataService.viewingUser()">storefront</span>
          </button>
          <button (click)="goToMyProfile()" [class.text-primary]="dataService.viewingUser()?.id === dataService.currentUser()?.id" class="flex flex-col items-center gap-1 transition-colors text-gray-400 p-2 hover:text-primary">
             @if(dataService.currentUser()?.avatar) {
                 <img [src]="dataService.currentUser()?.avatar" class="size-8 rounded-full object-cover ring-2 ring-transparent" [class.ring-primary]="dataService.viewingUser()?.id === dataService.currentUser()?.id">
             } @else { <span class="material-symbols-outlined text-3xl" [class.fill-current]="dataService.viewingUser()?.id === dataService.currentUser()?.id">person</span> }
          </button>
        </div>
      </nav>
    }
  `
})
export class AppComponent {
  dataService = inject(DataService);
  currentView = signal<'feed' | 'guides' | 'providers'>('feed');
  showCreatePost = signal(false);
  
  // New: View Mode for Guides/Providers (List or Map)
  viewMode = signal<'list' | 'map'>('list');
  
  // New: Admin Tab State
  adminTab = signal<'users' | 'reports'>('users');

  // Map Instance
  private map: any;
  private userMarker: any;
  
  // Map Search
  mapSearchQuery = '';

  // UPDATED: Computed property to sort guides by proximity to current user
  guidesList = computed(() => {
     const guides = this.dataService.getUsersByRole('guide');
     const me = this.dataService.currentUser();
     
     if (!me || !me.locationCoords) return guides;

     // Sort by Euclidean distance from Lat/Lng
     return guides.sort((a, b) => {
         if(!a.locationCoords || !b.locationCoords) return 0;
         const distA = Math.hypot(a.locationCoords.lat - me.locationCoords.lat, a.locationCoords.lng - me.locationCoords.lng);
         const distB = Math.hypot(b.locationCoords.lat - me.locationCoords.lat, b.locationCoords.lng - me.locationCoords.lng);
         return distA - distB;
     });
  });

  providersList = computed(() => this.dataService.getUsersByRole('provider'));

  ai = new GoogleGenAI({ apiKey: process.env['API_KEY'] });
  
  // Translator
  isListening = signal(false);
  isTranslating = signal(false);
  sourceText = signal('');
  translatedText = signal('');
  autoSpeak = signal(true);
  sourceLang = signal<string>('mn');
  targetLang = signal<string>('zh-CN');
  langSearchQuery = signal('');
  
  // OCR
  ocrImagePreview = signal<string | null>(null);

  filteredLanguages = computed(() => {
     const query = this.langSearchQuery().toLowerCase();
     return this.dataService.translatorLanguages.filter(l => l.name.toLowerCase().includes(query));
  });

  // Chat
  chatInput = signal('');
  
  // Call
  callInterval: any = null;
  callStartTime = 0;

  touchStartX = 0;
  touchEndX = 0;
  
  constructor() {
      // Watch for View Mode changes to Init Map
      effect(() => {
          const view = this.currentView();
          const mode = this.viewMode();
          if ((view === 'guides' || view === 'providers') && mode === 'map') {
              // Allow DOM to render
              setTimeout(() => {
                  this.initMap(view);
              }, 100);
          }
      });
  }

  currentChatMessages = computed(() => {
    const me = this.dataService.currentUser()?.id;
    const other = this.dataService.activeChatUser()?.id;
    if (!me || !other) return [];
    return this.dataService.messages().filter(m => 
        (m.senderId === me && m.receiverId === other) || 
        (m.senderId === other && m.receiverId === me)
    ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  });

  handleUserNavigation(userId: string) {
    this.dataService.setViewUser(userId);
    this.dataService.activeOverlay.set(null); 
  }
  
  handleNotificationClick(notification: AppNotification) {
      this.dataService.markNotificationRead(notification.id);
      if (notification.type === 'like' || notification.type === 'comment') {
          if (notification.resourceId) {
             this.switchView('feed');
             this.dataService.openPost(notification.resourceId);
             this.dataService.activeOverlay.set(null);
          }
      } else if (notification.type === 'follow') {
          this.handleUserNavigation(notification.triggerUserId);
      } else if (notification.type === 'booking') {
          this.goToMyProfile();
      }
  }

  switchView(view: 'feed' | 'guides' | 'providers') {
    this.dataService.viewingUser.set(null);
    this.currentView.set(view);
    this.dataService.activeOverlay.set(null);
    // Reset view mode when switching tabs, default to list for better mobile ux
    if (view !== 'feed') this.viewMode.set('list'); 
  }
  
  initMap(type: 'guides' | 'providers') {
      const mapId = type === 'guides' ? 'guides-map' : 'providers-map';
      const container = document.getElementById(mapId);
      if (!container) return; // Should not happen due to timeout

      // If map already exists, remove it
      if (this.map) {
          this.map.remove();
          this.map = null;
      }

      // Default Center (UB)
      const centerLat = 47.9188;
      const centerLng = 106.9176;

      this.map = L.map(mapId).setView([centerLat, centerLng], 13);

      // OpenStreetMap Tiles (Free, no API Key)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
      }).addTo(this.map);
      
      const list = type === 'guides' ? this.guidesList() : this.providersList();
      
      // Add markers
      list.forEach(user => {
          if (user.locationCoords) {
              const customIcon = L.divIcon({
                  className: 'custom-map-marker',
                  html: `<div class="marker-pin ${type === 'providers' ? 'provider' : ''}"><img src="${user.avatar}"></div>`,
                  iconSize: [40, 40],
                  iconAnchor: [20, 40]
              });

              const marker = L.marker([user.locationCoords.lat, user.locationCoords.lng], { icon: customIcon }).addTo(this.map);
              marker.bindPopup(`<b>${user.name}</b><br>${user.role}`);
              marker.on('click', () => {
                  // Wait a bit so popup can show, then nav? Or direct nav
                  // Better behavior: clicking popup content navigates
              });
              
              // Bind click to navigate
              marker.on('popupopen', () => {
                  const el = document.querySelector('.leaflet-popup-content');
                  if(el) {
                      el.addEventListener('click', () => this.handleUserNavigation(user.id));
                      el.classList.add('cursor-pointer', 'text-blue-600');
                  }
              });
          }
      });
      
      // Fix map rendering issues (grey tiles)
      setTimeout(() => {
          this.map.invalidateSize();
          this.locateMe(false);
      }, 200);
  }

  async searchMap() {
      if (!this.mapSearchQuery.trim()) return;
      
      // Use Nominatim API for geocoding (OpenStreetMap)
      try {
          const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(this.mapSearchQuery)}`);
          const data = await response.json();
          
          if (data && data.length > 0) {
              const result = data[0];
              const lat = parseFloat(result.lat);
              const lon = parseFloat(result.lon);
              
              if (this.map) {
                  this.map.setView([lat, lon], 14);
                  L.marker([lat, lon]).addTo(this.map)
                    .bindPopup(`<b>${result.display_name}</b>`)
                    .openPopup();
              }
          } else {
              alert('Location not found');
          }
      } catch (e) {
          alert('Error searching location');
      }
  }

  locateMe(zoomTo = true) {
      if (!navigator.geolocation) {
          alert("Geolocation is not supported by this browser.");
          return;
      }
      
      const options = {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
      };
      
      navigator.geolocation.getCurrentPosition((position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          // Update Map View
          if (this.map) {
              if (zoomTo) this.map.setView([lat, lng], 15);
              
              // Update/Create User Marker
              if (this.userMarker) {
                  this.userMarker.setLatLng([lat, lng]);
              } else {
                  const userIcon = L.divIcon({
                      className: 'custom-map-marker',
                      html: `<div class="user-location-marker"></div>`,
                      iconSize: [20, 20],
                      iconAnchor: [10, 10]
                  });
                  this.userMarker = L.marker([lat, lng], {icon: userIcon}).addTo(this.map);
                  this.userMarker.bindPopup("You are here");
              }
          }
      }, (err) => {
          console.error(err);
          if (zoomTo) alert("Unable to retrieve accurate location. Ensure GPS is enabled.");
      }, options);
  }

  goToMyProfile() {
    this.dataService.setMyProfileAsView();
    this.dataService.activeOverlay.set(null);
  }

  openCreatePost() {
      if (this.dataService.currentUser()?.status === 'pending') {
          alert('Your account is pending approval.');
          return;
      }
      this.showCreatePost.set(true);
  }
  
  closeOverlay() {}
  closeStory(event?: Event) { if(event) event.stopPropagation(); this.dataService.activeOverlay.set(null); this.dataService.activeStory.set(null); }
  navigateToProfileFromStory(userId: string, event: Event) { event.stopPropagation(); this.closeStory(); this.handleUserNavigation(userId); }
  nextStory() { this.dataService.navigateStory('next'); }
  prevStory() { this.dataService.navigateStory('prev'); }
  sendStoryReply(storyId: string, input: HTMLInputElement) { if (input.value.trim()) { this.dataService.replyToStory(storyId, input.value); input.value = ''; alert('Reply sent!'); } }
  
  onTouchStart(event: TouchEvent) { this.touchStartX = event.changedTouches[0].screenX; }
  
  onTouchEnd(event: TouchEvent) { 
      this.touchEndX = event.changedTouches[0].screenX; 
      if (this.touchStartX - this.touchEndX > 50) {
          this.nextStory(); 
      } else if (this.touchEndX - this.touchStartX > 50) {
          this.prevStory();
      }
  }

  // --- Helper Methods ---

  getLangName(code: string) {
    const found = this.dataService.translatorLanguages.find(l => l.code === code);
    return found ? found.name : code;
  }

  openTranslator() {
    this.dataService.activeOverlay.set('translator');
  }

  toggleAutoSpeak() {
    this.autoSpeak.update(v => !v);
  }

  swapLanguages() {
    const temp = this.sourceLang();
    this.sourceLang.set(this.targetLang());
    this.targetLang.set(temp);
    this.sourceText.set(this.translatedText());
    this.translatedText.set('');
  }

  toggleRecording() {
    if (!('webkitSpeechRecognition' in window)) {
        alert('Speech recognition not supported in this browser.');
        return;
    }
    
    if (this.isListening()) {
        this.isListening.set(false);
        return;
    }

    this.isListening.set(true);
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = this.sourceLang() === 'zh' ? 'zh-CN' : this.sourceLang();
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        this.sourceText.set(transcript);
        this.isListening.set(false);
        this.translateWithGemini();
    };

    recognition.onerror = () => {
        this.isListening.set(false);
    };
    
    recognition.onend = () => {
        this.isListening.set(false);
    };

    recognition.start();
  }

  handleImageTranslation(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
        const file = input.files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
            this.ocrImagePreview.set(e.target?.result as string);
        };
        reader.readAsDataURL(file);
    }
  }

  async translateWithGemini() {
    if (!this.sourceText() && !this.ocrImagePreview()) return;
    if (!this.dataService.isOnline()) return;

    this.isTranslating.set(true);
    
    try {
        let prompt = `Translate the following text from ${this.getLangName(this.sourceLang())} to ${this.getLangName(this.targetLang())}. Only return the translated text.`;
        
        let contents: any = [prompt];
        
        if (this.sourceText()) {
            contents.push(this.sourceText());
        }
        
        // Handle Image
        if (this.ocrImagePreview()) {
             prompt = `Translate the text in this image from ${this.getLangName(this.sourceLang())} to ${this.getLangName(this.targetLang())}. Return only the translated text.`;
             const base64Data = this.ocrImagePreview()!.split(',')[1];
             const imagePart = {
                 inlineData: {
                     mimeType: 'image/jpeg', 
                     data: base64Data
                 }
             };
             contents = [
                 { text: prompt },
                 imagePart
             ];
        } else {
             contents = [
                 { text: prompt + "\n\n" + this.sourceText() }
             ]
        }

        const response = await this.ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: contents
        });

        const resultText = response.text.trim();
        this.translatedText.set(resultText);
        
        if (this.autoSpeak()) {
            this.playTranslation();
        }

    } catch (err) {
        console.error(err);
        alert('Translation failed. Please try again.');
    } finally {
        this.isTranslating.set(false);
    }
  }

  playTranslation() {
    if (!this.translatedText()) return;
    const utterance = new SpeechSynthesisUtterance(this.translatedText());
    utterance.lang = this.targetLang(); 
    window.speechSynthesis.speak(utterance);
  }

  selectLanguage(code: string) {
      if (this.dataService.langSelectorContext() === 'source') {
          this.sourceLang.set(code);
      } else {
          this.targetLang.set(code);
      }
      this.dataService.activeOverlay.set('translator');
  }

  // CHAT & CALL
  sendMessage() {
    const user = this.dataService.activeChatUser();
    if (user && this.chatInput().trim()) {
        this.dataService.sendMessage(
            this.dataService.currentUser()!.id,
            user.id,
            this.chatInput()
        );
        this.chatInput.set('');
    }
  }

  closeChatOverlay() {
    this.dataService.activeOverlay.set(null);
    this.dataService.activeChatUser.set(null);
  }

  endCall() {
    this.dataService.callStatus.set('ended');
    setTimeout(() => {
        this.dataService.activeOverlay.set(null);
        this.dataService.callStatus.set('calling');
    }, 1000);
  }

  formatCallTime() {
    return "00:45"; 
  }
}