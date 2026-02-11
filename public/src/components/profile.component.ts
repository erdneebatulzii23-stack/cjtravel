import { Component, inject, computed, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../services/data.service';
import { User, Post, Booking } from '../types';
import { CreatePostComponent } from './create-post.component';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, FormsModule, CreatePostComponent],
  template: `
    @if (profileUser(); as user) {
    <div class="bg-background-light dark:bg-background-dark min-h-screen pb-32 relative">
        
        <!-- PENDING STATUS BANNER -->
        @if (user.status === 'pending') {
            <div class="bg-orange-500 text-white p-3 text-center text-sm font-bold shadow-lg sticky top-0 z-[60]">
                {{dataService.text().pendingAccount}}
                <div class="text-[10px] font-normal opacity-90">{{dataService.text().pendingDesc}}</div>
                @if (isOwnProfile()) {
                    <button (click)="dataService.approveUser(user.id)" class="mt-2 bg-white text-orange-600 px-3 py-1 rounded-full text-xs font-bold hover:bg-orange-50">
                        {{dataService.text().approveSelf}}
                    </button>
                }
            </div>
        }

        <!-- 1. HEADER SECTION (Background + Avatar + Info) -->
        <div class="relative">
            <!-- Back/Menu Buttons -->
            <div class="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-20">
                 <button *ngIf="!isOwnProfile()" (click)="goBack()" class="p-2 rounded-full bg-black/20 text-white hover:bg-black/40 backdrop-blur-md transition-colors">
                    <span class="material-symbols-outlined text-2xl">arrow_back_ios_new</span>
                 </button>
                 <div *ngIf="isOwnProfile()" class="flex-1"></div>
                 <div class="flex gap-2">
                     <button (click)="dataService.sharePost()" class="p-2 rounded-full bg-black/20 text-white hover:bg-black/40 backdrop-blur-md transition-colors">
                        <span class="material-symbols-outlined text-2xl">share</span>
                     </button>
                     <button *ngIf="isOwnProfile()" (click)="toggleSettingsMenu()" class="p-2 rounded-full bg-black/20 text-white hover:bg-black/40 backdrop-blur-md transition-colors">
                        <span class="material-symbols-outlined text-2xl">menu</span>
                     </button>
                 </div>
            </div>

            <!-- Gradient Background -->
            <div class="h-40 bg-gradient-to-b from-[#1a472a] to-[#0f2819] rounded-b-[2.5rem]"></div>
            
            <!-- Avatar & Info Container -->
            <div class="px-4 -mt-16 text-center">
                 <!-- Avatar Image -->
                 <div class="relative inline-block mb-3">
                    <div class="p-1 rounded-full bg-[#0f2819] shadow-2xl">
                        <img [src]="user.avatar" loading="lazy" class="size-32 rounded-full object-cover border-4 border-[#1a472a]">
                    </div>
                </div>

                <h1 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-1 mb-1">
                    {{user.name}}
                    @if (user.role === 'provider' || user.role === 'guide') {
                        <span class="material-symbols-outlined text-green-600 fill-current text-xl">verified</span>
                    }
                </h1>
                
                <p class="text-green-700 dark:text-green-400 font-bold text-sm uppercase tracking-wide mb-1">{{user.role === 'guide' ? 'Professional Guide' : user.role}}</p>
                
                @if (user.location) {
                    <p class="text-gray-500 dark:text-gray-400 text-xs flex items-center justify-center gap-1 mb-4">
                        <span class="material-symbols-outlined text-sm">location_on</span> {{user.location}}
                    </p>
                }

                <!-- STATS ROW -->
                <div class="flex justify-between gap-3 mb-6">
                    <div class="flex-1 border border-green-800/20 dark:border-green-800/50 rounded-xl p-2 py-3 bg-white dark:bg-surface-dark/50">
                        <div class="text-lg font-bold text-gray-900 dark:text-white">{{userPosts().length}}</div>
                        <div class="text-[10px] uppercase text-gray-500 font-bold">Posts</div>
                    </div>
                    <div class="flex-1 border border-green-800/20 dark:border-green-800/50 rounded-xl p-2 py-3 bg-white dark:bg-surface-dark/50">
                        <div class="text-lg font-bold text-gray-900 dark:text-white">{{user.rating || '-'}}</div>
                        <div class="text-[10px] uppercase text-gray-500 font-bold">{{dataService.text().rating}}</div>
                    </div>
                    <div class="flex-1 border border-green-800/20 dark:border-green-800/50 rounded-xl p-2 py-3 bg-white dark:bg-surface-dark/50">
                        <div class="text-lg font-bold text-gray-900 dark:text-white">{{user.followers.length}}</div>
                        <div class="text-[10px] uppercase text-gray-500 font-bold">Followers</div>
                    </div>
                </div>

                <!-- BIO & INFO SECTION -->
                <div class="text-left mb-6">
                    <h3 class="text-base font-bold text-gray-900 dark:text-white mb-2">
                        {{ user.role === 'provider' ? 'About Company' : dataService.text().aboutMe }}
                    </h3>
                    
                    <p class="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
                        {{user.bio || 'No info available yet.'}}
                    </p>

                    @if (user.role === 'provider' || user.role === 'guide') {
                        <div class="grid grid-cols-2 gap-3 mt-4">
                            <!-- Phone -->
                            <div class="bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-800 p-3 rounded-xl flex flex-col items-center justify-center text-center gap-1 shadow-sm">
                                 <span class="material-symbols-outlined text-purple-500 bg-purple-50 dark:bg-purple-900/20 p-2 rounded-full">call</span>
                                 <span class="text-xs font-bold dark:text-white break-all">{{user.phone || 'No phone'}}</span>
                                 <span class="text-[10px] text-gray-400 uppercase font-bold">Contact</span>
                            </div>
                            <!-- Email -->
                            <div class="bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-800 p-3 rounded-xl flex flex-col items-center justify-center text-center gap-1 shadow-sm">
                                 <span class="material-symbols-outlined text-blue-500 bg-blue-50 dark:bg-blue-900/20 p-2 rounded-full">mail</span>
                                 <span class="text-xs font-bold dark:text-white truncate w-full">{{user.email}}</span>
                                 <span class="text-[10px] text-gray-400 uppercase font-bold">Email</span>
                            </div>

                            @if (user.role === 'provider') {
                                <!-- Opening Hours -->
                                <div class="bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-800 p-3 rounded-xl flex flex-col items-center justify-center text-center gap-1 shadow-sm">
                                     <span class="material-symbols-outlined text-green-500 bg-green-50 dark:bg-green-900/20 p-2 rounded-full">schedule</span>
                                     <span class="text-xs font-bold dark:text-white">Open Daily</span>
                                     <span class="text-[10px] text-gray-400 font-medium">09:00 - 20:00</span>
                                </div>
                                <!-- Website -->
                                <div class="bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-800 p-3 rounded-xl flex flex-col items-center justify-center text-center gap-1 shadow-sm">
                                     <span class="material-symbols-outlined text-orange-500 bg-orange-50 dark:bg-orange-900/20 p-2 rounded-full">language</span>
                                     <span class="text-xs font-bold dark:text-white">Website</span>
                                     <span class="text-[10px] text-gray-400 font-medium">Visit Site</span>
                                </div>
                            } @else {
                                <!-- Verified -->
                                <div class="bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-800 p-3 rounded-xl flex flex-col items-center justify-center text-center gap-1 shadow-sm">
                                     <span class="material-symbols-outlined text-green-500 bg-green-50 dark:bg-green-900/20 p-2 rounded-full">verified</span>
                                     <span class="text-xs font-bold dark:text-white">Verified</span>
                                     <span class="text-[10px] text-gray-400 font-medium">Identity</span>
                                </div>

                                <!-- Languages -->
                                <div class="bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-800 p-3 rounded-xl flex flex-col items-center justify-center text-center gap-1 shadow-sm relative overflow-hidden">
                                     <div class="absolute top-1 right-1 opacity-10">
                                         <span class="material-symbols-outlined text-lg">translate</span>
                                     </div>
                                     
                                     <div class="flex flex-wrap justify-center gap-1 w-full max-h-16 overflow-y-auto no-scrollbar">
                                         @if (user.languages && user.languages.length > 0) {
                                             @for (lang of user.languages; track lang) {
                                                 <span class="text-[10px] font-bold bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded-md border border-orange-100 dark:border-orange-900/30 whitespace-nowrap uppercase">
                                                    {{getShortLang(lang)}}
                                                 </span>
                                             }
                                         } @else {
                                             <span class="text-xs text-gray-400 italic">No languages</span>
                                         }
                                     </div>
                                </div>
                            }
                        </div>
                    }

                    @if(user.role === 'traveler' && user.languages && user.languages.length > 0) {
                        <div class="flex flex-wrap gap-2 mt-4">
                            @for(lang of user.languages; track lang) {
                                <span class="px-3 py-1 bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-white rounded-full text-[10px] font-bold uppercase tracking-wider">
                                    {{getShortLang(lang)}}
                                </span>
                            }
                        </div>
                    }
                </div>

                <!-- PROFILE ACTION BUTTONS -->
                @if (isOwnProfile() || (user.role === 'traveler')) {
                    <div class="flex gap-3 mb-6">
                        @if (isOwnProfile()) {
                            <button (click)="openEditModal()" class="flex-1 bg-gray-200 dark:bg-slate-800 text-gray-900 dark:text-white py-3 rounded-xl text-sm font-bold shadow-sm active:scale-95 transition-transform">
                                Edit Profile
                            </button>
                        } @else {
                            <button (click)="toggleFollow()" 
                               [class]="isFollowing() ? 'bg-gray-200 dark:bg-slate-800 text-gray-900 dark:text-white' : 'bg-green-600 text-white shadow-lg shadow-green-600/30'"
                               class="flex-1 py-3 rounded-xl text-sm font-bold transition-all active:scale-95 flex items-center justify-center gap-2">
                               @if(isFollowing()) {
                                   <span class="material-symbols-outlined text-sm">check</span> Following
                               } @else {
                                   Follow
                               }
                            </button>
                            <button (click)="startChat()" class="flex-1 bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white py-3 rounded-xl text-sm font-bold active:scale-95 transition-transform">
                                Message
                            </button>
                        }
                    </div>
                }
            </div>
        </div>

        <!-- 2. SERVICES LIST -->
        @if (user.role === 'guide' || user.role === 'provider') {
            <div class="px-4 mb-8">
                <div class="flex justify-between items-center mb-3">
                    <h3 class="text-base font-bold text-gray-900 dark:text-white">
                        {{dataService.text().viewServices}}
                    </h3>
                    @if (isOwnProfile()) {
                        <button (click)="createNewService()" class="text-xs font-bold text-white bg-green-600 px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-green-700 transition-colors">
                            <span class="material-symbols-outlined text-sm">add</span> Add New
                        </button>
                    }
                </div>
                
                <div class="flex flex-col gap-3">
                    @for(service of userServices(); track service.id) {
                        <div class="bg-[#1a472a]/5 dark:bg-[#1a472a]/20 border border-green-800/10 dark:border-green-800/30 rounded-2xl p-4 flex items-center justify-between shadow-sm cursor-pointer hover:bg-[#1a472a]/10 transition-colors group" (click)="openServiceDetail(service)">
                            <div class="flex items-center gap-3">
                                <div class="size-10 rounded-xl bg-[#1a472a] text-white flex items-center justify-center shadow-md">
                                    <span class="material-symbols-outlined text-xl">
                                        {{service.title?.toLowerCase()?.includes('horse') ? 'bedroom_baby' : service.title?.toLowerCase()?.includes('boat') ? 'directions_boat' : 'hiking'}}
                                    </span>
                                </div>
                                <div>
                                    <h4 class="font-bold text-gray-900 dark:text-white text-sm">{{service.title || 'Service'}}</h4>
                                    <p class="text-xs text-gray-500 dark:text-gray-400">{{service.content | slice:0:20}}...</p>
                                </div>
                            </div>
                            <span class="text-green-700 dark:text-green-400 font-bold text-sm">\${{service.price}}</span>
                        </div>
                    }
                    @if (userServices().length === 0) {
                        <div class="text-center py-6 text-gray-400 text-sm border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                            No services available.
                        </div>
                    }
                </div>
            </div>
        }

        <!-- 3. PREVIOUS TRIPS (Photo Grid) -->
        <div class="px-4">
            <h3 class="text-base font-bold text-gray-900 dark:text-white mb-3">
                {{ user.role === 'traveler' ? 'My Travels' : 'Previous Trips' }}
            </h3>
            
            <div class="grid grid-cols-2 gap-2">
                @for (post of userStandardPosts(); track post.id) {
                    <div class="relative aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-surface-dark cursor-pointer group shadow-sm" (click)="viewPost(post)">
                        @if (post.mediaUrl) {
                            <img [src]="post.mediaUrl" loading="lazy" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" [style.filter]="post.filter">
                        } @else {
                            <div class="w-full h-full flex items-center justify-center text-gray-400 text-xs p-2 text-center font-medium">
                                {{post.content}}
                            </div>
                        }
                    </div>
                }
                @if (userStandardPosts().length === 0) {
                    <div class="col-span-2 py-8 flex flex-col items-center justify-center text-gray-400 border border-gray-200 dark:border-gray-800 rounded-xl border-dashed">
                        <span class="material-symbols-outlined text-3xl mb-1 opacity-50">photo_library</span>
                        <span class="text-xs">No photos yet</span>
                    </div>
                }
            </div>
        </div>

        <!-- STICKY BOOK BUTTON -->
        @if (!isOwnProfile() && (user.role === 'guide' || user.role === 'provider')) {
            <div class="fixed bottom-0 left-0 right-0 p-4 bg-white/90 dark:bg-[#101922]/90 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800 z-[100] pb-6 animate-in slide-in-from-bottom duration-300">
                <button (click)="openBookingModal()" class="w-full bg-[#00d632] hover:bg-[#00c22d] text-[#052e16] py-4 rounded-2xl font-bold text-lg shadow-xl shadow-green-500/20 flex items-center justify-center gap-2 active:scale-95 transition-transform">
                    <span class="material-symbols-outlined font-bold">verified_user</span>
                    {{dataService.text().bookNow}}
                </button>
            </div>
        }
    </div>

    <!-- SERVICE DETAIL MODAL -->
    @if (viewingService(); as service) {
         <div class="fixed inset-0 z-[120] flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" (click)="closeServiceDetail()">
             <div class="bg-white dark:bg-surface-dark w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]" (click)="$event.stopPropagation()">
                 
                 <!-- Media Header -->
                 <div class="relative h-64 bg-black">
                     @if (service.mediaUrl) {
                        @if (service.mediaType === 'video') {
                             <video [src]="service.mediaUrl" controls class="w-full h-full object-contain"></video>
                        } @else {
                             <img [src]="service.mediaUrl" [style.filter]="service.filter" class="w-full h-full object-cover">
                        }
                     } @else {
                        <div class="w-full h-full flex items-center justify-center bg-[#1a472a]">
                            <span class="material-symbols-outlined text-6xl text-white/50">storefront</span>
                        </div>
                     }
                     <button (click)="closeServiceDetail()" class="absolute top-4 right-4 bg-black/50 text-white rounded-full p-2 hover:bg-black/70 transition-colors">
                         <span class="material-symbols-outlined">close</span>
                     </button>
                 </div>

                 <!-- Content -->
                 <div class="p-6 flex-1 overflow-y-auto">
                     <div class="flex justify-between items-start mb-2">
                         <h2 class="text-2xl font-bold text-gray-900 dark:text-white">{{service.title}}</h2>
                         <span class="text-xl font-bold text-green-600">\${{service.price}}</span>
                     </div>
                     
                     <div class="flex gap-2 mb-4">
                         @if(service.maxCapacity) {
                             <span class="text-xs bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 px-2 py-1 rounded flex items-center gap-1">
                                 <span class="material-symbols-outlined text-[10px]">group</span> Max {{service.maxCapacity}}
                             </span>
                         }
                         <span class="text-xs bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 px-2 py-1 rounded flex items-center gap-1">
                             <span class="material-symbols-outlined text-[10px]">location_on</span> {{service.location}}
                         </span>
                     </div>

                     <p class="text-gray-600 dark:text-gray-300 leading-relaxed text-sm mb-6">
                         {{service.content}}
                     </p>

                     @if (isOwnProfile()) {
                         <div class="flex gap-3">
                             <button (click)="editService(service)" class="flex-1 bg-gray-200 dark:bg-slate-700 text-gray-900 dark:text-white font-bold py-3.5 rounded-xl shadow-sm hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors flex items-center justify-center gap-2">
                                 <span class="material-symbols-outlined text-sm">edit</span> Edit
                             </button>
                             <button (click)="deleteService(service)" class="flex-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-bold py-3.5 rounded-xl shadow-sm hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors flex items-center justify-center gap-2">
                                 <span class="material-symbols-outlined text-sm">delete</span> Delete
                             </button>
                         </div>
                     } @else {
                         <button (click)="openBookingModal(service)" class="w-full bg-[#00d632] hover:bg-[#00c22d] text-[#052e16] font-bold py-3.5 rounded-xl shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2">
                             <span class="material-symbols-outlined">calendar_month</span>
                             Book This Service
                         </button>
                     }
                 </div>
             </div>
         </div>
    }

    <!-- SERVICE EDITOR MODAL -->
    @if (showServiceEditor()) {
        <app-create-post 
            [mode]="'post'" 
            [postToEdit]="editingServicePost()" 
            (close)="closeServiceEditor()" 
            (postCreated)="closeServiceEditor()">
        </app-create-post>
    }

    <!-- BOOKING MODAL -->
    @if (showBookingModal()) {
        <div class="fixed inset-0 z-[130] flex items-end sm:items-center justify-center px-4 py-6">
             <div class="absolute inset-0 bg-black/80" (click)="closeBookingModal()"></div>
             <div class="relative w-full max-w-sm bg-white dark:bg-surface-dark rounded-3xl shadow-2xl p-6 animate-in slide-in-from-bottom duration-200">
                 <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4">Book {{profileUser()?.name}}</h3>
                 
                 <div class="space-y-4">
                     <!-- Service Name Input -->
                     <div>
                        <label class="block text-xs font-bold text-gray-500 mb-1">Service / Request</label>
                        <input type="text" [(ngModel)]="bookingForm.serviceName" placeholder="Type what you want to book..." class="w-full bg-gray-50 dark:bg-slate-800 border-none rounded-xl p-3 text-sm dark:text-white font-medium">
                     </div>

                     <div>
                         <label class="block text-xs font-bold text-gray-500 mb-1">Date</label>
                         <input type="date" [(ngModel)]="bookingForm.date" class="w-full bg-gray-50 dark:bg-slate-800 border-none rounded-xl p-3 text-sm dark:text-white">
                     </div>
                     
                     <div>
                         <label class="block text-xs font-bold text-gray-500 mb-1">Guests</label>
                         <input type="number" [(ngModel)]="bookingForm.people" (input)="calculateTotal()" min="1" max="20" class="w-full bg-gray-50 dark:bg-slate-800 border-none rounded-xl p-3 text-sm dark:text-white">
                     </div>

                     @if(bookingForm.totalPrice > 0) {
                         <div class="flex justify-between items-center bg-green-50 dark:bg-green-900/20 p-3 rounded-xl border border-green-100 dark:border-green-800">
                             <span class="text-sm text-green-700 dark:text-green-300 font-bold">Total Price (Est.)</span>
                             <span class="text-xl text-green-600 dark:text-green-400 font-bold">\${{bookingForm.totalPrice}}</span>
                         </div>
                     }

                     <div>
                         <label class="block text-xs font-bold text-gray-500 mb-1">Notes</label>
                         <textarea [(ngModel)]="bookingForm.notes" placeholder="Any special requests?" class="w-full bg-gray-50 dark:bg-slate-800 border-none rounded-xl p-3 text-sm dark:text-white resize-none h-20"></textarea>
                     </div>
                     
                     <button (click)="submitBooking()" class="w-full bg-[#00d632] hover:bg-[#00c22d] text-[#052e16] font-bold py-3 rounded-xl shadow-lg shadow-green-500/30 active:scale-95 transition-transform">
                         Confirm Request
                     </button>
                 </div>
             </div>
        </div>
    }

    <!-- SETTINGS MODAL -->
    @if (showSettingsMenu()) {
        <div class="fixed inset-0 z-[110] flex items-end justify-center px-4 py-6">
             <div class="absolute inset-0 bg-black/50" (click)="toggleSettingsMenu()"></div>
             <div class="relative w-full max-w-sm bg-white dark:bg-surface-dark rounded-3xl shadow-xl p-4 animate-in slide-in-from-bottom duration-200">
                  <h3 class="font-bold text-center mb-4 dark:text-white">Settings</h3>
                  <div class="space-y-2">
                       <button (click)="dataService.logout()" class="w-full bg-red-50 text-red-600 font-bold py-3 rounded-xl">Logout</button>
                       <button (click)="toggleSettingsMenu()" class="w-full text-gray-500 py-3 font-medium">Cancel</button>
                  </div>
             </div>
        </div>
    }

    <!-- EDIT PROFILE MODAL -->
    @if (showEditModal()) {
        <div class="fixed inset-0 z-[120] flex items-center justify-center px-4">
             <div class="absolute inset-0 bg-black/80" (click)="showEditModal.set(false)"></div>
             <div class="relative w-full max-w-sm bg-white dark:bg-surface-dark rounded-2xl shadow-xl p-6 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                 <h3 class="font-bold mb-4 dark:text-white">Edit Profile</h3>
                 
                 <div class="space-y-3">
                     <div>
                        <label class="text-xs font-bold text-gray-500">Avatar URL</label>
                        <input [(ngModel)]="editForm.avatar" class="w-full bg-gray-50 dark:bg-slate-800 border-none rounded-lg text-sm dark:text-white p-2">
                     </div>
                     <div>
                        <label class="text-xs font-bold text-gray-500">Full Name</label>
                        <input [(ngModel)]="editForm.name" class="w-full bg-gray-50 dark:bg-slate-800 border-none rounded-lg text-sm dark:text-white p-2">
                     </div>
                     <div>
                        <label class="text-xs font-bold text-gray-500">Bio</label>
                        <textarea [(ngModel)]="editForm.bio" class="w-full bg-gray-50 dark:bg-slate-800 border-none rounded-lg text-sm dark:text-white p-2 h-20"></textarea>
                     </div>
                     <div>
                        <label class="text-xs font-bold text-gray-500">Location</label>
                        <input [(ngModel)]="editForm.location" class="w-full bg-gray-50 dark:bg-slate-800 border-none rounded-lg text-sm dark:text-white p-2">
                     </div>
                     <div>
                        <label class="text-xs font-bold text-gray-500">Phone</label>
                        <input [(ngModel)]="editForm.phone" class="w-full bg-gray-50 dark:bg-slate-800 border-none rounded-lg text-sm dark:text-white p-2">
                     </div>
                     <button (click)="saveProfile()" class="w-full bg-primary text-white font-bold py-3 rounded-xl mt-2">Save Changes</button>
                 </div>
             </div>
        </div>
    }
    }
  `
})
export class ProfileComponent {
  dataService = inject(DataService);

  // Computeds
  profileUser = computed(() => this.dataService.viewingUser() || this.dataService.currentUser());
  isOwnProfile = computed(() => this.dataService.currentUser()?.id === this.profileUser()?.id);
  
  userPosts = computed(() => this.dataService.posts().filter(p => p.userId === this.profileUser()?.id));
  
  // Split posts into Standard vs Services
  userServices = computed(() => this.userPosts().filter(p => p.isService));
  userStandardPosts = computed(() => this.userPosts().filter(p => !p.isService));

  isFollowing = computed(() => {
     const me = this.dataService.currentUser();
     const target = this.profileUser();
     if (!me || !target) return false;
     return me.following.includes(target.id);
  });

  // State for Modals
  showBookingModal = signal(false);
  showServiceEditor = signal(false);
  showSettingsMenu = signal(false);
  showEditModal = signal(false);
  
  // Detail Views
  viewingService = signal<Post | null>(null);
  editingServicePost = signal<Post | null>(null);

  // Review State
  showReviewModal = signal(false);
  reviewForm = { rating: 0, text: '' };

  // Forms
  bookingForm = { serviceName: '', date: '', people: 1, notes: '', totalPrice: 0 };
  editForm: any = {};

  // -- METHODS --
  
  goBack() {
      this.dataService.viewingUser.set(null);
  }

  toggleFollow() {
      const u = this.profileUser();
      if (u) this.dataService.toggleFollow(u.id);
  }

  startChat() {
      const u = this.profileUser();
      if (u) this.dataService.startChat(u);
  }
  
  toggleSettingsMenu() {
      this.showSettingsMenu.update(v => !v);
  }

  // --- SERVICE / POST LOGIC ---
  viewPost(post: Post) {
      this.dataService.activeOverlay.set(null);
      this.dataService.viewingUser.set(null); // Go to feed context
      this.dataService.openPost(post.id);
  }
  
  createNewService() {
      this.editingServicePost.set(null);
      this.showServiceEditor.set(true);
  }
  
  editService(post: Post) {
      this.editingServicePost.set(post);
      this.showServiceEditor.set(true);
      this.closeServiceDetail();
  }
  
  deleteService(post: Post) {
      if(confirm('Delete this service?')) {
          this.dataService.deletePost(post.id);
          this.closeServiceDetail();
      }
  }

  openServiceDetail(post: Post) {
      this.viewingService.set(post);
  }
  
  closeServiceDetail() {
      this.viewingService.set(null);
  }

  closeServiceEditor() {
      this.showServiceEditor.set(false);
      this.editingServicePost.set(null);
  }

  // --- BOOKING LOGIC ---
  openBookingModal(specificService?: Post) {
      this.bookingForm = {
          serviceName: specificService ? specificService.title || 'Service' : '',
          date: '',
          people: 1,
          notes: '',
          totalPrice: specificService ? (specificService.price || 0) : 0
      };
      this.showBookingModal.set(true);
  }

  closeBookingModal() {
      this.showBookingModal.set(false);
  }

  calculateTotal() {
      // Simplified: Price logic would go here
  }

  submitBooking() {
      const u = this.profileUser();
      if (u) {
          this.dataService.createBooking(
              u.id, 
              u.name, 
              new Date(this.bookingForm.date), 
              this.bookingForm.people, 
              this.bookingForm.notes,
              this.bookingForm.totalPrice,
              this.bookingForm.serviceName
          );
          alert('Booking Request Sent!');
          this.closeBookingModal();
      }
  }

  // --- EDIT PROFILE ---
  openEditModal() {
      const u = this.profileUser();
      if (u) {
          this.editForm = { ...u };
          this.showEditModal.set(true);
      }
  }
  
  saveProfile() {
      this.dataService.updateProfile(this.editForm);
      this.showEditModal.set(false);
  }

  getShortLang(lang: string) {
      return lang.substring(0, 3);
  }
}