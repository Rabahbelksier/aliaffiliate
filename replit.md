# AliAffiliate

An AliExpress Affiliate Orders tracker app built with Expo React Native and Node.js.

## Project Overview

Mobile app to track AliExpress Affiliate orders, view commissions, and analyze performance. Features a dark, finance-app-inspired UI.

## Architecture

- **Frontend**: Expo React Native with Expo Router (file-based routing)
- **Backend**: Express.js deployed on Render at `https://aliaffiliate.onrender.com` — proxies AliExpress Affiliate API with MD5 signature generation
- **State**: AsyncStorage for offline caching + React Query for data fetching
- **Navigation**: Bottom tabs (Dashboard, Orders, Settled, Canceled, Settings)
- **API Keys**: Each user provides their own `app_key` and `app_secret` via the Settings screen, stored locally on device via AsyncStorage

## API Integration — Key Findings

After live testing the AliExpress API, the correct details are:

- **Correct method**: `aliexpress.affiliate.order.list` (NOT `aliexpress.affiliate.order.get`)
- **Response key**: `aliexpress_affiliate_order_list_response`
- **Date format**: `YYYY-MM-DD HH:MM:SS` (NOT timestamps)
- **Time limit**: Max 180-day range per request (we use 5 months / ~150 days by default)
- **Valid status values**: "Payment Completed", "Buyer Confirmed Receipt", "Invalid" (canceled)
- **Endpoint**: `https://api-sg.aliexpress.com/sync`

### Field name mapping (API → App)
| API field | App field |
|-----------|-----------|
| `order_number` | `sub_order_id` |
| `parent_order_number` | `order_id` |
| `order_status` | `status` |
| `paid_amount` | `payment_amount` |
| `estimated_paid_commission` | `estimated_paid_amount` |

## Key Features

- **Dashboard**: Live order counts and commission totals across all statuses
- **Orders**: Tabbed list (Paid, Received This Month, Received Last Month) with pagination
- **Settled/Canceled**: Dedicated screens for completed/void orders
- **Settings**: Per-user App Key and App Secret stored locally + API test
- **Offline Support**: AsyncStorage caches last API response per query
- **Tracking ID**: Automatically fetched from API responses (not manually saved)

## Backend Endpoint `/api/orders` (POST)

Accepts:
- `app_key`, `app_secret` (required)
- `status`: "Payment Completed" | "Buyer Confirmed Receipt" | "Invalid" | "Settled"
- `start_time`, `end_time`: YYYY-MM-DD HH:MM:SS (defaults to last 30 days)
- `time_type`: "1" (by paid time), default
- `page_no`, `page_size`

Returns: `{ total_record_count, current_record_count, orders[] }`

## File Structure

```
app/
  _layout.tsx           # Root layout with providers
  (tabs)/
    _layout.tsx         # Tab bar (NativeTabs liquid glass on iOS 26+)
    index.tsx           # Dashboard
    orders.tsx          # Orders (tabbed by status)
    settled.tsx         # Settled orders
    canceled.tsx        # Canceled orders  
    settings.tsx        # API credentials + test
components/
  StatCard.tsx          # Dashboard stat card
  OrderCard.tsx         # Individual order row card
  OrdersList.tsx        # Paginated orders list with refresh
context/
  SettingsContext.tsx   # AsyncStorage-backed settings context
hooks/
  useOrders.ts          # fetchOrders with offline cache fallback + date utils
server/
  routes.ts             # /api/orders proxy endpoint with MD5 signing
  index.ts              # Express server setup
constants/
  colors.ts             # Dark theme color system
lib/
  query-client.ts       # API URL config (EXPO_PUBLIC_DOMAIN or Render fallback)
```

## API URL Resolution

- `lib/query-client.ts` resolves the API URL dynamically:
  - If `EXPO_PUBLIC_DOMAIN` env var is set, uses `https://${EXPO_PUBLIC_DOMAIN}`
  - Otherwise falls back to `https://aliaffiliate.onrender.com`
- The Start Frontend workflow sets `EXPO_PUBLIC_DOMAIN=aliaffiliate.onrender.com` so both web preview and Expo Go use Render
- CORS on the server allows any origin (the API is secured by per-request app_key/app_secret)

## Server Deployment (Render)

- Backend is deployed on Render at `https://aliaffiliate.onrender.com`
- Build command: `npm install && npm run server:build`
- Start command: `npm run server:prod`
- After code changes, redeploy to Render for changes to take effect on production

## Running the Project

- Backend: `npm run server:dev` (port 5000) — local dev server
- Frontend: Start Frontend workflow (port 8081) — points to Render server
- Scan QR code with Expo Go to test on Android/iOS device
