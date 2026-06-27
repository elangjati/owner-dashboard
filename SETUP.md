# Quick Setup Guide

## Step 1: Install Dependencies

Open terminal di folder `d:\Kopay\owner-dashboard` dan jalankan:

```bash
npm install
```

Tunggu sampai selesai (mungkin 2-5 menit).

## Step 2: Configure Supabase

Edit file `.env.local` dan masukkan Supabase credentials kamu:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Cara mendapatkan credentials:
1. Login ke https://app.supabase.com
2. Select project kamu
3. Buka Settings → API
4. Copy "Project URL" ke VITE_SUPABASE_URL
5. Copy "anon public" key ke VITE_SUPABASE_ANON_KEY

## Step 3: Create Owner Account

Di Supabase Console:
1. Go to Authentication → Users
2. Click "Add user"
3. Email: owner@example.com
4. Password: (buat password yang aman)
5. Click "Create user"

Gunakan credentials ini untuk login ke dashboard.

## Step 4: Development Server

```bash
npm run dev
```

Akan membuka browser otomatis di `http://localhost:5173`

## Step 5: Login

Login dengan credentials yang dibuat di Step 3.

## Step 6: Build for Production

Ketika sudah siap deploy:

```bash
npm run build
```

Output ada di folder `dist/`

## Deployment Options

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Netlify
Connect repo GitHub, set build command: `npm run build`, publish: `dist`

### Firebase Hosting
```bash
npm install -g firebase-tools
firebase deploy
```

## Troubleshooting

**npm command not found:**
- Install Node.js dari https://nodejs.org/ (LTS version)
- Restart terminal

**Supabase connection error:**
- Check .env.local credentials
- Verify project URL is correct
- Check internet connection

**No orders showing:**
- Verify kasir app is creating orders di Supabase
- Check orders table exists
- Verify JWT permissions

## Features Ready to Use

✅ Dashboard - Real-time metrics
✅ Orders - Browse all orders
✅ Reports - Analytics & export
✅ Login/Logout
✅ Responsive design
✅ Real-time updates

## Next Steps

1. Deploy dashboard to Vercel/Netlify
2. Share URL with owner
3. Owner bookmarks on iPhone
4. Works like a native app!

Need help? Check README.md
