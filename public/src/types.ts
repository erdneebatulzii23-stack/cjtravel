export type UserRole = 'traveler' | 'guide' | 'provider' | 'admin';
export type UserStatus = 'pending' | 'active' | 'rejected';

export interface Review {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  rating: number; // 1-5
  text: string;
  createdAt: Date;
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  avatar: string;
  email: string;
  password?: string; 
  phone: string;
  bio?: string;
  location?: string;
  languages?: string[];
  coordinates?: { x: number, y: number }; 
  locationCoords?: { lat: number, lng: number }; 
  
  rating: number;
  reviews: Review[];

  followers: string[]; 
  following: string[]; 
  highlights?: { id: string, image: string, title: string }[];
  settings: {
    showEmail: boolean;
    showPhone: boolean;
  };
}

export interface Booking {
  id: string;
  providerId: string;
  providerName: string;
  customerId: string;
  customerName: string;
  date: Date;
  peopleCount: number;
  totalPrice?: number;
  serviceTitle?: string;
  notes: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: Date;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  text: string;
  createdAt: Date;
}

export interface PostReport {
  reporterId: string;
  reason: string;
  createdAt: Date;
}

export interface Post {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userRole: UserRole;
  content: string; 
  mediaUrl?: string; 
  mediaType?: 'image' | 'video';
  filter?: string; 
  location?: string;
  likes: number;
  likedBy: string[]; 
  comments: Comment[];
  isService?: boolean; 
  title?: string;
  price?: number;
  maxCapacity?: number;
  createdAt: Date;
  reports: PostReport[];
  warning?: string;
}

export interface Story {
  id: string;
  userId: string;
  userName: string;
  avatar: string;
  image: string;
  filter?: string; 
  viewed: boolean;
  createdAt: Date;
  likes: number;
  views: number;
  isPublicViews: boolean; 
  likedByViewer: boolean; 
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  type: 'text' | 'audio' | 'image' | 'call_log' | 'story_reply'; 
  mediaUrl?: string; 
  duration?: string; 
  callStatus?: 'missed' | 'ended'; 
  timestamp: Date;
}

export type NotificationType = 'like' | 'comment' | 'follow' | 'booking' | 'system';

export interface AppNotification {
  id: string;
  recipientId: string;
  triggerUserId: string;
  triggerUserName: string;
  triggerUserAvatar: string;
  type: NotificationType;
  resourceId?: string;
  text: string;
  isRead: boolean;
  createdAt: Date;
}