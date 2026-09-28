import React, { createContext, useContext, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
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

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // Global user state & role
  const [currentUser, setCurrentUser] = useState(INITIAL_USER);
  const [currentRole, setCurrentRole] = useState('buyer'); // 'buyer' | 'business' | 'ngo' | 'admin'
  const [isAuthenticated, setIsAuthenticated] = useState(true);

  // View presentation mode: 'web' or 'mobile-preview' or 'native'
  const [viewMode, setViewMode] = useState('web'); // 'web' | 'mobile'

  // Navigation tab state
  const [activeTab, setActiveTab] = useState('explore'); // explore, map, reservations, profile, badges, business_dash, business_new_listing, business_orders, ngo_dash, admin_dash, admin_businesses, admin_reports, notifications, leaderboard

  // Selected item states for modals / detailed views
  const [selectedListing, setSelectedListing] = useState(null);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewListingTarget, setReviewListingTarget] = useState(null);

  // Data states
  const [listings, setListings] = useState(MOCK_LISTINGS);
  const [businesses, setBusinesses] = useState(MOCK_BUSINESSES);
  const [reservations, setReservations] = useState(MOCK_RESERVATIONS);
  const [badges, setBadges] = useState(MOCK_BADGES);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [leaderboard, setLeaderboard] = useState(MOCK_LEADERBOARD);
  const [stats, setStats] = useState(PLATFORM_STATS);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tümü');
  const [selectedListingType, setSelectedListingType] = useState('all'); // all, free, discounted, bulk
  const [maxDistance, setMaxDistance] = useState(10); // km

  // Toast system
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Switch role handler with sync
  const handleRoleChange = (newRole) => {
    setCurrentRole(newRole);
    if (newRole === 'business') {
      setActiveTab('business_dash');
      setCurrentUser(prev => ({
        ...prev,
        name: 'Moda Fırını & Ekmek Atölyesi',
        email: 'iletisim@modafirini.com',
        role: 'business'
      }));
    } else if (newRole === 'ngo') {
      setActiveTab('ngo_dash');
      setCurrentUser(prev => ({
        ...prev,
        name: 'Temel İhtiyaç Derneği (TİDER)',
        email: 'destek@tider.org',
        role: 'ngo'
      }));
    } else if (newRole === 'admin') {
      setActiveTab('admin_dash');
      setCurrentUser(prev => ({
        ...prev,
        name: 'Sistem Yöneticisi',
        email: 'admin@gidakoprusu.org',
        role: 'admin'
      }));
    } else {
      setActiveTab('explore');
      setCurrentUser(INITIAL_USER);
    }
    showToast(`Rol "${newRole.toUpperCase()}" olarak değiştirildi.`, 'info');
  };

  // Make a reservation action
  const makeReservation = (listing, portionCount = 1) => {
    if (listing.portionsAvailable < portionCount) {
      showToast('Yeterli porsiyon kalmadı!', 'error');
      return false;
    }

    const newCode = `GK-${Math.floor(1000 + Math.random() * 9000)}`;
    const newRes = {
      id: `res_${Date.now().toString().slice(-4)}`,
      listingId: listing.id,
      listingTitle: listing.title,
      businessName: listing.businessName,
      businessAddress: 'Moda Cad. No:44, Kadıköy / İstanbul',
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

    // Trigger celebratory confetti
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
      icon: 'check_circle',
    };
    setNotifications(prev => [newNotif, ...prev]);

    showToast(`Rezervasyon başarıyla oluşturuldu! Teslimat Kodunuz: ${newCode}`);
    setSelectedReservation(newRes);
    return newRes;
  };

  // Business: Add new Listing
  const addNewListing = (listingData) => {
    const newListing = {
      id: `lst_${Date.now().toString().slice(-4)}`,
      businessId: 'biz_01',
      businessName: currentUser.name || 'Moda Fırını',
      businessAvatar: currentUser.avatar,
      title: listingData.title,
      description: listingData.description,
      category: listingData.category || 'Unlu Mamüller',
      type: listingData.type || 'discounted',
      priceOriginal: Number(listingData.priceOriginal) || 0,
      priceDiscounted: Number(listingData.priceDiscounted) || 0,
      discountPercentage: listingData.priceOriginal ? Math.round((1 - (listingData.priceDiscounted / listingData.priceOriginal)) * 100) : 100,
      portionsTotal: Number(listingData.portions) || 1,
      portionsAvailable: Number(listingData.portions) || 1,
      pickupStartTime: listingData.pickupStartTime || '19:00',
      pickupEndTime: listingData.pickupEndTime || '21:00',
      pickupDate: 'Bugün',
      image: listingData.image || 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80',
      images: [listingData.image || 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80'],
      allergens: listingData.allergens || ['Gluten'],
      lat: 40.9835,
      lng: 29.0275,
      distanceKm: 0.5,
      weightKg: Number(listingData.weightKg) || 2.0,
      co2ReductionKg: (Number(listingData.weightKg) || 2.0) * 2.5,
      status: 'active',
      createdAt: 'Az önce',
    };

    setListings(prev => [newListing, ...prev]);
    showToast('Yeni ilan başarıyla yayınlandı!', 'success');
    setActiveTab('business_dash');
  };

  // Business: Complete delivery by code or QR
  const completeDelivery = (pickupCode) => {
    const target = reservations.find(r => r.pickupCode.toUpperCase() === pickupCode.trim().toUpperCase());
    if (!target) {
      showToast('Geçersiz veya bulunamayan teslimat kodu!', 'error');
      return false;
    }
    if (target.status === 'completed') {
      showToast('Bu teslimat daha önce zaten onaylanmış.', 'info');
      return false;
    }

    setReservations(prev => prev.map(r => r.id === target.id ? { ...r, status: 'completed' } : r));
    showToast(`Teslimat başarıyla onaylandı: ${target.listingTitle}`, 'success');
    
    // Trigger confetti
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

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        currentRole,
        handleRoleChange,
        isAuthenticated,
        setIsAuthenticated,
        viewMode,
        setViewMode,
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
        listings,
        setListings,
        businesses,
        reservations,
        badges,
        setBadges,
        notifications,
        setNotifications,
        leaderboard,
        stats,
        searchQuery,
        setSearchQuery,
        selectedCategory,
        setSelectedCategory,
        selectedListingType,
        setSelectedListingType,
        maxDistance,
        setMaxDistance,
        toasts,
        showToast,
        makeReservation,
        addNewListing,
        completeDelivery,
        updateBusinessStatus,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
