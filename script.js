// --- Variabel Global Canvas ---
const firebaseConfig = {
  apiKey: "AIzaSyDqatY8EgkSDgOp799xdb1TqwdCwoda-7I",
  authDomain: "curhatan-959ee.firebaseapp.com",
  projectId: "curhatan-959ee",
  storageBucket: "curhatan-959ee.appspot.com",
  messagingSenderId: "111804283269",
  appId: "1:111804283269:web:da799747d37787f2ae6cec",
  measurementId: "G-4Q1V1J0800"
};

// --- Firebase SDK (CDN) ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile } 
  from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion, setDoc, limitToLast, getDoc, arrayRemove, deleteDoc, where, increment, limit, getDocs } 
  from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- State Aplikasi ---
let currentPage = 'Auth'; 
let previousPage = 'Auth'; 
let selectedLocation = null; 
let selectedFeeling = null; 
let currentUserAvatarUrl = null; 
let isCurrentUserVerified = false; 
let userDocUnsubscribe = null; 
let selectedChatThemeId = 'default'; 
let unsubscribeProfilePosts = null; 
let currentEditingPostId = null; 
let isCheckingBadges = false; 

// --- SVG Verifikasi ---
const VERIFIED_BADGE_SVG = `
  <svg class="w-4 h-4 text-fb-blue ml-1 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path fill="currentColor" d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z"/>
    <path fill="#FFFFFF" d="M9.999 17.27l-4.5-4.5a.996.996 0 111.41-1.41l3.09 3.09 7.09-7.09a.996.996 0 111.41 1.41l-8.5 8.5a.996.996 0 01-1.41 0z"/>
  </svg>
`;

// --- Data Avatar GIF ---
const GIF_AVATARS = [
    // Gratis
    { id: 'ghost', url: 'https://i.imgur.com/G5yDAWl.gif', glow: null, name: 'Hantu' },
    { id: 'heart', url: 'https://i.imgur.com/v1KSq0a.gif', glow: null, name: 'Hati' },
    // "Berbayar" (hanya contoh, sekarang semua bisa dipilih)
    { id: 'star', url: 'https://i.imgur.com/0PzsP81.gif', glow: null, name: 'Bintang' },
    { id: 'fire', url: 'https://i.imgur.com/80kAmkF.gif', glow: 'shadow-glow-blue', name: 'Api Biru' },
    { id: 'skull', url: 'https://i.imgur.com/sRk129y.gif', glow: 'shadow-glow-red', name: 'Tengkorak Api' },
    { id: 'planet', url: 'https://i.imgur.com/xqaPzRk.gif', glow: 'shadow-glow-cyan', name: 'Orb Petir' },
    { id: 'crown', url: 'https://i.imgur.com/s6k9z6r.gif', glow: 'shadow-glow-yellow', name: 'Mahkota Emas' },
    { id: 'diamond', url: 'https://i.imgur.com/xOKS69X.gif', glow: 'shadow-glow-cyan', name: 'Kristal' }
];
const DEFAULT_AVATAR_URL = GIF_AVATARS[0].url; 

// --- Data Lencana ---
const BADGE_DEFINITIONS = {
    'newbie': { name: 'Newbie', icon: '🥉', requires: (stats) => (stats.postsCount || 0) >= 1 },
    'komentator': { name: 'Komentator', icon: '🥈', requires: (stats) => (stats.commentsCount || 0) >= 50 },
    'veteran': { name: 'Veteran', icon: '🏆', requires: (stats) => (stats.points || 0) >= 5000 },
    'legenda': { name: 'Legenda', icon: '💎', requires: (stats) => (stats.points || 0) >= 10000 }
};

// --- Data Dummy ---
const DUMMY_LOCATIONS = [
  { name: "Pantai Bahari Jeneponto", detail: "Jeneponto · Jeneponto, South Sulawesi" },
];
const DUMMY_FEELINGS = [
  { emoji: "😊", text: "senang" }, { emoji: "😇", text: "terberkati" },
];
const DUMMY_ACTIVITIES = [
    { emoji: "🎉", text: "merayakan..." }, { emoji: "✈️", text: "bepergian ke..." },
];

// Data Tema Chat
const DUMMY_CHAT_THEMES = [
    { id: 'default', name: 'Default', css: 'bg-white' },
    { id: 'dark', name: 'Dark', css: 'bg-gray-800' },
    { id: 'ocean', name: 'Ocean', css: 'bg-gradient-to-br from-blue-100 to-cyan-100' },
    { id: 'sunset', name: 'Sunset', css: 'bg-gradient-to-br from-yellow-100 via-pink-100 to-red-100' },
    { id: 'forest', name: 'Forest', css: 'bg-gradient-to-br from-green-200 to-lime-300' },
];


// --- DOM Elements ---
const authView = document.getElementById("authView");
const mainView = document.getElementById("mainView");
const postView = document.getElementById("postView");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const curhatForm = document.getElementById("curhatForm");
const curhatList = document.getElementById("curhatList");
const profileModal = document.getElementById("profileModal");
const profileForm = document.getElementById("profileForm");
const profileNameInput = document.getElementById("profileName");
const postFormBackBtn = document.getElementById("postFormBackBtn");
const postUsernameText = document.getElementById("postUsernameText");
const postUserAvatarBlock = document.getElementById('postUserAvatarBlock'); 

// Elemen Lokasi
const locationModal = document.getElementById("locationModal");
const locationList = document.getElementById("locationList");
const locationSearchInput = document.getElementById("locationSearchInput");
const locationSelectionBar = document.getElementById("locationSelectionBar");
const locationBarText = document.getElementById("locationBarText");

// Elemen Perasaan
const feelingModal = document.getElementById("feelingModal");
const feelingList = document.getElementById("feelingList");
const feelingSearchInput = document.getElementById("feelingSearchInput");
const feelingTabPerasaan = document.getElementById("feelingTabPerasaan");
const feelingTabAktivitas = document.getElementById("feelingTabAktivitas");

// Elemen Chat Global
const chatView = document.getElementById("chatView");
const goToChatBtn = document.getElementById("goToChatBtn");
const chatBackBtn = document.getElementById("chatBackBtn");
const chatMessageList = document.getElementById("chatMessageList");
const chatForm = document.getElementById("chatForm");
const chatTextInput = document.getElementById("chatTextInput");
const chatSettingsBtn = document.getElementById('chatSettingsBtn'); 

// Elemen Menu & Pengaturan
const menuView = document.getElementById("menuView");
const settingsView = document.getElementById("settingsView");
const openMenuBtn = document.getElementById("openMenuBtn");
const menuBackBtn = document.getElementById("menuBackBtn");
const menuSettingsBtn = document.getElementById("menuSettingsBtn");
const menuLogoutBtn = document.getElementById("menuLogoutBtn");
const menuProfileName = document.getElementById("menuProfileName");
const settingsBackBtn = document.getElementById("settingsBackBtn");
const settingsForm = document.getElementById("settingsForm");
const settingsNameInput = document.getElementById("settingsNameInput");
const settingsProfileName = document.getElementById("settingsProfileName");

// Elemen Avatar
const avatarModal = document.getElementById('avatarModal');
const avatarList = document.getElementById('avatarList');
const avatarModalBackBtn = document.getElementById('avatarModalBackBtn');
const openAvatarModalBtn = document.getElementById('openAvatarModalBtn');

// Elemen Pengaturan Chat
const chatSettingsModal = document.getElementById('chatSettingsModal');
const chatSettingsBackBtn = document.getElementById('chatSettingsBackBtn');
const chatThemeList = document.getElementById('chatThemeList');

// Elemen Display Avatar (Container)
const mainAvatarDisplay = document.getElementById('mainAvatarDisplay');
const postAvatarDisplay = document.getElementById('postAvatarDisplay');
const menuAvatarDisplay = document.getElementById('menuAvatarDisplay');
const settingsAvatarDisplay = document.getElementById('settingsAvatarDisplay');

// Elemen Halaman Profil
const profileView = document.getElementById('profileView');
const profileBackBtn = document.getElementById('profileBackBtn');
const profileHeaderName = document.getElementById('profileHeaderName');
const profileViewAvatar = document.getElementById('profileViewAvatar');
const profileViewName = document.getElementById('profileViewName');
const profileViewEmail = document.getElementById('profileViewEmail');
const profilePostList = document.getElementById('profilePostList');
const profileViewPoints = document.getElementById('profileViewPoints'); 
const profileViewBadges = document.getElementById('profileViewBadges'); 

// Elemen Halaman Suka
const likesView = document.getElementById('likesView');
const likesViewBackBtn = document.getElementById('likesViewBackBtn');
const likesViewList = document.getElementById('likesViewList');

// Elemen Halaman Edit Postingan
const editPostView = document.getElementById('editPostView');
const editPostBackBtn = document.getElementById('editPostBackBtn');
const editPostForm = document.getElementById('editPostForm');
const editPostTextarea = document.getElementById('editPostTextarea');

// Elemen Halaman Peringkat
const leaderboardView = document.getElementById('leaderboardView');
const leaderboardBackBtn = document.getElementById('leaderboardBackBtn');
const leaderboardList = document.getElementById('leaderboardList');
const navFeedBtn = document.getElementById('navFeedBtn');
const navChatBtn = document.getElementById('navChatBtn');
const navLeaderboardBtn = document.getElementById('navLeaderboardBtn');

// Elemen Toko Poin (Dihapus)


// --- Inisialisasi Awal ---
const savedTheme = localStorage.getItem('chatTheme');
if (savedTheme) {
    selectedChatThemeId = savedTheme;
}


// --- Fungsi Navigasi Halaman ---
function navigateTo(page) {
  previousPage = currentPage; 
  currentPage = page;
  authView.style.display = 'none';
  mainView.style.display = 'none';
  postView.style.display = 'none';
  locationModal.style.display = 'none'; 
  feelingModal.style.display = 'none'; 
  chatView.style.display = 'none';
  menuView.style.display = 'none'; 
  settingsView.style.display = 'none'; 
  avatarModal.style.display = 'none'; 
  chatSettingsModal.style.display = 'none'; 
  profileView.style.display = 'none'; 
  likesView.style.display = 'none'; 
  editPostView.style.display = 'none'; 
  leaderboardView.style.display = 'none'; 
  // shopView.style.display = 'none'; // Dihapus

  if (page === 'Auth') {
    authView.style.display = 'block';
  } else if (page === 'Main') {
    mainView.style.display = 'block';
    updateNavTabs('Main');
  } else if (page === 'Post') {
    postView.style.display = 'flex';
    renderLocationBar(); 
    renderPostHeader();
  } else if (page === 'Chat') { 
    chatView.style.display = 'flex';
    applyChatTheme(); 
    updateNavTabs('Chat');
  } else if (page === 'Menu') { 
    menuView.style.display = 'flex';
  } else if (page === 'Settings') { 
    settingsView.style.display = 'flex';
  } else if (page === 'Avatar') { 
    avatarModal.style.display = 'flex';
    renderAvatarList(); 
  } else if (page === 'ChatSettings') { 
    chatSettingsModal.style.display = 'flex';
  } else if (page === 'Profile') { 
    profileView.style.display = 'flex';
    profileView.classList.add('flex-col');
  } else if (page === 'Likes') { 
    likesView.style.display = 'flex';
    likesView.classList.add('flex-col');
  } else if (page === 'EditPost') { 
    editPostView.style.display = 'flex';
    editPostView.classList.add('flex-col');
  } else if (page === 'Leaderboard') { 
    leaderboardView.style.display = 'flex';
    leaderboardView.classList.add('flex-col');
    openLeaderboard();
    updateNavTabs('Leaderboard');
  } 
  // else if (page === 'Shop') { ... } // Dihapus
}

// Fungsi untuk update tab navigasi
function updateNavTabs(activeTab) {
    const tabs = [navFeedBtn, navChatBtn, navLeaderboardBtn];
    tabs.forEach(tab => {
        tab.classList.remove('active');
        tab.classList.add('nav-tab'); 
    });
    
    if (activeTab === 'Main') {
        navFeedBtn.classList.add('active');
    } else if (activeTab === 'Chat') {
        navChatBtn.classList.add('active');
    } else if (activeTab === 'Leaderboard') {
        navLeaderboardBtn.classList.add('active');
    }
}

// Listener global untuk menutup dropdown
document.addEventListener('click', () => {
    document.querySelectorAll('.delete-dropdown.show').forEach(el => {
        el.classList.remove('show');
    });
});

// --- EVENT LISTENERS UI ---

openMenuBtn.addEventListener('click', () => navigateTo('Menu')); 

document.getElementById('goToPostBtn').addEventListener('click', () => {
    selectedLocation = null;
    selectedFeeling = null;
    navigateTo('Post');
});
postFormBackBtn.addEventListener('click', () => {
    navigateTo('Main');
});
document.getElementById('authSwitchToRegister').addEventListener('click', () => {
  document.getElementById('loginCard').style.display = 'none';
  document.getElementById('registerCard').style.display = 'block';
});
document.getElementById('authSwitchToLogin').addEventListener('click', () => {
  document.getElementById('registerCard').style.display = 'none';
  document.getElementById('loginCard').style.display = 'block';
});

// Navigasi Chat
navChatBtn.addEventListener('click', () => navigateTo('Chat'));
chatBackBtn.addEventListener('click', () => navigateTo('Main'));
chatSettingsBtn.addEventListener('click', () => navigateTo('ChatSettings'));
chatSettingsBackBtn.addEventListener('click', () => navigateTo('Chat'));

// Navigasi Feed & Leaderboard
navFeedBtn.addEventListener('click', () => navigateTo('Main'));
navLeaderboardBtn.addEventListener('click', () => navigateTo('Leaderboard'));
leaderboardBackBtn.addEventListener('click', () => navigateTo('Main'));

// Navigasi Menu & Pengaturan
menuBackBtn.addEventListener('click', () => navigateTo('Main'));
menuSettingsBtn.addEventListener('click', () => navigateTo('Settings'));
menuLogoutBtn.addEventListener('click', () => signOut(auth)); 
settingsBackBtn.addEventListener('click', () => navigateTo('Menu'));

// Navigasi Avatar
openAvatarModalBtn.addEventListener('click', () => navigateTo('Avatar'));
avatarModalBackBtn.addEventListener('click', () => navigateTo('Settings'));

// Navigasi Halaman Profil
profileBackBtn.addEventListener('click', () => {
    if (unsubscribeProfilePosts) unsubscribeProfilePosts(); 
    navigateTo('Main'); 
});

// Navigasi Halaman Suka
likesViewBackBtn.addEventListener('click', () => {
    navigateTo(previousPage || 'Main'); 
});

// Navigasi Halaman Edit
editPostBackBtn.addEventListener('click', () => {
    navigateTo(previousPage || 'Main');
});

// Navigasi Halaman Toko (Dihapus)
// menuShopBtn.addEventListener('click', () => navigateTo('Shop'));

// Form Edit Postingan
editPostForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newText = editPostTextarea.value.trim();
    if (!newText || !currentEditingPostId) return;
    
    try {
        const postRef = doc(db, "curhatan", currentEditingPostId);
        await updateDoc(postRef, {
            text: newText,
            editedAt: new Date()
        });
        showModalMessage("Sukses", "Postingan berhasil diperbarui.");
        navigateTo(previousPage || 'Main');
    } catch (err) {
        console.error("Gagal edit postingan:", err);
        showModalMessage("Gagal", "Tidak dapat menyimpan perubahan.");
    }
});


// --- Event Listener Lokasi ---
document.getElementById('openLocationModalBtn').addEventListener('click', () => {
  renderLocationList(DUMMY_LOCATIONS);
  locationModal.style.display = 'flex';
});
document.getElementById('locationModalBackBtn').addEventListener('click', () => {
  locationModal.style.display = 'none';
});
document.getElementById('removeLocationBtn').addEventListener('click', () => {
  selectedLocation = null;
  renderLocationBar();
});
locationSearchInput.addEventListener('input', (e) => {
  const searchTerm = e.target.value.toLowerCase();
  const filtered = DUMMY_LOCATIONS.filter(loc => 
    loc.name.toLowerCase().includes(searchTerm) || 
    loc.detail.toLowerCase().includes(searchTerm)
  );
  renderLocationList(filtered);
});

// --- Event Listener Perasaan ---
document.getElementById('openFeelingModalBtn').addEventListener('click', () => {
  renderFeelingList(DUMMY_FEELINGS, 'feeling'); 
  feelingTabPerasaan.classList.add('active');
  feelingTabAktivitas.classList.remove('active');
  feelingSearchInput.value = '';
  feelingModal.style.display = 'flex';
});
document.getElementById('feelingModalBackBtn').addEventListener('click', () => {
  feelingModal.style.display = 'none';
});
feelingTabPerasaan.addEventListener('click', () => {
    renderFeelingList(DUMMY_FEELINGS, 'feeling');
    feelingTabPerasaan.classList.add('active');
    feelingTabAktivitas.classList.remove('active');
});
feelingTabAktivitas.addEventListener('click', () => {
    renderFeelingList(DUMMY_ACTIVITIES, 'activity');
    feelingTabPerasaan.classList.remove('active');
    feelingTabAktivitas.classList.add('active');
});
feelingSearchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const currentType = feelingTabPerasaan.classList.contains('active') ? 'feeling' : 'activity';
    const sourceData = currentType === 'feeling' ? DUMMY_FEELINGS : DUMMY_ACTIVITIES;
    const filtered = sourceData.filter(item => 
        item.text.toLowerCase().includes(searchTerm)
    );
    renderFeelingList(filtered, currentType);
});


// --- Fungsi Render dan Logika Lokasi ---
function renderLocationBar() {
  if (selectedLocation) {
    locationBarText.textContent = selectedLocation.name;
    locationSelectionBar.classList.remove('hidden');
  } else {
    locationSelectionBar.classList.add('hidden');
  }
}
function renderLocationList(locations) {
  locationList.innerHTML = '';
  if (locations.length === 0) {
    locationList.innerHTML = `<p class="text-center text-gray-500 mt-4">Tidak ada lokasi ditemukan.</p>`;
    return;
  }
  locations.forEach(loc => {
    const item = document.createElement('div');
    item.className = 'flex items-center p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100';
    item.innerHTML = `
      <svg class="w-6 h-6 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
      <div>
        <p class="font-semibold text-gray-900">${escapeHtml(loc.name)}</p>
        <p class="text-sm text-gray-500">${escapeHtml(loc.detail)}</p>
      </div>
    `;
    item.addEventListener('click', () => {
      selectedLocation = loc;
      locationModal.style.display = 'none';
      navigateTo('Post'); 
    });
    locationList.appendChild(item);
  });
}

// --- Fungsi Render Perasaan ---
function renderPostHeader() {
    const user = auth.currentUser;
    if (!user) return;
    const name = user.displayName || user.email;
    let feelingHTML = '';
    if (selectedFeeling) {
        const actionText = selectedFeeling.type === 'feeling' ? 'merasa' : 'sedang';
        feelingHTML = ` ${escapeHtml(selectedFeeling.emoji)} <span class="font-normal">${actionText} ${escapeHtml(selectedFeeling.text)}.</span>`;
    }
    const checkmarkHtml = isCurrentUserVerified ? VERIFIED_BADGE_SVG : '';
    postUsernameText.innerHTML = `<span>${escapeHtml(name)}</span>${checkmarkHtml}${feelingHTML}`;
}
function renderFeelingList(items, type) {
    feelingList.innerHTML = '';
    if (items.length === 0) {
        feelingList.innerHTML = `<p class="text-center text-gray-500 mt-4">Tidak ada ${type} ditemukan.</p>`;
        return;
    }
    items.forEach(itemData => {
        const item = document.createElement('div');
        item.className = 'flex items-center p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100';
        item.innerHTML = `
            <span class="text-2xl mr-3">${itemData.emoji}</span>
            <div>
                <p class="font-semibold text-gray-900">${escapeHtml(itemData.text)}</p>
            </div>
        `;
        item.addEventListener('click', () => {
            selectedFeeling = { type: type, ...itemData };
            feelingModal.style.display = 'none';
            navigateTo('Post'); 
        });
        feelingList.appendChild(item);
    });
}

// --- Fungsi Render & Logika Avatar ---
async function renderAvatarList() {
    avatarList.innerHTML = '<p class="col-span-3 text-center text-gray-500">Memuat avatar Anda...</p>';
    
    const user = auth.currentUser;
    if (!user) return;
    
    try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const myAvatarUrls = userDoc.data()?.unlockedAvatars || [DEFAULT_AVATAR_URL];
        
        avatarList.innerHTML = '';
        
        const currentUserAvatar = userDoc.data()?.avatarUrl || DEFAULT_AVATAR_URL;
        
        // Tampilkan semua avatar yang ada di database
        GIF_AVATARS.forEach(avatar => {
            const isOwned = myAvatarUrls.includes(avatar.url);
            if (!isOwned) return; // Hanya tampilkan yang dimiliki
            
            const item = document.createElement('button');
            item.type = 'button';
            
            let ringClass = 'focus:ring-2 focus:ring-fb-blue';
            if (avatar.url === currentUserAvatar) {
                ringClass = 'ring-2 ring-fb-blue ring-offset-2'; 
            }
            
            item.className = `aspect-square bg-gray-200 rounded-full flex items-center justify-center text-gray-700 hover:bg-gray-300 ${ringClass} ${avatar.glow || ''}`;
            
            item.innerHTML = `<img src="${avatar.url}" alt="${avatar.name}" class="avatar-display-img">`;
            
            item.addEventListener('click', () => {
                selectAvatar(avatar.url);
            });
            avatarList.appendChild(item);
        });
        
        if (avatarList.innerHTML === '') {
            avatarList.innerHTML = '<p class="col-span-3 text-center text-gray-500">Anda belum punya avatar. Kunjungi Toko Poin.</p>';
        }
    } catch(err) {
        console.error("Gagal memuat avatar:", err);
        avatarList.innerHTML = '<p class="col-span-3 text-center text-red-500">Gagal memuat avatar.</p>';
    }
}

async function selectAvatar(avatarUrl) {
    const user = auth.currentUser;
    if (!user) return showModalMessage("Kesalahan", "Anda harus login.");
    try {
        await updateDoc(doc(db, "users", user.uid), { avatarUrl: avatarUrl });
        navigateTo('Settings'); 
    } catch (err) {
        console.error("Gagal simpan avatar:", err);
        showModalMessage("Gagal Simpan", "Gagal menyimpan avatar Anda.");
    }
}

// --- Fungsi Render & Logika Tema Chat ---
function applyChatTheme() {
    DUMMY_CHAT_THEMES.forEach(theme => {
        chatMessageList.classList.remove(...theme.css.split(' '));
    });
    
    const theme = DUMMY_CHAT_THEMES.find(t => t.id === selectedChatThemeId) || DUMMY_CHAT_THEMES[0];
    chatMessageList.classList.add(...theme.css.split(' '));
}

function renderChatThemeSelector() {
    chatThemeList.innerHTML = '';
    DUMMY_CHAT_THEMES.forEach(theme => {
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'flex flex-col items-center gap-2 hover:opacity-80';
        
        item.innerHTML = `
            <div class="w-16 h-16 rounded-full ${theme.css} border-2 border-gray-300"></div>
            <p class="font-semibold text-sm">${escapeHtml(theme.name)}</p>
        `;
        
        item.addEventListener('click', () => {
            selectedChatThemeId = theme.id;
            localStorage.setItem('chatTheme', theme.id); 
            applyChatTheme();
            
            document.querySelectorAll('#chatThemeList button').forEach(btn => btn.classList.remove('ring-2', 'ring-fb-blue', 'ring-offset-2'));
            item.classList.add('ring-2', 'ring-fb-blue', 'ring-offset-2');
        });
        
        if (theme.id === selectedChatThemeId) {
            item.classList.add('ring-2', 'ring-fb-blue', 'ring-offset-2');
        }
        
        chatThemeList.appendChild(item);
    });
}


// --- Bagian Auth, Profile ---

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = e.target.email.value;
  const pass = e.target.password.value;
  try {
    await createUserWithEmailAndPassword(auth, email, pass);
    registerForm.reset();
  } catch (err) {
    console.error("Gagal daftar:", err);
    showModalMessage("Gagal daftar", err.message);
  }
});

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = e.target.email.value;
  const pass = e.target.password.value;
  try {
    await signInWithEmailAndPassword(auth, email, pass);
    loginForm.reset();
  } catch (err) {
    console.error("Gagal login:", err);
    showModalMessage("Gagal masuk", err.message);
  }
});

function renderAvatar(el, avatarUrl, displayName, sizeClass, glowClass = '') {
    const avatarLetter = displayName[0] ? displayName[0].toUpperCase() : '?';
    const baseClasses = `rounded-full flex items-center justify-center font-bold`;
    
    if (avatarUrl) {
        el.innerHTML = `<img src="${avatarUrl}" alt="Avatar" class="avatar-display-img">`;
        el.className = `${sizeClass} ${baseClasses} ${glowClass} bg-gray-200`; 
    } else {
        el.innerHTML = `<span>${avatarLetter}</span>`;
        el.className = `${sizeClass} ${baseClasses} bg-fb-blue text-white`;
    }
}

function updateProfileUI(user, userData = {}) {
    if (!user) return;
    
    const displayName = user.displayName || user.email;
    const avatarUrl = userData.avatarUrl || null; 
    const isVerified = userData.isVerified || false; 
    
    currentUserAvatarUrl = avatarUrl; 
    isCurrentUserVerified = isVerified; 
    
    const avatarData = GIF_AVATARS.find(a => a.url === avatarUrl);
    const glowClass = avatarData?.glow || '';
    
    const checkmarkHtml = isVerified ? VERIFIED_BADGE_SVG : ''; 

    // 1. Main View (Header)
    renderAvatar(mainAvatarDisplay, avatarUrl, displayName, 'w-10 h-10 text-lg', glowClass);
    
    // 2. Post View
    renderAvatar(postAvatarDisplay, avatarUrl, displayName, 'w-12 h-12 text-xl mr-3', glowClass);
    renderPostHeader(); 
    
    // 3. Menu View
    menuProfileName.innerHTML = `<span>${escapeHtml(displayName)}</span>${checkmarkHtml}`; 
    renderAvatar(menuAvatarDisplay, avatarUrl, displayName, 'w-12 h-12 text-xl mr-4', glowClass);
    menuAvatarDisplay.parentElement.onclick = () => openProfilePage(user.uid);
    
    // 4. Settings View
    settingsProfileName.innerHTML = `<span>${escapeHtml(displayName)}</span>${checkmarkHtml}`; 
    renderAvatar(settingsAvatarDisplay, avatarUrl, displayName, 'w-24 h-24 text-4xl mb-4', glowClass);
    settingsNameInput.value = displayName;
    settingsAvatarDisplay.onclick = () => openProfilePage(user.uid);
    settingsProfileName.onclick = () => openProfilePage(user.uid);
    
    // 5. Update semua avatar di kolom komentar
    const commentAvatars = document.querySelectorAll('.currentUserCommentAvatar');
    commentAvatars.forEach(avatarEl => {
        renderAvatar(avatarEl, avatarUrl, displayName, 'w-8 h-8 text-sm', glowClass);
        avatarEl.classList.add('currentUserCommentAvatar'); 
    });
}

// Fungsi untuk UPDATE nama (hanya untuk user yang sudah ada)
async function saveProfileName(name) {
  const user = auth.currentUser;
  if (!user) return;
  await updateProfile(user, { displayName: name });
  await updateDoc(doc(db, "users", user.uid), {
    name: name,
    updatedAt: new Date()
  });
}

// Form Pendaftaran Awal (Hanya untuk pengguna baru)
profileForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = profileNameInput.value.trim();
  if (!name) return showModalMessage("Perhatian", "Nama tidak boleh kosong");
  
  const user = auth.currentUser;
  if (!user) return;
  
  try {
    await updateProfile(user, { displayName: name });
    // Buat dokumen user baru dengan data default
    await setDoc(doc(db, "users", user.uid), {
        name: name,
        email: user.email,
        updatedAt: new Date(),
        avatarUrl: DEFAULT_AVATAR_URL,
        isVerified: false,
        points: 0,
        unlockedAvatars: [GIF_AVATARS[0].url, GIF_AVATARS[1].url], // Beri 2 avatar gratis
        unlockedBadges: [], 
        postsCount: 0, 
        commentsCount: 0 
    });
    
    profileModal.style.display = "none";
    navigateTo('Main');
  } catch (err) {
    console.error("Gagal simpan nama:", err);
    showModalMessage("Gagal simpan nama", err.message);
  }
});

// Form Pengaturan (Untuk ganti nama)
settingsForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = settingsNameInput.value.trim();
    if (!name) return showModalMessage("Perhatian", "Nama tidak boleh kosong");
    
    try {
        await saveProfileName(name); 
        showModalMessage("Sukses", "Nama berhasil diperbarui!");
        navigateTo('Menu'); 
    } catch (err) {
        console.error("Gagal simpan nama:", err);
        showModalMessage("Gagal simpan nama", err.message);
    }
});

function subscribeToUserDoc(uid) {
    if (userDocUnsubscribe) userDocUnsubscribe(); 
    
    userDocUnsubscribe = onSnapshot(doc(db, "users", uid), (docSnap) => {
        const user = auth.currentUser;
        if (user) {
            if (docSnap.exists()) {
                updateProfileUI(user, docSnap.data());
            } else {
                updateProfileUI(user, {}); 
            }
        }
    }, (err) => {
        console.error("Gagal listen ke user doc:", err);
    });
}


let unsubscribeCurhatListener = null;
let unsubscribeChatListener = null; 

onAuthStateChanged(auth, async (user) => {
  if (unsubscribeCurhatListener) unsubscribeCurhatListener();
  if (unsubscribeChatListener) unsubscribeChatListener();
  if (userDocUnsubscribe) userDocUnsubscribe(); 
  if (unsubscribeProfilePosts) unsubscribeProfilePosts(); 

  if (user) {
    if (!user.displayName) {
      profileModal.style.display = "flex";
      navigateTo('Auth'); 
      return;
    }

    subscribeToUserDoc(user.uid); 
    
    profileModal.style.display = "none";
    navigateTo('Main');

    unsubscribeCurhatListener = listenCurhatan();
    unsubscribeChatListener = listenGlobalChat();
    
    renderAvatarList(); 
    renderChatThemeSelector(); 
  } else {
    navigateTo('Auth');
  }
});

// --- POST CURHATAN (Firestore) ---
curhatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = e.target.text.value.trim();
  if (!text) return;
  const user = auth.currentUser;
  if (!user) return showModalMessage("Kesalahan", "Harus login dulu");
  const userName = user.displayName || user.email;
  const postData = {
    text, userId: user.uid, userName, createdAt: new Date(), comments: [], likes: []
  };
  
  if (currentUserAvatarUrl) {
      postData.userAvatarUrl = currentUserAvatarUrl; 
  }
  postData.isVerified = isCurrentUserVerified; 
  
  if (selectedLocation) { postData.location = selectedLocation; }
  if (selectedFeeling) { postData.feeling = selectedFeeling; }
  
  try {
    await addDoc(collection(db, "curhatan"), postData);
    
    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, { 
        points: increment(10),
        postsCount: increment(1) 
    });
    
    curhatForm.reset();
    selectedLocation = null; 
    selectedFeeling = null;
    navigateTo('Main'); 
  } catch (err) {
    console.error("Gagal posting:", err);
    showModalMessage("Gagal posting", err.message);
  }
});

// --- KIRIM PESAN CHAT GLOBAL (Firestore) ---
chatForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = chatTextInput.value.trim();
    if (!text) return;
    const user = auth.currentUser;
    if (!user) return showModalMessage("Kesalahan", "Harus login dulu");
    const userName = user.displayName || user.email;
    const messageData = {
        text, userId: user.uid, userName, createdAt: new Date()
    };
    try {
        await addDoc(collection(db, "globalChat"), messageData);
        chatForm.reset();
        chatMessageList.scrollTop = chatMessageList.scrollHeight;
    } catch (err) {
        console.error("Gagal kirim pesan:", err);
        showModalMessage("Gagal kirim pesan", err.message);
    }
});


// --- LISTEN REAL-TIME CURHATAN ---
function listenCurhatan() {
  const q = query(collection(db, "curhatan"), orderBy("createdAt", "desc"));
  const unsub = onSnapshot(q, (snapshot) => {
    curhatList.innerHTML = "";
    
    if (snapshot.empty) {
         curhatList.innerHTML = `
            <p class="text-center text-gray-500 mt-10 mb-4">Belum ada curhatan. Ayo buat postingan pertamamu!</p>
            ${generateDummyPosts()}
        `;
        curhatList.classList.add('pb-10');
        return;
    } else {
        curhatList.classList.remove('pb-10');
    }

    snapshot.forEach((docSnap) => {
      const postElement = createPostElement(docSnap);
      curhatList.appendChild(postElement);
    });
  }, (err) => {
    console.error("Listen curhatan error:", err);
  });
  return unsub;
}

// --- Buat Elemen Postingan (Reusable) ---
function createPostElement(docSnap) {
    const data = docSnap.data();
    const id = docSnap.id;
    const displayName = data.userName || data.user || "Anon";
    const time = data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : 'Baru saja';
    const isOwnPost = auth.currentUser && data.userId === auth.currentUser.uid;
    
    const locationData = data.location;
    const feelingData = data.feeling;
    const postAvatarUrl = data.userAvatarUrl || null; 
    const postIsVerified = data.isVerified || false; 
    const postUserId = data.userId; 
    
    let feelingDisplay = '';
    if (feelingData) {
        const actionText = feelingData.type === 'feeling' ? 'merasa' : 'sedang';
        feelingDisplay = ` ${escapeHtml(feelingData.emoji || '')} <span class="font-normal">${actionText} ${escapeHtml(feelingData.text)}.</span>`;
    }
    
    const mapPlaceholder = (locationData) 
        ? `
          <div class="bg-gray-100 mt-3 rounded-lg overflow-hidden relative">
              <div class="aspect-video flex items-center justify-center text-center text-gray-500 bg-gray-200 border border-gray-300">
                  <div class="p-4">
                      <svg class="w-8 h-8 mx-auto mb-2 text-red-500" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"/></svg>
                      <p class="text-sm font-medium">${escapeHtml(locationData.name)}</p>
                      <p class="text-xs">${escapeHtml(locationData.detail)}</p>
                  </div>
              </div>
          </div>
      ` : '';
      
    const div = document.createElement("div");
    div.className = `post-card mb-3 shadow-md`; 
    
    // --- Logika Avatar Postingan ---
    const avatarData = GIF_AVATARS.find(a => a.url === postAvatarUrl);
    const glowClass = avatarData?.glow || '';
    const avatarEl = document.createElement('div');
    renderAvatar(avatarEl, postAvatarUrl, displayName, 'w-10 h-10 text-lg mr-2', glowClass);
    
    const postCheckmarkHtml = postIsVerified ? VERIFIED_BADGE_SVG : ''; 
    
    const userInfoHtml = `
      <div class="p-4">
          <div class="flex items-center mb-3 relative">
              ${avatarEl.outerHTML}
              <div class="flex-grow">
                  <p class="font-semibold text-gray-900 flex items-center">
                      <button type="button" class="profile-link-btn font-semibold hover:underline">
                          <span>${escapeHtml(displayName)}</span>
                      </button>
                      ${postCheckmarkHtml}
                      ${feelingDisplay}
                      ${locationData ? `<span class="font-normal ml-1"> di <a href="#" class="font-bold text-fb-blue hover:underline">${escapeHtml(locationData.name)}</a></span>` : ''}
                  </p>
                  <p class="text-xs text-gray-500">${time} · Publik</p>
              </div>
              ${isOwnPost ? `
              <div class="ml-auto">
                  <button type="button" class="delete-menu-btn text-gray-500 hover:text-gray-800 p-1 rounded-full">
                      <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"></path></svg>
                  </button>
                  <div class="delete-dropdown w-40">
                      <button type="button" class="edit-post-btn w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                          Edit Postingan
                      </button>
                      <button type="button" class="delete-post-btn w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100">
                          Hapus Postingan
                      </button>
                  </div>
              </div>
              ` : ''}
          </div>
      </div>
    `;
    
    const postContentHtml = `
      <div class="px-4">
          <p class="text-gray-800 text-lg my-3 whitespace-pre-wrap">${escapeHtml(data.text)}</p>
          ${mapPlaceholder}
      </div>`;
    
    const likes = data.likes || [];
    const isLiked = auth.currentUser ? likes.includes(auth.currentUser.uid) : false;
    
    const buttonsHtml = `
      <div class="p-4 pt-0">
          <div class="flex justify-around border-t border-gray-200 mt-4 pt-2">
              <div class="flex items-center">
                  <button class="like-btn flex items-center ${isLiked ? 'text-fb-blue' : 'text-gray-600'} hover:text-fb-blue transition duration-150 p-2 rounded-lg">
                      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-2a2 2 0 00-2 2v5M6 10h2l3 3m-3 0v7a1 1 0 01-1 1H4a1 1 0 01-1-1v-7a1 1 0 011-1h2z"></path></svg>
                  </button>
                  <button class="like-count-btn text-sm font-semibold text-gray-600 hover:underline p-1">
                      (${likes.length})
                  </button>
              </div>
              
              <button class="comment-toggle flex items-center text-gray-600 hover:text-fb-blue transition duration-150 p-2 rounded-lg">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4.735-1.248l-3.376 1.099A.999.999 0 013 18.5V12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                  <span class="ml-1 text-sm font-semibold text-gray-600">(${(data.comments || []).length})</span>
              </button>
              
              <button class="flex items-center text-gray-600 hover:text-fb-blue transition duration-150 p-2 rounded-lg">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.024-3.535a6.66 6.66 0 000-4.634l-6.024-3.535M18 12a3 3 0 110-6 3 3 0 010 6zm0 0a3 3 0 110-6 3 3 0 010 6z"></path></svg>
              </button>
          </div>
      </div>
    `;
    
    const user = auth.currentUser;
    const userAvatarData = GIF_AVATARS.find(a => a.url === currentUserAvatarUrl);
    const userGlowClass = userAvatarData?.glow || '';
    const userAvatarEl = document.createElement('div');
    renderAvatar(userAvatarEl, currentUserAvatarUrl, user?.displayName || 'A', 'w-8 h-8 text-sm', userGlowClass);
    userAvatarEl.classList.add('currentUserCommentAvatar');

    const commentsHtml = `
      <div class="comments-area border-t border-gray-100 p-4 bg-gray-50 hidden">
          <div class="comments space-y-3 mb-4">
            </div>
          
          <div class="reply-status-container text-sm text-gray-500 mb-2 hidden"></div>
          
          <form class="commentForm flex gap-2 items-center">
              ${userAvatarEl.outerHTML}
              <input type="text" placeholder="Tulis komentar..." required
                  class="comment-input flex-grow px-3 py-2 text-sm border-gray-300 bg-white rounded-full focus:ring-0 focus:border-fb-blue"
              >
              <button class="text-fb-blue hover:opacity-75 transition duration-150 p-2 rounded-full">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 9l3 3m0 0l-3 3m3-3H8m8 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </button>
          </form>
      </div>
    `;
    
    div.innerHTML = userInfoHtml + postContentHtml + buttonsHtml + commentsHtml;
    
    // --- Listener Tombol Suka ---
    const likeBtn = div.querySelector(".like-btn");
    likeBtn.addEventListener('click', async () => {
        const user = auth.currentUser;
        if (!user) {
            showModalMessage("Kesalahan", "Anda harus login untuk menyukai postingan.");
            return;
        }
        
        const postRef = doc(db, "curhatan", id);
        const currentLikes = (docSnap.data().likes || []);
        const isCurrentlyLiked = currentLikes.includes(user.uid);

        try {
            if (isCurrentlyLiked) {
                await updateDoc(postRef, { likes: arrayRemove(user.uid) });
            } else {
                await updateDoc(postRef, { likes: arrayUnion(user.uid) });
            }
        } catch (err) {
            console.error("Gagal update like:", err);
            showModalMessage("Gagal", "Gagal memperbarui suka.");
        }
    });
    
    // --- Listener Tombol Jumlah Suka ---
    const likeCountBtn = div.querySelector(".like-count-btn");
    if (likeCountBtn) {
        likeCountBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openLikesList(id);
        });
    }
    
    // --- Listener Tombol Hapus & Edit ---
    const deleteMenuBtn = div.querySelector(".delete-menu-btn");
    const deleteDropdown = div.querySelector(".delete-dropdown");
    const deletePostBtn = div.querySelector(".delete-post-btn");
    const editPostBtn = div.querySelector(".edit-post-btn"); 

    if (isOwnPost && deleteMenuBtn) {
        deleteMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation(); 
            document.querySelectorAll('.delete-dropdown.show').forEach(el => {
                if(el !== deleteDropdown) el.classList.remove('show');
            });
            deleteDropdown.classList.toggle('show');
        });
        
        // Listener Edit
        editPostBtn.addEventListener('click', () => {
            openEditPostModal(id, data.text);
        });

        // Listener Hapus
        deletePostBtn.addEventListener('click', async () => {
            if (confirm("Anda yakin ingin menghapus postingan ini? Tindakan ini tidak bisa dibatalkan.")) {
                try {
                    await deleteDoc(doc(db, "curhatan", id));
                } catch (err) {
                    console.error("Gagal hapus postingan:", err);
                    showModalMessage("Gagal", "Tidak dapat menghapus postingan.");
                }
            }
            deleteDropdown.classList.remove('show');
        });
    }
    
    // --- Listener Tombol Profil ---
    const profileLinkBtn = div.querySelector(".profile-link-btn");
    if (profileLinkBtn) {
        profileLinkBtn.addEventListener('click', () => {
            openProfilePage(postUserId);
        });
    }
    
    // --- Logika untuk Render & Balas Komentar ---
    const commentsArea = div.querySelector(".comments-area");
    const commentsContainer = commentsArea.querySelector(".comments");
    const form = commentsArea.querySelector(".commentForm");
    const commentInput = form.querySelector(".comment-input");
    const replyStatusEl = commentsArea.querySelector(".reply-status-container");

    function resetReplyState() {
        form.dataset.replyToId = '';
        form.dataset.replyToName = '';
        replyStatusEl.classList.add('hidden');
        replyStatusEl.innerHTML = '';
    }
    
    const allComments = (data.comments || []).map((c, i) => {
        if (!c.commentId) {
            c.commentId = `c_${c.createdAt?.seconds || i}_${c.userId}`;
        }
        return c;
    });
    
    const repliesMap = new Map();
    const mainComments = [];
    
    allComments.forEach(c => {
        if (c.replyTo) {
            if (!repliesMap.has(c.replyTo)) {
                repliesMap.set(c.replyTo, []);
            }
            repliesMap.get(c.replyTo).push(c);
        } else {
            mainComments.push(c);
        }
    });

    mainComments.forEach(c => {
        const commentEl = createCommentElement(c, false, id, docSnap); 
        commentsContainer.appendChild(commentEl);
        
        const replyBtn = commentEl.querySelector('.reply-btn');
        if (replyBtn) {
            replyBtn.addEventListener('click', () => {
                form.dataset.replyToId = c.commentId;
                form.dataset.replyToName = c.userName;
                replyStatusEl.innerHTML = `Membalas <strong>${escapeHtml(c.userName)}</strong> <button type="button" class="cancel-reply-btn text-red-500 ml-2">[Batal]</button>`;
                replyStatusEl.classList.remove('hidden');
                commentInput.focus();
                
                replyStatusEl.querySelector('.cancel-reply-btn').addEventListener('click', resetReplyState);
            });
        }
        
        const replies = repliesMap.get(c.commentId) || [];
        if (replies.length > 0) {
            const repliesContainer = document.createElement('div');
            repliesContainer.className = 'ml-6 space-y-3 hidden'; 
            
            replies.forEach(r => {
                const replyEl = createCommentElement(r, true, id, docSnap); 
                repliesContainer.appendChild(replyEl);
            });
            
            const viewRepliesBtn = document.createElement('button');
            viewRepliesBtn.className = 'view-replies-btn text-sm font-semibold text-gray-600 hover:underline ml-10 mt-1';
            viewRepliesBtn.textContent = `Lihat ${replies.length} balasan...`;
            viewRepliesBtn.addEventListener('click', () => {
                repliesContainer.classList.toggle('hidden');
                viewRepliesBtn.textContent = repliesContainer.classList.contains('hidden') ? `Lihat ${replies.length} balasan...` : 'Sembunyikan balasan';
            });
            
            commentsContainer.appendChild(viewRepliesBtn);
            commentsContainer.appendChild(repliesContainer);
        }
    });
    

    const commentToggleBtn = div.querySelector(".comment-toggle");
    commentToggleBtn.addEventListener('click', () => {
      commentsArea.classList.toggle('hidden');
    });
    
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const commentText = commentInput.value.trim();
      if (!commentText) return;
      const user = auth.currentUser;
      if (!user) return showModalMessage("Kesalahan", "Harus login dulu untuk berkomentar!");
      
      const newCommentId = "c_" + Date.now() + Math.random().toString(36).substring(2, 9);
      const parentId = form.dataset.replyToId || null;
      const parentName = form.dataset.replyToName || null;
      
      const commentData = {
          commentId: newCommentId,
          replyTo: parentId,
          replyToName: parentName,
          userId: user.uid,
          userName: user.displayName || user.email,
          text: commentText,
          createdAt: new Date(),
          userAvatarUrl: currentUserAvatarUrl,
          isVerified: isCurrentUserVerified,
          likes: [] 
      };
      
      try {
        await updateDoc(doc(db, "curhatan", id), {
          comments: arrayUnion(commentData)
        });
        
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, { 
            points: increment(2),
            commentsCount: increment(1) 
        });
        
        e.target.reset();
        resetReplyState();
      } catch (err) {
        console.error("Gagal kirim komentar:", err);
        showModalMessage("Gagal kirim komentar", err.message);
      }
    });
    
    return div; 
}

// --- Helper: Buat Elemen Komentar ---
function createCommentElement(c, isReply = false, postId, docSnap) {
    const commenterAvatarData = GIF_AVATARS.find(a => a.url === c.userAvatarUrl);
    const commenterGlowClass = commenterAvatarData?.glow || '';
    
    const el = document.createElement('div');
    el.className = 'comment-container';
    
    const avatarEl = document.createElement('div');
    renderAvatar(avatarEl, c.userAvatarUrl, c.userName || 'A', 'w-7 h-7 text-xs mr-2 shrink-0', commenterGlowClass);

    const commenterIsVerified = c.isVerified || false;
    const commenterCheckmarkHtml = commenterIsVerified ? VERIFIED_BADGE_SVG : '';
    
    const timeAgo = c.createdAt?.seconds ? formatTimeAgo(c.createdAt.seconds * 1000) : 'baru saja';
    
    let textContent = escapeHtml(c.text);
    if (isReply && c.replyToName) {
        textContent = `<strong class="text-fb-blue mr-1">@${escapeHtml(c.replyToName)}</strong> ${textContent}`;
    }
    
    const likes = c.likes || [];
    const isLiked = auth.currentUser ? likes.includes(auth.currentUser.uid) : false;
    const isOwnComment = auth.currentUser && c.userId === auth.currentUser.uid;

    el.innerHTML = `
        <div class="flex items-start">
            ${avatarEl.outerHTML}
            <div class="bg-gray-200 p-2 rounded-xl flex-grow max-w-[calc(100%-40px)]">
                <p class="font-semibold text-sm text-gray-800 flex items-center">
                    <button type="button" class="profile-link-btn font-semibold hover:underline">
                       <span>${escapeHtml(c.userName || c.user)}</span>
                    </button>
                    ${commenterCheckmarkHtml}
                </p>
                <p class="text-sm text-gray-700 break-words">${textContent}</p>
            </div>
        </div>
        <div class="flex items-center text-xs font-semibold text-gray-600 gap-3 ml-9 mt-1">
            <span class="font-normal">${timeAgo}</span>
            <button class="like-comment-btn hover:underline ${isLiked ? 'text-fb-blue' : ''}">
                ${isLiked ? 'Disukai' : 'Suka'} (${likes.length})
            </button>
            ${!isReply ? `<button class="reply-btn hover:underline">Balas</button>` : ''}
            ${isOwnComment ? `<button class="delete-comment-btn text-red-500 hover:underline">Hapus</button>` : ''}
        </div>
    `;
    
    // --- Listener untuk Suka Komentar ---
    const likeBtn = el.querySelector('.like-comment-btn');
    if (likeBtn) {
        likeBtn.addEventListener('click', async () => {
            const user = auth.currentUser;
            if (!user) return showModalMessage("Kesalahan", "Anda harus login.");
            
            const postRef = doc(db, "curhatan", postId);
            const currentComments = docSnap.data().comments || [];
            
            const commentIndex = currentComments.findIndex(com => com.commentId === c.commentId);
            if (commentIndex === -1) return; 
            
            const commentToUpdate = currentComments[commentIndex];
            const commentLikes = commentToUpdate.likes || [];
            const isAlreadyLiked = commentLikes.includes(user.uid);

            if (isAlreadyLiked) {
                commentToUpdate.likes = commentLikes.filter(uid => uid !== user.uid);
            } else {
                commentToUpdate.likes.push(user.uid);
            }
            
            try {
                await updateDoc(postRef, { comments: currentComments });
            } catch(err) {
                console.error("Gagal suka komentar:", err);
                showModalMessage("Gagal", "Gagal memperbarui suka.");
            }
        });
    }
    
    // --- Listener untuk Hapus Komentar ---
    const deleteBtn = el.querySelector('.delete-comment-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', async () => {
            if (!confirm("Anda yakin ingin menghapus komentar ini?")) return;
            
            const postRef = doc(db, "curhatan", postId);
            const currentComments = docSnap.data().comments || [];
            
            const newComments = currentComments.filter(com => {
                return com.commentId !== c.commentId && com.replyTo !== c.commentId;
            });
            
            try {
                await updateDoc(postRef, { comments: newComments });
            } catch(err) {
                console.error("Gagal hapus komentar:", err);
                showModalMessage("Gagal", "Gagal menghapus komentar.");
            }
        });
    }
    
    // Listener untuk tombol profil
    el.querySelector('.profile-link-btn').addEventListener('click', () => {
        openProfilePage(c.userId);
    });
    
    return el;
}

// --- Helper: Format Waktu ---
function formatTimeAgo(timestamp) {
    const now = Date.now();
    const seconds = Math.floor((now - timestamp) / 1000);
    
    let interval = seconds / 31536000; // tahun
    if (interval > 1) return Math.floor(interval) + " thn";
    interval = seconds / 2592000; // bulan
    if (interval > 1) return Math.floor(interval) + " bln";
    interval = seconds / 86400; // hari
    if (interval > 1) return Math.floor(interval) + " hr";
    interval = seconds / 3600; // jam
    if (interval > 1) return Math.floor(interval) + " jam";
    interval = seconds / 60; // menit
    if (interval > 1) return Math.floor(interval) + " mnt";
    return "baru saja";
}

// --- Listener untuk Postingan di Halaman Profil ---
function listenProfilePosts(userId) {
    const q = query(
        collection(db, "curhatan"), 
        where("userId", "==", userId), 
        orderBy("createdAt", "desc")
    );
    
    const unsub = onSnapshot(q, (snapshot) => {
        profilePostList.innerHTML = "";
        
        if (snapshot.empty) {
            profilePostList.innerHTML = `
                <p class="text-center text-gray-500 mt-10">Pengguna ini belum memiliki postingan.</p>
            `;
            return;
        }

        snapshot.forEach((docSnap) => {
            const postElement = createPostElement(docSnap);
            profilePostList.appendChild(postElement);
        });
    }, (err) => {
        console.error("Listen profile posts error:", err);
        profilePostList.innerHTML = `<p class="text-center text-red-500 mt-10">Gagal memuat postingan.</p>`;
    });
    return unsub;
}

// --- Fungsi untuk Membuka Halaman Profil ---
async function openProfilePage(userId) {
    if (!userId) return;
    
    if (unsubscribeProfilePosts) unsubscribeProfilePosts();
    
    profilePostList.innerHTML = '<p class="text-center text-gray-500 mt-10">Memuat postingan...</p>';
    
    // Cek Lencana
    if(auth.currentUser && userId === auth.currentUser.uid && !isCheckingBadges) {
        checkAndGrantBadges(userId);
    }
    
    try {
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            const displayName = userData.name || "Pengguna";
            const avatarUrl = userData.avatarUrl || null;
            const isVerified = userData.isVerified || false;
            const points = userData.points || 0; 
            const badges = userData.unlockedBadges || []; 
            
            profileHeaderName.textContent = displayName;
            profileViewName.innerHTML = `<span>${escapeHtml(displayName)}</span> ${isVerified ? VERIFIED_BADGE_SVG : ''}`;
            profileViewEmail.textContent = censorEmail(userData.email); 
            profileViewPoints.textContent = `${points} Poin`; 
            
            // Tampilkan Lencana
            profileViewBadges.innerHTML = '';
            badges.forEach(badgeId => {
                const badge = BADGE_DEFINITIONS[badgeId];
                if (badge) {
                    const badgeEl = document.createElement('span');
                    badgeEl.className = 'badge';
                    badgeEl.innerHTML = `<span class="icon">${badge.icon}</span> ${badge.name}`;
                    profileViewBadges.appendChild(badgeEl);
                }
            });

            const avatarData = GIF_AVATARS.find(a => a.url === avatarUrl);
            const glowClass = avatarData?.glow || '';
            renderAvatar(profileViewAvatar, avatarUrl, displayName, 'w-24 h-24 text-4xl mb-4', glowClass);

        } else {
            profileViewName.innerHTML = `<span>Pengguna Tak Dikenal</span>`;
            profileViewEmail.textContent = '';
            profileViewPoints.textContent = '0 Poin'; 
            profileViewBadges.innerHTML = ''; 
            renderAvatar(profileViewAvatar, null, '?', 'w-24 h-24 text-4xl mb-4');
        }
    } catch (err) {
        console.error("Gagal ambil data profil:", err);
        profileViewName.innerHTML = `<span>Gagal memuat profil</span>`;
    }

    navigateTo('Profile');
    
    unsubscribeProfilePosts = listenProfilePosts(userId);
}

// --- Fungsi untuk Cek & Beri Lencana ---
async function checkAndGrantBadges(userId) {
    isCheckingBadges = true;
    try {
        const userRef = doc(db, "users", userId);
        const userDoc = await getDoc(userRef);
        if (!userDoc.exists()) return;

        const userData = userDoc.data();
        const currentBadges = userData.unlockedBadges || [];
        const newBadges = [];
        
        // Cek setiap definisi lencana
        for (const badgeId in BADGE_DEFINITIONS) {
            if (!currentBadges.includes(badgeId)) { // Jika belum dimiliki
                const requirement = BADGE_DEFINITIONS[badgeId].requires;
                if (requirement(userData)) {
                    // Pengguna memenuhi syarat
                    newBadges.push(badgeId);
                }
            }
        }

        if (newBadges.length > 0) {
            // Ada lencana baru! Simpan ke database
            await updateDoc(userRef, {
                unlockedBadges: arrayUnion(...newBadges)
            });
            showModalMessage("Lencana Baru Didapat!", `Anda membuka: ${newBadges.map(id => BADGE_DEFINITIONS[id].name).join(', ')}`);
        }
        
    } catch (err) {
        console.error("Gagal mengecek lencana:", err);
    } finally {
        isCheckingBadges = false;
    }
}

// --- Fungsi untuk Membuka Daftar Suka ---
async function openLikesList(postId) {
    navigateTo('Likes');
    likesViewList.innerHTML = '<p class="text-center text-gray-500 p-4">Memuat daftar...</p>';

    try {
        const postDoc = await getDoc(doc(db, "curhatan", postId));
        if (!postDoc.exists()) {
            likesViewList.innerHTML = '<p class="text-center text-red-500 p-4">Postingan tidak ditemukan.</p>';
            return;
        }
        
        const likesArray = postDoc.data().likes || [];
        if (likesArray.length === 0) {
            likesViewList.innerHTML = '<p class="text-center text-gray-500 p-4">Belum ada yang menyukai postingan ini.</p>';
            return;
        }

        const userIdsToFetch = likesArray.slice(0, 30); 
        const userPromises = userIdsToFetch.map(uid => getDoc(doc(db, "users", uid)));
        const userDocs = await Promise.all(userPromises);
        
        likesViewList.innerHTML = ''; 
        
        userDocs.forEach(userDoc => {
            if (userDoc.exists()) {
                const userData = userDoc.data();
                const displayName = userData.name || 'Pengguna';
                const avatarUrl = userData.avatarUrl || null;
                const isVerified = userData.isVerified || false;
                
                const avatarData = GIF_AVATARS.find(a => a.url === avatarUrl);
                const glowClass = avatarData?.glow || '';
                
                const userEl = document.createElement('div');
                userEl.className = 'flex items-center p-3 bg-white rounded-lg shadow-sm mb-2';
                
                const avatarEl = document.createElement('div');
                renderAvatar(avatarEl, avatarUrl, displayName, 'w-10 h-10 text-lg mr-3', glowClass);
                
                userEl.innerHTML = `
                    ${avatarEl.outerHTML}
                    <button type="button" class="profile-link-btn font-semibold hover:underline text-gray-900 flex items-center">
                        <span>${escapeHtml(displayName)}</span>
                        ${isVerified ? VERIFIED_BADGE_SVG : ''}
                    </button>
                `;
                
                userEl.querySelector('.profile-link-btn').addEventListener('click', () => {
                    openProfilePage(userDoc.id);
                });
                
                likesViewList.appendChild(userEl);
            }
        });

    } catch (err) {
        console.error("Gagal mengambil daftar suka:", err);
        likesViewList.innerHTML = '<p class="text-center text-red-500 p-4">Gagal memuat daftar.</p>';
    }
}

// --- Fungsi untuk Membuka Modal Edit Postingan ---
function openEditPostModal(postId, currentText) {
    currentEditingPostId = postId;
    editPostTextarea.value = currentText; 
    navigateTo('EditPost');
    editPostTextarea.focus();
}

// --- Fungsi untuk Membuka Halaman Peringkat ---
async function openLeaderboard() {
    navigateTo('Leaderboard');
    leaderboardList.innerHTML = '<p class="text-center text-gray-500 p-4">Memuat papan peringkat...</p>';
    
    try {
        const q = query(collection(db, "users"), orderBy("points", "desc"), limit(10));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            leaderboardList.innerHTML = '<p class="text-center text-gray-500 p-4">Belum ada pengguna dengan poin.</p>';
            return;
        }
        
        leaderboardList.innerHTML = ''; // Kosongkan daftar
        
        let rank = 1;
        querySnapshot.forEach(userDoc => {
            const userData = userDoc.data();
            const displayName = userData.name || 'Pengguna';
            const avatarUrl = userData.avatarUrl || null;
            const isVerified = userData.isVerified || false;
            const points = userData.points || 0;
            
            const avatarData = GIF_AVATARS.find(a => a.url === avatarUrl);
            const glowClass = avatarData?.glow || '';
            
            const rankColor = rank === 1 ? 'text-yellow-500' : (rank === 2 ? 'text-gray-400' : (rank === 3 ? 'text-yellow-700' : 'text-gray-500'));
            
            const userEl = document.createElement('div');
            userEl.className = 'flex items-center p-3 bg-white rounded-lg shadow-sm mb-2';
            
            const avatarEl = document.createElement('div');
            renderAvatar(avatarEl, avatarUrl, displayName, 'w-10 h-10 text-lg mr-3', glowClass);
            
            userEl.innerHTML = `
                <div class="w-10 text-center">
                    <span class="text-xl font-bold ${rankColor}">#${rank}</span>
                </div>
                ${avatarEl.outerHTML}
                <div class="flex-grow">
                    <button type="button" class="profile-link-btn font-semibold hover:underline text-gray-900 flex items-center">
                        <span>${escapeHtml(displayName)}</span>
                        ${isVerified ? VERIFIED_BADGE_SVG : ''}
                    </button>
                </div>
                <div class="text-lg font-bold text-fb-blue">
                    ${points} Poin
                </div>
            `;
            
            userEl.querySelector('.profile-link-btn').addEventListener('click', () => {
                openProfilePage(userDoc.id);
            });
            
            leaderboardList.appendChild(userEl);
            rank++;
        });

    } catch (err) {
        console.error("Gagal mengambil papan peringkat:", err);
        leaderboardList.innerHTML = '<p class="text-center text-red-500 p-4">Gagal memuat papan peringkat. Pastikan Anda sudah membuat indeks di Firestore.</p>';
    }
}

// --- Fungsi Toko Poin (Dihapus) ---


// --- LISTEN REAL-TIME CHAT GLOBAL ---
function listenGlobalChat() {
    const q = query(collection(db, "globalChat"), orderBy("createdAt", "asc"), limitToLast(50));
    const unsub = onSnapshot(q, (snapshot) => {
        chatMessageList.innerHTML = ""; 
        if (snapshot.empty) {
            chatMessageList.innerHTML = `<p class="text-center text-gray-500 mt-4">Belum ada pesan. Mulai obrolan!</p>`;
            return;
        }
        snapshot.forEach((doc) => {
            const data = doc.data();
            const isOwnMessage = auth.currentUser && data.userId === auth.currentUser.uid;
            const container = document.createElement('div');
            container.className = 'chat-message-container';
            if (isOwnMessage) {
                container.classList.add('sent');
                container.innerHTML = `<div class="chat-bubble sent">${escapeHtml(data.text)}</div>`;
            } else {
                container.classList.add('received');
                // Tampilkan centang di chat akan butuh join data user, kita lewati dulu
                container.innerHTML = `
                    <p class="chat-sender-name">${escapeHtml(data.userName)}</p>
                    <div class="chat-bubble received">${escapeHtml(data.text)}</div>
                `;
            }
            chatMessageList.appendChild(container);
        });
        chatMessageList.scrollTop = chatMessageList.scrollHeight;
    }, (err) => {
        console.error("Listen chat error:", err);
    });
    return unsub;
}


// --- Helper: Generate Dummy Posts ---
function generateDummyPosts() {
    return ""; 
}

// --- Helper: escape untuk mencegah XSS sederhana ---
function escapeHtml(str) {
  if (!str && str !== 0) return "";
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// --- Helper untuk sensor email ---
function censorEmail(email) {
  if (!email || email.indexOf('@') === -1) {
    return 'Email tersembunyi'; 
  }
  const [localPart, domain] = email.split('@');
  if (localPart.length <= 3) {
    return `${localPart.substring(0, 1)}***@${domain}`;
  }
  return `${localPart.substring(0, 3)}***@${domain}`;
}

// --- Helper: Modal Pesan (Mengganti alert()) ---
const msgModal = document.getElementById('messageModal');
const msgTitle = document.getElementById('messageTitle');
const msgContent = document.getElementById('messageContent');
document.getElementById('messageCloseBtn').addEventListener('click', () => msgModal.style.display = 'none');

function showModalMessage(title, content) {
    msgTitle.textContent = title;
    msgContent.textContent = content;
    msgModal.style.display = 'flex';
}