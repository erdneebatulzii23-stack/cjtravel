import { Injectable, signal, computed, effect, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { User, Post, UserRole, Message, Story, Booking, AppNotification, NotificationType, Review } from '../types';

export type AppLang = 'en' | 'mn' | 'zh' | 'de' | 'ru' | 'ko' | 'ja';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  // SSR дээр алдаа гарахаас сэргийлж platformId ашиглана
  private platformId = inject(PLATFORM_ID);
  
  isOnline = signal(true);
  currentUser = signal<User | null>(null);
  viewingUser = signal<User | null>(null);
  activeOverlay = signal<'translator' | 'chat' | 'notifications' | 'call' | 'story_viewer' | 'lang_selector' | 'booking' | 'approvals' | null>(null);
  activePost = signal<Post | null>(null);
  langSelectorContext = signal<'source' | 'target'>('source');
  activeChatUser = signal<User | null>(null);
  chatBackground = signal<string>('');
  callType = signal<'video' | 'audio'>('video');
  callStatus = signal<'calling' | 'connected' | 'ended'>('calling');
  callStartTime = signal<number>(0);
  activeStory = signal<Story | null>(null);
  currentLang = signal<AppLang>('en');

  // Translations (Товчлов)
  private translations: Record<AppLang, any> = {
    // ... Таны орчуулгын код хэвээрээ ...
    // ЭНД ОРЧУУЛГЫН УРТ ТЕКСТҮҮД БАЙГАА (Өмнөхөөсөө хуулж аваарай эсвэл хэвээр нь үлдээгээрэй)
    en: { appName: 'CJ Travel', slogan: 'Connect. Share. Explore.', signIn: 'Sign In', register: 'Register', email: 'EMAIL', password: 'PASSWORD', fullName: 'FULL NAME', iAmA: 'I AM A', createAccount: 'Create Account', travelFeed: 'Travel Feed', recentUpdates: 'Recent Updates', topGuides: 'Nearby Pro Guides', allGuides: 'All Guides', providers: 'Service Providers', viewServices: 'View Services', seeAll: 'See All', search: 'Search...', home: 'Home', explore: 'Explore', bookings: 'Bookings', profile: 'Profile', posts: 'Posts', followers: 'Followers', following: 'Following', editProfile: 'Edit Profile', follow: 'Follow', message: 'Message', logout: 'Log Out', newPost: 'New Post', whatsOnYourMind: "What's on your mind?", post: 'Post', translatorTitle: 'Live Translator', chatTitle: 'Messages', notifications: 'Notifications', typeToTranslate: 'Type to translate...', translating: 'Translating...', listening: 'Listening...', calling: 'Calling...', incomingCall: 'Incoming Call', changeBg: 'Change Background', autoPlay: 'Auto-play Audio', missedCall: 'Missed Call', callEnded: 'Call Ended', bio: 'Bio', stories: 'Stories', delete: 'Delete', report: 'Report', selectLanguage: 'Select Language', searchLanguage: 'Search language...', roles: { traveler: 'Traveler', guide: 'Guide', provider: 'Provider', admin: 'Admin' }, bookNow: 'Book Now', pendingAccount: 'Account Pending', pendingDesc: 'Your account is under review.', approveSelf: 'Simulate Admin Approval', choosePostType: 'Choose Post Type', standardPost: 'Standard Post', standardDesc: 'Share photos, videos.', businessPost: 'Business Service', businessDesc: 'List a tour or service.', serviceTitle: 'Service Title', pricePerPerson: 'Price (per person)', maxCapacity: 'Max Capacity', description: 'Description', location: 'Location', locationPlaceholder: 'Search or type location...', offlineMode: 'Offline Mode', offlineDesc: 'Check your internet connection.', viewMap: 'Map View', viewList: 'List View', approvals: 'Admin Panel', pendingUsers: 'Pending Users', reportedPosts: 'Reported Content', noApprovals: 'No pending requests', noReports: 'No reported posts', approve: 'Approve', reject: 'Reject', warn: 'Warn', dismiss: 'Dismiss', warningIssued: 'Official Warning Issued', leaveReview: 'Leave Review', reviews: 'Reviews', rating: 'Rating', writeReviewPlaceholder: 'Write your experience...', submitReview: 'Submit Review', reportReason: 'Reason for reporting', reasons: { spam: 'Spam', scam: 'Scam/Fraud', inappropriate: 'Inappropriate Content', harassment: 'Harassment', other: 'Other' }, shareTo: 'Share to', copyLink: 'Copy Link', copied: 'Copied!', languages: 'Languages', aboutMe: 'About Me' },
    // ... Бусад хэлүүд ...
  } as any; // "as any" гэж түр тавьлаа, typescript алдаа гаргахгүй байх үүднээс.

  text = computed(() => {
     const lang = this.currentLang();
     // Хэрэв орчуулга дутуу байвал 'en'-ийг default болгоно
     const base = this.translations['en'] || {};
     const current = this.translations[lang] || base;
     return { ...base, ...current };
  });

  translatorLanguages = [
    { code: 'mn', name: 'Mongolian' }, { code: 'en', name: 'English' }, { code: 'zh', name: 'Chinese' },
    { code: 'ru', name: 'Russian' }, { code: 'ja', name: 'Japanese' }, { code: 'ko', name: 'Korean' },
    { code: 'de', name: 'German' }, { code: 'fr', name: 'French' }, { code: 'es', name: 'Spanish' },
    { code: 'it', name: 'Italian' }, { code: 'th', name: 'Thai' }, { code: 'vi', name: 'Vietnamese' }
  ];

  private _users = signal<User[]>([]);
  private _posts = signal<Post[]>([]);
  private _stories = signal<Story[]>([]);
  private _messages = signal<Message[]>([]);
  private _notifications = signal<AppNotification[]>([]);
  private _bookings = signal<Booking[]>([]);

  users = this._users.asReadonly();
  posts = this._posts.asReadonly();
  stories = this._stories.asReadonly();
  messages = this._messages.asReadonly();
  notifications = this._notifications.asReadonly();
  bookings = this._bookings.asReadonly();
  
  pendingUsers = computed(() => {
     return this._users().filter(u => u.status === 'pending');
  });

  reportedPosts = computed(() => {
      return this._posts().filter(p => p.reports && p.reports.length > 0);
  });

  constructor() {
     // ЗӨВХӨН BROWSER ДЭЭР АЖИЛЛАНА (SSR ҮЕД АЛГАСНА)
     if (isPlatformBrowser(this.platformId)) {
         this.checkOnlineStatus();
         this.loadFromStorage();

         window.addEventListener('online', () => this.isOnline.set(true));
         window.addEventListener('offline', () => this.isOnline.set(false));

         // Effect дотор localStorage ашиглаж байгаа тул мөн адил шалгах хэрэгтэй
         effect(() => { localStorage.setItem('cj_users', JSON.stringify(this._users())); });
         effect(() => { localStorage.setItem('cj_posts', JSON.stringify(this._posts())); });
         effect(() => { localStorage.setItem('cj_stories', JSON.stringify(this._stories())); });
         effect(() => { localStorage.setItem('cj_messages', JSON.stringify(this._messages())); });
         effect(() => { localStorage.setItem('cj_notifications', JSON.stringify(this._notifications())); });
         effect(() => { localStorage.setItem('cj_bookings', JSON.stringify(this._bookings())); });
         effect(() => { 
             if (this.currentUser()) {
                 localStorage.setItem('cj_current_user', JSON.stringify(this.currentUser()));
             } else {
                 localStorage.removeItem('cj_current_user');
             }
         });
     }
  }

  private checkOnlineStatus() {
      if (typeof navigator !== 'undefined') {
          this.isOnline.set(navigator.onLine);
      }
  }

  private loadFromStorage() {
      // LocalStorage байхгүй бол юу ч хийхгүй (Server дээр алдаа гаргахгүй)
      if (typeof localStorage === 'undefined') return;

      try {
          const savedUsers = localStorage.getItem('cj_users');
          if (savedUsers) {
              const users = JSON.parse(savedUsers);
              this._users.set(users.map((u: any) => ({
                  ...u, 
                  rating: u.rating || 0,
                  reviews: u.reviews || [],
                  languages: u.languages || (u.role === 'guide' ? ['Mongolian', 'English'] : ['Mongolian'])
              })));
          } else {
              // Default data (Анхны өгөгдөл)
              this._users.set([
                { id: 'admin', name: 'Super Admin', role: 'admin', status: 'active', avatar: 'https://ui-avatars.com/api/?name=Admin&background=000&color=fff', email: 'admin@cjtravel.com', password: '1234', phone: '0000', followers: [], following: [], settings: {showEmail:false, showPhone:false}, bio: 'System Administrator', rating: 0, reviews: [], languages: ['Mongolian'] },
                { id: 'u1', name: 'Alex Guide', role: 'guide', status: 'active', avatar: 'https://ui-avatars.com/api/?name=Alex+G&background=random', email: 'alex@cjtravel.com', password: '123', phone: '9911', followers: [], following: [], settings: {showEmail:true, showPhone:true}, location: 'Khatgal, Mongolia', bio: 'Professional guide specializing in Khuvsgul Lake tours.', coordinates: {x: 45, y: 30}, locationCoords: { lat: 47.9188, lng: 106.9176 }, rating: 4.9, reviews: [{id: 'r1', authorId: 'u2', authorName: 'Sarah T', authorAvatar: 'https://ui-avatars.com/api/?name=Sarah+T&background=random', rating: 5, text: 'Amazing guide!', createdAt: new Date()}], languages: ['Mongolian', 'English'] },
                { id: 'u2', name: 'Sarah T', role: 'traveler', status: 'active', avatar: 'https://ui-avatars.com/api/?name=Sarah+T&background=random', email: 'sarah@gmail.com', password: '123', phone: '8811', followers: [], following: [], settings: {showEmail:false, showPhone:false}, location: 'USA', bio: 'Love exploring new cultures.', coordinates: {x: 20, y: 50}, locationCoords: { lat: 47.9250, lng: 106.9100 }, rating: 0, reviews: [], languages: ['English'] },
                { id: 'u3', name: 'Gobi Camp', role: 'provider', status: 'active', avatar: 'https://ui-avatars.com/api/?name=Gobi+C&background=random', email: 'contact@nomadcamp.mn', password: '123', phone: '7711', followers: [], following: [], settings: {showEmail:true, showPhone:true}, location: 'Gobi', bio: 'Best Camp experience in Gobi.', coordinates: {x: 60, y: 70}, locationCoords: { lat: 43.5, lng: 105.0 }, rating: 0, reviews: [], languages: ['Mongolian', 'English', 'Chinese'] }
              ]);
          }

          // Ensure coordinates
          this._users.update(users => users.map(u => {
              let updated = {...u};
              if (!updated.locationCoords && updated.role !== 'admin') {
                 const baseLat = 47.9188;
                 const baseLng = 106.9176;
                 updated.locationCoords = {
                     lat: baseLat + (Math.random() - 0.5) * 0.1,
                     lng: baseLng + (Math.random() - 0.5) * 0.1
                 };
              }
              return updated;
          }));

          const savedCu = localStorage.getItem('cj_current_user');
          if (savedCu) this.currentUser.set(JSON.parse(savedCu));

          const savedPosts = localStorage.getItem('cj_posts');
          if (savedPosts) {
              const parsedPosts = JSON.parse(savedPosts);
              this._posts.set(parsedPosts.map((p: any) => ({
                  ...p, 
                  reports: Array.isArray(p.reports) && typeof p.reports[0] === 'string' ? [] : (p.reports || []), 
                  warning: p.warning || undefined
              })));
          } else {
              this._posts.set([
                  { id: 'p1', userId: 'u1', userName: 'Alex Guide', userAvatar: 'https://ui-avatars.com/api/?name=Alex+G&background=random', userRole: 'guide', content: 'Horseback riding tour in Khuvsgul.', mediaUrl: 'https://picsum.photos/seed/horse/600/400', mediaType: 'image', likes: 12, likedBy: [], comments: [], createdAt: new Date(), isService: true, title: 'Horse Trip', price: 85000, maxCapacity: 5, location: 'Khatgal', reports: [] },
                  { id: 'p2', userId: 'u1', userName: 'Alex Guide', userAvatar: 'https://ui-avatars.com/api/?name=Alex+G&background=random', userRole: 'guide', content: 'Boat trip on the lake.', mediaUrl: 'https://picsum.photos/seed/boat/600/400', mediaType: 'image', likes: 8, likedBy: [], comments: [], createdAt: new Date(), isService: true, title: 'Boat Trip', price: 120000, maxCapacity: 10, location: 'Khatgal', reports: [] }
              ]);
          }

          const savedStories = localStorage.getItem('cj_stories');
          if (savedStories) this._stories.set(JSON.parse(savedStories));

          const savedMsgs = localStorage.getItem('cj_messages');
          if (savedMsgs) this._messages.set(JSON.parse(savedMsgs).map((m:any) => ({...m, timestamp: new Date(m.timestamp)})));

          const savedNotifs = localStorage.getItem('cj_notifications');
          if (savedNotifs) this._notifications.set(JSON.parse(savedNotifs).map((n:any) => ({...n, createdAt: new Date(n.createdAt)})));

          const savedBookings = localStorage.getItem('cj_bookings');
          if (savedBookings) this._bookings.set(JSON.parse(savedBookings).map((b:any) => ({...b, date: new Date(b.date), createdAt: new Date(b.createdAt)})));

      } catch (e) {
          console.error("Local Storage Error (Clearing corrupted data):", e);
          localStorage.clear(); 
      }
  }

  // ... (Үлдсэн функцууд хэвээрээ: login, register, logout, addPost гэх мэт)
  myNotifications = computed(() => {
     const uid = this.currentUser()?.id;
     if (!uid) return [];
     return this._notifications()
        .filter(n => n.recipientId === uid)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  });
  
  hasUnreadNotifications = computed(() => {
      return this.myNotifications().some(n => !n.isRead);
  });

  login(email: string, pass: string): boolean {
    const user = this._users().find(u => u.email === email && u.password === pass);
    if (user) {
      this.currentUser.set(user);
      return true;
    }
    return false;
  }

  register(name: string, email: string, pass: string, role: UserRole): boolean {
    const exists = this._users().find(u => u.email === email);
    if (exists) return false;
    const newUser: User = {
      id: `u_${Date.now()}`, name, email, password: pass, role, status: role === 'traveler' ? 'active' : 'pending',
      avatar: `https://ui-avatars.com/api/?name=${name}&background=random`, phone: '', bio: '', location: '', followers: [], following: [], highlights: [], settings: { showEmail: false, showPhone: false }, 
      coordinates: {x: 50, y: 50},
      locationCoords: { lat: 47.9188 + (Math.random() - 0.5)*0.1, lng: 106.9176 + (Math.random() - 0.5)*0.1 },
      rating: 0, reviews: [],
      languages: role === 'guide' ? ['Mongolian', 'English'] : ['Mongolian']
    };
    this._users.update(u => [...u, newUser]);
    this.currentUser.set(newUser);
    return true;
  }

  logout() {
    this.currentUser.set(null);
    this.viewingUser.set(null);
    this.activeOverlay.set(null);
  }

  addPost(content: string, mediaUrl: string | undefined, mediaType: 'image' | 'video' | undefined, isService: boolean, filter?: string, price?: number, title?: string, maxCapacity?: number, location?: string) {
      const u = this.currentUser();
      if (!u) return;
      const newPost: Post = {
          id: `p_${Date.now()}`, userId: u.id, userName: u.name, userAvatar: u.avatar, userRole: u.role,
          content, mediaUrl, mediaType, filter, location: location || u.location, likes: 0, likedBy: [], comments: [], createdAt: new Date(), isService, price, title, maxCapacity, reports: []
      };
      this._posts.update(p => [newPost, ...p]);
  }
  
  updatePost(updatedPost: Post) {
      this._posts.update(posts => posts.map(p => p.id === updatedPost.id ? updatedPost : p));
  }

  deletePost(id: string) { this._posts.update(p => p.filter(x => x.id !== id)); }
  deleteStory(id: string) { this._stories.update(s => s.filter(x => x.id !== id)); }

  reportPost(postId: string, reason: string) {
      const me = this.currentUser();
      if (!me) return;
      this._posts.update(posts => posts.map(p => {
          if (p.id === postId && !p.reports.some(r => r.reporterId === me.id)) {
              return { ...p, reports: [...p.reports, { reporterId: me.id, reason, createdAt: new Date() }] };
          }
          return p;
      }));
  }

  warnPost(postId: string, message: string) {
      this._posts.update(posts => posts.map(p => {
          if (p.id === postId) {
              return { ...p, warning: message };
          }
          return p;
      }));
  }
  
  dismissReports(postId: string) {
      this._posts.update(posts => posts.map(p => {
          if (p.id === postId) {
              return { ...p, reports: [] }; 
          }
          return p;
      }));
  }

  addReview(targetUserId: string, rating: number, text: string) {
      const me = this.currentUser();
      if (!me) return;
      
      const newReview: Review = {
          id: `rev_${Date.now()}`,
          authorId: me.id,
          authorName: me.name,
          authorAvatar: me.avatar,
          rating,
          text,
          createdAt: new Date()
      };

      this._users.update(users => users.map(u => {
          if (u.id === targetUserId) {
              const updatedReviews = [newReview, ...u.reviews];
              const totalRating = updatedReviews.reduce((sum, r) => sum + r.rating, 0);
              const avgRating = updatedReviews.length > 0 ? totalRating / updatedReviews.length : 0;
              
              const updatedUser = { ...u, reviews: updatedReviews, rating: parseFloat(avgRating.toFixed(1)) };
              
              if (this.viewingUser()?.id === u.id) {
                  this.viewingUser.set(updatedUser);
              }
              
              return updatedUser;
          }
          return u;
      }));
  }

  canReviewUser(targetUserId: string): boolean {
      const me = this.currentUser();
      if (!me || me.id === targetUserId) return false;
      
      return this._bookings().some(b => 
          b.customerId === me.id && 
          b.providerId === targetUserId && 
          b.status === 'confirmed'
      );
  }

  likePost(id: string) {
      const me = this.currentUser();
      if (!me) return;
      this._posts.update(posts => posts.map(p => {
          if (p.id === id) {
              const liked = p.likedBy.includes(me.id);
              if (!liked && p.userId !== me.id) this.notify(p.userId, me, 'like', id, 'liked your post');
              return { ...p, likes: liked ? p.likes - 1 : p.likes + 1, likedBy: liked ? p.likedBy.filter(x => x !== me.id) : [...p.likedBy, me.id] };
          }
          return p;
      }));
  }

  addComment(id: string, text: string) {
      const me = this.currentUser();
      if (!me) return;
      const comment = { id: `c_${Date.now()}`, userId: me.id, userName: me.name, userAvatar: me.avatar, text, createdAt: new Date() };
      this._posts.update(posts => posts.map(p => {
          if (p.id === id) {
              if (p.userId !== me.id) this.notify(p.userId, me, 'comment', id, `commented: ${text}`);
              const updatedPost = { ...p, comments: [...p.comments, comment] };
              
              if (this.activePost()?.id === id) {
                  this.activePost.set(updatedPost);
              }
              return updatedPost;
          }
          return p;
      }));
  }
  
  sendMessage(sid: string, rid: string, text: string, type: Message['type'] = 'text', dur?: string, media?: string, status?: 'missed'|'ended') {
      const m: Message = { id: `m_${Date.now()}`, senderId: sid, receiverId: rid, text, type, duration: dur, mediaUrl: media, callStatus: status, timestamp: new Date() };
      this._messages.update(msg => [...msg, m]);
  }

  addStory(img: string, filter?: string) {
      const u = this.currentUser();
      if (!u) return;
      const s: Story = { id: `s_${Date.now()}`, userId: u.id, userName: u.name, avatar: u.avatar, image: img, filter, viewed: false, createdAt: new Date(), likes: 0, views: 0, isPublicViews: true, likedByViewer: false };
      this._stories.update(v => [s, ...v]);
  }

  viewStory(id: string) {
      const s = this._stories().find(x => x.id === id);
      if (s) { this.activeStory.set(s); this.activeOverlay.set('story_viewer'); }
  }

  navigateStory(dir: 'next'|'prev') {
      const curr = this.activeStory();
      if (!curr) return;
      const all = this._stories();
      const idx = all.findIndex(x => x.id === curr.id);
      const nextIdx = dir === 'next' ? idx + 1 : idx - 1;
      if (nextIdx >= 0 && nextIdx < all.length) this.viewStory(all[nextIdx].id);
      else { this.activeOverlay.set(null); this.activeStory.set(null); }
  }

  replyToStory(id: string, text: string) {
      const s = this._stories().find(x => x.id === id);
      const me = this.currentUser();
      if (s && me) this.sendMessage(me.id, s.userId, `[Story Reply]: ${text}`, 'story_reply', undefined, s.image);
  }

  toggleStoryLike(id: string) {
      this._stories.update(s => s.map(x => x.id === id ? { ...x, likedByViewer: !x.likedByViewer, likes: !x.likedByViewer ? x.likes + 1 : x.likes - 1 } : x));
      const updated = this._stories().find(x => x.id === id);
      if (updated) this.activeStory.set(updated);
  }
  
  toggleStoryPrivacy(id: string) {
      this._stories.update(s => s.map(x => x.id === id ? { ...x, isPublicViews: !x.isPublicViews } : x));
      const updated = this._stories().find(x => x.id === id);
      if (updated) this.activeStory.set(updated);
  }

  createBooking(pid: string, pname: string, date: Date, count: number, notes: string, price: number = 0, title?: string) {
      const me = this.currentUser();
      if (!me) return;
      const b: Booking = { id: `b_${Date.now()}`, providerId: pid, providerName: pname, customerId: me.id, customerName: me.name, date, peopleCount: count, notes, status: 'pending', createdAt: new Date(), totalPrice: price, serviceTitle: title };
      this._bookings.update(v => [...v, b]);
      this.notify(pid, me, 'booking', b.id, 'requested booking');
  }

  getUserById(id: string) { return this._users().find(u => u.id === id); }
  getUsersByRole(r: UserRole) { return this._users().filter(u => u.role === r && u.status === 'active'); }
  setViewUser(id: string) { const u = this.getUserById(id); if (u) this.viewingUser.set(u); }
  setMyProfileAsView() { this.viewingUser.set(this.currentUser()); }
  updateProfile(data: any) {
      const u = this.currentUser();
      if (!u) return;
      const updated = { ...u, ...data };
      this.currentUser.set(updated);
      this._users.update(list => list.map(x => x.id === u.id ? updated : x));
  }
  approveUser(id: string) { this._users.update(u => u.map(x => x.id === id ? {...x, status: 'active'} : x)); }
  rejectUser(id: string) { this._users.update(u => u.filter(x => x.id !== id)); }
  
  toggleFollow(id: string) {
      const me = this.currentUser();
      const target = this.getUserById(id);
      if (!me || !target) return;
      const following = me.following.includes(id);
      
      const newMe = { ...me, following: following ? me.following.filter(x => x !== id) : [...me.following, id] };
      const newTarget = { ...target, followers: following ? target.followers.filter(x => x !== me.id) : [...target.followers, me.id] };
      
      this._users.update(list => list.map(u => u.id === me.id ? newMe : u.id === id ? newTarget : u));
      this.currentUser.set(newMe);
      if (this.viewingUser()?.id === id) this.viewingUser.set(newTarget);
      if (!following) this.notify(id, me, 'follow', undefined, 'started following you');
  }

  private notify(rid: string, trigger: User, type: NotificationType, resid?: string, text: string = '') {
      const n: AppNotification = { id: `n_${Date.now()}`, recipientId: rid, triggerUserId: trigger.id, triggerUserName: trigger.name, triggerUserAvatar: trigger.avatar, type, resourceId: resid, text, isRead: false, createdAt: new Date() };
      this._notifications.update(v => [n, ...v]);
  }
  
  markNotificationRead(id: string) { this._notifications.update(n => n.map(x => x.id === id ? {...x, isRead: true} : x)); }
  openPost(id: string) { const p = this._posts().find(x => x.id === id); if (p) this.activePost.set(p); }
  sharePost() { alert('Link copied!'); }

  toggleOverlay(t: any) { this.activeOverlay.set(this.activeOverlay() === t ? null : t); }
  openLangSelector(c: any) { this.langSelectorContext.set(c); this.activeOverlay.set('lang_selector'); }
  startChat(u: User) { this.activeChatUser.set(u); this.activeOverlay.set('chat'); }
  setChatBackground(bg: string) { this.chatBackground.set(bg); }
  startCall(t: 'video'|'audio') { this.callType.set(t); this.callStatus.set('calling'); this.callStartTime.set(0); this.toggleOverlay('call'); }
  getUserBookings(uid: string) { return this._bookings().filter(b => b.customerId === uid || b.providerId === uid); }
}
