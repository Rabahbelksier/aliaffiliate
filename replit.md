# AliAffiliate

An AliExpress Affiliate Orders tracker app built with Expo React Native and Node.js.

## Project Overview

Mobile app to track AliExpress Affiliate orders, view commissions, and analyze performance. Features a dark, finance-app-inspired UI.

## Architecture

- **Frontend**: Expo React Native with Expo Router (file-based routing)
- **Backend**: Express.js on port 5000 — proxies AliExpress Affiliate API with MD5 signature generation
- **State**: AsyncStorage for offline caching + React Query for data fetching
- **Navigation**: Bottom tabs (Dashboard, Orders, Settled, Canceled, Settings)

## Key Features

- **Dashboard**: Live order counts and commission totals across all statuses
- **Orders**: Tabbed list (Paid, Received This Month, Received Last Month) with pagination
- **Settled/Canceled**: Dedicated screens for completed/void orders
- **Settings**: Secure local storage of App Key, App Secret, Tracking ID + API test
- **Offline Support**: AsyncStorage caches last API response per query

## API Integration

Backend endpoint `/api/orders` (POST):
- Accepts: `app_key`, `app_secret`, `status`, `start_time`, `end_time`, `page_no`, `page_size`
- Generates MD5 signature per AliExpress spec
- Calls `https://api-sg.aliexpress.com/sync` with method `aliexpress.affiliate.order.get`
- Returns normalized `{ total_record_count, current_record_count, orders[] }`

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
  useOrders.ts          # fetchOrders with offline cache fallback
server/
  routes.ts             # /api/orders proxy endpoint
  index.ts              # Express server setup
constants/
  colors.ts             # Dark theme color system
```

## Running the Project

- Backend: `npm run server:dev` (port 5000)
- Frontend: `npm run expo:dev` (port 8081)
- Scan QR code with Expo Go to test on Android/iOS device

## Dependencies

All standard Expo Go compatible packages. No native modules required.
