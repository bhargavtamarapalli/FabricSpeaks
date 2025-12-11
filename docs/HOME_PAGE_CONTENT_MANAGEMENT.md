# Home Page Content Management Implementation

## Overview
This document outlines the implementation plan for making the home page content dynamic and manageable through the admin panel.

## Current Issues & Solutions

### 1. Hero Slideshow (HeroVersion5)
**Current State:** Hardcoded slides with local video/image imports
**Problem:** Videos take time to load from DB, content is not manageable
**Solution:**
- Keep videos in client assets for performance (as you suggested)
- Store slide configuration (titles, subtitles, order, duration) in database
- Admin can:
  - Upload images directly to database (using image upload API)
  - Reference video files by filename (videos stay in assets)
  - Set title, subtitle, display order, and duration
  - Preview how slides look before publishing
  - Enable/disable slides

**Implementation:**
- New table: `hero_slides` (see `shared/home-content-schema.ts`)
- Admin page: "Home Page > Hero Slides"
- API endpoints:
  - `GET /api/admin/hero-slides` - List all slides
  - `POST /api/admin/hero-slides` - Create new slide
  - `PUT /api/admin/hero-slides/:id` - Update slide
  - `DELETE /api/admin/hero-slides/:id` - Delete slide
  - `PATCH /api/admin/hero-slides/:id/reorder` - Change display order
- Frontend: `GET /api/hero-slides` - Public endpoint for active slides

### 2. Fabric Showcase (FabricShowcaseInteractive)
**Current State:** Hardcoded fabric data
**Status:** ✅ Already partially dynamic (navigates to products with fabric filter)
**Enhancement Needed:**
- Store fabric showcase configuration in database
- Admin can manage which fabrics to feature
- Link to actual product inventory

**Implementation:**
- New table: `featured_fabrics` (see `shared/home-content-schema.ts`)
- Admin page: "Home Page > Featured Fabrics"
- Each fabric entry has:
  - Name, origin, description
  - Image/video URL
  - Fabric filter (used to query products)
  - Display order
- Frontend fetches from `GET /api/featured-fabrics`

### 3. Signature Product (ProductDescription)
**Current State:** Hardcoded product ID `"signature-coat-123"`
**Problem:** If product is deleted or ID changes, "Add to Bag" fails
**Solution:**
- Add `is_featured_signature` boolean to products table
- Admin can mark ONE product as the featured signature piece
- Frontend queries: `GET /api/products/featured-signature`
- Fallback: If no product is marked, show nothing or show most expensive signature product

**Implementation:**
```typescript
// In products table, add:
is_featured_signature: boolean("is_featured_signature").default(false)

// Backend ensures only one product can be featured at a time
// When admin marks a product as featured, unmark all others
```

### 4. Marquee Text (MarqueeBridge)
**Current State:** Hardcoded messages like "Sustainable Luxury", "Handcrafted in Italy"
**My Recommendation:**
- Make these configurable from admin panel
- Store in database with display order
- Admin can add/edit/remove messages
- Messages rotate automatically

**Implementation:**
- New table: `marquee_messages` (see `shared/home-content-schema.ts`)
- Admin page: "Home Page > Marquee Messages"
- Simple CRUD interface
- Frontend fetches from `GET /api/marquee-messages`

## Database Schema

Created in `shared/home-content-schema.ts`:
- `hero_slides` - Hero slideshow configuration
- `marquee_messages` - Rotating marquee text
- `featured_fabrics` - Fabric showcase configuration

## Admin Panel Features

### Home Page Management Section
New menu item: "Home Page" with sub-items:
1. **Hero Slides**
   - List view with drag-and-drop reordering
   - Preview thumbnails
   - Add/Edit modal with:
     - Title & Subtitle
     - Media upload (image) or video file selection
     - Duration slider (1-30 seconds)
     - Display order
     - Active/Inactive toggle
   - Live preview showing how it looks on the site

2. **Featured Fabrics**
   - List view with reordering
   - Add/Edit modal with:
     - Fabric name, origin, description
     - Media upload
     - Fabric filter (dropdown of available fabrics from products)
     - Display order

3. **Marquee Messages**
   - Simple list with inline editing
   - Add/Remove buttons
   - Drag to reorder

4. **Featured Signature Product**
   - Dropdown to select from signature products
   - Preview of selected product
   - One-click to feature/unfeature

## Migration Strategy

### Phase 1: Database Setup
1. Create migration for new tables
2. Seed with current hardcoded data
3. Test data retrieval

### Phase 2: Backend APIs
1. Create handlers for hero slides CRUD
2. Create handlers for marquee messages CRUD
3. Create handlers for featured fabrics CRUD
4. Add featured signature product endpoint
5. Add public endpoints for frontend

### Phase 3: Frontend Updates
1. Update `Home.tsx` to fetch dynamic data
2. Add loading states and fallbacks
3. Test with various data configurations

### Phase 4: Admin Panel
1. Create admin pages for each content type
2. Implement drag-and-drop reordering
3. Add image upload integration
4. Add live preview feature

## Suggestions & Improvements

### Performance Optimization
- **Videos:** Keep in client assets as you suggested. Admin selects from predefined list.
- **Images:** Upload to CDN/storage, store URLs in database
- **Caching:** Cache home page content with 5-minute TTL
- **Lazy Loading:** Load videos only when slide is active

### User Experience
- **Preview Mode:** Admin can preview changes before publishing
- **Scheduling:** Optional: Schedule slides for specific date ranges
- **Analytics:** Track which slides get most engagement
- **A/B Testing:** Optional: Test different hero configurations

### Content Validation
- **Image Requirements:** Enforce minimum resolution (e.g., 1920x1080)
- **Video Requirements:** Enforce format (MP4), max file size
- **Text Limits:** Enforce character limits for titles/descriptions
- **Accessibility:** Require alt text for images

### Fallback Strategy
- If no hero slides configured → Show default static hero
- If no featured fabrics → Show "Coming Soon" message
- If no signature product → Hide section entirely
- If no marquee messages → Show default brand messages

## API Endpoints Summary

### Public Endpoints (Frontend)
```
GET /api/hero-slides              # Active slides ordered by display_order
GET /api/featured-fabrics         # Active fabrics ordered by display_order
GET /api/marquee-messages         # Active messages ordered by display_order
GET /api/products/featured-signature  # The featured signature product
```

### Admin Endpoints
```
# Hero Slides
GET    /api/admin/hero-slides
POST   /api/admin/hero-slides
PUT    /api/admin/hero-slides/:id
DELETE /api/admin/hero-slides/:id
PATCH  /api/admin/hero-slides/reorder

# Featured Fabrics
GET    /api/admin/featured-fabrics
POST   /api/admin/featured-fabrics
PUT    /api/admin/featured-fabrics/:id
DELETE /api/admin/featured-fabrics/:id

# Marquee Messages
GET    /api/admin/marquee-messages
POST   /api/admin/marquee-messages
PUT    /api/admin/marquee-messages/:id
DELETE /api/admin/marquee-messages/:id

# Featured Signature Product
GET    /api/admin/products/signature
PATCH  /api/admin/products/:id/feature-signature
```

## Next Steps

1. ✅ Create database schema (DONE)
2. Create database migration
3. Seed initial data from current hardcoded values
4. Implement backend handlers
5. Update frontend to consume APIs
6. Build admin panel UI
7. Test end-to-end
8. Deploy and monitor

## Questions Addressed

**Q: Videos take time to load from DB. Should we keep them in client?**
A: Yes, excellent decision. Keep videos as static assets in the client. Admin can select from a predefined list of video files. This ensures fast loading and better performance.

**Q: Should we make fabric showcase dynamic?**
A: Yes, but it's already partially dynamic (navigation works). We should store the showcase configuration in DB so admin can manage which fabrics to feature and their descriptions.

**Q: What about the hardcoded signature product ID?**
A: Add a `is_featured_signature` flag to products. Admin can mark one product as featured. Frontend fetches it dynamically. If deleted, the section gracefully hides.

**Q: Opinion on marquee text?**
A: Make it configurable. It's simple to implement and gives admin flexibility to update brand messages seasonally or for campaigns. Store in DB with display order.

## Robustness Improvements

1. **Error Handling:** Graceful degradation if APIs fail
2. **Validation:** Strict input validation on both frontend and backend
3. **Caching:** Reduce database load with smart caching
4. **Monitoring:** Log when content fails to load
5. **Versioning:** Track content changes for rollback capability
6. **Permissions:** Only admins can modify home page content
7. **Audit Trail:** Log who changed what and when

This implementation makes the home page fully dynamic while maintaining performance and providing a great admin experience.
