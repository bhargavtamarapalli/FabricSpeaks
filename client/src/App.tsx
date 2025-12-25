import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/useAuth";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { HelmetProvider } from "react-helmet-async";
import { useState, useEffect, lazy, Suspense } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

// Phase 1: Security Integration
import { initializeSecurity, cleanupSecurity } from "@/lib/security/init";
import { logger } from "@/lib/utils/logger";

// Components
import LoadingScreen from "@/components/LoadingScreen";
import ShoppingCart from "@/components/ShoppingCart";
import BottomNav from "@/components/BottomNav";
import AuthModal from "@/components/AuthModal";
import { ProtectedAdminRoute } from "@/components/admin/ProtectedAdminRoute";
import { SocketProvider } from "@/providers/SocketProvider";

// E-commerce Pages (Static Import for faster LCP on main site)
import Home from "@/pages/Home";
import ProductPage from "@/pages/ProductPage";
import Orders from "@/pages/Orders";
import OrderDetail from "@/pages/OrderDetail";
import Profile from "@/pages/Profile";
import Wishlist from "@/pages/Wishlist";
import Clothing from "@/pages/Clothing";
import Accessories from "@/pages/Accessories";
import NewArrivals from "@/pages/NewArrivals";
import Sale from "@/pages/Sale";
import Checkout from "@/pages/Checkout";
import Contact from "@/pages/Contact";
import About from "@/pages/About";
import HelpSupport from "@/pages/HelpSupport";
import Fabrics from "@/pages/Fabrics";
import AuthCallback from "@/pages/AuthCallback";
import ResetPassword from "@/pages/ResetPassword";
import NotFound from "@/pages/not-found";
import DesignMockup from "@/pages/DesignMockup";
import AccessoriesDesignMockup from "@/pages/AccessoriesDesignMockup";
import SignatureMockup from "@/pages/SignatureMockup";
import SignatureCardsMockup from "@/pages/SignatureCardsMockup";
import Sustainability from "@/pages/Sustainability";
import Press from "@/pages/Press";
import ShippingReturns from "@/pages/ShippingReturns";
import SizeGuide from "@/pages/SizeGuide";
import SignatureCollectionPage from "@/pages/SignatureCollection";
import SignatureProductDetail from "@/pages/SignatureProductDetail";


// Admin Pages (Lazy Loaded)
const AdminDashboard = lazy(() => import("@/pages/admin/Dashboard"));
const AdminProducts = lazy(() => import("@/pages/admin/Products"));
const AdminProductFormPage = lazy(() => import("@/pages/admin/ProductForm"));
const AdminOrders = lazy(() => import("@/pages/admin/Orders"));
const AdminOrderDetailsPage = lazy(() => import("@/pages/admin/OrderDetails"));
const AdminInventory = lazy(() => import("@/pages/admin/Inventory"));
const AdminCustomers = lazy(() => import("@/pages/admin/Customers"));
const AdminCustomerDetailsPage = lazy(() => import("@/pages/admin/CustomerDetails"));
const AdminAnalytics = lazy(() => import("@/pages/admin/Analytics"));
const AdminNotifications = lazy(() => import("@/pages/admin/Notifications"));
const AdminSettings = lazy(() => import("@/pages/admin/Settings"));
const AdminTeam = lazy(() => import("@/pages/admin/Team"));
const AdminProfile = lazy(() => import("@/pages/admin/AdminProfile"));
const AdminSignatureProducts = lazy(() => import("@/pages/admin/SignatureProducts"));
const AdminContent = lazy(() => import("@/pages/admin/Content"));
const AdminLogin = lazy(() => import("@/pages/admin/Login"));

function Router() {
  return (
    <Switch>
      {/* Admin Routes - Must be before other routes to take precedence */}
      <Route path="/admin/login">
        <Suspense fallback={<LoadingScreen />}>
          <AdminLogin />
        </Suspense>
      </Route>

      <Route path="/admin">
        <SocketProvider>
          <Suspense fallback={<LoadingScreen />}>
            <ProtectedAdminRoute>
              <AdminDashboard />
            </ProtectedAdminRoute>
          </Suspense>
        </SocketProvider>
      </Route>

      <Route path="/admin/products/new">
        <SocketProvider>
          <Suspense fallback={<LoadingScreen />}>
            <ProtectedAdminRoute permission="manage_products">
              <AdminProductFormPage />
            </ProtectedAdminRoute>
          </Suspense>
        </SocketProvider>
      </Route>

      <Route path="/admin/products/:id">
        <SocketProvider>
          <Suspense fallback={<LoadingScreen />}>
            <ProtectedAdminRoute permission="manage_products">
              <AdminProductFormPage />
            </ProtectedAdminRoute>
          </Suspense>
        </SocketProvider>
      </Route>

      <Route path="/admin/signature-products">
        <SocketProvider>
          <Suspense fallback={<LoadingScreen />}>
            <ProtectedAdminRoute permission="manage_products">
              <AdminSignatureProducts />
            </ProtectedAdminRoute>
          </Suspense>
        </SocketProvider>
      </Route>

      <Route path="/admin/products">
        <SocketProvider>
          <Suspense fallback={<LoadingScreen />}>
            <ProtectedAdminRoute permission="manage_products">
              <AdminProducts />
            </ProtectedAdminRoute>
          </Suspense>
        </SocketProvider>
      </Route>

      <Route path="/admin/orders/:id">
        <SocketProvider>
          <Suspense fallback={<LoadingScreen />}>
            <ProtectedAdminRoute permission="manage_orders">
              <AdminOrderDetailsPage />
            </ProtectedAdminRoute>
          </Suspense>
        </SocketProvider>
      </Route>

      <Route path="/admin/orders">
        <SocketProvider>
          <Suspense fallback={<LoadingScreen />}>
            <ProtectedAdminRoute permission="manage_orders">
              <AdminOrders />
            </ProtectedAdminRoute>
          </Suspense>
        </SocketProvider>
      </Route>

      <Route path="/admin/inventory">
        <SocketProvider>
          <Suspense fallback={<LoadingScreen />}>
            <ProtectedAdminRoute permission="manage_inventory">
              <AdminInventory />
            </ProtectedAdminRoute>
          </Suspense>
        </SocketProvider>
      </Route>

      <Route path="/admin/customers/:id">
        <SocketProvider>
          <Suspense fallback={<LoadingScreen />}>
            <ProtectedAdminRoute permission="view_customers">
              <AdminCustomerDetailsPage />
            </ProtectedAdminRoute>
          </Suspense>
        </SocketProvider>
      </Route>

      <Route path="/admin/customers">
        <SocketProvider>
          <Suspense fallback={<LoadingScreen />}>
            <ProtectedAdminRoute permission="view_customers">
              <AdminCustomers />
            </ProtectedAdminRoute>
          </Suspense>
        </SocketProvider>
      </Route>

      <Route path="/admin/analytics">
        <SocketProvider>
          <Suspense fallback={<LoadingScreen />}>
            <ProtectedAdminRoute permission="view_analytics">
              <AdminAnalytics />
            </ProtectedAdminRoute>
          </Suspense>
        </SocketProvider>
      </Route>

      <Route path="/admin/notifications">
        <SocketProvider>
          <Suspense fallback={<LoadingScreen />}>
            <ProtectedAdminRoute permission="view_dashboard">
              <AdminNotifications />
            </ProtectedAdminRoute>
          </Suspense>
        </SocketProvider>
      </Route>

      <Route path="/admin/settings">
        <SocketProvider>
          <Suspense fallback={<LoadingScreen />}>
            <ProtectedAdminRoute>
              <AdminSettings />
            </ProtectedAdminRoute>
          </Suspense>
        </SocketProvider>
      </Route>

      <Route path="/admin/content">
        <SocketProvider>
          <Suspense fallback={<LoadingScreen />}>
            <ProtectedAdminRoute permission="manage_settings">
              <AdminContent />
            </ProtectedAdminRoute>
          </Suspense>
        </SocketProvider>
      </Route>

      <Route path="/admin/team">
        <SocketProvider>
          <Suspense fallback={<LoadingScreen />}>
            <ProtectedAdminRoute permission="manage_admins">
              <AdminTeam />
            </ProtectedAdminRoute>
          </Suspense>
        </SocketProvider>
      </Route>

      <Route path="/admin/profile">
        <SocketProvider>
          <Suspense fallback={<LoadingScreen />}>
            <ProtectedAdminRoute>
              <AdminProfile />
            </ProtectedAdminRoute>
          </Suspense>
        </SocketProvider>
      </Route>

      {/* E-commerce Routes */}
      <Route path="/" component={Home} />
      <Route path="/product/:id" component={ProductPage} />
      <Route path="/orders/:id" component={OrderDetail} />
      <Route path="/orders" component={Orders} />
      <Route path="/profile" component={Profile} />
      <Route path="/wishlist" component={Wishlist} />
      <Route path="/clothing" component={Clothing} />
      <Route path="/accessories" component={Accessories} />
      <Route path="/accessories-mockup" component={AccessoriesDesignMockup} />
      <Route path="/signature-mockup" component={SignatureMockup} />
      <Route path="/signature-cards-mockup" component={SignatureCardsMockup} />
      <Route path="/new-arrivals" component={NewArrivals} />
      <Route path="/sale" component={Sale} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/contact" component={Contact} />
      <Route path="/about" component={About} />
      <Route path="/help-support" component={HelpSupport} />
      <Route path="/fabrics" component={Fabrics} />
      <Route path="/auth/callback" component={AuthCallback} />
      <Route path="/auth/reset-password" component={ResetPassword} />
      <Route path="/design-mockup" component={DesignMockup} />
      <Route path="/sustainability" component={Sustainability} />
      <Route path="/press" component={Press} />
      <Route path="/shipping" component={ShippingReturns} />
      <Route path="/size-guide" component={SizeGuide} />
      <Route path="/signature-collection" component={SignatureCollectionPage} />
      <Route path="/signature/:slug" component={SignatureProductDetail} />

      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { isLoading, login, register } = useAuth();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const { toast } = useToast();
  const [location, navigate] = useLocation();

  // Debug: Log navigation changes
  useEffect(() => {
    console.log(`[NAV] 📍 Current Route: ${location}`);
  }, [location]);

  // Phase 1: Initialize security features
  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || '/api';

    logger.info('Initializing Phase 1 security features');

    initializeSecurity({
      apiUrl,
      onUnauthorized: () => {
        // Don't redirect if already on login or auth pages
        const currentPath = window.location.pathname;
        const isOnLoginPage = currentPath === '/admin/login' ||
          currentPath.startsWith('/auth/') ||
          currentPath === '/auth';

        if (isOnLoginPage) {
          logger.debug('User is on login page, skipping unauthorized redirect');
          return;
        }

        logger.warn('User session expired - redirecting to login');
        toast({
          title: "Session Expired",
          description: "Please log in again to continue.",
          variant: "destructive",
        });

        // Navigate to home instead of hard redirect
        setTimeout(() => {
          navigate('/');
          // Trigger auth modal open
          document.dispatchEvent(new Event('open-auth'));
        }, 2000);
      },
      onTokenRefreshSuccess: () => {
        logger.debug('Token refreshed automatically');
      },
      onTokenRefreshFailure: (error) => {
        logger.error('Token refresh failed', { error: error.message });
      },
    });

    return () => {
      cleanupSecurity();
    };
  }, [navigate, toast]);

  useEffect(() => {
    const handleOpenCart = () => setIsCartOpen(true);
    const handleOpenAuth = () => setIsAuthOpen(true);

    document.addEventListener('open-cart', handleOpenCart);
    document.addEventListener('open-auth', handleOpenAuth);

    return () => {
      document.removeEventListener('open-cart', handleOpenCart);
      document.removeEventListener('open-auth', handleOpenAuth);
    };
  }, []);

  if (isLoading) return <LoadingScreen />;

  return (
    <TooltipProvider>
      <Toaster />
      <Router />
      <BottomNav onCartClick={() => setIsCartOpen(true)} />
      <ShoppingCart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLogin={async (identifier, password) => {
          try {
            await login(identifier, password);
            setIsAuthOpen(false);
            toast({
              title: "Welcome back!",
              description: "You have successfully logged in.",
            });
          } catch (e: any) {
            // Only log technical errors, show friendly message to user
            if (e.name !== 'UserFriendlyError') {
              console.error("Login failed:", e);
            }
            throw e;
          }
        }}
        onRegister={async (identifier, password, name) => {
          try {
            await register(identifier, password, name);
            setIsAuthOpen(false);
            toast({
              title: "Welcome!",
              description: "Your account has been created.",
            });
          } catch (e: any) {
            if (e.name !== 'UserFriendlyError') {
              console.error("Registration failed:", e);
            }
            throw e;
          }
        }}
      />
    </TooltipProvider>
  );
}

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
