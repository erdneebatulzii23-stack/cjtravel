import { Injectable, signal, computed, effect, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { User, Post, UserRole, Message, Story, Booking, AppNotification, NotificationType, Review } from '../types';

export type AppLang = 'en' | 'mn' | 'zh' | 'de' | 'ru' | 'ko' | 'ja';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private platformId = inject(PLATFORM_ID); // SSR шалгах  
  
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

  // БҮХ ОРЧУУЛГА (Энийг дутуу бичвэл сайт гацна)
  private translations: Record<AppLang, any> = {
    en: { appName: 'CJ Travel', slogan: 'Connect. Share. Explore.', signIn: 'Sign In', register: 'Register', email: 'EMAIL', password: 'PASSWORD', fullName: 'FULL NAME', iAmA: 'I AM A', createAccount: 'Create Account', travelFeed: 'Travel Feed', recentUpdates: 'Recent Updates', topGuides: 'Nearby Pro Guides', allGuides: 'All Guides', providers: 'Service Providers', viewServices: 'View Services', seeAll: 'See All', search: 'Search...', home: 'Home', explore: 'Explore', bookings: 'Bookings', profile: 'Profile', posts: 'Posts', followers: 'Followers', following: 'Following', editProfile: 'Edit Profile', follow: 'Follow', message: 'Message', logout: 'Log Out', newPost: 'New Post', whatsOnYourMind: "What's on your mind?", post: 'Post', translatorTitle: 'Live Translator', chatTitle: 'Messages', notifications: 'Notifications', typeToTranslate: 'Type to translate...', translating: 'Translating...', listening: 'Listening...', calling: 'Calling...', incomingCall: 'Incoming Call', changeBg: 'Change Background', autoPlay: 'Auto-play Audio', missedCall: 'Missed Call', callEnded: 'Call Ended', bio: 'Bio', stories: 'Stories', delete: 'Delete', report: 'Report', selectLanguage: 'Select Language', searchLanguage: 'Search language...', roles: { traveler: 'Traveler', guide: 'Guide', provider: 'Provider', admin: 'Admin' }, bookNow: 'Book Now', pendingAccount: 'Account Pending', pendingDesc: 'Your account is under review.', approveSelf: 'Simulate Admin Approval', choosePostType: 'Choose Post Type', standardPost: 'Standard Post', standardDesc: 'Share photos, videos.', businessPost: 'Business Service', businessDesc: 'List a tour or service.', serviceTitle: 'Service Title', pricePerPerson: 'Price (per person)', maxCapacity: 'Max Capacity', description: 'Description', location: 'Location', locationPlaceholder: 'Search or type location...', offlineMode: 'Offline Mode', offlineDesc: 'Check your internet connection.', viewMap: 'Map View', viewList: 'List View', approvals: 'Admin Panel', pendingUsers: 'Pending Users', reportedPosts: 'Reported Content', noApprovals: 'No pending requests', noReports: 'No reported posts', approve: 'Approve', reject: 'Reject', warn: 'Warn', dismiss: 'Dismiss', warningIssued: 'Official Warning Issued', leaveReview: 'Leave Review', reviews: 'Reviews', rating: 'Rating', writeReviewPlaceholder: 'Write your experience...', submitReview: 'Submit Review', reportReason: 'Reason for reporting', reasons: { spam: 'Spam', scam: 'Scam/Fraud', inappropriate: 'Inappropriate Content', harassment: 'Harassment', other: 'Other' }, shareTo: 'Share to', copyLink: 'Copy Link', copied: 'Copied!', languages: 'Languages', aboutMe: 'About Me' },
    mn: { appName: 'CJ Travel', slogan: 'Холбогд. Хуваалц. Аял.', signIn: 'Нэвтрэх', register: 'Бүртгүүлэх', email: 'ИМЭЙЛ', password: 'НУУЦ ҮГ', fullName: 'БҮТЭН НЭР', iAmA: 'БИ БОЛ', createAccount: 'Бүртгэл үүсгэх', travelFeed: 'Аяллын мэдээ', recentUpdates: 'Шинэ мэдээлэл', topGuides: 'Ойр байгаа хөтөч нар', allGuides: 'Бүх хөтөч', providers: 'Үйлчилгээ үзүүлэгчид', viewServices: 'Үйлчилгээ үзэх', seeAll: 'Бүгд', search: 'Хайх...', home: 'Нүүр', explore: 'Хөтөч', bookings: 'Захиалга', profile: 'Профайл', posts: 'Пост', followers: 'Дагагч', following: 'Дагаж буй', editProfile: 'Засах', follow: 'Дагах', message: 'Чат', logout: 'Гарах', newPost: 'Шинэ пост', whatsOnYourMind: "Юу бодож байна?", post: 'Нийтлэх', translatorTitle: 'Орчуулагч', chatTitle: 'Зурвас', notifications: 'Мэдэгдэл', typeToTranslate: 'Орчуулах текст...', translating: 'Орчуулж байна...', listening: 'Сонсож байна...', calling: 'Залгаж байна...', incomingCall: 'Дуудлага ирлээ', changeBg: 'Арын фон солих', autoPlay: 'Шууд унших', missedCall: 'Аваагүй дуудлага', callEnded: 'Дуудлага дууссан', bio: 'Танилцуулга', stories: 'Стори', delete: 'Устгах', report: 'Репорт', selectLanguage: 'Хэл сонгох', searchLanguage: 'Хэл хайх...', roles: { traveler: 'Аялагч', guide: 'Хөтөч', provider: 'Байгууллага', admin: 'Админ' }, bookNow: 'Захиалах', pendingAccount: 'Бүртгэл Хүлээгдэж байна', pendingDesc: 'Таны бүртгэлийг шалгаж байна.', approveSelf: 'Админ эрхээр зөвшөөрөх', choosePostType: 'Постын төрөл', standardPost: 'Энгийн Пост', standardDesc: 'Зураг, түүх хуваалцах.', businessPost: 'Бизнес Үйлчилгээ', businessDesc: 'Аялал, үйлчилгээ санал болгох.', serviceTitle: 'Үйлчилгээний нэр', pricePerPerson: 'Үнэ (нэг хүний)', maxCapacity: 'Дээд тоо', description: 'Тайлбар', location: 'Байршил', locationPlaceholder: 'Байршил хайх...', offlineMode: 'Оффлайн горим', offlineDesc: 'Интернэт холболтоо шалгана уу.', viewMap: 'Газрын зураг', viewList: 'Жагсаалт', approvals: 'Админ Самбар', pendingUsers: 'Хүлээгдэж буй', reportedPosts: 'Репорт', noApprovals: 'Хүсэлт алга', noReports: 'Репорт алга', approve: 'Зөвшөөрөх', reject: 'Татгалзах', warn: 'Анхааруулах', dismiss: 'Цэвэрлэх', warningIssued: 'Албан ёсны анхааруулга!', leaveReview: 'Үнэлгээ өгөх', reviews: 'Үнэлгээнүүд', rating: 'Үнэлгээ', writeReviewPlaceholder: 'Сэтгэгдэл бичих...', submitReview: 'Илгээх', reportReason: 'Репортлох шалтгаан', reasons: { spam: 'Спам', scam: 'Луйвар', inappropriate: 'Зохимжгүй агуулга', harassment: 'Дарамт шахалт', other: 'Бусад' }, shareTo: 'Хуваалцах', copyLink: 'Линк хуулах', copied: 'Хуулагдлаа!', languages: 'Хэлний мэдлэг', aboutMe: 'Миний тухай' },
    zh: { appName: 'CJ 旅游', slogan: '连接. 分享. 探索.', signIn: '登录', register: '注册', email: '电子邮件', password: '密码', fullName: '全名', iAmA: '我是', createAccount: '创建账户', travelFeed: '旅游动态', recentUpdates: '最近更新', topGuides: '附近的向导', allGuides: '所有向导', providers: '服务商', viewServices: '查看服务', seeAll: '查看全部', search: '搜索...', home: '主页', explore: '探索', bookings: '预订', profile: '个人资料', posts: '帖子', followers: '粉丝', following: '关注', editProfile: '编辑资料', follow: '关注', message: '私信', logout: '登出', newPost: '发帖', whatsOnYourMind: "你在想什么？", post: '发布', translatorTitle: '实时翻译', chatTitle: '消息', notifications: '通知', typeToTranslate: '输入文字...', translating: '翻译中...', listening: '正在听...', calling: '呼叫中...', incomingCall: '来电', changeBg: '更换背景', autoPlay: '自动播放', missedCall: '未接来电', callEnded: '通话结束', bio: '简介', stories: '快拍', delete: '删除', report: '举报', selectLanguage: '选择语言', searchLanguage: '搜索语言...', roles: { traveler: '旅行者', guide: '向导', provider: '提供商', admin: '管理员' }, bookNow: '预订', pendingAccount: '账户待审核', pendingDesc: '审核中。', approveSelf: '模拟批准', choosePostType: '选择类型', standardPost: '普通帖子', standardDesc: '分享照片。', businessPost: '商业服务', businessDesc: '发布服务。', serviceTitle: '服务标题', pricePerPerson: '价格', maxCapacity: '最大容量', description: '描述', location: '位置', locationPlaceholder: '搜索位置...', offlineMode: '离线模式', offlineDesc: '请检查您的互联网连接。', viewMap: '地图视图', viewList: '列表视图', approvals: 'Admin Panel', pendingUsers: '待审核', reportedPosts: '被举报', noApprovals: '无待办请求', noReports: '无举报', approve: '批准', reject: '拒绝', warn: '警告', dismiss: '忽略', warningIssued: '已发出警告', leaveReview: '发表评论', reviews: '评论', rating: '评分', writeReviewPlaceholder: '写下你的体验...', submitReview: '提交评论', reportReason: '举报原因', reasons: { spam: '垃圾信息', scam: '诈骗', inappropriate: '不当内容', harassment: '骚扰', other: '其他' }, shareTo: '分享到', copyLink: '复制链接', copied: '已复制', languages: '语言', aboutMe: '关于我' },
    de: { appName: 'CJ Travel', slogan: 'Verbinden. Entdecken.', signIn: 'Anmelden', register: 'Registrieren', email: 'EMAIL', password: 'PASSWORT', fullName: 'NAME', iAmA: 'ICH BIN', createAccount: 'Konto erstellen', travelFeed: 'Feed', recentUpdates: 'Updates', topGuides: 'Guides in der Nähe', allGuides: 'Alle Guides', providers: 'Anbieter', viewServices: 'Dienste', seeAll: 'Alle', search: 'Suchen...', home: 'Start', explore: 'Entdecken', bookings: 'Buchungen', profile: 'Profil', posts: 'Beiträge', followers: 'Follower', following: 'Folgt', editProfile: 'Bearbeiten', follow: 'Folgen', message: 'Nachricht', logout: 'Abmelden', newPost: 'Neuer Beitrag', whatsOnYourMind: "Was gibts?", post: 'Posten', translatorTitle: 'Übersetzer', chatTitle: 'Chat', notifications: 'Infos', typeToTranslate: 'Text eingeben...', translating: 'Übersetze...', listening: 'Höre...', calling: 'Rufe an...', incomingCall: 'Anruf', changeBg: 'Hintergrund', autoPlay: 'Auto-Play', missedCall: 'Verpasst', callEnded: 'Beendet', bio: 'Bio', stories: 'Stories', delete: 'Löschen', report: 'Melden', selectLanguage: 'Sprache', searchLanguage: 'Suche...', roles: { traveler: 'Reisender', guide: 'Guide', provider: 'Anbieter', admin: 'Admin' }, bookNow: 'Buchen', pendingAccount: 'Ausstehend', pendingDesc: 'Wird geprüft.', approveSelf: 'Genehmigen', choosePostType: 'Typ wählen', standardPost: 'Standard', standardDesc: 'Fotos teilen.', businessPost: 'Business', businessDesc: 'Service anbieten.', serviceTitle: 'Titel', pricePerPerson: 'Preis', maxCapacity: 'Kapazität', description: 'Beschreibung', location: 'Ort', locationPlaceholder: 'Ort suchen...', offlineMode: 'Offline-Modus', offlineDesc: 'Überprüfen Sie Ihre Internetverbindung.', viewMap: 'Kartenansicht', viewList: 'Listenansicht', approvals: 'Admin', pendingUsers: 'Benutzer', reportedPosts: 'Gemeldet', noApprovals: 'Keine Anfragen', noReports: 'Keine Meldungen', approve: 'Genehmigen', reject: 'Ablehnen', warn: 'Warnen', dismiss: 'Verwerfen', warningIssued: 'Warnung ausgegeben', leaveReview: 'Bewertung abgeben', reviews: 'Bewertungen', rating: 'Bewertung', writeReviewPlaceholder: 'Schreiben Sie Ihre Erfahrung...', submitReview: 'Bewertung absenden', reportReason: 'Grund für die Meldung', reasons: { spam: 'Spam', scam: 'Betrug', inappropriate: 'Unangemessener Inhalt', harassment: 'Belästigung', other: 'Andere' }, shareTo: 'Teilen auf', copyLink: 'Link kopieren', copied: 'Kopiert', languages: 'Sprachen', aboutMe: 'Über mich' },
    ru: { appName: 'CJ Travel', slogan: 'Общайся. Путешествуй.', signIn: 'Войти', register: 'Регистрация', email: 'EMAIL', password: 'ПАРОЛЬ', fullName: 'ИМЯ', iAmA: 'Я', createAccount: 'Создать', travelFeed: 'Лента', recentUpdates: 'Обновления', topGuides: 'Гиды рядом', allGuides: 'Все гиды', providers: 'Провайдеры', viewServices: 'Услуги', seeAll: 'Все', search: 'Поиск...', home: 'Главная', explore: 'Обзор', bookings: 'Бронь', profile: 'Профиль', posts: 'Посты', followers: 'Подписчики', following: 'Подписки', editProfile: 'Ред.', follow: 'Подписаться', message: 'Чат', logout: 'Выйти', newPost: 'Пост', whatsOnYourMind: "О чем думаете?", post: 'Опубликовать', translatorTitle: 'Переводчик', chatTitle: 'Сообщения', notifications: 'Уведомления', typeToTranslate: 'Введите текст...', translating: 'Перевод...', listening: 'Слушаю...', calling: 'Звонок...', incomingCall: 'Входящий', changeBg: 'Фон', autoPlay: 'Авто', missedCall: 'Пропущенный', callEnded: 'Завершен', bio: 'О себе', stories: 'Истории', delete: 'Удалить', report: 'Жалоба', selectLanguage: 'Язык', searchLanguage: 'Поиск...', roles: { traveler: 'Турист', guide: 'Гид', provider: 'Провайдер', admin: 'Админ' }, bookNow: 'Забронировать', pendingAccount: 'На проверке', pendingDesc: 'Аккаунт проверяется.', approveSelf: 'Одобрить', choosePostType: 'Тип поста', standardPost: 'Обычный', standardDesc: 'Фото и видео.', businessPost: 'Бизнес', businessDesc: 'Услуги.', serviceTitle: 'Название', pricePerPerson: 'Цена', maxCapacity: 'Вместимость', description: 'Описание', location: 'Место', locationPlaceholder: 'Поиск места...', offlineMode: 'Оффлайн режим', offlineDesc: 'Проверьте подключение к интернету.', viewMap: 'Карта', viewList: 'Список', approvals: 'Admin', pendingUsers: 'Пользователи', reportedPosts: 'Жалобы', noApprovals: 'Нет запросов', noReports: 'Нет жалоб', approve: 'Одобрить', reject: 'Отклонить', warn: 'Предупр.', dismiss: 'Скрыть', warningIssued: 'Предупреждение!', leaveReview: 'Оставить отзыв', reviews: 'Отзывы', rating: 'Рейтинг', writeReviewPlaceholder: 'Напишите свой отзыв...', submitReview: 'Отправить отзыв', reportReason: 'Причина жалобы', reasons: { spam: 'Спам', scam: 'Мошенничество', inappropriate: 'Неприемлемый контент', harassment: 'Домогательства', other: 'Другое' }, shareTo: 'Поделиться', copyLink: 'Копировать', copied: 'Скопировано', languages: 'Языки', aboutMe: 'Обо мне' },
    ko: { appName: 'CJ Travel', slogan: '탐험하세요.', signIn: '로그인', register: '가입', email: '이메일', password: '비번', fullName: '이름', iAmA: '나는', createAccount: '계정생성', travelFeed: '피드', recentUpdates: '업데이트', topGuides: '주변 가이드', allGuides: '모든 가이드', providers: '제공자', viewServices: '서비스', seeAll: '모두', search: '검색...', home: '홈', explore: '탐색', bookings: '예약', profile: '프로필', posts: '게시물', followers: '팔로워', following: '팔로잉', editProfile: '수정', follow: '팔로우', message: '메시지', logout: '로그아웃', newPost: '새 글', whatsOnYourMind: "생각?", post: '게시', translatorTitle: '번역기', chatTitle: '메시지', notifications: '알림', typeToTranslate: '입력...', translating: '번역 중...', listening: '듣는 중...', calling: '연결 중...', incomingCall: '수신', changeBg: '배경', autoPlay: '자동재생', missedCall: '부재중', callEnded: '종료', bio: '소개', stories: '스토리', delete: '삭제', report: '신고', selectLanguage: '언어선택', searchLanguage: '검색...', roles: { traveler: '여행자', guide: '가이드', provider: '제공자', admin: '관리자' }, bookNow: '예약', pendingAccount: '대기 중', pendingDesc: '검토 중.', approveSelf: '승인', choosePostType: '유형 선택', standardPost: '일반', standardDesc: '사진 공유.', businessPost: '비즈니스', businessDesc: '서비스 등록.', serviceTitle: '제목', pricePerPerson: '가격', maxCapacity: '인원', description: '설명', location: '위치', locationPlaceholder: '위치 검색...', offlineMode: '오프라인 모드', offlineDesc: '인터넷 연결을 확인하세요.', viewMap: '지도', viewList: '목록', approvals: '관리', pendingUsers: '대기', reportedPosts: '신고', noApprovals: '요청 없음', noReports: '신고 없음', approve: '승인', reject: '거절', warn: '경고', dismiss: '무시', warningIssued: '경고 발령', leaveReview: '리뷰 남기기', reviews: '리뷰', rating: '평점', writeReviewPlaceholder: '리뷰 작성...', submitReview: '리뷰 제출', reportReason: '신고 사유', reasons: { spam: '스팸', scam: '사기', inappropriate: '부적절한 내용', harassment: '괴롭힘', other: '기타' }, shareTo: '공유', copyLink: '링크 복사', copied: '복사됨', languages: '언어', aboutMe: '소개' },
    ja: { appName: 'CJ Travel', slogan: '冒険しよう。', signIn: 'ログイン', register: '登録', email: 'メール', password: 'パスワード', fullName: '氏名', iAmA: '私は', createAccount: '作成', travelFeed: 'フィード', recentUpdates: '更新', topGuides: '近くのガイド', allGuides: '全ガイド', providers: '提供者', viewServices: 'サービス', seeAll: '全て', search: '検索...', home: 'ホーム', explore: '探索', bookings: '予約', profile: 'プロフィール', posts: '投稿', followers: 'フォロワー', following: 'フォロー', editProfile: '編集', follow: 'フォロー', message: 'メッセージ', logout: 'ログアウト', newPost: '投稿', whatsOnYourMind: "なにか？", post: '投稿', translatorTitle: '翻訳', chatTitle: 'チャット', notifications: '通知', typeToTranslate: '入力...', translating: '翻訳中...', listening: '聞き取り...', calling: '発信...', incomingCall: '着信', changeBg: '背景', autoPlay: '自動再生', missedCall: '不在', callEnded: '終了', bio: '紹介', stories: 'ストーリー', delete: '削除', report: '報告', selectLanguage: '言語選択', searchLanguage: '検索...', roles: { traveler: '旅行者', guide: 'ガイド', provider: '提供者', admin: '管理者' }, bookNow: '予約', pendingAccount: '保留中', pendingDesc: '審査中。', approveSelf: '承認', choosePostType: 'タイプ選択', standardPost: '通常', standardDesc: '写真共有。', businessPost: 'ビジネス', businessDesc: 'サービス掲載。', serviceTitle: 'タイトル', pricePerPerson: '価格', maxCapacity: '定員', description: '説明', location: '場所', locationPlaceholder: '場所検索...', offlineMode: 'オフライン', offlineDesc: 'インターネット接続を確認してください。', viewMap: '地図', viewList: 'リスト', approvals: '管理', pendingUsers: '保留中', reportedPosts: '通報', noApprovals: 'リクエストなし', noReports: '通報なし', approve: '承認', reject: '拒否', warn: '警告', dismiss: '無視', warningIssued: '警告が出されました', leaveReview: 'レビューを書く', reviews: 'レビュー', rating: '評価', writeReviewPlaceholder: 'レビューを書く...', submitReview: '送信', reportReason: '通報理由', reasons: { spam: 'スパム', scam: '詐欺', inappropriate: '不適切なコンテンツ', harassment: 'ハラスメント', other: 'その他' }, shareTo: 'シェア', copyLink: 'リンクをコピー', copied: 'コピーしました', languages: '言語', aboutMe: '自己紹介' }
  };

  text = computed(() => {
     const lang = this.currentLang();
     // Орчуулга олдохгүй бол алдаа гаргахгүйгээр 'en'-ийг авна
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
     // LocalStorage ба Window нь зөвхөн browser дээр байдаг тул шалгах хэрэгтэй
     if (isPlatformBrowser(this.platformId)) {
         this.checkOnlineStatus();
         this.loadFromStorage();

         window.addEventListener('online', () => this.isOnline.set(true));
         window.addEventListener('offline', () => this.isOnline.set(false));

         // Effect-ийг зөвхөн browser дээр ажиллуулна
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

  // ... (rest of the class remains unchanged)  
}