import { Component, inject, output, signal, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../services/data.service';
import { FormsModule } from '@angular/forms';
import { Post } from '../types';
import { CreatePostComponent } from './create-post.component';

@Component({
  selector: 'app-home',
  imports: [CommonModule, FormsModule, CreatePostComponent],
  template: `
    <!-- Stories Section -->
    <div class="px-4 py-3 flex gap-3 overflow-x-auto no-scrollbar snap-x touch-pan-x bg-white dark:bg-background-dark">
      <!-- Add Story -->
      <label class="flex flex-col items-center gap-1 cursor-pointer shrink-0 snap-start group w-16">
         <input type="file" accept="image/*" class="hidden" (change)="handleStoryUpload($event)">
         <div class="size-16 rounded-full p-[2px] border-2 border-gray-300 dark:border-gray-700 relative group-active:scale-95 transition-transform">
             <img [src]="dataService.currentUser()?.avatar" loading="lazy" class="size-full rounded-full object-cover">
             <div class="absolute bottom-0 right-0 bg-primary text-white rounded-full p-0.5 border-2 border-white dark:border-background-dark">
                 <span class="material-symbols-outlined text-xs block">add</span>
             </div>
         </div>
         <span class="text-xs text-gray-500 dark:text-gray-400 w-full text-center truncate">Your Story</span>
      </label>

      <!-- Other Stories -->
      @for (story of dataService.stories(); track story.id) {
         <div class="flex flex-col items-center gap-1 cursor-pointer shrink-0 snap-start group w-16 relative">
             <div (click)="viewStory(story.id)" class="size-16 rounded-full p-[2px] transition-transform group-active:scale-95" [class]="story.viewed ? 'bg-gray-300 dark:bg-gray-700' : 'bg-gradient-to-tr from-yellow-400 to-purple-500'">
                 <div class="bg-white dark:bg-background-dark p-[2px] rounded-full size-full">
                    <img [src]="story.avatar" loading="lazy" class="size-full rounded-full object-cover">
                 </div>
             </div>
             <!-- ADMIN DELETE STORY -->
             @if (dataService.currentUser()?.role === 'admin') {
                 <button (click)="dataService.deleteStory(story.id)" class="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 z-10 shadow-sm border border-white">
                     <span class="material-symbols-outlined text-[10px]">close</span>
                 </button>
             }
             <span class="text-xs text-gray-500 dark:text-gray-400 w-full text-center truncate">{{story.userName}}</span>
         </div>
      }
    </div>

    <!-- Story Editor Modal -->
    @if (showStoryEditor()) {
        <app-create-post 
            [mode]="'story'" 
            [initialFile]="pendingStoryFile()" 
            (close)="closeStoryEditor()" 
            (postCreated)="closeStoryEditor()">
        </app-create-post>
    }

    <!-- REPORT MODAL -->
    @if (showReportModal() && reportTargetPostId()) {
        <div class="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div class="absolute inset-0 bg-black/80" (click)="closeReportModal()"></div>
            <div class="relative w-full max-w-sm bg-white dark:bg-surface-dark rounded-2xl shadow-2xl p-6 animate-in zoom-in-95">
                <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">{{dataService.text().reportReason}}</h3>
                <div class="flex flex-col gap-2">
                    @for(reason of reportReasons; track reason.key) {
                        <button (click)="confirmReport(reason.label)" class="text-left px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-800 dark:text-white font-medium text-sm transition-colors">
                            {{reason.label}}
                        </button>
                    }
                </div>
                <button (click)="closeReportModal()" class="mt-4 w-full py-2 text-center text-gray-500 hover:text-gray-700 dark:text-gray-400 text-sm font-bold">Cancel</button>
            </div>
        </div>
    }

    <!-- SHARE MODAL -->
    @if (showShareModal()) {
        <div class="fixed inset-0 z-[110] flex items-end justify-center">
            <div class="absolute inset-0 bg-black/50" (click)="closeShareModal()"></div>
            <div class="relative w-full bg-white dark:bg-surface-dark rounded-t-3xl shadow-2xl p-6 animate-in slide-in-from-bottom duration-200">
                <div class="w-12 h-1 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto mb-6"></div>
                <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-6 text-center">{{dataService.text().shareTo}}</h3>
                
                <div class="grid grid-cols-4 gap-4 mb-6">
                    <!-- Copy Link -->
                    <button (click)="copyLink()" class="flex flex-col items-center gap-2 group">
                        <div class="size-14 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                            <span class="material-symbols-outlined text-2xl text-gray-700 dark:text-gray-300">link</span>
                        </div>
                        <span class="text-xs text-gray-500 dark:text-gray-400">{{dataService.text().copyLink}}</span>
                    </button>
                    
                    <!-- Facebook -->
                    <a [href]="'https://www.facebook.com/sharer/sharer.php?u=' + shareUrl()" target="_blank" class="flex flex-col items-center gap-2 group">
                        <div class="size-14 rounded-full bg-blue-600 flex items-center justify-center group-hover:bg-blue-700 transition-colors text-white">
                            <svg class="w-7 h-7 fill-current" viewBox="0 0 24 24">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                            </svg>
                        </div>
                        <span class="text-xs text-gray-500 dark:text-gray-400">Facebook</span>
                    </a>

                    <!-- Twitter / X -->
                    <a [href]="'https://twitter.com/intent/tweet?url=' + shareUrl()" target="_blank" class="flex flex-col items-center gap-2 group">
                        <div class="size-14 rounded-full bg-black flex items-center justify-center group-hover:bg-gray-900 transition-colors text-white border border-gray-700">
                            <svg class="w-6 h-6 fill-current" viewBox="0 0 24 24">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                            </svg>
                        </div>
                        <span class="text-xs text-gray-500 dark:text-gray-400">X</span>
                    </a>

                    <!-- WhatsApp -->
                    <a [href]="'https://wa.me/?text=' + shareUrl()" target="_blank" class="flex flex-col items-center gap-2 group">
                        <div class="size-14 rounded-full bg-green-500 flex items-center justify-center group-hover:bg-green-600 transition-colors text-white">
                            <svg class="w-7 h-7 fill-current" viewBox="0 0 24 24">
                                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                            </svg>
                        </div>
                        <span class="text-xs text-gray-500 dark:text-gray-400">WhatsApp</span>
                    </a>
                </div>
            </div>
        </div>
    }

    <!-- User Feed Section -->
    <div class="px-4 py-2">
      <div class="flex items-center justify-between mb-4 mt-2">
        <h3 class="text-lg font-bold text-gray-900 dark:text-white">{{dataService.text().travelFeed}}</h3>
        <span class="text-xs text-gray-400">{{dataService.text().recentUpdates}}</span>
      </div>
      
      <div class="flex flex-col gap-6">
        @for (post of dataService.posts(); track post.id) {
          <article class="bg-white dark:bg-surface-dark rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
            
            <!-- ADMIN WARNING BANNER -->
            @if (post.warning) {
                <div class="bg-red-500 text-white p-2 text-xs font-bold text-center flex items-center justify-center gap-2">
                    <span class="material-symbols-outlined text-sm">warning</span>
                    {{post.warning}}
                </div>
            }

            <!-- Post Header -->
            <div class="p-4 flex items-center gap-3 relative">
              <img [src]="post.userAvatar" loading="lazy" (click)="navigateToUser(post.userId)" class="size-10 rounded-full object-cover cursor-pointer ring-2 ring-transparent hover:ring-primary transition-all">
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <h4 (click)="navigateToUser(post.userId)" class="font-bold text-sm text-[#0d141b] dark:text-white cursor-pointer hover:underline">{{post.userName}}</h4>
                  @if (post.userRole === 'provider') {
                    <span class="bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">{{dataService.text().roles.provider}}</span>
                  }
                  @if (post.userRole === 'guide') {
                    <span class="bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-300 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">{{dataService.text().roles.guide}}</span>
                  }
                </div>
                <p class="text-[10px] text-gray-400 font-medium">{{post.location}} • 2h ago</p>
              </div>
              
              <!-- Post Menu Dropdown -->
              <div class="relative">
                  <button (click)="toggleMenu(post.id)" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
                    <span class="material-symbols-outlined text-xl">more_horiz</span>
                  </button>
                  
                  @if (activeMenu() === post.id) {
                    <div class="absolute right-0 top-8 w-36 bg-white dark:bg-surface-dark shadow-xl rounded-xl border border-gray-100 dark:border-gray-700 z-10 overflow-hidden">
                        <!-- ADMIN OR OWNER DELETE -->
                        @if (post.userId === dataService.currentUser()?.id || dataService.currentUser()?.role === 'admin') {
                            <button (click)="deletePost(post.id)" class="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-50 dark:hover:bg-slate-800 flex items-center gap-2 font-bold">
                                <span class="material-symbols-outlined text-sm">delete</span> 
                                {{ dataService.currentUser()?.role === 'admin' ? 'Delete (Admin)' : dataService.text().delete }}
                            </button>
                        } @else {
                            <button (click)="initiateReport(post.id)" class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 flex items-center gap-2">
                                <span class="material-symbols-outlined text-sm">flag</span> {{dataService.text().report}}
                            </button>
                        }
                    </div>
                    <!-- Overlay to close menu -->
                    <div (click)="activeMenu.set(null)" class="fixed inset-0 z-0"></div>
                  }
              </div>
            </div>

            <!-- Media with LAZY LOADING OPTIMIZATION (@defer) -->
            @if (post.mediaUrl) {
              <!-- Use @defer to lazily load the image/video section only when it comes into the viewport -->
              @defer (on viewport) {
                <div class="w-full bg-gray-100 dark:bg-black/20 overflow-hidden relative">
                    @if (post.mediaType === 'image') {
                        <img [src]="post.mediaUrl" loading="lazy" [style.filter]="post.filter" class="w-full object-cover max-h-[500px]">
                    } @else {
                        <video [src]="post.mediaUrl" controls class="w-full max-h-[500px]"></video>
                    }
                    
                    <!-- Business Tag for Service Posts -->
                    @if (post.isService) {
                        <div class="absolute top-4 left-4 bg-white/90 dark:bg-black/70 backdrop-blur text-purple-600 dark:text-purple-300 px-3 py-1 rounded-lg font-bold text-xs flex items-center gap-1 shadow-md">
                            <span class="material-symbols-outlined text-sm">storefront</span>
                            Business Service
                        </div>
                    }
                </div>
              } @placeholder {
                <!-- Placeholder shown while waiting for viewport -->
                <div class="w-full h-64 bg-gray-100 dark:bg-gray-800 animate-pulse flex items-center justify-center">
                    <span class="material-symbols-outlined text-4xl text-gray-300 dark:text-gray-600">image</span>
                </div>
              }
            }

             <!-- Post Content -->
             <div class="px-4 pt-4 pb-2">
              <!-- Service Title & Price Header -->
              @if (post.isService && post.title) {
                  <div class="flex justify-between items-start mb-2">
                      <h3 class="font-bold text-lg leading-tight dark:text-white max-w-[70%]">{{post.title}}</h3>
                      @if (post.price) {
                          <div class="flex flex-col items-end">
                              <span class="text-xl font-bold text-green-600">\${{post.price}}</span>
                              <span class="text-[10px] text-gray-400 font-medium uppercase">per person</span>
                          </div>
                      }
                  </div>
                  @if (post.maxCapacity) {
                      <div class="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-3 bg-gray-100 dark:bg-slate-800 w-fit px-2 py-1 rounded">
                          <span class="material-symbols-outlined text-sm">group</span>
                          Max capacity: {{post.maxCapacity}} people
                      </div>
                  }
              }

              <p class="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
                <span class="font-bold mr-1 cursor-pointer" (click)="navigateToUser(post.userId)">{{post.userName}}</span>
                {{post.content}}
              </p>
            </div>

            <!-- Service Link (Booking Action) -->
            @if (post.isService) {
              <div class="mx-4 mb-3 mt-2 p-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl shadow-lg shadow-purple-500/20 flex items-center justify-between cursor-pointer group active:scale-95 transition-transform" (click)="navigateToUser(post.userId)">
                <div class="flex flex-col">
                  <span class="text-xs font-bold uppercase tracking-wide text-white/90">Book This Service</span>
                  <span class="text-xs text-white/80">Check availability</span>
                </div>
                <span class="material-symbols-outlined text-white group-hover:translate-x-1 transition-transform">calendar_month</span>
              </div>
            }

            <!-- Actions -->
            <div class="px-4 pb-4 mt-2">
              <div class="flex items-center gap-6 mb-3">
                <button (click)="dataService.likePost(post.id)" class="flex items-center gap-1.5 text-gray-500 hover:text-red-500 transition-colors group">
                  @let isLiked = post.likedBy.includes(dataService.currentUser()?.id || '');
                  <span class="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform" 
                        [class.fill-current]="isLiked" 
                        [class.text-red-500]="isLiked">favorite</span>
                </button>
                
                <button (click)="openComments(post)" class="flex items-center gap-1.5 text-gray-500 hover:text-primary transition-colors group">
                  <span class="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform">chat_bubble</span>
                </button>
                
                <button (click)="handleShare(post)" class="flex items-center gap-1.5 text-gray-500 hover:text-primary transition-colors ml-auto group">
                   <span class="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform">share</span>
                </button>
              </div>
              
              <div class="flex justify-between items-center text-sm">
                 <div class="font-bold text-gray-900 dark:text-white">
                    {{post.likes}} likes
                 </div>
                 @if(post.comments.length > 0) {
                     <button (click)="openComments(post)" class="text-gray-500 dark:text-gray-400 text-xs hover:underline">
                        View all {{post.comments.length}} comments
                     </button>
                 }
              </div>
            </div>
          </article>
        }
      </div>
    </div>

    @if (dataService.activePost(); as activePost) {
      <div class="fixed inset-0 z-[120] flex items-end justify-center sm:items-center">
         <div class="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" (click)="closeComments()"></div>
         
         <div class="relative w-full max-w-md bg-white dark:bg-surface-dark rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col h-[85vh] sm:h-[80vh] animate-in slide-in-from-bottom duration-300">
             
             <div class="w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto mt-3 mb-1 sm:hidden"></div>

             <div class="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-surface-dark shrink-0 rounded-t-3xl">
                 <h3 class="font-bold text-gray-900 dark:text-white text-lg">Comments</h3>
                 <button (click)="closeComments()" class="p-2 bg-gray-100 dark:bg-slate-800 rounded-full hover:bg-gray-200 transition-colors">
                     <span class="material-symbols-outlined text-xl block">close</span>
                 </button>
             </div>

             <div class="flex-1 overflow-y-auto p-4 space-y-4 bg-white dark:bg-background-dark/50" #commentsContainer>
                 @if (activePost.comments.length === 0) {
                     <div class="flex flex-col items-center justify-center py-20 text-gray-400">
                         <span class="material-symbols-outlined text-6xl mb-4 opacity-30">chat_bubble_outline</span>
                         <p class="font-medium text-sm">No comments yet.</p>
                         <p class="text-xs">Start the conversation.</p>
                     </div>
                 }
                 @for (comment of activePost.comments; track comment.id) {
                     <div class="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                         <img [src]="comment.userAvatar" loading="lazy" class="size-9 rounded-full object-cover shrink-0 border border-gray-100 dark:border-gray-700">
                         <div class="flex flex-col max-w-[85%]">
                             <div class="bg-gray-100 dark:bg-slate-800 p-3 rounded-2xl rounded-tl-none">
                                 <span class="font-bold text-sm text-gray-900 dark:text-white block mb-0.5">{{comment.userName}}</span>
                                 <p class="text-sm text-gray-800 dark:text-gray-200 break-words leading-snug">{{comment.text}}</p>
                             </div>
                             <span class="text-[10px] text-gray-400 mt-1 ml-2 font-medium">Just now</span>
                         </div>
                     </div>
                 }
             </div>

             <div class="p-3 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-surface-dark shrink-0 pb-6 sm:pb-3">
                 <div class="flex items-end gap-2">
                     <img [src]="dataService.currentUser()?.avatar" loading="lazy" class="size-9 rounded-full object-cover shrink-0 mb-1 border border-gray-200 dark:border-gray-700">
                     <div class="flex-1 bg-gray-100 dark:bg-slate-800 rounded-2xl flex items-center px-4 py-2 border border-transparent focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
                        <textarea
                            #modalCommentInput
                            rows="1"
                            placeholder="Add a comment..." 
                            class="w-full bg-transparent border-none text-sm focus:ring-0 px-0 py-1 dark:text-white placeholder:text-gray-500 min-w-0 resize-none max-h-24"
                            (keyup.enter)="addComment(activePost.id, modalCommentInput)"
                        ></textarea>
                     </div>
                     <button (click)="addComment(activePost.id, modalCommentInput)" [disabled]="!modalCommentInput.value.trim()" class="p-3 bg-primary text-white rounded-full shadow-lg shadow-primary/30 active:scale-95 transition-transform shrink-0 disabled:opacity-50 disabled:shadow-none hover:bg-blue-600">
                         <span class="material-symbols-outlined text-xl block">send</span>
                     </button>
                 </div>
             </div>
         </div>
      </div>
    }
  `
})
export class HomeComponent {
  dataService = inject(DataService);
  onUserSelect = output<string>();
  
  @ViewChild('commentsContainer') commentsContainer?: ElementRef;
  
  activeMenu = signal<string | null>(null);
  showStoryEditor = signal(false);
  pendingStoryFile = signal<string | undefined>(undefined);
  
  showReportModal = signal(false);
  reportTargetPostId = signal<string | null>(null);
  
  showShareModal = signal(false);
  shareTargetPost = signal<Post | null>(null);
  shareUrl = signal('');
  
  get reportReasons() {
      return [
          { key: 'spam', label: this.dataService.text().reasons.spam },
          { key: 'scam', label: this.dataService.text().reasons.scam },
          { key: 'inappropriate', label: this.dataService.text().reasons.inappropriate },
          { key: 'harassment', label: this.dataService.text().reasons.harassment },
          { key: 'other', label: this.dataService.text().reasons.other }
      ];
  }

  openComments(post: Post) {
      this.dataService.activePost.set(post);
      setTimeout(() => this.scrollToBottom(), 100);
  }

  closeComments() {
      this.dataService.activePost.set(null);
  }

  addComment(postId: string, input: HTMLTextAreaElement) {
    if (input.value.trim()) {
      this.dataService.addComment(postId, input.value);
      input.value = '';
      setTimeout(() => this.scrollToBottom(), 50);
    }
  }
  
  scrollToBottom() {
      if (this.commentsContainer) {
          this.commentsContainer.nativeElement.scrollTop = this.commentsContainer.nativeElement.scrollHeight;
      }
  }

  navigateToUser(userId: string) {
    this.onUserSelect.emit(userId);
  }

  toggleMenu(postId: string) {
      if (this.activeMenu() === postId) {
          this.activeMenu.set(null);
      } else {
          this.activeMenu.set(postId);
      }
  }

  deletePost(postId: string) {
      if(confirm('Are you sure you want to delete this post?')) {
          this.dataService.deletePost(postId);
          this.activeMenu.set(null);
      }
  }

  initiateReport(postId: string) {
      this.reportTargetPostId.set(postId);
      this.showReportModal.set(true);
      this.activeMenu.set(null);
  }
  
  closeReportModal() {
      this.showReportModal.set(false);
      this.reportTargetPostId.set(null);
  }
  
  confirmReport(reason: string) {
      const pid = this.reportTargetPostId();
      if (pid) {
          this.dataService.reportPost(pid, reason);
          alert('Report submitted successfully.');
      }
      this.closeReportModal();
  }
  
  async handleShare(post: Post) {
      const url = `${window.location.origin}/#post/${post.id}`; 
      this.shareUrl.set(url);
      
      if (navigator.share) {
          try {
              await navigator.share({
                  title: 'Check out this post on CJ Travel',
                  text: post.content,
                  url: url
              });
              return; 
          } catch (err) {
              console.log('Share canceled or failed', err);
          }
      }
      
      this.shareTargetPost.set(post);
      this.showShareModal.set(true);
  }
  
  closeShareModal() {
      this.showShareModal.set(false);
      this.shareTargetPost.set(null);
  }
  
  copyLink() {
      navigator.clipboard.writeText(this.shareUrl()).then(() => {
          alert(this.dataService.text().copied);
          this.closeShareModal();
      });
  }

  handleStoryUpload(event: Event) {
      const input = event.target as HTMLInputElement;
      if (input.files && input.files[0]) {
          const file = input.files[0];
          const reader = new FileReader();
          reader.onload = (e) => {
             const result = e.target?.result as string;
             this.pendingStoryFile.set(result);
             this.showStoryEditor.set(true);
          };
          reader.readAsDataURL(file);
      }
      input.value = ''; 
  }
  
  closeStoryEditor() {
      this.showStoryEditor.set(false);
      this.pendingStoryFile.set(undefined);
  }

  viewStory(storyId: string) {
      this.dataService.viewStory(storyId);
  }
}