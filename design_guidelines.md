# Luxury Fashion E-Commerce Design Guidelines

## Design Approach
**Reference-Based: Net-a-Porter + COS Aesthetic**
- Ultra-minimalist luxury fashion presentation
- Editorial photography emphasis with generous breathing room
- Sophisticated restraint over visual complexity
- Premium materials metaphor through digital polish

## Color Palette (User Specified)
- Primary: `#000000` (Black) - Headers, CTAs, navigation
- Secondary: `#FFFFFF` (White) - Backgrounds, cards
- Accent: `#C9A96E` (Gold) - Premium highlights, hover states, sale badges
- Background: `#F8F8F8` (Light Grey) - Page backgrounds, subtle separations
- Text: `#333333` (Charcoal) - Body copy, descriptions
- Subtle: `#E5E5E5` (Border Grey) - Dividers, input borders

## Typography
**Font Families:**
- Primary: Inter (via Google Fonts)
- Fallback: Helvetica Neue, system-ui, sans-serif

**Hierarchy:**
- Hero Headlines: 48-72px, font-weight 300 (light), letter-spacing tight
- Section Headers: 32-40px, font-weight 400 (regular)
- Product Titles: 16-18px, font-weight 500 (medium), uppercase tracking-wide
- Body Text: 14-16px, font-weight 400, line-height 1.6
- Pricing: 18-20px, font-weight 500
- Small Print: 12px, font-weight 400, text-charcoal

## Layout System
**Spacing Primitives:** Use Tailwind units of 2, 4, 6, 8, 12, 16, 20, 24
- Component padding: p-6 to p-8
- Section spacing: py-16 to py-24
- Card gaps: gap-6 to gap-8
- Button padding: px-8 py-3

**Container Strategy:**
- Max-width: 1440px (max-w-7xl)
- Content sections: max-w-6xl with px-6 to px-8
- Product grids: Full-width with inner constraints

## Component Library

### Navigation
- Fixed top navigation with subtle shadow on scroll
- Logo: Left-aligned, minimal wordmark or icon
- Main menu: Center-aligned, uppercase, letter-spacing wide
- Icons: Right-aligned (Search, Account, Cart with item count badge)
- Mobile: Slide-out drawer with same menu structure
- Height: 80px desktop, 64px mobile

### Hero Section
**Full-width editorial hero with overlay:**
- High-quality lifestyle fashion photography (1920x800px)
- Semi-transparent black overlay (opacity 0.3) for text contrast
- Centered content with glass-morphism card effect
- Headline + subheadline + CTA button with blur background
- Button styling: Black background with blur, white text, gold hover border
- Height: 70vh on desktop, 60vh on mobile

### Product Grid
**Grid-based catalog layout:**
- Desktop: 4 columns (grid-cols-4)
- Tablet: 3 columns (md:grid-cols-3)
- Mobile: 2 columns (grid-cols-2)
- Aspect ratio: 3:4 (portrait) for product images
- Card structure: Image + Brand + Title + Price
- Hover: Subtle lift (translate-y-1), second product image fade-in
- White background cards with minimal border

### Product Cards
- Image container: Full-width with aspect-ratio-3/4
- Product brand: Uppercase, 11px, letter-spacing widest, text-charcoal
- Product name: 16px, font-medium, line-clamp-2
- Price: 18px, font-medium, black text
- Sale badge: Gold background, white text, absolute top-right
- Spacing: p-4 padding below image

### Product Detail Page
**Two-column layout (desktop):**
- Left: Image gallery (60%) - Main image + thumbnail strip
- Right: Product info (40%) - Sticky positioning
- Product title: 28px, font-light
- Price: 24px, font-medium
- Size selector: Button group with border, gold active state
- Add to cart: Full-width black button, white text
- Description: Collapsible accordion sections
- Mobile: Stack vertically, full-width images

### Shopping Cart
**Slide-out drawer (right side):**
- Width: 480px desktop, full-width mobile
- Item cards: Horizontal layout with small thumbnail
- Quantity controls: Minimal +/- buttons
- Subtotal calculation with prominent display
- Checkout button: Full-width gold button
- Empty state: Centered icon + message

### Forms (Auth, Checkout)
**Minimal, generous spacing:**
- Input fields: Full-width, border-subtle, focus:border-black, py-3 px-4
- Labels: Above inputs, 12px uppercase, letter-spacing wide
- Buttons: Full-width, black background, white text
- Error states: Red text below field, red border
- Divider: "OR" with horizontal lines

### Footer
**Multi-column layout:**
- 4 columns desktop, 2 columns tablet, stack mobile
- Sections: Shop, About, Customer Service, Newsletter
- Newsletter: Email input + gold submit button
- Social icons: Minimal black outline icons
- Copyright: Center-aligned, small text
- Background: Background color (#F8F8F8)

## Images
**Product Photography:**
- High-resolution fashion photography (minimum 1200px width)
- 3:4 portrait aspect ratio for consistency
- Clean white or minimal backgrounds
- Multiple angles per product (front, back, detail shots)
- Lifestyle images for hero and category banners

**Hero Section:**
- Large editorial fashion photography (1920x800px minimum)
- Professional model photography or styled flat lays
- Overlay with semi-transparent black for text readability

**Category Banners:**
- Full-width lifestyle images (1920x600px)
- Contextual fashion scenes (runway, street style, editorial)

## Animations
**Subtle, premium interactions only:**
- Product card hover: Smooth translate-y-1 + second image fade
- Button hover: Gold border appear (transition-all duration-200)
- Cart drawer: Slide-in from right (transform-x)
- Image gallery: Crossfade transitions
- No scroll animations or complex choreography

## Responsive Breakpoints
- Mobile: < 768px (2-column grid, stacked layouts)
- Tablet: 768px - 1024px (3-column grid)
- Desktop: > 1024px (4-column grid, two-column detail page)

## Key UX Principles
- **Editorial Quality:** Every product feels curated and premium
- **Generous Breathing Room:** White space conveys luxury
- **Effortless Navigation:** Clear hierarchy, minimal clicks
- **Trust Signals:** High-quality imagery, professional typography
- **Mobile Excellence:** Touch-friendly targets (min 44px), thumb-zone navigation