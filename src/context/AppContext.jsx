import React, { createContext, useContext, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { playSoundEffect } from '../utils/audioEffects';
import { translations } from '../i18n/translations';
import {
  INITIAL_USER,
  MOCK_BUSINESSES,
  MOCK_LISTINGS,
  MOCK_RESERVATIONS,
  MOCK_BADGES,
  MOCK_NOTIFICATIONS,
  MOCK_LEADERBOARD,
  PLATFORM_STATS
} from '../data/mockData';
import { sanitizeText, sanitizeNumber, getHomeTab } from '../utils/security';

const AppContext = createContext();

const VALID_ROLES = ['buyer', 'business', 'ngo', 'admin'];

const loadStorage = (key, fallback) => {
  try {
    const saved = localStorage.getItem(`GK_${key}`);
    return saved ? JSON.parse(saved) : fallback;
  } catch (e) {
    return fallback;
  }
};

const saveStorage = (key, data) => {
  try {
    localStorage.setItem(`GK_${key}`, JSON.stringify(data));
  } catch (e) {
    console.warn('Storage save failed', e);
  }
};

export const AppProvider = ({ children }) => {
  // Global user state & role with RBAC integrity check
  const [currentUser, setCurrentUser] = useState(() => loadStorage('USER', INITIAL_USER));
  const [currentRole, setCurrentRole] = useState(() => {
    const savedRole = loadStorage('ROLE', 'buyer');
    return VALID_ROLES.includes(savedRole) ? savedRole : 'buyer';
  });
  const [isAuthenticated, setIsAuthenticated] = useState(true);

  // View presentation mode: 'web' or 'mobile'
  const [viewMode, setViewMode] = useState(() => loadStorage('VIEW_MODE', 'web'));

  // Language & Theme State
  const [language, setLanguage] = useState(() => loadStorage('LANG', 'tr'));
  const [isDarkMode, setIsDarkMode] = useState(() => loadStorage('DARK_MODE', false));

  // Navigation tab state
  const [activeTab, setActiveTab] = useState('explore');

  // Selected item states for modals / detailed views
  const [selectedListing, setSelectedListing] = useState(null);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewListingTarget, setReviewListingTarget] = useState(null);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Data states with persistence
  const [listings, setListings] = useState(() => loadStorage('LISTINGS', MOCK_LISTINGS));
  const [businesses, setBusinesses] = useState(() => loadStorage('BUSINESSES', MOCK_BUSINESSES));
  const [reservations, setReservations] = useState(() => loadStorage('RESERVATIONS', MOCK_RESERVATIONS));
  const [badges, setBadges] = useState(() => loadStorage('BADGES', MOCK_BADGES));
  const [notifications, setNotifications] = useState(() => loadStorage('NOTIFICATIONS', MOCK_NOTIFICATIONS));
  const [leaderboard, setLeaderboard] = useState(MOCK_LEADERBOARD);
  const [stats, setStats] = useState(PLATFORM_STATS);

  // Favorites state
  const [favorites, setFavorites] = useState(() => loadStorage('FAVORITES', ['lst_01', 'lst_03']));

  // Advanced Filter & Sort states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tümü');
  const [selectedListingType, setSelectedListingType] = useState('all'); // all, free, discounted, bulk, favorites
  const [sortBy, setSortBy] = useState('distance'); // 'distance' | 'discount' | 'price' | 'co2'
  const [maxDistance, setMaxDistance] = useState(10); // km
  const [dietaryFilters, setDietaryFilters] = useState({
    vegan: false,
    vegetarian: false,
    glutenFree: false,
    dairyFree: false
  });

  // Sync dark mode class on HTML document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    saveStorage('DARK_MODE', isDarkMode);
  }, [isDarkMode]);

  // Sync state changes to localStorage
  useEffect(() => saveStorage('USER', currentUser), [currentUser]);
  useEffect(() => saveStorage('ROLE', currentRole), [currentRole]);
  useEffect(() => saveStorage('VIEW_MODE', viewMode), [viewMode]);
  useEffect(() => saveStorage('LANG', language), [language]);
  useEffect(() => saveStorage('LISTINGS', listings), [listings]);
  useEffect(() => saveStorage('BUSINESSES', businesses), [businesses]);
  useEffect(() => saveStorage('RESERVATIONS', reservations), [reservations]);
  useEffect(() => saveStorage('BADGES', badges), [badges]);
  useEffect(() => saveStorage('NOTIFICATIONS', notifications), [notifications]);
  useEffect(() => saveStorage('FAVORITES', favorites), [favorites]);

  // Translation Helper
  const t = (key) => {
    return translations[language]?.[key] || translations['tr']?.[key] || key;
  };

  // Toggle Dark Mode
  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
    playSoundEffect('pop');
    showToast(!isDarkMode ? 'Karanlık Mod aktif edildi 🌙' : 'Aydınlık Mod aktif edildi ☀️', 'info');
  };

  // Switch Language
  const toggleLanguage = () => {
    const nextLang = language === 'tr' ? 'en' : 'tr';
    setLanguage(nextLang);
    playSoundEffect('pop');
    showToast(nextLang === 'tr' ? 'Türkçe seçildi 🇹🇷' : 'English selected 🇬🇧', 'info');
  };

  // Toast system
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Toggle favorite
  const toggleFavorite = (listingId) => {
    setFavorites(prev => {
      const isFav = prev.includes(listingId);
      const updated = isFav ? prev.filter(id => id !== listingId) : [...prev, listingId];
      showToast(isFav ? 'Favorilerden çıkarıldı 💔' : 'Favorilere eklendi! ❤️', 'info');
      playSoundEffect('pop');
      return updated;
    });
  };

  // Sign in: identity, role and landing tab move together so they cannot drift apart
  const login = (profile) => {
    const role = VALID_ROLES.includes(profile.role) ? profile.role : 'buyer';
    setCurrentUser({ ...profile, role });
    setCurrentRole(role);
    setActiveTab(getHomeTab(role));
    setIsAuthenticated(true);
  };

  // Make a reservation action
  const makeReservation = (listing, portionCount = 1) => {
    if (listing.portionsAvailable < portionCount) {
      playSoundEffect('error');
      showToast('Yeterli porsiyon kalmadı!', 'error');
      return false;
    }

    const newCode = `GK-${Math.floor(1000 + Math.random() * 9000)}`;
    const newRes = {
      id: `res_${Date.now().toString().slice(-4)}`,
      listingId: listing.id,
      listingTitle: listing.title,
      businessName: listing.businessName,
      businessAddress: 'Moda Cad. No:44, Caferağa, Kadıköy / İstanbul',
      businessPhone: '+90 216 333 1122',
      image: listing.image,
      portionCount: portionCount,
      paidAmount: listing.priceDiscounted * portionCount,
      status: 'confirmed',
      pickupStartTime: listing.pickupStartTime,
      pickupEndTime: listing.pickupEndTime,
      pickupDate: 'Bugün',
      pickupCode: newCode,
      qrToken: `GK_AUTH_${newCode}_${Date.now()}`,
      createdAt: 'Az önce',
    };

    // Update listings available count
    setListings(prev => prev.map(item => {
      if (item.id === listing.id) {
        return {
          ...item,
          portionsAvailable: Math.max(0, item.portionsAvailable - portionCount)
        };
      }
      return item;
    }));

    setReservations(prev => [newRes, ...prev]);

    // Update User saved metrics
    const savedFood = portionCount * (listing.weightKg / (listing.portionsTotal || 1));
    const co2Saved = savedFood * 2.5;

    setCurrentUser(prev => ({
      ...prev,
      savedKg: +(prev.savedKg + savedFood).toFixed(1),
      co2SavedKg: +(prev.co2SavedKg + co2Saved).toFixed(1),
      portionsCount: prev.portionsCount + portionCount,
      points: prev.points + (portionCount * 50),
    }));

    // Trigger sound and confetti
    playSoundEffect('success');
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#2D6A4F', '#52B788', '#95D5B2', '#FFD700']
    });

    // Add notification
    const newNotif = {
      id: `notif_${Date.now()}`,
      title: 'Rezervasyon Onaylandı!',
      message: `${listing.title} için teslimat kodun: ${newCode}`,
      time: 'Az önce',
      read: false,
      type: 'order',
    };
    setNotifications(prev => [newNotif, ...prev]);

    showToast(`Rezervasyon başarıyla oluşturuldu! Teslimat Kodunuz: ${newCode}`);
    setSelectedReservation(newRes);
    return newRes;
  };

  // Cancel a reservation
  const cancelReservation = (resId) => {
    const target = reservations.find(r => r.id === resId);
    if (!target) return;

    setReservations(prev => prev.map(r => r.id === resId ? { ...r, status: 'cancelled' } : r));
    
    // Restore portion
    setListings(prev => prev.map(l => {
      if (l.id === target.listingId) {
        return { ...l, portionsAvailable: l.portionsAvailable + target.portionCount };
      }
      return l;
    }));

    playSoundEffect('pop');
    showToast('Rezervasyon iptal edildi ve paket iade edildi.', 'info');
  };

  // Business: Quick portion increment/decrement
  const updateListingPortions = (listingId, delta) => {
    setListings(prev => prev.map(item => {
      if (item.id === listingId) {
        const nextCount = Math.max(0, item.portionsAvailable + delta);
        return { ...item, portionsAvailable: nextCount };
      }
      return item;
    }));
    playSoundEffect('pop');
    showToast('Stok porsiyon adedi güncellendi.', 'success');
  };

  // Business: Remove listing
  const deleteListing = (listingId) => {
    setListings(prev => prev.filter(item => item.id !== listingId));
    playSoundEffect('pop');
    showToast('İlan başarıyla kaldırıldı.', 'info');
  };

  // Business: Add new Listing (with security sanitization)
  const addNewListing = (listingData) => {
    const cleanTitle = sanitizeText(listingData.title || '', 100);
    const cleanDesc = sanitizeText(listingData.description || '', 500);
    const cleanCategory = sanitizeText(listingData.category || 'Unlu Mamüller', 50);
    const priceOrig = sanitizeNumber(listingData.priceOriginal, 0, 50000, 0);
    const priceDisc = sanitizeNumber(listingData.priceDiscounted, 0, priceOrig || 50000, 0);
    const portions = Math.max(1, Math.floor(sanitizeNumber(listingData.portions, 1, 1000, 1)));
    const weight = sanitizeNumber(listingData.weightKg, 0.1, 500, 1.5);

    const newListing = {
      id: `lst_${Date.now().toString().slice(-4)}`,
      businessId: 'biz_01',
      businessName: currentUser.name || 'Moda Fırını',
      businessAvatar: currentUser.avatar,
      title: cleanTitle || 'Günün Kurtarma Paketi',
      description: cleanDesc,
      category: cleanCategory,
      type: listingData.type || 'discounted',
      priceOriginal: priceOrig,
      priceDiscounted: priceDisc,
      discountPercentage: priceOrig ? Math.round((1 - (priceDisc / priceOrig)) * 100) : 100,
      portionsTotal: portions,
      portionsAvailable: portions,
      pickupStartTime: sanitizeText(listingData.pickupStartTime || '19:00', 10),
      pickupEndTime: sanitizeText(listingData.pickupEndTime || '21:00', 10),
      pickupDate: 'Bugün',
      image: listingData.image || 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80',
      allergens: Array.isArray(listingData.allergens) ? listingData.allergens.map(a => sanitizeText(a, 30)) : ['Gluten'],
      lat: 40.9842,
      lng: 29.0265,
      distanceKm: 0.4,
      weightKg: weight,
      co2ReductionKg: +(weight * 2.5).toFixed(1),
      status: 'active',
      createdAt: 'Az önce',
    };

    setListings(prev => [newListing, ...prev]);
    playSoundEffect('success');
    showToast('Yeni ilan başarıyla yayınlandı!', 'success');
    setActiveTab('business_dash');
  };

  // Business: Complete delivery by code or QR
  const completeDelivery = (pickupCode) => {
    if (!pickupCode || typeof pickupCode !== 'string') {
      showToast('Lütfen geçerli bir kod girin.', 'error');
      return false;
    }
    const cleanCode = sanitizeText(pickupCode, 30).toUpperCase().replace(/[^A-Z0-9-]/g, '');
    const target = reservations.find(r => r.pickupCode.toUpperCase() === cleanCode);
    if (!target) {
      playSoundEffect('error');
      showToast('Geçersiz veya bulunamayan teslimat kodu!', 'error');
      return false;
    }
    if (target.status === 'completed') {
      showToast('Bu teslimat daha önce zaten onaylanmış.', 'info');
      return false;
    }

    setReservations(prev => prev.map(r => r.id === target.id ? { ...r, status: 'completed' } : r));
    playSoundEffect('beep');
    setTimeout(() => playSoundEffect('success'), 150);

    showToast(`Teslimat başarıyla onaylandı: ${target.listingTitle}`, 'success');
    
    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.5 },
      colors: ['#10B981', '#52B788', '#0F5238']
    });

    return target;
  };

  // Admin: Toggle business status
  const updateBusinessStatus = (id, newStatus) => {
    setBusinesses(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));
    showToast(`İşletme durumu güncellendi: ${newStatus.toUpperCase()}`);
  };

  // Admin: Update business trust score
  const updateBusinessTrustScore = (id, delta) => {
    setBusinesses(prev => prev.map(b => {
      if (b.id === id) {
        const nextScore = Math.min(100, Math.max(50, b.trustScore + delta));
        return { ...b, trustScore: nextScore };
      }
      return b;
    }));
    playSoundEffect('pop');
    showToast('İşletme güven skoru güncellendi.', 'info');
  };

  // Reset all mock data to defaults
  const resetDemoData = () => {
    localStorage.clear();
    setListings(MOCK_LISTINGS);
    setBusinesses(MOCK_BUSINESSES);
    setReservations(MOCK_RESERVATIONS);
    setBadges(MOCK_BADGES);
    setNotifications(MOCK_NOTIFICATIONS);
    setFavorites(['lst_01', 'lst_03']);
    setCurrentUser(INITIAL_USER);
    setCurrentRole('buyer');
    showToast('Tüm veriler başarıyla sıfırlandı! 🔄', 'info');
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        currentRole,
        login,
        isAuthenticated,
        setIsAuthenticated,
        viewMode,
        setViewMode,
        language,
        setLanguage,
        toggleLanguage,
        isDarkMode,
        toggleDarkMode,
        t,
        activeTab,
        setActiveTab,
        selectedListing,
        setSelectedListing,
        selectedReservation,
        setSelectedReservation,
        isReviewModalOpen,
        setIsReviewModalOpen,
        reviewListingTarget,
        setReviewListingTarget,
        isFilterModalOpen,
        setIsFilterModalOpen,
        listings,
        setListings,
        updateListingPortions,
        deleteListing,
        businesses,
        reservations,
        badges,
        setBadges,
        notifications,
        setNotifications,
        leaderboard,
        stats,
        favorites,
        toggleFavorite,
        searchQuery,
        setSearchQuery,
        selectedCategory,
        setSelectedCategory,
        selectedListingType,
        setSelectedListingType,
        sortBy,
        setSortBy,
        maxDistance,
        setMaxDistance,
        dietaryFilters,
        setDietaryFilters,
        toasts,
        showToast,
        makeReservation,
        cancelReservation,
        addNewListing,
        completeDelivery,
        updateBusinessStatus,
        updateBusinessTrustScore,
        resetDemoData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
