import type { Express, Request, Response } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { readFileSync } from "fs";

import path from "path";
import { checkDbConnectivity } from "./db/health";
import { uploadCSV } from "./middleware/upload";
import { adminNotify } from "./admin-notify";
import { requireAuth, requireAdmin, optionalAuth } from "./middleware/auth";
import { validateCartOwnership } from "./middleware/cartOwnership";
import { cartErrorHandler } from "./middleware/cartErrorHandler";
import cartValidationRouter from "./cartValidation";
import adminOrdersRouter from "./admin-orders";
import { productsCacheMiddleware, productDetailCacheMiddleware, invalidateProductsCacheMiddleware } from "./middleware/cache";
import { 
  inviteAdminHandler, 
  acceptInvitationHandler, 
  listInvitationsHandler, 
  revokeInvitationHandler 
} from "./adminInvitations";
import { 
  votePollHandler, 
  getPollResultsHandler, 
  getActivePollHandler 
} from "./polls";

export async function registerRoutes(app: Express): Promise<Server> {
  console.error('DEBUG: registerRoutes started');

  // Dynamic imports to avoid circular dependencies
  console.error('DEBUG: Importing auth');
  const {
    loginHandler,
    logoutHandler,
    registerHandler,
    meHandler,
    updateMeHandler,
    resetPasswordHandler,
    confirmResetPasswordHandler,
    updatePasswordHandler,
    deleteUserHandler,
    adminDeleteUserHandler,
    adminUpdateRoleHandler,
    listUsersHandler
  } = await import("./auth");

  console.error('DEBUG: Importing products');
  const { listProductsHandler, getProductHandler } = await import("./products");

  console.error('DEBUG: Importing cart');
  const { 
    getCartHandler, 
    addCartItemHandler, 
    updateCartItemHandler, 
    removeCartItemHandler, 
    mergeGuestCartHandler 
  } = await import("./cart");

  console.error('DEBUG: Importing orders');
  const { 
    checkoutHandler, 
    listOrdersHandler, 
    getOrderHandler, 
    verifyPaymentHandler, 
    cancelOrderHandler, 
    reorderHandler 
  } = await import("./orders");

  console.error('DEBUG: Importing profile');
  const { 
    getMeHandler, 
    updateMeHandler: profileUpdateMeHandler, 
    listAddressesHandler, 
    createAddressHandler, 
    updateAddressHandler, 
    deleteAddressHandler 
  } = await import("./profile");

  console.error('DEBUG: Importing addresses');
  const { 
    listAddressesHandler: listAddressesProfileHandler, 
    createAddressHandler: createAddressProfileHandler, 
    getAddressHandler, 
    updateAddressHandler: updateAddressProfileHandler, 
    deleteAddressHandler: deleteAddressProfileHandler, 
    setDefaultAddressHandler, 
    getDefaultAddressesHandler 
  } = await import("./addresses");

  console.error('DEBUG: Importing admin');
  const { 
    createProductHandler, 
    updateProductHandler, 
    deleteProductHandler, 
    createCategoryHandler, 
    listCategoriesHandler, 
    importProductsHandler 
  } = await import("./admin");

  console.error('DEBUG: Importing wishlists');
  const {
    listWishlistsHandler,
    getWishlistHandler,
    createWishlistHandler,
    updateWishlistHandler,
    deleteWishlistHandler,
    addWishlistItemHandler,
    removeWishlistItemHandler,
    getDefaultWishlistHandler
  } = await import("./wishlists");

  console.error('DEBUG: Importing reviews');
  const {
    listProductReviewsHandler,
    getProductReviewStatsHandler,
    createReviewHandler,
    updateReviewHandler,
    deleteReviewHandler,
    voteReviewHelpfulHandler,
    removeReviewVoteHandler,
    listRecentReviewsHandler
  } = await import("./reviews");

  console.error('DEBUG: Importing search');
  const { searchProductsHandler, searchSuggestionsHandler } = await import("./search");

  // SEO
  console.error('DEBUG: Importing seo');
  const { sitemapHandler } = await import("./seo");
  app.get("/sitemap.xml", sitemapHandler);

  // Health checks
  console.error('DEBUG: Importing health');
  const { healthCheckHandler, readinessHandler, livenessHandler } = await import('./health');
  app.get("/api/health", healthCheckHandler);
  app.get("/api/health/ready", readinessHandler);
  app.get("/api/health/live", livenessHandler);
  app.get("/api/version", (_req: Request, res: Response) => {
    try {
      const pkgPath = path.resolve(process.cwd(), "package.json");
      const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
      return res.status(200).json({ name: pkg.name ?? "app", version: pkg.version ?? "0.0.0" });
    } catch (_err) {
      return res.status(500).json({ code: "VERSION_READ_ERROR", message: "Unable to read version" });
    }
  });

  // Webhooks (no CSRF protection needed)
  console.error('DEBUG: Importing webhooks');
  const { razorpayWebhookHandler } = await import('./webhooks/razorpay');
  app.post("/api/webhooks/razorpay", express.json({ verify: (req, res, buf) => {
    (req as any).rawBody = buf.toString();
  }}), razorpayWebhookHandler);

  // Auth routes (Phase 3)
  app.post("/api/auth/register", registerHandler);
  app.post("/api/auth/login", loginHandler);
  app.post("/api/auth/logout", logoutHandler);
  app.post("/api/auth/reset-password", resetPasswordHandler);
  app.post("/api/auth/reset-password/confirm", confirmResetPasswordHandler);
  app.post("/api/auth/update-password", requireAuth, updatePasswordHandler);
  app.delete("/api/auth/me", requireAuth, deleteUserHandler);
  app.get("/api/auth/me", requireAuth, meHandler);
  app.put("/api/auth/me", requireAuth, updateMeHandler);

  // Profile Address Management (Phase 1 Refactor)
  app.get("/api/me/addresses", requireAuth, listAddressesHandler);
  app.post("/api/me/addresses", requireAuth, createAddressHandler);
  app.put("/api/me/addresses/:id", requireAuth, updateAddressHandler);
  app.delete("/api/me/addresses/:id", requireAuth, deleteAddressHandler);


  // Admin User Management Routes
  app.get("/api/admin/users", requireAuth, requireAdmin, listUsersHandler);
  app.delete("/api/admin/users/:id", requireAuth, requireAdmin, adminDeleteUserHandler);
  app.patch("/api/admin/users/:id/role", requireAuth, requireAdmin, adminUpdateRoleHandler);

  // OAuth routes (Google & Apple Sign-In)
  console.error('DEBUG: Importing oauth');
  const { 
    googleAuthHandler, 
    googleCallbackHandler, 
    appleAuthHandler, 
    appleCallbackHandler,
    verifyOAuthTokenHandler 
  } = await import("./oauth");
  
  app.get("/api/auth/google", googleAuthHandler);
  app.get("/api/auth/google/callback", googleCallbackHandler);
  app.get("/api/auth/apple", appleAuthHandler);
  app.get("/api/auth/apple/callback", appleCallbackHandler);
  app.post("/api/auth/oauth/verify", verifyOAuthTokenHandler);

  // Password Reset (Debug/Admin Tool)
  const passwordResetRouter = await import("./password-reset");
  app.use("/api/debug", passwordResetRouter.default);

  // Phase 5: Search routes
  app.get("/api/search", searchProductsHandler);
  app.get("/api/search/suggestions", searchSuggestionsHandler);

  // Products routes (Phase 3) - with cache middleware
  app.get("/api/products", productsCacheMiddleware, listProductsHandler);
  app.get("/api/products/:id", productDetailCacheMiddleware, getProductHandler);
  
  // Product Variants routes (Phase 2) - Using new handlers
  console.error('DEBUG: Importing product-variants');
  const {
    listVariantsHandler,
    getVariantHandler,
    findVariantHandler,
    createVariantHandler,
    updateVariantHandler,
    deleteVariantHandler,
    bulkUpdateVariantsHandler
  } = await import("./product-variants");
  
  // 1️⃣ Signature products endpoint
  console.error('DEBUG: Importing products-signature');
  const { listSignatureProductsHandler } = await import("./products-signature");
  app.get("/api/products/signature", productsCacheMiddleware, listSignatureProductsHandler);

  // Recommendations endpoint
  app.get("/api/products/:id/recommendations", async (req, res) => {
      try {
          const { recommendationService } = await import("./services/recommendations");
          const recs = await recommendationService.getRecommendations(req.params.id);
          
          // Transform products to include images properly
          // Use same logic as transformProductImages in products repository
          const transformed = recs.map((p: any) => {
            const images: string[] = [];
            
            // 1. Check main_image first
            if (p.main_image) {
              images.push(p.main_image);
            }
            
            // 2. Check color_images (e.g. { "Black": [url1, url2], "White": [url3] })
            if (p.color_images && typeof p.color_images === 'object') {
              const colorImagesObj = p.color_images as Record<string, string[]>;
              for (const colorUrls of Object.values(colorImagesObj)) {
                if (Array.isArray(colorUrls)) {
                  for (const url of colorUrls) {
                    if (!images.includes(url)) {
                      images.push(url);
                    }
                  }
                }
              }
            }
            
            // 3. Fallback to signature_details.image
            if (images.length === 0 && p.signature_details?.image) {
              images.push(p.signature_details.image);
            }
            
            return {
              ...p,
              images,
            };
          });
          
          res.json(transformed);
      } catch (error) {
          console.error("Recommendation error:", error);
          res.status(500).json({ error: "Failed to fetch recommendations" });
      }
  });

  // Similar Apparels endpoint - by Fabric and Occasion
  app.get("/api/products/:id/similar-apparels", async (req, res) => {
      try {
          const { recommendationService } = await import("./services/recommendations");
          const { byFabric, byOccasion } = await recommendationService.getSimilarApparels(req.params.id);
          
          // Transform products to include images (same logic as recommendations)
          const transformProducts = (products: any[]) => products.map((p: any) => {
            const images: string[] = [];
            
            if (p.main_image) {
              images.push(p.main_image);
            }
            
            if (p.color_images && typeof p.color_images === 'object') {
              const colorImagesObj = p.color_images as Record<string, string[]>;
              for (const colorUrls of Object.values(colorImagesObj)) {
                if (Array.isArray(colorUrls)) {
                  for (const url of colorUrls) {
                    if (!images.includes(url)) {
                      images.push(url);
                    }
                  }
                }
              }
            }
            
            if (images.length === 0 && p.signature_details?.image) {
              images.push(p.signature_details.image);
            }
            
            return { ...p, images };
          });
          
          res.json({
            byFabric: transformProducts(byFabric),
            byOccasion: transformProducts(byOccasion)
          });
      } catch (error) {
          console.error("Similar apparels error:", error);
          res.status(500).json({ error: "Failed to fetch similar apparels" });
      }
  });

  app.get("/api/products/:productId/variants", listVariantsHandler);
  app.get("/api/products/:productId/variants/find", findVariantHandler);
  app.get("/api/products/:productId/variants/:id", getVariantHandler);

  // Cart routes (Phase 4) - Updated with security fixes
  // Guest cart support with ownership validation
  app.get("/api/cart", optionalAuth, getCartHandler);
  app.post("/api/cart/items", optionalAuth, addCartItemHandler);
  app.put("/api/cart/items/:id", optionalAuth, validateCartOwnership, updateCartItemHandler);
  app.delete("/api/cart/items/:id", optionalAuth, validateCartOwnership, removeCartItemHandler);
  app.post("/api/cart/merge", requireAuth, mergeGuestCartHandler);
  
  // Cart error handler - must be after cart routes
  app.use("/api/cart", cartErrorHandler);

  // Cart Validation routes (Phase 1.4)
  app.use("/api/cart", cartValidationRouter);
  app.use("/api/products", cartValidationRouter);

  // Stock Notifications routes (Phase 2)
  console.error('DEBUG: Importing stock-notifications');
  const { 
    createStockNotificationHandler, 
    listStockNotificationsHandler, 
    deleteStockNotificationHandler 
  } = await import("./stock-notifications");
  
  app.post("/api/stock-notifications", createStockNotificationHandler); // No auth required - guests can subscribe
  app.get("/api/stock-notifications", requireAuth, listStockNotificationsHandler);
  app.delete("/api/stock-notifications/:id", requireAuth, deleteStockNotificationHandler);

  // Wishlists routes (Phase 3.1)
  app.get("/api/wishlists", requireAuth, listWishlistsHandler);
  app.post("/api/wishlists", requireAuth, createWishlistHandler);
  app.get("/api/wishlists/default", requireAuth, getDefaultWishlistHandler);
  app.get("/api/wishlists/:id", requireAuth, getWishlistHandler);
  app.put("/api/wishlists/:id", requireAuth, updateWishlistHandler);
  app.delete("/api/wishlists/:id", requireAuth, deleteWishlistHandler);
  app.post("/api/wishlists/:id/items", requireAuth, addWishlistItemHandler);
  app.delete("/api/wishlists/:id/items/:itemId", requireAuth, removeWishlistItemHandler);

  // Orders & checkout (Phase 5)
  app.post("/api/orders/checkout", requireAuth, checkoutHandler);
  app.post("/api/orders/verify", requireAuth, verifyPaymentHandler);
  app.get("/api/orders", requireAuth, listOrdersHandler);
  app.get("/api/orders/:id", requireAuth, getOrderHandler);
  app.post("/api/orders/:id/cancel", requireAuth, cancelOrderHandler);
  app.post("/api/orders/:id/reorder", requireAuth, reorderHandler);

  // Order Tracking (Phase 2)
  console.error('DEBUG: Importing order-tracking');
  const { getOrderTrackingHandler, updateOrderShippingHandler } = await import("./order-tracking");
  app.get("/api/orders/:id/tracking", requireAuth, getOrderTrackingHandler);
  app.patch("/api/admin/orders/:id/shipping", requireAdmin, updateOrderShippingHandler);

  // Coupons (Phase 2)
  console.error('DEBUG: Importing coupons');
  const { validateCouponHandler } = await import("./coupons");
  const { 
    listCouponsHandler, 
    createCouponHandler, 
    updateCouponHandler, 
    deleteCouponHandler,
    getCouponStatsHandler 
  } = await import("./admin-coupons");
  
  // User coupon routes
  app.post("/api/coupons/validate", requireAuth, validateCouponHandler);
  
  // Admin coupon routes
  app.get("/api/admin/coupons", requireAdmin, listCouponsHandler);
  app.post("/api/admin/coupons", requireAdmin, createCouponHandler);
  app.put("/api/admin/coupons/:id", requireAdmin, updateCouponHandler);
  app.delete("/api/admin/coupons/:id", requireAdmin, deleteCouponHandler);
  app.get("/api/admin/coupons/:id/stats", requireAdmin, getCouponStatsHandler);

  // Profile & addresses (Phase 6)
  app.get("/api/profile/me", requireAuth, getMeHandler);
  app.put("/api/profile/me", requireAuth, profileUpdateMeHandler);
  app.get("/api/profile/addresses", requireAuth, listAddressesHandler);
  app.post("/api/profile/addresses", requireAuth, createAddressHandler);
  app.put("/api/profile/addresses/:id", requireAuth, updateAddressHandler);
  app.delete("/api/profile/addresses/:id", requireAuth, deleteAddressHandler);

  // Dedicated addresses API (Checkout enhancement)
  app.get("/api/addresses", requireAuth, listAddressesProfileHandler);
  app.post("/api/addresses", requireAuth, createAddressProfileHandler);
  app.get("/api/addresses/:id", requireAuth, getAddressHandler);
  app.put("/api/addresses/:id", requireAuth, updateAddressProfileHandler);
  app.delete("/api/addresses/:id", requireAuth, deleteAddressProfileHandler);
  app.post("/api/addresses/:id/default", requireAuth, setDefaultAddressHandler);
  app.get("/api/addresses/default", requireAuth, getDefaultAddressesHandler);

  // Admin (Phase 7) - with cache invalidation
  app.get("/api/admin/categories", requireAdmin, listCategoriesHandler);
  app.post("/api/admin/categories", requireAdmin, createCategoryHandler);

  // Admin Products (Phase 2 Migration - Drizzle & Zod)
  console.error('DEBUG: Importing admin-products');
  const { 
    getAdminProductsHandler, 
    getAdminProductHandler,
    createAdminProductHandler, 
    updateAdminProductHandler, 
    deleteAdminProductHandler,
    bulkUpdateProductStatusHandler
  } = await import("./admin-products");

  app.get("/api/admin/products", requireAdmin, getAdminProductsHandler);
  app.get("/api/admin/products/:id", requireAdmin, getAdminProductHandler);
  app.post("/api/admin/products", requireAdmin, invalidateProductsCacheMiddleware, createAdminProductHandler);
  app.put("/api/admin/products/:id", requireAdmin, invalidateProductsCacheMiddleware, updateAdminProductHandler);
  app.delete("/api/admin/products/:id", requireAdmin, invalidateProductsCacheMiddleware, deleteAdminProductHandler);
  app.post("/api/admin/products/bulk-status", requireAdmin, invalidateProductsCacheMiddleware, bulkUpdateProductStatusHandler);
  
  
  // Admin Product Variants (Phase 2) - with cache invalidation
  app.post("/api/admin/products/:productId/variants", requireAdmin, invalidateProductsCacheMiddleware, createVariantHandler);
  app.put("/api/admin/products/:productId/variants/:id", requireAdmin, invalidateProductsCacheMiddleware, updateVariantHandler);
  app.delete("/api/admin/products/:productId/variants/:id", requireAdmin, invalidateProductsCacheMiddleware, deleteVariantHandler);
  app.patch("/api/admin/products/:productId/variants/bulk", requireAdmin, invalidateProductsCacheMiddleware, bulkUpdateVariantsHandler);

  // Admin order management (Phase 2 - inventory sync)
  app.use("/api/admin", adminOrdersRouter);

  // Admin Dashboard Stats (Phase 2 Migration)
  console.error('DEBUG: Importing admin-dashboard');
  const { getDashboardStatsHandler } = await import("./admin-dashboard");
  app.get("/api/admin/stats", requireAdmin, getDashboardStatsHandler);

  // Admin Inventory (Phase 2 Migration)
  console.error('DEBUG: Importing admin-inventory');
  const { getInventoryHandler, adjustInventoryHandler, getInventoryHealthHandler } = await import("./admin-inventory");
  app.get("/api/admin/inventory", requireAdmin, getInventoryHandler);
  app.get("/api/admin/inventory/intelligence", requireAdmin, getInventoryHealthHandler);
  app.post("/api/admin/inventory/adjust", requireAdmin, adjustInventoryHandler);


  // Admin Analytics (Phase 4)
  console.error('DEBUG: Importing admin-analytics');
  const { 
    getRevenueAnalyticsHandler, 
    getTopProductsHandler, 
    getCustomerGrowthHandler, 
    getCategoryPerformanceHandler,
    getSalesOverviewHandler,
    exportReportHandler
  } = await import("./admin-analytics");

  app.get("/api/admin/analytics/revenue", requireAdmin, getRevenueAnalyticsHandler);
  app.get("/api/admin/analytics/products", requireAdmin, getTopProductsHandler);
  app.get("/api/admin/analytics/customers", requireAdmin, getCustomerGrowthHandler);
  app.get("/api/admin/analytics/categories", requireAdmin, getCategoryPerformanceHandler);
  app.get("/api/admin/analytics/sales", requireAdmin, getSalesOverviewHandler);
  app.get("/api/admin/analytics/export", requireAdmin, exportReportHandler);

  // Admin Notifications (Phase 4)
  console.error('DEBUG: Importing admin-notifications');
  const { 
    listRecipientsHandler, 
    createRecipientHandler, 
    updateRecipientHandler, 
    deleteRecipientHandler, 
    toggleRecipientHandler,
    getPreferencesHandler,
    updatePreferencesHandler,
    listNotificationsHandler,
    markNotificationReadHandler,
    getNotificationStatsHandler,
    sendTestNotificationHandler
  } = await import("./admin-notifications");
  
  // Admin Content Management (Phase 7 - Dynamic Banners)
  console.error('DEBUG: Importing admin-content');
  const {
    listContentHandler,
    createContentHandler,
    updateContentHandler,
    deleteContentHandler,

    getActiveBannersHandler,
    trackBannerClickHandler
  } = await import("./admin-content");

  // Public Banner API
  app.get("/api/banners/active", getActiveBannersHandler);
  app.get("/api/banners/active", getActiveBannersHandler);
  app.post("/api/banners/:id/click", trackBannerClickHandler);

  // Polls API
  app.get("/api/polls/active", getActivePollHandler);
  app.get("/api/polls/:id/results", getPollResultsHandler);
  app.post("/api/polls/:id/vote", requireAuth, votePollHandler);

  // Admin Content API
  app.get("/api/admin/content", requireAdmin, listContentHandler);
  app.post("/api/admin/content", requireAdmin, createContentHandler);
  app.put("/api/admin/content/:id", requireAdmin, updateContentHandler);
  app.delete("/api/admin/content/:id", requireAdmin, deleteContentHandler);
  
  app.get("/api/admin/notifications/recipients", requireAdmin, listRecipientsHandler);
  app.post("/api/admin/notifications/recipients", requireAdmin, createRecipientHandler);
  app.put("/api/admin/notifications/recipients/:id", requireAdmin, updateRecipientHandler);
  app.delete("/api/admin/notifications/recipients/:id", requireAdmin, deleteRecipientHandler);
  app.patch("/api/admin/notifications/recipients/:id/toggle", requireAdmin, toggleRecipientHandler);
  
  app.get("/api/admin/notifications/preferences", requireAdmin, getPreferencesHandler);
  app.put("/api/admin/notifications/preferences", requireAdmin, updatePreferencesHandler);
  
  app.get("/api/admin/notifications/history", requireAdmin, listNotificationsHandler);
  app.patch("/api/admin/notifications/history/:id/read", requireAdmin, markNotificationReadHandler);
  app.get("/api/admin/notifications/stats", requireAdmin, getNotificationStatsHandler);
  
  app.post("/api/admin/notifications/test", requireAdmin, sendTestNotificationHandler);

  // Product Reviews (Phase 3.2)
  app.get("/api/reviews/recent", listRecentReviewsHandler);
  app.get("/api/products/:productId/reviews", listProductReviewsHandler);
  app.get("/api/products/:productId/reviews/stats", getProductReviewStatsHandler);
  app.post("/api/products/:productId/reviews", requireAuth, createReviewHandler);
  app.put("/api/reviews/:id", requireAuth, updateReviewHandler);
  app.delete("/api/reviews/:id", requireAuth, deleteReviewHandler);
  app.post("/api/reviews/:id/vote", requireAuth, voteReviewHelpfulHandler);
  app.delete("/api/reviews/:id/vote", requireAuth, removeReviewVoteHandler);

  // Admin notifications
  app.post("/api-notify", requireAdmin, adminNotify);

  // Admin Customers (Phase 4)
  console.log('DEBUG: Importing admin-customers');
  const { 
    getCustomersHandler, 
    getCustomerHandler, 
    getVIPCustomersHandler,
    updateCustomerStatusHandler 
  } = await import("./admin-customers");

  app.get("/api/admin/customers", requireAdmin, getCustomersHandler);
  app.get("/api/admin/customers/vip", requireAdmin, getVIPCustomersHandler);
  app.get("/api/admin/customers/:id", requireAdmin, getCustomerHandler);
  app.patch("/api/admin/customers/:id/status", requireAdmin, updateCustomerStatusHandler);

  // Admin Jobs (Phase 2)
  app.post("/api/admin/jobs/stock-notifications", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { checkStockAndNotify } = await import('./jobs/stock-monitor');
      const result = await checkStockAndNotify();
      return res.json({
        success: true,
        message: `Stock notification job completed. Sent ${result.notifiedCount} notifications.`,
        result,
      });
    } catch (error: any) {
      console.error('Failed to run stock notification job:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to run stock notification job',
        error: error.message,
      });
    }
  });

  // Audit logs (Phase 4)
  app.get("/api/admin/audit-logs", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { searchAuditLogs } = await import('./utils/auditLog');
      const { action, resourceType, startDate, endDate } = req.query;
      
      const logs = await searchAuditLogs({
        action: action as string,
        resourceType: resourceType as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        limit: 100,
      });

      return res.json(logs);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
      return res.status(500).json({ 
        code: 'AUDIT_LOG_ERROR', 
        message: 'Failed to fetch audit logs' 
      });
    }
  });

  // Image Upload (Phase 2)
  console.error('DEBUG: Importing upload');
  const { uploadImageHandler, uploadMiddleware } = await import("./upload");
  app.post("/api/upload", requireAdmin, uploadMiddleware, uploadImageHandler);

  // Serve uploads directory statically
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  // Newsletter
  console.error('DEBUG: Importing newsletter');
  const { subscribeNewsletterHandler } = await import("./newsletter");
  app.post("/api/newsletter/subscribe", subscribeNewsletterHandler);

  const httpServer = createServer(app);
  console.error('DEBUG: registerRoutes complete');

  // Admin Invitation Routes
  app.post("/api/admin/invitations", requireAdmin, inviteAdminHandler);
  app.get("/api/admin/invitations", requireAdmin, listInvitationsHandler);
  app.delete("/api/admin/invitations/:id", requireAdmin, revokeInvitationHandler);
  app.post("/api/admin/invitations/accept", acceptInvitationHandler);

  return httpServer;
}
