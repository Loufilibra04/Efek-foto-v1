import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  doc, 
  setLogLevel 
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Heart, 
  User, 
  MessageCircle, 
  Plus, 
  Send, 
  ArrowLeft, 
  Users, 
  Wand2,
  ChevronDown,
  Github,
  Sun,
  Moon
} from 'lucide-react';

// --- Konfigurasi Firebase ---
// Variabel global __firebase_config dan __app_id akan disediakan oleh environment.
const firebaseConfig = typeof __firebase_config !== 'undefined' 
  ? JSON.parse(__firebase_config) 
  : { apiKey: "YOUR_FALLBACK_API_KEY", authDomain: "...", projectId: "..." };

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
setLogLevel('debug'); // Aktifkan log debug Firestore

// --- Dummy Data (Initial) ---
const initialCharacters = [
  {
    id: 'dummy-1',
    name: 'Airi',
    race: 'Cyborg',
    role: 'Tsundere',
    personality: { tsundereYandere: 20, coolSweet: 30, shyBold: 70 },
    description: 'Cyborg pendiam yang diam-diam peduli.',
    avatarUrl: 'https://placehold.co/400x600/E8D5FF/6D28D9?text=Airi+🌸'
  },
  {
    id: 'dummy-2',
    name: 'Kazuto',
    race: 'Manusia',
    role: 'MC',
    personality: { tsundereYandere: 50, coolSweet: 80, shyBold: 60 },
    description: 'Protagonis penuh semangat dengan pedang neon.',
    avatarUrl: 'https://placehold.co/400x600/FFD6EC/D946EF?text=Kazuto+⚡'
  },
  {
    id: 'dummy-3',
    name: 'Rika',
    race: 'Angel',
    role: 'Senpai',
    personality: { tsundereYandere: 10, coolSweet: 90, shyBold: 40 },
    description: 'Senpai yang baik hati dari surga, mengawasi semua orang.',
    avatarUrl: 'https://placehold.co/400x600/D1FAFF/0EA5E9?text=Rika+🕊️'
  }
];

// --- Komponen Utility ---

/**
 * Komponen GlassCard (Reusable)
 * Wrapper untuk efek glassmorphism.
 */
const GlassCard = ({ children, className = '' }) => {
  return (
    <div className={`bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-lg ${className}`}>
      {children}
    </div>
  );
};

/**
 * Komponen Tombol Neon (Reusable)
 */
const NeonButton = ({ children, onClick, className = '', variant = 'primary' }) => {
  const primaryClasses = 'bg-pink-500/80 hover:bg-pink-400/90 shadow-pink-500/40 hover:shadow-pink-400/60';
  const secondaryClasses = 'bg-purple-500/80 hover:bg-purple-400/90 shadow-purple-500/40 hover:shadow-purple-400/60';
  
  return (
    <motion.button
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`px-6 py-3 rounded-lg font-semibold text-white shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent ${variant === 'primary' ? primaryClasses : secondaryClasses} ${className}`}
    >
      {children}
    </motion.button>
  );
};

/**
 * Background Partikel Futuristik
 */
const FuturisticBackground = () => {
  return (
    <div className="fixed inset-0 -z-50 overflow-hidden bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900">
      <div className="absolute inset-0 z-0 opacity-30">
        {/* Simple CSS animated particles */}
        <style>{`
          @keyframes move {
            0% { transform: translateY(0) translateX(0) scale(1); opacity: 0.1; }
            50% { transform: translateY(-300px) translateX(200px) scale(1.5); opacity: 0.5; }
            100% { transform: translateY(-600px) translateX(-200px) scale(1); opacity: 0.1; }
          }
          .particle {
            position: absolute;
            border-radius: 50%;
            background: linear-gradient(to right, #ec4899, #8b5cf6);
            animation: move 25s infinite alternate;
          }
        `}</style>
        <div className="particle" style={{ left: '10%', bottom: '10%', width: '100px', height: '100px', animationDelay: '0s' }}></div>
        <div className="particle" style={{ left: '80%', bottom: '20%', width: '150px', height: '150px', animationDelay: '-5s' }}></div>
        <div className="particle" style={{ left: '40%', bottom: '70%', width: '80px', height: '80px', animationDelay: '-10s' }}></div>
        <div className="particle" style={{ left: '60%', bottom: '50%', width: '120px', height: '120px', animationDelay: '-15s' }}></div>
      </div>
    </div>
  );
};

// --- Komponen Halaman ---

/**
 * Navbar (Navigasi Utama)
 */
const Navbar = ({ setPage, page }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navItems = [
    { name: 'Home', page: 'landing' },
    { name: 'Buat Karakter', page: 'create' },
    { name: 'Jelajahi Dunia', page: 'explore' },
  ];

  return (
    <nav className="sticky top-0 z-40 w-full bg-black/30 backdrop-blur-lg border-b border-pink-500/30 shadow-lg shadow-pink-500/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div 
            className="flex-shrink-0 flex items-center cursor-pointer group"
            onClick={() => setPage('landing')}
          >
            <span className="text-3xl font-bold text-white font-['Poppins'] group-hover:text-pink-400 transition-colors">
              CharAI
            </span>
            <span className="text-3xl font-bold text-pink-400 font-['Poppins'] group-hover:text-white transition-colors">
              Studio
            </span>
            <Sparkles className="w-6 h-6 ml-2 text-cyan-300 group-hover:animate-spin" />
          </div>

          {/* Navigasi Desktop */}
          <div className="hidden md:flex md:items-center md:space-x-6">
            {navItems.map((item) => (
              <button
                key={item.name}
                onClick={() => setPage(item.page)}
                className={`px-4 py-2 rounded-md text-lg font-medium transition-all duration-300 ${
                  page === item.page
                    ? 'text-pink-400 scale-110'
                    : 'text-gray-300 hover:text-white hover:scale-110'
                }`}
              >
                {item.name}
              </button>
            ))}
            <button className="p-2 rounded-full text-gray-300 hover:text-white hover:bg-white/10">
              <User className="w-6 h-6" />
            </button>
          </div>

          {/* Tombol Menu Mobile */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
            >
              {isMenuOpen ? (
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Menu Dropdown Mobile */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden"
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => {
                    setPage(item.page);
                    setIsMenuOpen(false);
                  }}
                  className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${
                    page === item.page ? 'bg-pink-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  {item.name}
                </button>
              ))}
              <button className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white">
                Profile
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

/**
 * Halaman Landing (Home)
 */
const LandingPage = ({ setPage }) => {
  const characters = [
    { name: 'Airi', src: 'https://placehold.co/400x700/E8D5FF/6D28D9?text=Airi+Siluet' },
    { name: 'Kazuto', src: 'https://placehold.co/400x700/FFD6EC/D946EF?text=Kazuto+Siluet' },
    { name: 'Rika', src: 'https://placehold.co/400x700/D1FAFF/0EA5E9?text=Rika+Siluet' },
  ];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % characters.length);
    }, 4000); // Ganti karakter setiap 4 detik
    return () => clearInterval(timer);
  }, [characters.length]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative min-h-[calc(100vh-80px)] flex items-center justify-center text-center overflow-hidden"
    >
      {/* Character Showcase */}
      <AnimatePresence>
        <motion.img
          key={index}
          src={characters[index].src}
          alt={characters[index].name}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 0.5, x: 0, transition: { duration: 1, ease: 'easeInOut' } }}
          exit={{ opacity: 0, x: -100, transition: { duration: 1, ease: 'easeInOut' } }}
          className="absolute right-0 bottom-0 md:bottom-auto md:top-1/2 md:-translate-y-1/2 w-1/2 md:w-1/3 lg:w-1/4 max-w-sm h-auto object-contain"
          style={{ filter: 'brightness(0.8) drop-shadow(0 0 20px rgba(236, 72, 153, 0.5))' }}
        />
      </AnimatePresence>

      {/* Konten Utama */}
      <div className="relative z-10 p-6 max-w-3xl">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.2, duration: 0.7 } }}
          className="text-4xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 font-['Poppins'] tracking-tight"
          style={{ textShadow: '0 0 15px rgba(236, 72, 153, 0.7)' }}
        >
          Bikin Dunia Anime-Mu, Mulai dari Satu Karakter AI.
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.4, duration: 0.7 } }}
          className="text-lg sm:text-xl text-gray-300 mb-10 max-w-xl mx-auto"
        >
          Ciptakan, kustomisasi, dan mengobrol dengan karakter anime impianmu. Hidupkan imajinasimu di CharAI Studio.
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.6, duration: 0.7 } }}
          className="flex flex-col sm:flex-row justify-center gap-6"
        >
          <NeonButton onClick={() => setPage('create')} variant="primary" className="text-lg">
            <Wand2 className="w-5 h-5 inline-block mr-2" />
            Buat Karakter Sekarang
          </NeonButton>
          <NeonButton onClick={() => setPage('explore')} variant="secondary" className="text-lg">
            <Users className="w-5 h-5 inline-block mr-2" />
            Jelajahi Dunia Anime
          </NeonButton>
        </motion.div>
      </div>
      
      {/* Event Banner (Bonus) */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.8, duration: 0.7 } }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 w-11/12 max-w-2xl"
      >
        <GlassCard className="p-4 border-pink-400/50">
          <div className="flex items-center justify-center space-x-4">
            <span className="text-xl">💖</span>
            <div>
              <h3 className="font-bold text-white text-lg">Event Valentine Festival!</h3>
              <p className="text-sm text-gray-300">Buat karakter bertema cokelat & dapatkan avatar eksklusif!</p>
            </div>
            <span className="text-xl">💖</span>
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
};

/**
 * Halaman Character Creator
 */
const CreatePage = ({ setPage, userId, db, appId, isAuthReady }) => {
  const [formData, setFormData] = useState({
    name: '',
    race: 'Manusia',
    role: 'MC',
    personality: { tsundereYandere: 50, coolSweet: 50, shyBold: 50 },
    description: '',
  });
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isSummoning, setIsSummoning] = useState(false);
  const [showSummonSuccess, setShowSummonSuccess] = useState(false);
  const summonAudioRef = useRef(null);

  // Pre-load sound effect (placeholder)
  useEffect(() => {
    // Di dunia nyata, ini akan menjadi file audio.
    // Kita simulasikan dengan Tone.js jika ada, atau log.
    try {
      // Coba buat sound effect sederhana
      const synth = new (window.Tone || {}).Synth().toDestination();
      summonAudioRef.current = () => synth.triggerAttackRelease("C5", "8n");
    } catch (e) {
      console.log("Tone.js tidak ada, sound effect dinonaktifkan.");
      summonAudioRef.current = () => console.log("Beep! Summon!");
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSliderChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      personality: { ...prev.personality, [name]: parseInt(value) }
    }));
  };

  const handleGenerateAvatar = () => {
    // Placeholder: Hasilkan avatar acak dari placehold.co
    const races = ['Manusia', 'Elf', 'Demon', 'Cyborg', 'Angel'];
    const colors = ['E8D5FF/6D28D9', 'FFD6EC/D946EF', 'D1FAFF/0EA5E9', 'FFDDC1/F97316', 'D1FADF/10B981'];
    const raceIndex = races.indexOf(formData.race);
    const color = colors[raceIndex] || colors[0];
    const name = formData.name || 'Avatar';
    setAvatarUrl(`https://placehold.co/400x600/${color}?text=${encodeURIComponent(name)}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthReady || !userId) {
      console.error("User belum siap atau tidak terautentikasi.");
      // Tampilkan pesan error ke user di sini
      return;
    }
    if (!formData.name || !formData.description) {
      console.error("Nama dan deskripsi wajib diisi.");
      return;
    }

    setIsSummoning(true);
    
    const characterData = {
      ...formData,
      avatarUrl: avatarUrl || `https://placehold.co/400x600/E8D5FF/6D28D9?text=${encodeURIComponent(formData.name)}`,
      creatorId: userId,
      createdAt: new Date().toISOString(),
    };

    try {
      // Simpan ke Firestore
      // Kita gunakan /public/data/ untuk bisa diakses di halaman Explore
      const collectionPath = `artifacts/${appId}/public/data/characters`;
      await addDoc(collection(db, collectionPath), characterData);
      
      // Tampilkan animasi sukses
      setShowSummonSuccess(true);
      if (summonAudioRef.current) {
        summonAudioRef.current();
      }
      
      // Reset form dan pindah halaman
      setTimeout(() => {
        setShowSummonSuccess(false);
        setPage('explore');
      }, 2500);

    } catch (error) {
      console.error("Error saat menyimpan karakter:", error);
    } finally {
      setIsSummoning(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-4xl mx-auto p-4 md:p-8 relative"
    >
      {/* Animasi Summon Success */}
      <AnimatePresence>
        {showSummonSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: -100 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <GlassCard className="p-10 text-center border-pink-500">
              <Sparkles className="w-24 h-24 text-pink-400 mx-auto animate-pulse" />
              <h2 className="text-4xl font-bold text-white mt-4">Summon Successful!</h2>
              <p className="text-xl text-gray-300 mt-2">Karaktermu telah lahir ke dunia!</p>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
      
      <GlassCard className="p-6 sm:p-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-white text-center mb-8 font-['Poppins']">
          ✨ Buat Karakter AI Baru
        </h1>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          
          {/* Kolom Kiri: Avatar */}
          <div className="md:col-span-1 flex flex-col items-center">
            <div className="w-full max-w-xs aspect-[3/4] bg-white/5 rounded-lg flex items-center justify-center border-2 border-dashed border-white/30 mb-4">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar Preview" className="w-full h-full object-cover rounded-lg" />
              ) : (
                <span className="text-gray-400">Preview Avatar</span>
              )}
            </div>
            <NeonButton type="button" onClick={handleGenerateAvatar} variant="secondary" className="w-full max-w-xs">
              Generate Avatar
            </NeonButton>
            <p className="text-xs text-gray-400 mt-2 text-center">*(AI Image placeholder)</p>
          </div>

          {/* Kolom Kanan: Form Data */}
          <div className="md:col-span-2 space-y-5">
            {/* Nama Karakter */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-pink-300 mb-1">Nama Karakter</label>
              <input
                type="text"
                name="name"
                id="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="Contoh: Airi Tachibana"
              />
            </div>

            {/* Ras & Role */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="race" className="block text-sm font-medium text-pink-300 mb-1">Ras</label>
                <select
                  name="race"
                  id="race"
                  value={formData.race}
                  onChange={handleChange}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <option>Manusia</option>
                  <option>Elf</option>
                  <option>Demon</option>
                  <option>Cyborg</option>
                  <option>Angel</option>
                </select>
              </div>
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-pink-300 mb-1">Role</label>
                <select
                  name="role"
                  id="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <option>MC</option>
                  <option>Senpai</option>
                  <option>Villain</option>
                  <option>Yandere</option>
                  <option>Tsundere</option>
                  <option>Lainnya</option>
                </select>
              </div>
            </div>

            {/* Personality Sliders */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-pink-300">Personality Sliders</label>
              {/* Slider 1 */}
              <div>
                <div className="flex justify-between text-xs text-gray-300 px-1">
                  <span>Tsundere</span>
                  <span>Yandere</span>
                </div>
                <input
                  type="range"
                  name="tsundereYandere"
                  min="0"
                  max="100"
                  value={formData.personality.tsundereYandere}
                  onChange={handleSliderChange}
                  className="w-full h-2 bg-purple-300/30 rounded-lg appearance-none cursor-pointer range-thumb"
                />
              </div>
              {/* Slider 2 */}
              <div>
                <div className="flex justify-between text-xs text-gray-300 px-1">
                  <span>Cool</span>
                  <span>Sweet</span>
                </div>
                <input
                  type="range"
                  name="coolSweet"
                  min="0"
                  max="100"
                  value={formData.personality.coolSweet}
                  onChange={handleSliderChange}
                  className="w-full h-2 bg-pink-300/30 rounded-lg appearance-none cursor-pointer range-thumb"
                />
              </div>
              {/* Slider 3 */}
              <div>
                <div className="flex justify-between text-xs text-gray-300 px-1">
                  <span>Shy</span>
                  <span>Bold</span>
                </div>
                <input
                  type="range"
                  name="shyBold"
                  min="0"
                  max="100"
                  value={formData.personality.shyBold}
                  onChange={handleSliderChange}
                  className="w-full h-2 bg-cyan-300/30 rounded-lg appearance-none cursor-pointer range-thumb"
                />
              </div>
            </div>

            {/* Deskripsi */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-pink-300 mb-1">Deskripsi Karakter</label>
              <textarea
                name="description"
                id="description"
                rows="4"
                value={formData.description}
                onChange={handleChange}
                required
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="Tuliskan latar belakang, kepribadian, dan detail unik karaktermu..."
              />
            </div>

            {/* Tombol Simpan */}
            <div className="text-right pt-4">
              <NeonButton type="submit" variant="primary" className="w-full sm:w-auto" disabled={isSummoning}>
                {isSummoning ? 'Mensummon...' : (
                  <>
                    <Sparkles className="w-5 h-5 inline-block mr-2" />
                    Simpan Karakter
                  </>
                )}
              </NeonButton>
            </div>
          </div>
        </form>
      </GlassCard>
    </motion.div>
  );
};

/**
 * Komponen CharacterCard (untuk Explore)
 */
const CharacterCard = ({ char, onChat }) => {
  const getPersonalityTag = (p) => {
    let tags = [];
    if (p.tsundereYandere < 30) tags.push('Tsundere');
    else if (p.tsundereYandere > 70) tags.push('Yandere');
    
    if (p.coolSweet < 30) tags.push('Cool');
    else if (p.coolSweet > 70) tags.push('Sweet');
    
    if (p.shyBold < 30) tags.push('Shy');
    else if (p.shyBold > 70) tags.push('Bold');
    
    return tags.length > 0 ? tags.join(' ') : (char.role || 'Unik');
  };

  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -5 }}
      className="relative"
    >
      <GlassCard className="overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-pink-500/30">
        <img src={char.avatarUrl} alt={char.name} className="w-full h-64 sm:h-80 object-cover" />
        <div className="p-5">
          <h3 className="text-2xl font-bold text-white mb-1 font-['Poppins']">{char.name}</h3>
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="px-3 py-1 rounded-full bg-pink-500/50 text-white text-xs font-semibold">{char.race}</span>
            <span className="px-3 py-1 rounded-full bg-purple-500/50 text-white text-xs font-semibold">{getPersonalityTag(char.personality)}</span>
          </div>
          <p className="text-gray-300 text-sm mb-5 h-10 overflow-hidden text-ellipsis">
            {char.description}
          </p>
          <div className="flex justify-between items-center">
            <NeonButton onClick={() => onChat(char)} variant="primary" className="px-4 py-2 text-sm">
              <MessageCircle className="w-4 h-4 inline-block mr-1" />
              Chat Now
            </NeonButton>
            <button className="p-2 rounded-full text-gray-400 hover:text-pink-500 transition-colors duration-300">
              <Heart className="w-6 h-6" />
            </button>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
};

/**
 * Halaman Explore
 */
const ExplorePage = ({ setPage, setSelectedCharacter, db, appId, isAuthReady }) => {
  const [characters, setCharacters] = useState(initialCharacters);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSort, setActiveSort] = useState('Terbaru');
  
  // Fetch data dari Firestore
  useEffect(() => {
    if (!isAuthReady) return;

    setIsLoading(true);
    const collectionPath = `artifacts/${appId}/public/data/characters`;
    const q = collection(db, collectionPath);

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const charsData = [];
      querySnapshot.forEach((doc) => {
        charsData.push({ id: doc.id, ...doc.data() });
      });
      // Gabungkan data dummy dengan data firestore untuk demo
      const combinedData = [...initialCharacters, ...charsData.filter(c => !initialCharacters.find(ic => ic.id === c.id))];
      
      // Sortir (Implementasi dasar)
      if (activeSort === 'Terbaru') {
        combinedData.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      }
      
      setCharacters(combinedData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching characters:", error);
      setIsLoading(false);
    });

    // Cleanup listener
    return () => unsubscribe();
  }, [db, appId, isAuthReady, activeSort]);

  const handleChat = (char) => {
    setSelectedCharacter(char);
    setPage('chat');
  };

  const sortOptions = ['Terbaru', 'Terpopuler', 'Isekai', 'Romance'];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-7xl mx-auto p-4 md:p-8"
    >
      <h1 className="text-4xl sm:text-5xl font-bold text-white text-center mb-4 font-['Poppins']">
        Jelajahi Dunia Karakter
      </h1>
      <p className="text-lg text-gray-300 text-center mb-8">
        Temukan dan mengobrol dengan AI yang dibuat oleh user lain.
      </p>

      {/* Tombol Sorting */}
      <div className="flex justify-center flex-wrap gap-3 mb-10">
        {sortOptions.map(opt => (
          <button
            key={opt}
            onClick={() => setActiveSort(opt)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
              activeSort === opt
                ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/30'
                : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>

      {/* Grid Karakter */}
      {isLoading ? (
        <div className="text-center text-white text-xl">
          <Sparkles className="w-12 h-12 mx-auto animate-spin text-pink-400" />
          Memuat karakter...
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
          {characters.map(char => (
            <CharacterCard key={char.id} char={char} onChat={handleChat} />
          ))}
        </div>
      )}
    </motion.div>
  );
};

/**
 * Komponen ChatBubble (untuk ChatPage)
 */
const ChatBubble = ({ message, charAvatar }) => {
  const isUser = message.sender === 'user';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-end gap-3 mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {/* Avatar AI */}
      {!isUser && (
        <img 
          src={charAvatar} 
          alt="AI Avatar" 
          className="w-10 h-10 rounded-full object-cover border-2 border-purple-400"
        />
      )}
      
      {/* Bubble Chat */}
      <div 
        className={`max-w-xs sm:max-w-md lg:max-w-lg p-4 rounded-2xl ${
          isUser
            ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-br-lg'
            : 'bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-bl-lg'
        }`}
        style={{
          boxShadow: `0 4px 15px ${isUser ? 'rgba(236, 72, 153, 0.3)' : 'rgba(139, 92, 246, 0.3)'}`
        }}
      >
        <p className="text-base">{message.text}</p>
      </div>
    </motion.div>
  );
};

/**
 * Halaman AI Chat
 */
const AIChatPage = ({ character, setPage }) => {
  const [messages, setMessages] = useState([
    { sender: 'ai', text: `Halo! Namaku ${character?.name || 'Airi'}. Senang bertemu denganmu! 🌸` }
  ]);
  const [userInput, setUserInput] = useState('');
  const [relationship, setRelationship] = useState(25); // Persentase
  const [mood, setMood] = useState('Happy');
  const chatEndRef = useRef(null);
  
  useEffect(() => {
    // Auto-scroll ke bawah
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (userInput.trim() === '') return;

    const newUserMessage = { sender: 'user', text: userInput };
    setMessages(prev => [...prev, newUserMessage]);
    setUserInput('');

    // Simulasi AI response
    setTimeout(() => {
      const aiResponse = { 
        sender: 'ai', 
        text: `(Placeholder) ${character.name} sedang memproses... (Mood: ${mood})` 
      };
      setMessages(prev => [...prev, aiResponse]);
      
      // Naikkan relationship bar sedikit (demo)
      setRelationship(prev => Math.min(prev + 2, 100));
    }, 1500);
  };

  if (!character) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)] text-white">
        <h2 className="text-2xl mb-4">Karakter tidak ditemukan.</h2>
        <NeonButton onClick={() => setPage('explore')} variant="secondary">
          <ArrowLeft className="w-5 h-5 inline-block mr-2" />
          Kembali ke Explore
        </NeonButton>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-4xl mx-auto h-[calc(100vh-80px)] flex flex-col p-4"
    >
      {/* Header Chat */}
      <GlassCard className="flex-shrink-0 p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setPage('explore')} className="text-white hover:text-pink-400">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <img src={character.avatarUrl} alt={character.name} className="w-12 h-12 rounded-full object-cover border-2 border-pink-400" />
            <div>
              <h2 className="text-xl font-bold text-white font-['Poppins']">{character.name}</h2>
              <p className="text-sm text-pink-300">{character.role}</p>
            </div>
          </div>
          {/* Relationship Bar */}
          <div className="w-1/3">
            <div className="flex justify-between text-xs text-pink-300 mb-1">
              <span>Relationship</span>
              <span>Lv. {Math.floor(relationship / 10)}</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2.5">
              <div 
                className="bg-gradient-to-r from-pink-500 to-rose-500 h-2.5 rounded-full transition-all duration-500" 
                style={{ width: `${relationship}%` }}
              ></div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Area Chat */}
      <div className="flex-grow overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-pink-500/50 scrollbar-track-transparent">
        {messages.map((msg, index) => (
          <ChatBubble key={index} message={msg} charAvatar={character.avatarUrl} />
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <GlassCard className="flex-shrink-0 p-4 mt-4">
        <form onSubmit={handleSend} className="flex items-center gap-3">
          {/* Mood Selector */}
          <div className="relative">
            <select 
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              className="appearance-none w-full sm:w-32 bg-white/10 border border-white/20 rounded-lg pl-4 pr-8 py-3 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              <option>Happy</option>
              <option>Sad</option>
              <option>Angry</option>
              <option>Shy</option>
              <option>Flirty</option>
            </select>
            <ChevronDown className="w-5 h-5 text-gray-300 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          
          {/* Text Input */}
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Ketik pesanmu di sini..."
            className="flex-grow bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
          
          {/* Tombol Kirim */}
          <button
            type="submit"
            className="p-3 rounded-lg bg-pink-500 hover:bg-pink-600 text-white shadow-lg shadow-pink-500/40 transition-all"
          >
            <Send className="w-6 h-6" />
          </button>
        </form>
      </GlassCard>
    </motion.div>
  );
};


// --- Komponen App Utama ---

export default function App() {
  const [page, setPage] = useState('landing'); // 'landing', 'create', 'explore', 'chat'
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Efek untuk autentikasi Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        setUserId(user.uid);
        console.log("User authenticated:", user.uid);
      } else {
        // Jika tidak ada user, coba login dengan custom token atau anonim
        try {
          if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            await signInWithCustomToken(auth, __initial_auth_token);
            console.log("Signed in with custom token.");
          } else {
            await signInAnonymously(auth);
            console.log("Signed in anonymously.");
          }
        } catch (error) {
          console.error("Firebase auth error:", error);
        }
      }
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  // Render konten berdasarkan halaman
  const renderPage = () => {
    switch (page) {
      case 'create':
        return <CreatePage setPage={setPage} userId={userId} db={db} appId={appId} isAuthReady={isAuthReady} />;
      case 'explore':
        return <ExplorePage setPage={setPage} setSelectedCharacter={setSelectedCharacter} db={db} appId={appId} isAuthReady={isAuthReady} />;
      case 'chat':
        return <AIChatPage character={selectedCharacter} setPage={setPage} />;
      case 'landing':
      default:
        return <LandingPage setPage={setPage} />;
    }
  };

  return (
    <div className="min-h-screen text-white font-['Poppins']">
      {/* Load Fonts (Cara-hacky untuk single file) */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&family=Noto+Sans+JP:wght@400;700&display=swap');
          body {
            font-family: 'Poppins', 'Noto Sans JP', sans-serif;
            background-color: #0B0014; /* Fallback bg */
          }
          /* Custom scrollbar */
          ::-webkit-scrollbar {
            width: 8px;
          }
          ::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 10px;
          }
          ::-webkit-scrollbar-thumb {
            background: rgba(236, 72, 153, 0.5); /* pink-500/50 */
            border-radius: 10px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: rgba(236, 72, 153, 0.8); /* pink-500/80 */
          }
          /* Custom range slider thumb */
          .range-thumb::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 20px;
            height: 20px;
            background: #ec4899; /* pink-500 */
            border-radius: 50%;
            cursor: pointer;
            border: 2px solid white;
            box-shadow: 0 0 10px #ec4899;
          }
          .range-thumb::-moz-range-thumb {
            width: 20px;
            height: 20px;
            background: #ec4899;
            border-radius: 50%;
            cursor: pointer;
            border: 2px solid white;
            box-shadow: 0 0 10px #ec4899;
          }
        `}
      </style>
      
      <FuturisticBackground />
      
      <Navbar setPage={setPage} page={page} />
      
      <main className="relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            {renderPage()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
