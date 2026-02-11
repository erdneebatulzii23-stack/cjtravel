import { Component, inject, signal, output, input, effect, OnInit, OnDestroy } from '@angular/core';
import { DataService } from '../services/data.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Post } from '../types';

@Component({
  selector: 'app-create-post',
  imports: [FormsModule, CommonModule],
  template: `
    <div class="fixed inset-0 z-[100] flex items-end sm:items-center justify-center px-4 py-6">
      <!-- Backdrop -->
      <div (click)="close.emit()" class="absolute inset-0 bg-black/80 transition-opacity"></div>

      <!-- Modal Content -->
      <div class="relative w-full max-w-lg bg-white dark:bg-surface-dark rounded-3xl shadow-2xl overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        <!-- Header -->
        <div class="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <button (click)="goBack()" class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 transition-colors">
            <span class="material-symbols-outlined">{{step() === 'select' || step() === 'type_selection' ? 'close' : 'arrow_back'}}</span>
          </button>
          <h2 class="text-base font-bold text-gray-900 dark:text-white">
             @if(mode() === 'story') {
                 {{step() === 'edit' ? 'Edit Story' : 'New Story'}}
             } @else if (postToEdit()) {
                 Edit {{postType() === 'business' ? 'Service' : 'Post'}}
             } @else if (step() === 'type_selection') {
                 {{dataService.text().choosePostType}}
             } @else {
                 {{step() === 'select' ? 'New Post' : step() === 'edit' ? 'Edit Photo' : postType() === 'business' ? 'Service Details' : 'New Post'}}
             }
          </h2>
          @if (step() === 'edit') {
             <button (click)="saveFilter()" class="text-primary font-bold text-sm px-2">
                 {{ mode() === 'story' ? 'Share' : 'Done' }}
             </button>
          } @else if (step() === 'details') {
             <button (click)="submit()" [disabled]="isProcessing()" class="text-primary font-bold text-sm px-2 disabled:opacity-50 flex items-center gap-1">
                 @if(isProcessing()) { <span class="material-symbols-outlined animate-spin text-xs">progress_activity</span> }
                 {{ postToEdit() ? 'Save' : 'Share' }}
             </button>
          } @else {
             <div class="w-8"></div>
          }
        </div>

        <div class="flex-1 overflow-y-auto">
            <!-- STEP 0: TYPE SELECTION (Guides/Providers only) -->
            @if (step() === 'type_selection') {
                <div class="p-6 flex flex-col gap-4 h-full justify-center">
                    <button (click)="selectType('standard')" class="flex items-center gap-4 p-4 rounded-2xl border-2 border-gray-100 dark:border-gray-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left group">
                        <div class="size-12 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center shrink-0">
                            <span class="material-symbols-outlined text-2xl">photo_camera</span>
                        </div>
                        <div>
                            <h3 class="font-bold text-gray-900 dark:text-white group-hover:text-blue-600">{{dataService.text().standardPost}}</h3>
                            <p class="text-xs text-gray-500 dark:text-gray-400">{{dataService.text().standardDesc}}</p>
                        </div>
                    </button>

                    <button (click)="selectType('business')" class="flex items-center gap-4 p-4 rounded-2xl border-2 border-gray-100 dark:border-gray-700 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all text-left group">
                        <div class="size-12 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-600 flex items-center justify-center shrink-0">
                            <span class="material-symbols-outlined text-2xl">storefront</span>
                        </div>
                        <div>
                            <h3 class="font-bold text-gray-900 dark:text-white group-hover:text-purple-600">{{dataService.text().businessPost}}</h3>
                            <p class="text-xs text-gray-500 dark:text-gray-400">{{dataService.text().businessDesc}}</p>
                        </div>
                    </button>
                </div>
            }

            <!-- STEP 1: SELECT MEDIA (Stories Only) -->
            @if (step() === 'select') {
               <div class="p-8 flex flex-col items-center justify-center min-h-[300px]">
                  <span class="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600 mb-4">perm_media</span>
                  <label class="bg-primary text-white px-6 py-3 rounded-xl font-bold cursor-pointer hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/30">
                      Select from device
                      <input type="file" accept="image/*,video/*" class="hidden" (change)="handleFileSelect($event)">
                  </label>
               </div>
            }

            <!-- STEP 2: EDIT (FILTERS) -->
            @if (step() === 'edit' && displayUrl()) {
                <div class="flex flex-col h-full">
                    <div class="flex-1 bg-gray-100 dark:bg-black/20 flex items-center justify-center p-4 relative">
                        <img [src]="displayUrl()" [style.filter]="currentFilter()" class="max-h-[50vh] object-contain shadow-lg rounded-lg transition-all duration-300">
                        @if(isProcessing()) {
                            <div class="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg backdrop-blur-sm z-10">
                                <div class="text-white text-xs font-bold flex flex-col items-center">
                                    <span class="material-symbols-outlined animate-spin text-3xl mb-2">compress</span>
                                    Compressing...
                                </div>
                            </div>
                        }
                    </div>
                    
                    <!-- Filter Scroll -->
                    <div class="p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-surface-dark">
                        <p class="text-center text-xs font-bold text-gray-400 mb-3 uppercase tracking-widest">Filters</p>
                        <div class="flex gap-4 overflow-x-auto pb-2 no-scrollbar snap-x touch-pan-x">
                            @for (filter of filters; track filter.name) {
                                <div (click)="currentFilter.set(filter.style)" class="flex flex-col items-center gap-1 cursor-pointer snap-center group min-w-[64px]">
                                    <div class="size-16 rounded-md overflow-hidden border-2 transition-all" [class.border-primary]="currentFilter() === filter.style" [class.border-transparent]="currentFilter() !== filter.style">
                                        <img [src]="displayUrl()" [style.filter]="filter.style" class="w-full h-full object-cover">
                                    </div>
                                    <span class="text-[10px] font-medium text-gray-500 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" [class.text-primary]="currentFilter() === filter.style">{{filter.name}}</span>
                                </div>
                            }
                        </div>
                    </div>
                </div>
            }

            <!-- STEP 3: DETAILS (Main Post Form) -->
            @if (step() === 'details') {
                <div class="flex flex-col h-full">
                    
                    <!-- Image Area -->
                    <div class="p-4 pb-0">
                         @if (displayUrl()) {
                             <div class="relative w-full h-48 rounded-2xl overflow-hidden group bg-black/5 dark:bg-black/20">
                                 <img [src]="displayUrl()" [style.filter]="currentFilter()" class="w-full h-full object-cover">
                                 <div class="absolute inset-0 bg-black/40 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                      <button (click)="step.set('edit')" class="px-3 py-1.5 bg-white text-black rounded-lg text-xs font-bold hover:bg-gray-200">
                                          Edit Filter
                                      </button>
                                      <label class="px-3 py-1.5 bg-white/20 text-white rounded-lg text-xs font-bold hover:bg-white/30 cursor-pointer">
                                          Change
                                          <input type="file" accept="image/*" class="hidden" (change)="handleFileSelect($event)">
                                      </label>
                                 </div>
                                 @if(isProcessing()) {
                                    <div class="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded-full flex items-center gap-1 z-20">
                                        <span class="material-symbols-outlined animate-spin text-xs">sync</span> Processing
                                    </div>
                                 }
                             </div>
                         } @else {
                             <label class="w-full h-48 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors group">
                                 <div class="bg-gray-100 dark:bg-slate-700 p-3 rounded-full mb-2 group-hover:scale-110 transition-transform">
                                     <span class="material-symbols-outlined text-gray-400 dark:text-gray-300">add_photo_alternate</span>
                                 </div>
                                 <span class="text-sm font-bold text-gray-500 dark:text-gray-400">Add Cover Photo</span>
                                 <input type="file" accept="image/*" class="hidden" (change)="handleFileSelect($event)">
                             </label>
                         }
                    </div>

                    <!-- Description Input -->
                    <div class="p-4">
                        <textarea 
                          [(ngModel)]="postContent" 
                          [placeholder]="dataService.text().description + '...'" 
                          class="w-full bg-transparent border-none focus:ring-0 p-2 resize-none text-base dark:text-white placeholder:text-gray-400 h-24"
                        ></textarea>
                    </div>
                    
                    <!-- BUSINESS POST SPECIFIC INPUTS -->
                    @if (postType() === 'business') {
                        <div class="px-4 space-y-4">
                            <div>
                                <label class="block text-xs font-bold text-gray-500 mb-1 uppercase">{{dataService.text().serviceTitle}}</label>
                                <input type="text" [(ngModel)]="serviceTitle" placeholder="e.g. 3-Day Gobi Tour" class="w-full bg-gray-50 dark:bg-slate-800 border-none rounded-xl p-3 text-sm dark:text-white font-bold">
                            </div>

                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-xs font-bold text-gray-500 mb-1 uppercase">{{dataService.text().pricePerPerson}}</label>
                                    <div class="flex items-center bg-gray-50 dark:bg-slate-800 rounded-xl px-3 py-2">
                                        <span class="text-gray-500 mr-2">$</span>
                                        <input type="number" [(ngModel)]="price" placeholder="0.00" class="bg-transparent border-none focus:ring-0 w-full text-sm font-bold text-gray-900 dark:text-white">
                                    </div>
                                </div>
                                <div>
                                    <label class="block text-xs font-bold text-gray-500 mb-1 uppercase">{{dataService.text().maxCapacity}}</label>
                                    <div class="flex items-center bg-gray-50 dark:bg-slate-800 rounded-xl px-3 py-2">
                                        <span class="material-symbols-outlined text-gray-500 text-sm mr-2">group</span>
                                        <input type="number" [(ngModel)]="maxCapacity" placeholder="10" class="bg-transparent border-none focus:ring-0 w-full text-sm font-bold text-gray-900 dark:text-white">
                                    </div>
                                </div>
                            </div>
                        </div>
                    }

                    <div class="p-4 mt-2">
                         <label class="block text-xs font-bold text-gray-500 mb-1 uppercase">{{dataService.text().location}}</label>
                         <div class="relative">
                            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">location_on</span>
                            <input 
                                list="popularLocations"
                                [(ngModel)]="location" 
                                [placeholder]="dataService.text().locationPlaceholder || 'Add Location'" 
                                class="w-full bg-gray-50 dark:bg-slate-800 border-none rounded-xl py-3 pl-10 pr-3 text-sm dark:text-white font-medium"
                            >
                            <datalist id="popularLocations">
                                <option value="Ulaanbaatar, Mongolia">
                                <option value="Bali, Indonesia">
                                <option value="Berlin, Germany">
                                <option value="Gobi Desert, Mongolia">
                                <option value="Altai Mountains, Mongolia">
                                <option value="Lake Khuvsgul, Mongolia">
                                <option value="Seoul, South Korea">
                                <option value="Tokyo, Japan">
                                <option value="Beijing, China">
                                <option value="Moscow, Russia">
                            </datalist>
                         </div>
                    </div>
                </div>
            }
        </div>
      </div>
    </div>
  `
})
export class CreatePostComponent implements OnInit, OnDestroy {
  dataService = inject(DataService);
  
  // Inputs
  mode = input<'post' | 'story'>('post');
  initialFile = input<string | undefined>(undefined);
  
  // NEW INPUT: To handle Editing
  postToEdit = input<Post | null>(null);

  // Outputs
  close = output<void>();
  postCreated = output<void>();
  
  user = this.dataService.currentUser;
  
  // Form Data
  postContent = '';
  
  // OPTIMIZATION: Separate Display URL (Blob) vs Submission URL (Compressed Base64)
  displayUrl = signal<string | undefined>(undefined);
  submissionData = signal<string | undefined>(undefined);
  isProcessing = signal(false); // Shows spinner while compression happens

  mediaType = signal<'image' | 'video' | undefined>(undefined);
  location = '';
  
  // Business Fields
  price = signal<number | undefined>(undefined);
  serviceTitle = signal<string>('');
  maxCapacity = signal<number | undefined>(undefined);
  
  // State
  step = signal<'type_selection' | 'select' | 'edit' | 'details'>('select');
  postType = signal<'standard' | 'business'>('standard');
  currentFilter = signal<string>('');

  filters = [
      { name: 'Normal', style: '' },
      { name: 'Vivid', style: 'contrast(1.1) saturate(1.2)' },
      { name: 'B&W', style: 'grayscale(1)' },
      { name: 'Sepia', style: 'sepia(0.5)' },
      { name: 'Vintage', style: 'sepia(0.4) contrast(1.2) brightness(0.9)' },
      { name: 'Cool', style: 'hue-rotate(30deg) contrast(0.9)' },
      { name: 'Warm', style: 'sepia(0.3) saturate(1.4)' },
      { name: 'Fade', style: 'brightness(1.1) contrast(0.8)' }
  ];

  constructor() {
      // Check if we have an initial file (e.g. from Story upload)
      effect(() => {
          const file = this.initialFile();
          if (file) {
              this.displayUrl.set(file);
              // For story upload from home, it's already base64, but we treat it as valid.
              // Ideally, we should compress that too, but assuming Home component handles file reading differently.
              this.submissionData.set(file); 
              this.mediaType.set('image');
              this.step.set('edit');
          }
      });
      
      // Check if we are editing an existing post
      effect(() => {
         const p = this.postToEdit();
         if (p) {
             this.postContent = p.content;
             this.displayUrl.set(p.mediaUrl);
             this.submissionData.set(p.mediaUrl);
             this.mediaType.set(p.mediaType);
             this.location = p.location || '';
             this.currentFilter.set(p.filter || '');
             
             if (p.isService) {
                 this.postType.set('business');
                 this.serviceTitle.set(p.title || '');
                 this.price.set(p.price);
                 this.maxCapacity.set(p.maxCapacity);
             } else {
                 this.postType.set('standard');
             }
             
             this.step.set('details');
         }
      });
  }

  ngOnInit() {
      if (this.mode() === 'post' && !this.postToEdit()) {
          const role = this.user()?.role;
          if (role === 'guide' || role === 'provider') {
              this.step.set('type_selection');
          } else {
              this.step.set('details');
              this.postType.set('standard');
          }
      } else if (!this.postToEdit()) {
          if(!this.initialFile()) this.step.set('select');
      }
  }
  
  ngOnDestroy() {
      // Cleanup Blob URLs to avoid memory leaks
      const url = this.displayUrl();
      if (url && url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
      }
  }

  selectType(type: 'standard' | 'business') {
      this.postType.set(type);
      this.step.set('details');
  }

  handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      if (file.size > 50 * 1024 * 1024) {
        alert('File size exceeds 50MB limit');
        return;
      }

      // 1. Immediate UI Feedback using Blob URL (Instant)
      const objectUrl = URL.createObjectURL(file);
      this.displayUrl.set(objectUrl);

      // Detect Type
      if (file.type.startsWith('image/')) {
        this.mediaType.set('image');
        
        // 2. AGGRESSIVE IMAGE COMPRESSION
        this.isProcessing.set(true);
        // Add a small timeout to allow UI to show spinner before freezing momentarily
        setTimeout(() => {
            this.compressImage(file).then(compressedBase64 => {
                 this.submissionData.set(compressedBase64);
                 this.isProcessing.set(false);
            });
        }, 50);

      } else if (file.type.startsWith('video/')) {
        this.mediaType.set('video');
        this.isProcessing.set(true);
        const reader = new FileReader();
        reader.onload = (e) => {
            this.submissionData.set(e.target?.result as string);
            this.isProcessing.set(false);
        };
        reader.readAsDataURL(file);
      } else {
        alert('Unsupported file type. Please select an image or video.');
        return;
      }

      // Move to next step
      if (this.mode() === 'story') {
          this.step.set('edit');
      }
    }
  }

  // --- IMAGE COMPRESSION LOGIC (AGGRESSIVE) ---
  private compressImage(file: File): Promise<string> {
      return new Promise((resolve) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = (event) => {
              const img = new Image();
              img.src = event.target?.result as string;
              img.onload = () => {
                  const canvas = document.createElement('canvas');
                  // Aggressive resizing: Max width 800px is enough for mobile feeds
                  const MAX_WIDTH = 800; 
                  
                  // Calculate new dimensions
                  let width = img.width;
                  let height = img.height;
                  
                  if (width > MAX_WIDTH) {
                      height = Math.round(height * (MAX_WIDTH / width));
                      width = MAX_WIDTH;
                  }
                  
                  canvas.width = width;
                  canvas.height = height;
                  
                  const ctx = canvas.getContext('2d');
                  ctx?.drawImage(img, 0, 0, width, height);
                  
                  // Aggressive Compression: Quality 0.5 (50%)
                  const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.5);
                  resolve(compressedDataUrl);
              };
          };
      });
  }

  goBack() {
      // If Editing, just close
      if (this.postToEdit()) {
          this.close.emit();
          return;
      }

      // Logic depends on mode and current step
      if (this.mode() === 'story') {
          this.close.emit();
          return;
      }

      if (this.step() === 'details') {
           const role = this.user()?.role;
           if (role === 'guide' || role === 'provider') {
               this.step.set('type_selection');
           } else {
               this.close.emit();
           }
      } else if (this.step() === 'edit') {
          // Back from filter
          if (this.mode() === 'story') {
             this.step.set('select');
          } else {
             this.step.set('details');
          }
      } else {
          this.close.emit();
      }
  }

  saveFilter() {
      if (this.mode() === 'story') {
          this.submit();
      } else {
          this.step.set('details');
      }
  }
  
  submit() {
    // Ensure processing is done
    if (this.isProcessing()) return;

    if (this.mode() === 'story') {
        if (!this.submissionData()) return;
        this.dataService.addStory(this.submissionData()!, this.currentFilter());
    } else {
        const isBusiness = this.postType() === 'business';
        
        if (isBusiness && !this.serviceTitle()) {
            alert('Please add a service title.');
            return;
        }

        const existing = this.postToEdit();
        if (existing) {
            // UPDATE LOGIC
            const updated: Post = {
                ...existing,
                content: this.postContent,
                mediaUrl: this.submissionData(), // Use compressed data
                mediaType: this.mediaType(),
                filter: this.currentFilter(),
                isService: isBusiness,
                price: this.price(),
                title: isBusiness ? this.serviceTitle() : undefined,
                maxCapacity: isBusiness ? this.maxCapacity() : undefined,
                location: this.location
            };
            this.dataService.updatePost(updated);
        } else {
            // CREATE LOGIC
            this.dataService.addPost(
              this.postContent,
              this.submissionData(), // Use compressed data
              this.mediaType(),
              isBusiness,
              this.currentFilter(),
              this.price(),
              isBusiness ? this.serviceTitle() : undefined,
              isBusiness ? this.maxCapacity() : undefined,
              this.location
            );
        }
    }

    // Reset
    this.postContent = '';
    this.displayUrl.set(undefined);
    this.submissionData.set(undefined);
    this.currentFilter.set('');
    this.price.set(undefined);
    this.serviceTitle.set('');
    this.maxCapacity.set(undefined);
    this.location = '';
    
    this.postCreated.emit();
    this.close.emit();
  }
}