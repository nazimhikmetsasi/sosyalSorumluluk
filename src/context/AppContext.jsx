import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { playSoundEffect } from '../utils/audioEffects';
import { translations } from '../i18n/translations';
import { INITIAL_USER } from '../data/mockData';
import { computeImpact, computeBadges } from '../utils/impact';
import { buildNotifications } from '../utils/notifications';
import { sanitizeText, sanitizeNumber, getHomeTab, randomDigits, ownsRecord, distanceKm, reanchor } from '../utils/security';
import { supabase, loadVerifiedAccount, signOut, saveProfile, uploadAvatar } from '../lib/supabase';
import {
  fetchAll,
  insertListing,
  updateListingPortionCount,
  archiveListing,
  insertReservation,
  setReservationStatus,
  setOrganisationStatus,
  setOrganisationTrustScore,
  grantOrganisationAccess,
} from '../lib/data';

const AppContext = createContext();

// Where the seeded listings were authored. Their coordinates are offsets from this point,
// which is what lets the whole set be moved to wherever the user actually is.
const SEED_ANCHOR = { lat: 40.9835, lng: 29.0275 }; // Moda, Kadıköy

// Data moved to the database and the session to Supabase. Anyone who used the app before
// that still has the old copies sitting in their browser; nothing reads them now, so drop
// them rather than leaving a stale shadow of someone's data and session on the device.
['LISTINGS', 'BUSINESSES', 'RESERVATIONS', 'SESSION'].forEach(key => {
  try {
    localStorage.removeItem(`GK_${key}`);
  } catch {
    // A browser with storage disabled has nothing to clean up.
  }
});

const loadStorage = (key, fallback) => {
  try {
    const saved = localStorage.getItem(`GK_${key}`);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
};

const saveStorage = (key, data) => {
  try {
    localStorage.setItem(`GK_${key}`, JSON.stringify(data));
  } catch {
    console.warn('Storage save failed');
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
  // Declared first: geolocation, data loading and several actions below report through
  // it, and a later definition would be read before initialisation.
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Identity comes from a server-verified Supabase session, never from browser storage.
  // The demo profile below only supplies presentational extras (avatar, points); role and
  // organisation always come from `account`, which the auth server signed.
  const [account, setAccount] = useState(null);
  // Nothing to verify when Supabase is absent, so the app renders signed out immediately.
  const [authLoading, setAuthLoading] = useState(Boolean(supabase));

  const [storedProfile, setStoredProfile] = useState(() => loadStorage('USER', INITIAL_USER));

  const currentRole = account?.role || 'buyer';
  const isAuthenticated = Boolean(account);


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
  // Server-owned from here on. Row level security decides what each query returns, so
  // these arrays hold exactly what this session is allowed to see.
  const [rawListings, setListings] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [readNotificationIds, setReadNotificationIds] = useState(() => loadStorage('NOTIFICATIONS_READ', []));
  const [leaderboard, setLeaderboard] = useState([]);
  // Starts empty rather than at invented figures: a placeholder like "18.920 users" would
  // be on screen as fact until the real numbers land.
  const [stats, setStats] = useState({
    totalFoodSavedKg: 0,
    totalCo2SavedKg: 0,
    totalPortions: 0,
    activeBusinesses: 0,
    activeNgos: 0,
    totalUsers: 0,
    todayActiveListings: 0,
  });

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

      // Signing out must drop the cached rows, or the next account would briefly see the
      // previous one's data before its own fetch lands.
      if (!verified) {
        setListings([]);
        setBusinesses([]);
        setReservations([]);
        setDataLoading(false);
      }

      // One-off adoption of the seeded demo reservations, which predate per-user
      // ownership. Local storage is per browser, so these are this person's demo rows;
      // stamping them keeps the demo populated without the read path having to treat
      // ownerless records as everyone's. Drops out once reservations live in the database.
      if (verified) {
        setReservations(prev =>
          prev.some(r => !r.userId)
            ? prev.map(r => (r.userId ? r : { ...r, userId: verified.id }))
            : prev
        );
      }
    };

    sync();

    const { data } = supabase.auth.onAuthStateChange(() => sync());
    return () => {
      cancelled = true;
      data.subscription.unsubscribe();
    };
  }, []);

  // Pull everything this account may see. Called on sign-in and after any mutation, so
  // the UI always reflects what the database actually accepted rather than an optimistic
  // guess that a policy may have rejected.
  const applyData = useCallback((payload) => {
    if (payload.error) {
      console.error('Veri yüklenemedi', payload.error);
      showToast('Veriler yüklenemedi. Bağlantınızı kontrol edin.', 'error');
    }
    setBusinesses(payload.organisations);
    setListings(payload.listings);
    setReservations(payload.reservations);
    setLeaderboard(payload.leaderboard);
    if (payload.stats) setStats(payload.stats);
    setDataLoading(false);
  }, []);

  // Re-read after a mutation so the UI shows what the database actually accepted rather
  // than an optimistic guess a policy may have rejected.
  const refreshData = useCallback(async () => {
    if (!supabase || !account) return;
    applyData(await fetchAll());
  }, [account, applyData]);

  // The cancellation flag drops a response that lands after the account changed, which
  // would otherwise flash the previous account's rows on screen.
  useEffect(() => {
    if (!supabase || !account) return undefined;

    let cancelled = false;
    (async () => {
      const payload = await fetchAll();
      if (cancelled) return;
      applyData(payload);
    })();

    return () => {
      cancelled = true;
    };
  }, [account, applyData]);

  // Sync state changes to localStorage
  useEffect(() => saveStorage('USER', storedProfile), [storedProfile]);
  useEffect(() => saveStorage('VIEW_MODE', viewMode), [viewMode]);
  useEffect(() => saveStorage('LANG', language), [language]);
  useEffect(() => saveStorage('NOTIFICATIONS_READ', readNotificationIds), [readNotificationIds]);
  useEffect(() => saveStorage('FAVORITES', favorites), [favorites]);

  // The seed data is laid out around Moda. Once the browser gives us a fix, the whole
  // cluster is translated onto the user: each listing keeps its offset from the anchor,
  // so a user in Bursa sees the same neighbourhood-scale spread instead of a map centred
  // 150 km away, and the relative distances the seed intended still hold.
  //
  // Longitude degrees shrink towards the poles, so the east-west offsets are rescaled by
  // latitude; without it the cluster would stretch or squash as it moves north or south.
  //
  // Derived, never written back: revoking the permission restores the seeded coordinates.
  const listingsWithDistance = userPosition
    ? rawListings.map(item => {
        const { lat, lng } = reanchor(SEED_ANCHOR, userPosition, item);
        return {
          ...item,
          lat,
          lng,
          distanceKm: +distanceKm(userPosition, { lat, lng }).toFixed(1),
        };
      })
    : rawListings;

  // Organisation-scoped views. Panels read these instead of the global arrays so one
  // tenant's dashboard cannot surface another tenant's listings or orders.
  // Only ever the server-issued organisation; the stored profile has no say in it.
  const myOrganisationId = account?.organisationId || null;
  const myListings = myOrganisationId ? listingsWithDistance.filter(l => l.businessId === myOrganisationId) : [];
  const myReservations = myOrganisationId ? reservations.filter(r => r.businessId === myOrganisationId) : [];

  // The buyer's own orders. Seeded rows carry no userId, so they stay invisible rather
  // than being shown to whoever signs in first; the migration below adopts them once.
  const myPurchases = account ? reservations.filter(r => r.userId === account.id) : [];

  // Impact and badges are derived from real completed pickups, not stored on the profile.
  // Defined here rather than with the other identity fields because they need the
  // reservations, which load after the account does.
  const impact = computeImpact(myPurchases);
  const badges = computeBadges(impact, myPurchases);

  const notifications = buildNotifications(myPurchases, readNotificationIds);

  const markNotificationRead = (id) =>
    setReadNotificationIds(prev => (prev.includes(id) ? prev : [...prev, id]));

  const markAllNotificationsRead = () =>
    setReadNotificationIds(notifications.map(n => n.id));

  const currentUser = account
    ? {
        ...storedProfile,
        ...impact,
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
      // Surfacing the real reason matters here: the usual failure is a migration that has
      // not been run yet, and a generic message makes that impossible to diagnose.
      console.error('Profil kaydedilemedi', error);
      showToast(`Profil kaydedilemedi: ${error.message || 'bilinmeyen hata'}`, 'error');
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
      console.error('Avatar yüklenemedi', error);
      showToast(`Görsel yüklenemedi: ${error.message || 'bilinmeyen hata'}`, 'error');
      return false;
    }

    await refreshAccount();
    showToast('Profil fotoğrafınız güncellendi 📸');
    return true;
  };

  // Make a reservation action
  const makeReservation = async (listing, portionCount = 1) => {
    if (!account) {
      showToast('Rezervasyon için giriş yapmalısınız.', 'error');
      return false;
    }
    if (listing.portionsAvailable < portionCount) {
      playSoundEffect('error');
      showToast('Yeterli porsiyon kalmadı!', 'error');
      return false;
    }

    // A unique index on (organisation_id, pickup_code) is the real guarantee; this just
    // avoids the obvious collision before the round trip.
    const openCodes = new Set(
      reservations.filter(r => r.businessId === listing.businessId).map(r => r.pickupCode)
    );
    let newCode = `GK-${randomDigits(6)}`;
    while (openCodes.has(newCode)) newCode = `GK-${randomDigits(6)}`;

    const { data: newRes, error } = await insertReservation({
      listingId: listing.id,
      businessId: listing.businessId,
      listingTitle: listing.title,
      image: listing.image,
      portionCount,
      pickupStartTime: listing.pickupStartTime,
      pickupEndTime: listing.pickupEndTime,
      pickupCode: newCode,
      qrToken: `GK_AUTH_${randomDigits(16)}`,
    });

    if (error) {
      console.error('Rezervasyon oluşturulamadı', error);
      playSoundEffect('error');
      showToast(`Rezervasyon oluşturulamadı: ${error.message || 'bilinmeyen hata'}`, 'error');
      return false;
    }

    // Stock is adjusted by a database trigger, atomically with the insert, so there is
    // nothing to update from here.
    await refreshData();

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

    showToast(`Rezervasyon başarıyla oluşturuldu! Teslimat Kodunuz: ${newCode}`);
    setSelectedReservation(newRes);
    return newRes;
  };

  // Cancel a reservation. The database trigger enforces that only the buyer may cancel;
  // this check keeps the UI honest and gives a readable message.
  const cancelReservation = async (resId) => {
    const target = myPurchases.find(r => r.id === resId);
    if (!target) {
      showToast('Bu rezervasyon üzerinde yetkiniz yok.', 'error');
      return;
    }

    const { error } = await setReservationStatus(resId, 'cancelled');
    if (error) {
      console.error('İptal edilemedi', error);
      showToast(`İptal edilemedi: ${error.message || 'bilinmeyen hata'}`, 'error');
      return;
    }

    // The cancel trigger returns the portions to the listing.
    await refreshData();

    playSoundEffect('pop');
    showToast('Rezervasyon iptal edildi ve paket iade edildi.', 'info');
  };

  // A business may only touch its own listings; every mutation routes through here.
  const ownsListing = (listingId) =>
    ownsRecord(currentRole, myOrganisationId, rawListings.find(l => l.id === listingId));

  // Business: Quick portion increment/decrement
  const updateListingPortions = async (listingId, delta) => {
    const listing = rawListings.find(l => l.id === listingId);
    if (!ownsListing(listingId) || !listing) {
      showToast('Bu ilan üzerinde yetkiniz yok.', 'error');
      return;
    }

    const { error } = await updateListingPortionCount(
      listingId,
      Math.max(0, listing.portionsAvailable + delta)
    );
    if (error) {
      console.error('Stok güncellenemedi', error);
      showToast(`Stok güncellenemedi: ${error.message || 'bilinmeyen hata'}`, 'error');
      return;
    }

    await refreshData();
    playSoundEffect('pop');
    showToast('Stok porsiyon adedi güncellendi.', 'success');
  };

  // Business: Remove listing
  // Archived rather than deleted: completed reservations still reference the listing.
  const deleteListing = async (listingId) => {
    if (!ownsListing(listingId)) {
      showToast('Bu ilan üzerinde yetkiniz yok.', 'error');
      return;
    }

    const { error } = await archiveListing(listingId);
    if (error) {
      console.error('İlan kaldırılamadı', error);
      showToast(`İlan kaldırılamadı: ${error.message || 'bilinmeyen hata'}`, 'error');
      return;
    }

    await refreshData();
    playSoundEffect('pop');
    showToast('İlan başarıyla kaldırıldı.', 'info');
  };

  // Business: Add new Listing (with security sanitization)
  const addNewListing = async (listingData) => {
    if (currentRole !== 'business' || !myOrganisationId) {
      showToast('İlan yayınlamak için onaylı bir işletme hesabı gerekiyor.', 'error');
      return;
    }

    const priceOrig = sanitizeNumber(listingData.priceOriginal, 0, 50000, 0);
    const priceDisc = sanitizeNumber(listingData.priceDiscounted, 0, priceOrig || 50000, 0);
    const portions = Math.max(1, Math.floor(sanitizeNumber(listingData.portions, 1, 1000, 1)));
    const weight = sanitizeNumber(listingData.weightKg, 0.1, 500, 1.5);

    // Listings are placed at the publishing organisation's own coordinates.
    const organisation = businesses.find(b => b.id === myOrganisationId);

    const { error } = await insertListing(myOrganisationId, {
      title: sanitizeText(listingData.title || '', 100) || 'Günün Kurtarma Paketi',
      description: sanitizeText(listingData.description || '', 500),
      category: sanitizeText(listingData.category || 'Unlu Mamüller', 50),
      type: listingData.type || 'discounted',
      priceOriginal: priceOrig,
      priceDiscounted: priceDisc,
      portions,
      pickupStartTime: sanitizeText(listingData.pickupStartTime || '19:00', 10),
      pickupEndTime: sanitizeText(listingData.pickupEndTime || '21:00', 10),
      image: listingData.image || 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80',
      allergens: Array.isArray(listingData.allergens)
        ? listingData.allergens.map(a => sanitizeText(a, 30))
        : ['Gluten'],
      lat: organisation?.lat ?? null,
      lng: organisation?.lng ?? null,
      weightKg: weight,
      co2ReductionKg: +(weight * 2.5).toFixed(1),
    });

    if (error) {
      console.error('İlan yayınlanamadı', error);
      showToast(`İlan yayınlanamadı: ${error.message || 'bilinmeyen hata'}`, 'error');
      return;
    }

    await refreshData();
    playSoundEffect('success');
    showToast('Yeni ilan başarıyla yayınlandı!', 'success');
    setActiveTab('business_dash');
  };

  // Business: Complete delivery by code or QR
  const completeDelivery = async (pickupCode) => {
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

    // The database trigger is the real gate: only the owning organisation may move an
    // order to completed, so a forged request fails here even if the UI was bypassed.
    const { error } = await setReservationStatus(target.id, 'completed');
    if (error) {
      console.error('Teslimat onaylanamadı', error);
      playSoundEffect('error');
      showToast(`Teslimat onaylanamadı: ${error.message || 'bilinmeyen hata'}`, 'error');
      return false;
    }

    await refreshData();
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
  const updateBusinessStatus = async (id, newStatus) => {
    if (currentRole !== 'admin') {
      showToast('Bu işlem için yönetici yetkisi gerekiyor.', 'error');
      return;
    }
    const { error } = await setOrganisationStatus(id, newStatus);
    if (error) {
      console.error('Durum güncellenemedi', error);
      showToast(`Durum güncellenemedi: ${error.message || 'bilinmeyen hata'}`, 'error');
      return;
    }

    await refreshData();
    showToast(`İşletme durumu güncellendi: ${newStatus.toUpperCase()}`);
  };

  // Admin: Update business trust score
  const updateBusinessTrustScore = async (id, delta) => {
    if (currentRole !== 'admin') {
      showToast('Bu işlem için yönetici yetkisi gerekiyor.', 'error');
      return;
    }
    const organisation = businesses.find(b => b.id === id);
    if (!organisation) return;

    const { error } = await setOrganisationTrustScore(
      id,
      Math.min(100, Math.max(50, organisation.trustScore + delta))
    );
    if (error) {
      console.error('Skor güncellenemedi', error);
      showToast(`Skor güncellenemedi: ${error.message || 'bilinmeyen hata'}`, 'error');
      return;
    }

    await refreshData();
    playSoundEffect('pop');
    showToast('İşletme güven skoru güncellendi.', 'info');
  };

  // Binds a signed-up user to an organisation. The role itself lives in app_metadata,
  // which no client key can write, so this goes through a definer function that re-checks
  // the caller's own admin claim before touching anything.
  const grantAccess = async (email, organisationId, role) => {
    if (currentRole !== 'admin') {
      showToast('Bu işlem için yönetici yetkisi gerekiyor.', 'error');
      return false;
    }

    const { error } = await grantOrganisationAccess(email.trim().toLowerCase(), organisationId, role);
    if (error) {
      console.error('Yetki verilemedi', error);
      showToast(`Yetki verilemedi: ${error.message || 'bilinmeyen hata'}`, 'error');
      return false;
    }

    playSoundEffect('success');
    showToast(`${email} hesabı yetkilendirildi. Kullanıcı yeniden giriş yapmalı.`);
    return true;
  };

  // Reset all mock data to defaults
  const resetDemoData = () => {
    if (currentRole !== 'admin') {
      showToast('Bu işlem için yönetici yetkisi gerekiyor.', 'error');
      return;
    }
    // Listings, organisations and reservations live in the database now and are governed
    // by row level security, so this only clears what is still kept on this device.
    clearAppStorage();
    setReadNotificationIds([]);
    setFavorites([]);
    setCurrentUser(INITIAL_USER);
    logout();
    showToast('Bu cihazdaki yerel tercihler sıfırlandı 🔄', 'info');
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
        myPurchases,
        myOrganisationId,
        updateListingPortions,
        deleteListing,
        businesses,
        reservations,
        badges,
        notifications,
        markNotificationRead,
        markAllNotificationsRead,
        leaderboard,
        stats,
        dataLoading,
        refreshData,
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
        grantAccess,
        resetDemoData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
