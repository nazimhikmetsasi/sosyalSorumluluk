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
import { sanitizeText, sanitizeNumber, getHomeTab, randomDigits, ownsRecord, distanceKm } from '../utils/security';
import { supabase, loadVerifiedAccount, signOut, saveProfile, uploadAvatar } from '../lib/supabase';

const AppContext = createContext();

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

// Only this app's own keys. localStorage is shared per origin, so clear() would also
// wipe anything else served from the same host.
const clearAppStorage = () => {
  try {
    Object.keys(localStorage)
      .filter(key => key.startsWith('GK_'))
      .forEach(key => localStorage.removeItem(key));
  } catch (e) {
    console.warn('Storage clear failed', e);
  }
};

export const AppProvider = ({ children }) => {
  // Identity comes from a server-verified Supabase session, never from browser storage.
  // The demo profile below only supplies presentational extras (avatar, points); role and
  // organisation always come from `account`, which the auth server signed.
  const [account, setAccount] = useState(null);
  // Nothing to verify when Supabase is absent, so the app renders signed out immediately.
  const [authLoading, setAuthLoading] = useState(Boolean(supabase));

  const [storedProfile, setStoredProfile] = useState(() => loadStorage('USER', INITIAL_USER));

  const currentRole = account?.role || 'buyer';
  const isAuthenticated = Boolean(account);

  const currentUser = account
    ? {
        ...storedProfile,
        id: account.id,
        email: account.email,
        name: account.displayName || storedProfile.name,
        avatar: account.avatarUrl || storedProfile.avatar,
        city: account.city || storedProfile.city,
        district: account.district || storedProfile.district,
        phone: account.phone || storedProfile.phone,
        bio: account.bio || '',
        role: account.role,
        organisationId: account.organisationId,
      }
    : storedProfile;

  const setCurrentUser = setStoredProfile;

  // View presentation mode: 'web' or 'mobile'
  const [viewMode, setViewMode] = useState(() => loadStorage('VIEW_MODE', 'web'));

  // Language & Theme State
  const [language, setLanguage] = useState(() => loadStorage('LANG', 'tr'));
  const [isDarkMode, setIsDarkMode] = useState(() => loadStorage('DARK_MODE', false));

  // Real device location. Null until the browser grants a fix, which keeps the seeded
  // Kadıköy coordinates as the fallback rather than showing an empty map.
  const [userPosition, setUserPosition] = useState(null);
  const [geoStatus, setGeoStatus] = useState('idle'); // idle | locating | granted | denied | unsupported

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus('unsupported');
      showToast('Tarayıcınız konum servisini desteklemiyor.', 'error');
      return;
    }

    setGeoStatus('locating');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setUserPosition({ lat: coords.latitude, lng: coords.longitude });
        setGeoStatus('granted');
        showToast('Konumunuz alındı, mesafeler güncellendi 📍');
      },
      (error) => {
        setGeoStatus(error.code === error.PERMISSION_DENIED ? 'denied' : 'unsupported');
        showToast(
          error.code === error.PERMISSION_DENIED
            ? 'Konum izni verilmedi. Mesafeler varsayılan konuma göre gösteriliyor.'
            : 'Konum alınamadı. Mesafeler varsayılan konuma göre gösteriliyor.',
          'info'
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  // Navigation tab state. A restored session lands on its role's home tab, otherwise a
  // reload would drop an admin or business account onto the buyer's explore view.
  const [activeTab, setActiveTab] = useState('explore');

  // Selected item states for modals / detailed views
  const [selectedListing, setSelectedListing] = useState(null);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewListingTarget, setReviewListingTarget] = useState(null);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Data states with persistence
  const [rawListings, setListings] = useState(() => loadStorage('LISTINGS', MOCK_LISTINGS));
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

  // Keep identity in step with the auth server. getUser() inside loadVerifiedAccount
  // validates the JWT against Supabase, so a hand-written session in localStorage simply
  // fails to resolve and the app falls back to signed out.
  useEffect(() => {
    if (!supabase) return undefined;

    let cancelled = false;

    const sync = async () => {
      const verified = await loadVerifiedAccount();
      if (cancelled) return;
      setAccount(verified);
      setActiveTab(getHomeTab(verified?.role));
      setAuthLoading(false);
    };

    sync();

    const { data } = supabase.auth.onAuthStateChange(() => sync());
    return () => {
      cancelled = true;
      data.subscription.unsubscribe();
    };
  }, []);

  // Sync state changes to localStorage
  useEffect(() => saveStorage('USER', storedProfile), [storedProfile]);
  useEffect(() => saveStorage('VIEW_MODE', viewMode), [viewMode]);
  useEffect(() => saveStorage('LANG', language), [language]);
  useEffect(() => saveStorage('LISTINGS', rawListings), [rawListings]);
  useEffect(() => saveStorage('BUSINESSES', businesses), [businesses]);
  useEffect(() => saveStorage('RESERVATIONS', reservations), [reservations]);
  useEffect(() => saveStorage('BADGES', badges), [badges]);
  useEffect(() => saveStorage('NOTIFICATIONS', notifications), [notifications]);
  useEffect(() => saveStorage('FAVORITES', favorites), [favorites]);

  // Real distances replace the seeded ones as soon as the browser gives us a fix. Derived
  // rather than written back, so a denied or revoked permission just falls back to the
  // seed value instead of leaving stale numbers in storage.
  const listingsWithDistance = userPosition
    ? rawListings.map(item => ({
        ...item,
        distanceKm: +distanceKm(userPosition, { lat: item.lat, lng: item.lng }).toFixed(1),
      }))
    : rawListings;

  // Organisation-scoped views. Panels read these instead of the global arrays so one
  // tenant's dashboard cannot surface another tenant's listings or orders.
  // Only ever the server-issued organisation; the stored profile has no say in it.
  const myOrganisationId = account?.organisationId || null;
  const myListings = myOrganisationId ? listingsWithDistance.filter(l => l.businessId === myOrganisationId) : [];
  const myReservations = myOrganisationId ? reservations.filter(r => r.businessId === myOrganisationId) : [];

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

  // Signing out is the auth server's job; onAuthStateChange clears local identity.
  const logout = () => signOut();

  const refreshAccount = async () => {
    const verified = await loadVerifiedAccount();
    setAccount(verified);
  };

  const updateProfile = async (fields) => {
    if (!account) return false;

    const { error } = await saveProfile(account.id, fields);
    if (error) {
      showToast('Profil kaydedilemedi. Lütfen tekrar deneyin.', 'error');
      return false;
    }

    await refreshAccount();
    playSoundEffect('pop');
    showToast('Profiliniz güncellendi ✅');
    return true;
  };

  const changeAvatar = async (file) => {
    if (!account) return false;

    const { error } = await uploadAvatar(account.id, file);
    if (error) {
      showToast(error.message || 'Görsel yüklenemedi.', 'error');
      return false;
    }

    await refreshAccount();
    showToast('Profil fotoğrafınız güncellendi 📸');
    return true;
  };

  // Make a reservation action
  const makeReservation = (listing, portionCount = 1) => {
    if (listing.portionsAvailable < portionCount) {
      playSoundEffect('error');
      showToast('Yeterli porsiyon kalmadı!', 'error');
      return false;
    }

    // Six digits collide often enough to matter across a busy day, and a duplicate
    // inside one business would let the wrong order be handed over.
    const openCodes = new Set(
      reservations.filter(r => r.businessId === listing.businessId).map(r => r.pickupCode)
    );
    let newCode = `GK-${randomDigits(6)}`;
    while (openCodes.has(newCode)) newCode = `GK-${randomDigits(6)}`;
    const newRes = {
      id: `res_${Date.now().toString().slice(-4)}`,
      listingId: listing.id,
      listingTitle: listing.title,
      businessId: listing.businessId,
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
      qrToken: `GK_AUTH_${randomDigits(16)}`,
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

  // A business may only touch its own listings; every mutation routes through here.
  const ownsListing = (listingId) =>
    ownsRecord(currentRole, myOrganisationId, rawListings.find(l => l.id === listingId));

  // Business: Quick portion increment/decrement
  const updateListingPortions = (listingId, delta) => {
    if (!ownsListing(listingId)) {
      showToast('Bu ilan üzerinde yetkiniz yok.', 'error');
      return;
    }
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
    if (!ownsListing(listingId)) {
      showToast('Bu ilan üzerinde yetkiniz yok.', 'error');
      return;
    }
    setListings(prev => prev.filter(item => item.id !== listingId));
    playSoundEffect('pop');
    showToast('İlan başarıyla kaldırıldı.', 'info');
  };

  // Business: Add new Listing (with security sanitization)
  const addNewListing = (listingData) => {
    if (currentRole !== 'business' || !myOrganisationId) {
      showToast('İlan yayınlamak için onaylı bir işletme hesabı gerekiyor.', 'error');
      return;
    }

    const cleanTitle = sanitizeText(listingData.title || '', 100);
    const cleanDesc = sanitizeText(listingData.description || '', 500);
    const cleanCategory = sanitizeText(listingData.category || 'Unlu Mamüller', 50);
    const priceOrig = sanitizeNumber(listingData.priceOriginal, 0, 50000, 0);
    const priceDisc = sanitizeNumber(listingData.priceDiscounted, 0, priceOrig || 50000, 0);
    const portions = Math.max(1, Math.floor(sanitizeNumber(listingData.portions, 1, 1000, 1)));
    const weight = sanitizeNumber(listingData.weightKg, 0.1, 500, 1.5);

    const newListing = {
      id: `lst_${Date.now().toString().slice(-4)}`,
      businessId: myOrganisationId,
      businessName: currentUser.name,
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

    // Only the business the order belongs to may confirm it. Admins are deliberately
    // excluded: confirming a handover is an operational act, not a moderation one.
    const target = reservations.find(
      r => r.pickupCode.toUpperCase() === cleanCode && ownsRecord(currentRole, myOrganisationId, r)
    );
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
    if (currentRole !== 'admin') {
      showToast('Bu işlem için yönetici yetkisi gerekiyor.', 'error');
      return;
    }
    setBusinesses(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));
    showToast(`İşletme durumu güncellendi: ${newStatus.toUpperCase()}`);
  };

  // Admin: Update business trust score
  const updateBusinessTrustScore = (id, delta) => {
    if (currentRole !== 'admin') {
      showToast('Bu işlem için yönetici yetkisi gerekiyor.', 'error');
      return;
    }
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
    if (currentRole !== 'admin') {
      showToast('Bu işlem için yönetici yetkisi gerekiyor.', 'error');
      return;
    }
    clearAppStorage();
    setListings(MOCK_LISTINGS);
    setBusinesses(MOCK_BUSINESSES);
    setReservations(MOCK_RESERVATIONS);
    setBadges(MOCK_BADGES);
    setNotifications(MOCK_NOTIFICATIONS);
    setFavorites(['lst_01', 'lst_03']);
    setCurrentUser(INITIAL_USER);
    logout();
    showToast('Tüm veriler başarıyla sıfırlandı! 🔄', 'info');
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        currentRole,
        logout,
        authLoading,
        updateProfile,
        changeAvatar,
        isAuthenticated,
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
        listings: listingsWithDistance,
        userPosition,
        geoStatus,
        requestLocation,
        myListings,
        myReservations,
        myOrganisationId,
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
