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
// Leaflet and react-leaflet are the heaviest dependency in the app and only the map tab
// needs them, so they load on first visit instead of on every page load.
const BusinessDashboardView = React.lazy(() =>
  import('./components/views/BusinessDashboardView').then(m => ({ default: m.BusinessDashboardView }))
);
const BusinessOrdersView = React.lazy(() =>
  import('./components/views/BusinessOrdersView').then(m => ({ default: m.BusinessOrdersView }))
);
const BusinessStatsView = React.lazy(() =>
  import('./components/views/BusinessStatsView').then(m => ({ default: m.BusinessStatsView }))
);
const NewListingView = React.lazy(() =>
  import('./components/views/NewListingView').then(m => ({ default: m.NewListingView }))
);
const NgoDashboardView = React.lazy(() =>
  import('./components/views/NgoDashboardView').then(m => ({ default: m.NgoDashboardView }))
);
const AdminDashboardView = React.lazy(() =>
  import('./components/views/AdminDashboardView').then(m => ({ default: m.AdminDashboardView }))
);
const AdminReportsView = React.lazy(() =>
  import('./components/views/AdminReportsView').then(m => ({ default: m.AdminReportsView }))
);
const MapView = React.lazy(() =>
  import('./components/views/MapView').then(m => ({ default: m.MapView }))
);
import { ReservationsView } from './components/views/ReservationsView';
import { ProfileBadgesView } from './components/views/ProfileBadgesView';
import { LeaderboardView } from './components/views/LeaderboardView';
import { NotificationsView } from './components/views/NotificationsView';

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
  // Only the map is lazy, so one boundary around the router covers it.
  const renderActiveView = () => (
    <React.Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-4 border-[#A8E7C5] border-t-[#0F5238] animate-spin" />
        </div>
      }
    >
      {renderRoutedView()}
    </React.Suspense>
  );

  const renderRoutedView = () => {
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
