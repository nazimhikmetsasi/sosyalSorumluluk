import React from 'react';
import { useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { BottomNav } from './components/common/BottomNav';
import { ToastContainer } from './components/common/ToastContainer';

// Modals
import { ListingDetailModal } from './components/modals/ListingDetailModal';
import { ReservationModal } from './components/modals/ReservationModal';
import { ReviewModal } from './components/modals/ReviewModal';
import { FilterModal } from './components/modals/FilterModal';
import { BusinessDetailModal } from './components/modals/BusinessDetailModal';

// Views
import { AuthView } from './components/views/AuthView';
import { ExploreView } from './components/views/ExploreView';
import { MapView } from './components/views/MapView';
import { ReservationsView } from './components/views/ReservationsView';
import { ProfileBadgesView } from './components/views/ProfileBadgesView';
import { LeaderboardView } from './components/views/LeaderboardView';
import { NotificationsView } from './components/views/NotificationsView';
import { BusinessDashboardView } from './components/views/BusinessDashboardView';
import { BusinessOrdersView } from './components/views/BusinessOrdersView';
import { BusinessStatsView } from './components/views/BusinessStatsView';
import { NewListingView } from './components/views/NewListingView';
import { NgoDashboardView } from './components/views/NgoDashboardView';
import { AdminDashboardView } from './components/views/AdminDashboardView';
import { AdminReportsView } from './components/views/AdminReportsView';

// Security & RBAC Guard
import { isAuthorized } from './utils/security';
import { UnauthorizedView } from './components/views/UnauthorizedView';

// Mobile Frame Viewport
import { MobileFrame } from './components/mobile/MobileFrame';

export const App = () => {
  const {
    isAuthenticated,
    authLoading,
    viewMode,
    activeTab,
    currentRole
  } = useApp();

  // Verifying the stored session with the auth server takes a round trip. Without this
  // a signed-in user would see the login screen flash before it resolves.
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F0FFF4]">
        <div className="w-10 h-10 rounded-full border-4 border-[#A8E7C5] border-t-[#0F5238] animate-spin" />
      </div>
    );
  }

  // If user is logged out, render Auth View (OTP Login)
  if (!isAuthenticated) {
    return (
      <>
        <AuthView />
        <ToastContainer />
      </>
    );
  }

  // Active View Router with RBAC Security Guard
  const renderActiveView = () => {
    // 🛡️ Security Check: Ensure user role is permitted to view requested tab
    if (!isAuthorized(currentRole, activeTab)) {
      return <UnauthorizedView />;
    }

    switch (activeTab) {
      case 'map':
        return <MapView />;
      case 'reservations':
        return <ReservationsView />;
      case 'badges':
      case 'profile':
        return <ProfileBadgesView />;
      case 'leaderboard':
        return <LeaderboardView />;
      case 'notifications':
        return <NotificationsView />;
      case 'business_dash':
        return <BusinessDashboardView />;
      case 'business_orders':
        return <BusinessOrdersView />;
      case 'business_stats':
        return <BusinessStatsView />;
      case 'business_new_listing':
        return <NewListingView />;
      case 'ngo_dash':
      case 'ngo_bulk_requests':
      case 'ngo_distribution':
      case 'ngo_volunteers':
        return <NgoDashboardView />;
      case 'admin_dash':
      case 'admin_businesses':
      case 'admin_categories':
        return <AdminDashboardView />;
      case 'admin_reports':
        return <AdminReportsView />;
      case 'explore':
      default:
        return <ExploreView />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F0FFF4] text-[#1B4332] flex flex-col font-sans selection:bg-[#52B788]/20 selection:text-[#0F5238]">
      {/* Top Main Navigation Header */}
      <Header />

      {/* Main Layout Body */}
      {viewMode === 'mobile' ? (
        <MobileFrame>
          {renderActiveView()}
        </MobileFrame>
      ) : (
        <div className="flex-1 max-w-7xl w-full mx-auto flex">
          {/* Left Sidebar */}
          <Sidebar />

          {/* Center Main Scrollable Area */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
            {renderActiveView()}
          </main>
        </div>
      )}

      {/* Mobile Responsive Bottom Navigation */}
      {viewMode !== 'mobile' && <BottomNav />}

      {/* Global Interactive Modals */}
      <ListingDetailModal />
      <ReservationModal />
      <ReviewModal />
      <FilterModal />
      <BusinessDetailModal />

      {/* Toast Notification Container */}
      <ToastContainer />
    </div>
  );
};
