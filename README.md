# FoodMart Storefront (Next.js)

The customer-facing website for FoodMart, where people discover restaurants, home chefs, local food points and food bloggers, watch food reels, and order food.

Built from the Next.js + TypeScript template and redesigned to match the FoodMart Figma home screen (desktop, tablet and mobile). It talks to the FoodMart backend (`foodmart-backend`) for all data.

| App | Default URL | Purpose |
| --- | --- | --- |
| Backend API | http://localhost:5000/api/v1 | Express + MongoDB |
| Partner / admin dashboard | http://localhost:5173 | Sellers and the FoodMart team |
| **Storefront (this app)** | **http://localhost:3000** | Customers |

## Stack

- Next.js 16 (App Router), React 19, TypeScript
- Tailwind CSS v4 (theme tokens live in `src/app/globals.css`)
- @tanstack/react-query for data fetching and caching
- zustand for the signed-in user and the selected city
- axios with automatic access-token refresh
- sonner for toasts, react-icons for icons

## Getting started

```bash
cp .env.example .env.local     # then edit if your URLs differ
npm install
npm run dev                    # http://localhost:3000
```

Start the backend first (`npm run dev` in `foodmart-backend`).

### Environment variables (`.env.local` / Vercel settings)

| Variable | Example | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | `https://api.yourdomain.com/api/v1` | Backend API base URL (or `/api/v1` when using the proxy below) |
| `API_PROXY_TARGET` | `https://api.yourdomain.com` | Optional. Forwards `/api/v1/*` and `/uploads/*` through this site so no CORS setup is needed |
| `NEXT_PUBLIC_DASHBOARD_URL` | `https://panel.yourdomain.com` | "Partner dashboard" / "FoodMart panel" links and the partner sign-up screen |
| `NEXT_PUBLIC_SITE_URL` | `https://yourdomain.com` | Public URL of this site (metadata, links) |
| `NEXT_PUBLIC_DEFAULT_CITY` | `Karachi` | City used until the visitor picks one |

`NEXT_PUBLIC_*` values are baked into the build: after changing them in Vercel, **redeploy**. Never commit `.env.local`. `.env.example` and `.env.production.example` are safe templates.

### Connect your own domain (checklist)

1. **Backend** (own server/VPS/Render/etc.) reachable at e.g. `https://api.yourdomain.com` (HTTPS).
2. **Backend `.env`**:
   - `FRONTEND_URL=https://yourdomain.com,https://www.yourdomain.com` (comma separated, used for CORS)
   - `DASHBOARD_URL=https://panel.yourdomain.com`
   - `APP_PUBLIC_URL=https://yourdomain.com` (links in emails, Stripe return URLs)
   - `PUBLIC_BASE_URL=https://api.yourdomain.com`
   - `TRUST_PROXY=true` when behind Nginx/Cloudflare/Render
3. **Vercel (this site)**: add the variables above (`NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com/api/v1`, dashboard and site URLs), add your domain under *Settings > Domains*, then redeploy.
4. **Dashboard**: set `VITE_API_BASE_URL=https://api.yourdomain.com/api/v1` and `VITE_STOREFRONT_URL=https://yourdomain.com`.
5. **Stripe**: webhook endpoint `https://api.yourdomain.com/api/v1/webhooks/stripe`.
6. Prefer no CORS at all? Set `NEXT_PUBLIC_API_BASE_URL=/api/v1` and `API_PROXY_TARGET=https://api.yourdomain.com`.

If the site shows "Cannot reach the FoodMart server", the API URL is wrong, the backend is down, or CORS (`FRONTEND_URL`) does not include your domain.

### Payments in the storefront

Checkout offers the methods the seller accepts (`GET /payments/methods`): cash, card (Stripe Checkout redirect) and JazzCash / Easypaisa. For wallets the order page shows the account number and a form for the transaction ID; the seller confirms it in the dashboard. After Stripe the customer returns to `/orders/:id?payment=success` and the payment is verified automatically.

### Languages (English / اردو) and dark theme

- The header has a language button and a theme button (mobile: in the header and in the menu drawer). The choice is saved in the browser and applied before the page paints.
- Urdu switches the whole site to right-to-left with the Noto Naskh Arabic font. Texts are translated live from the dictionary in `src/lib/ur.ts` (`components/layout/Translator.tsx`). A text that is not in the dictionary simply stays in English; to translate it, add `"English text": "اردو متن"` to `ur.ts`. Dynamic texts use the `UR_PATTERNS` list in the same file.
- The assistant gets the selected language and answers in Urdu when the AI model key is configured on the backend.
- Dark theme swaps the colour tokens in `globals.css` (`html.dark`), so every page follows it. It starts from the visitor's system preference.

### Mobile menu

The menu drawer renders in a portal on `<body>`. (Inside the sticky blurred header, `position: fixed` was clipped to the header height.)

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build (`next build --webpack`, as in the original template) |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |

## Pages and the APIs they use

| Route | Page | Main API calls |
| --- | --- | --- |
| `/` | Home: hero search, For You reels, cuisines, Picked For You, trending restaurants, nearby food points, special offers, today's deal, top bloggers and chefs | `/reels/feed`, `/profiles`, `/discovery/nearby`, `/discover/trending`, `/deals`, `/recommendations` (signed in) |
| `/explore` | Search and filters (sort, budget, seller type, verified, near me); dishes, places and posts tabs | `/search`, `/foods`, `/profiles`, `/feed`, `/discover/trending` |
| `/reels` | Full-screen vertical reels with like, comment, save, share, follow and "Order this dish" | `/reels/feed`, `/posts/:id/like`, `/posts/:id/save`, `/posts/:id/comments`, `/posts/:id/view`, `/posts/:id/share` |
| `/offers` | Live deals with countdowns and popular dishes | `/deals`, `/discover/trending` |
| `/restaurants`, `/chefs`, `/food-points`, `/bloggers` | Listings with search, In city / All Pakistan / Near me, sort, verified and cuisine filters | `/profiles`, `/discovery/nearby` |
| `/restaurants/[slug]` (and the same for chefs, food-points, bloggers) | Profile: menu, reels and posts, reviews, about, deals, follow | `/profiles/:idOrSlug`, `/profiles/:id/foods`, `/profiles/:id/posts`, `/profiles/:id/reviews`, `/profiles/:id/deals`, `/profiles/:id/follow` |
| `/food/[id]` | Dish page: gallery, price, deals, add to cart, seller, reviews, similar dishes | `/foods/:id`, `/foods/:id/reviews`, `/foods/:id/similar`, `/foods/:id/favorite`, `/cart/items` |
| `/cart` | Cart with quantity steppers and delivery / pickup totals | `/cart`, `/cart/items` |
| `/checkout` | Delivery or pickup, saved or new address, phone, notes, cash payment | `/cart`, `/users/me/addresses`, `POST /orders` (sends an `Idempotency-Key`) |
| `/orders`, `/orders/[id]` | Order history, live tracker (refreshes every 20 s), cancel, rate dishes and service | `/orders`, `/orders/:id`, `/orders/:id/cancel`, `/food-reviews`, `/restaurant-reviews`, `/seller-reviews` |
| `/login`, `/signup` | Customer auth (sign-up asks for city and favourite cuisines) | `/auth/login`, `/auth/register` |
| `/partner` | Partner sign-up for restaurant, home chef, food point or blogger | `/platform/config`, `/auth/register` (with `profileType`), `POST /profiles` (if already signed in) |
| `/forgot-password`, `/reset-password`, `/verify-email` | Email flows | `/auth/password/forgot`, `/auth/password/reset`, `/auth/email/verify` |
| `/account` | Profile and photo, food preferences, addresses, password, partner link | `/users/me`, `/users/me/avatar`, `/users/me/preferences`, `/users/me/addresses`, `/auth/password/change` |
| `/favourites` | Favourite dishes, saved posts, following | `/users/me/favorite-foods`, `/users/me/saved-posts`, `/users/me/following` |
| `/notifications` | Notifications, mark all as read | `/notifications`, `/notifications/read-all` |
| `/awards` | FoodMart Awards winners | `/awards/winners` |
| `/help`, `/safety`, `/contact`, `/privacy`, `/terms`, `/cookies` | Static content pages | none |

Every endpoint above was checked against the backend route files: all 72 calls exist with the same HTTP method.

## How partners reach the dashboard

1. A restaurant, chef, food point or blogger opens **Partner with us** (`/partner`).
2. They pick a type and enter a business name and city. A new visitor also creates an account; someone already signed in just adds the business profile.
3. The success screen links to the dashboard (`NEXT_PUBLIC_DASHBOARD_URL/signin`). They sign in there with the same email and password.
4. Signed-in partners also see a **Partner dashboard** link in the account menu.

The FoodMart team signs in to the dashboard directly. Team accounts are not created from the storefront.

## Images

Dishes, profiles, covers and reels show the photos sellers upload in the dashboard (served by the backend). When a photo is missing or fails to load, `SmartImage` shows a matching illustrated fallback (biryani, burger, pizza, BBQ and so on), picked from the dish's name or cuisine. Real photos replace the illustrations automatically.

## Project structure

```
src/
  app/                 routes (thin server pages; metadata titles)
  components/
    brand/             FoodMart logo and food illustrations
    cards/             reel, place, dish, creator and offer cards
    layout/            header, footer, mobile bottom nav, auth guard
    ui/                buttons, inputs, tabs, modal, badges, SmartImage…
  features/            page-level client components (home, discovery, reels, auth, orders, account, content)
  hooks/               cart, follow / like / save / favourite, auth redirect
  lib/                 shared types (match the backend) and formatting helpers
  providers/           React Query + toaster, session bootstrap
  services/            axios client (token refresh) and typed API functions
  store/               signed-in user, selected city / GPS location
```

### Notes for Next.js 16

- Dynamic route `params` are Promises (`const { slug } = await params`).
- Pages that read `useSearchParams` are wrapped in `<Suspense>`.
- `images.unoptimized` is on, so backend upload URLs (any host) work without extra config.

## Auth and session details

- Access and refresh tokens are kept in `localStorage` (`fm_access_token`, `fm_refresh_token`). On a 401, one refresh request runs and queued requests retry automatically.
- An anonymous `X-Session-Id` is sent with requests (used by the backend for view counts and activity tracking).
- The selected city is saved as `fm_city`. "Use my current location" asks the browser for GPS and powers the Near me results.
- Payments are cash on delivery or cash at pickup, matching the backend.

## Status of this build

The UI was checked page by page in a browser preview at desktop (1440px), tablet (834px) and mobile (390px) widths, using sample data shaped like the backend's responses. Imports, icons and API routes were checked by script, and the code was type-checked against stand-in type declarations. `npm install` and `next build` could not be run in the environment where this was made, so run `npm install && npm run build` once on your machine and send any error output if something comes up.

## Images & language
- No cartoon art any more: missing photos fall back to real food photos (`src/lib/photos.ts`, Unsplash License). For production copy the photos you keep into `public/` or upload your own from the dashboard.
- Language is a globe-icon dropdown (English / اردو) in the header.
