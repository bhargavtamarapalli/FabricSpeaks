# Home Page & Core Navigation Review Report

This report outlines the issues, implementation gaps, and areas for improvement identified during the review of the Home Page (`Home.tsx`), Header, and Footer.

## 1. Missing Pages & Broken Links
The following links found in the Header/Footer or Home page content do not have corresponding routes defined in `App.tsx`:
- **Sustainability**: Footer link to `/sustainability` (404).
- **Press**: Footer link to `/press` (404).
- **Shipping & Returns**: Footer link to `/shipping` (404).
- **Size Guide**: Footer link to `/size-guide` (404).
- **Explore Fabric**: The "Explore FabricAdmin_A" button in the `FabricShowcaseInteractive` section is purely visual and does not navigate anywhere.

## 2. Hardcoded Data & Content
Several sections rely on hardcoded data instead of fetching from the backend or configuration:
- **Hero Slideshow**: Slides (images/videos, titles) are hardcoded in `HeroVersion5`.
- **Fabric Showcase**: Fabric types (Royal Satin, Pure Linen, etc.) are hardcoded in `FabricShowcaseInteractive`.
- **Signature Product**: The "Camel Cashmere Overcoat" section uses a hardcoded ID (`signature-coat-123`). If this product is deleted or the ID changes, the "Add to Bag" button will fail.
- **Marquee Text**: "Sustainable Luxury", "Handcrafted in Italy", etc., are hardcoded.

## 3. Functionality Gaps
- **Newsletter Subscription**:
    - Both the Home page newsletter section and the Footer newsletter input are **purely visual**. They do not submit data to any API or backend service.
- **Social Media Links**:
    - WhatsApp and Telegram buttons in the Footer link to generic homepages (`whatsapp.com`, `telegram.org`) instead of a specific business account or group.
- **Search**:
    - The search bar redirects to `/clothing?search=...`. While functional, it assumes all searchable items are under the "clothing" route.

## 4. UI/UX & Code Quality Issues
- **Inline Styles**: `Home.tsx` contains a `<style>` block (lines 387-397) injecting global CSS. This should be moved to `index.css` or a dedicated CSS file for better maintainability.
- **Error Handling**: The `AuthModal` uses `alert()` for login/registration errors. This is a poor user experience; toast notifications should be used instead.
- **Brand Logo Component**: The `BrandLogo` component in `Home.tsx` uses `fixed` positioning (`top-6 left-6`). This might overlap with the `Header` or other elements on smaller screens or different layouts.
- **Performance**:
    - The Home page loads multiple heavy assets (videos and images) immediately.
    - `AnimatePresence` and complex animations are used extensively. While visually appealing, performance on lower-end devices should be verified.

## 5. Recommendations for Next Steps
1.  **Create Missing Pages**: Implement placeholder or actual pages for Sustainability, Press, Shipping, and Size Guide.
2.  **Dynamic Content**:
    - Fetch "Signature Product" dynamically (e.g., by a "featured" flag in the DB).
    - Consider moving Hero/Fabric data to a config file or database if frequent updates are expected.
3.  **Implement Newsletter**: Create a backend endpoint to collect emails (or integrate with a service) and wire up the frontend forms.
4.  **Fix Social Links**: Update Footer links to point to actual business profiles.
5.  **Refactor Code**:
    - Move inline styles to `index.css`.
    - Replace `alert()` with `useToast`.
    - Fix `BrandLogo` positioning or integrate it properly into the Header/Layout.
