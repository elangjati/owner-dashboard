# Kopay Owner Dashboard

A real-time business dashboard for Kopay coffee shop owners built with React, TypeScript, and Supabase.

## Features

- 📊 Real-time sales dashboard
- 📋 Order management and tracking
- 📈 Sales reports and analytics
- 💰 Revenue tracking
- 🔄 Live data updates via Supabase
- 📱 Responsive design for mobile/tablet/desktop
- 🌐 Works on any browser (Chrome, Safari, Firefox, etc.)

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL)
- **Icons**: Lucide React
- **State Management**: React Hooks

## Prerequisites

- Node.js 16+ and npm/yarn
- Supabase account and project
- Git

## Setup

### 1. Clone and Install

```bash
cd owner-dashboard
npm install
```

### 2. Configure Supabase

Create a `.env.local` file with your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Get these values from your Supabase project:
1. Go to https://app.supabase.com
2. Select your project
3. Settings → API
4. Copy `Project URL` and `anon` key

### 3. Create Owner User in Supabase

In Supabase Auth:
1. Go to Authentication → Users
2. Create a new user with email and password
3. This user will access the owner dashboard

### 4. Development

```bash
npm run dev
```

Opens at `http://localhost:5173`

### 5. Build for Production

```bash
npm run build
```

Output in `dist/` folder

## Deployment

### Option 1: Vercel (Recommended - Free)

```bash
npm install -g vercel
vercel
```

### Option 2: Netlify

1. Connect GitHub repo
2. Build command: `npm run build`
3. Publish directory: `dist`

### Option 3: Firebase Hosting

```bash
npm install -g firebase-tools
firebase deploy
```

## Database Requirements

Make sure your Supabase has these tables:

- `orders` - Order records
- `order_items` - Order line items
- `menus` - Menu items

The dashboard queries from these tables, so they must exist and have data.

## Features

### Dashboard
- Real-time sales metrics
- Today's revenue and order count
- Recent orders list
- Live updates

### Orders
- Filter by date range (today, week, month)
- Search by order number
- Payment status tracking
- Summary statistics

### Reports
- 7-day and 30-day reports
- Daily revenue breakdown
- Export to CSV
- Analytics

## Usage

### For Owner

1. Open the dashboard URL in Safari (iPhone)
2. Login with your Supabase email
3. View real-time business metrics
4. Check orders and reports

### Sharing with Owner

- Deploy to Vercel/Netlify
- Share the URL with owner
- Owner bookmarks it on iPhone home screen
- Works like a native app

## Development

### Project Structure

```
src/
├── components/      # Reusable React components
├── pages/          # Page components
├── lib/            # Utilities and Supabase client
├── types/          # TypeScript types
└── main.tsx        # Entry point
```

### Adding New Features

1. Create component in `src/components/`
2. Import Supabase client from `src/lib/supabase`
3. Use hooks for state management
4. Style with Tailwind CSS

## Troubleshooting

**Login issues:**
- Check Supabase credentials in `.env.local`
- Verify user exists in Supabase Auth

**No data showing:**
- Verify orders table exists in Supabase
- Check if kasir app is creating orders
- Check browser console for errors

**Real-time not working:**
- Verify Supabase connection
- Check if Realtime is enabled in Supabase

## License

MIT
