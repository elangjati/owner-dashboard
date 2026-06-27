# 🎉 START HERE - Owner Dashboard Setup

Selamat! Kamu sudah punya complete owner dashboard siap pakai. Ini adalah panduan pertama yang harus dibaca.

---

## ⚡ Quick Start (15 minutes)

### 1️⃣ Install Dependencies
Buka terminal/PowerShell di folder `d:\Kopay\owner-dashboard` dan jalankan:
```bash
npm install
```
Tunggu hingga selesai (mungkin 2-5 menit).

### 2️⃣ Konfigurasi Supabase
Edit file `.env.local` di folder ini:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Cara dapat credentials:**
1. Login ke https://app.supabase.com
2. Pilih project kamu
3. Settings → API
4. Copy "Project URL" dan "anon public" key

### 3️⃣ Jalankan Development Server
```bash
npm run dev
```
Browser akan membuka otomatis ke `http://localhost:5173`

### 4️⃣ Login & Test
- Email: owner@example.com (atau email owner kamu di Supabase)
- Password: (password dari Supabase Auth)

Sekarang kamu lihat dashboard dengan data real-time!

---

## 📖 Dokumentasi Lengkap

Baca dalam urutan ini:

1. **START_HERE.md** ← Kamu di sini 🎯
2. **GETTING_STARTED.md** - Setup & struktur folder
3. **README.md** - API & fitur lengkap
4. **DEPLOYMENT_GUIDE.md** - Deploy ke production
5. **PROJECT_SUMMARY.md** - Ringkasan teknis

---

## 🎯 Apa yang Sudah Ada

✅ **Dashboard Page**
- Real-time sales metrics
- Today's revenue & orders
- Recent orders list
- Live updates

✅ **Orders Page**
- Filter by date (today, week, month)
- Search orders
- Payment status tracking
- Revenue summary

✅ **Reports Page**
- 7-day & 30-day analytics
- Daily breakdown
- Export to CSV
- Trend analysis

✅ **Authentication**
- Supabase login/logout
- Session management
- Protected routes

✅ **Design**
- Fully responsive (mobile, tablet, desktop)
- Beautiful UI
- Coffee theme
- Tailwind CSS

---

## 🔧 Tech Stack

```
Frontend: React 18 + TypeScript
Build: Vite 5
Styling: Tailwind CSS
Backend: Supabase (PostgreSQL)
Icons: Lucide React
Routing: React Router v6
```

---

## 📱 How It Works

```
Owner Login
    ↓
Dashboard fetches data dari Supabase
    ↓
Real-time listener subscribe to changes
    ↓
Kasir create order → Supabase
    ↓
Dashboard auto-update
    ↓
Owner lihat order instantly
```

---

## 🚀 Next Steps

### Untuk Development
```bash
npm run dev        # Start dev server
npm run build      # Build for production
```

### Untuk Production
1. Deploy ke Vercel/Netlify (free)
2. Share URL dengan owner
3. Owner buka di Safari iPhone
4. Owner add to home screen

---

## 🆘 Troubleshooting

**npm command not found:**
- Install Node.js dari https://nodejs.org/ (LTS)
- Restart terminal

**Blank page/loading forever:**
- Check .env.local credentials
- Open DevTools (F12) → Console lihat errors

**No orders showing:**
- Verify Kasir app creating orders
- Check orders table exists di Supabase
- Check database permissions

**Still stuck?**
- Check README.md FAQ section
- Check DEPLOYMENT_GUIDE.md troubleshooting

---

## 📋 Checklist

- [ ] npm install selesai
- [ ] .env.local sudah terisi Supabase credentials
- [ ] Owner account sudah dibuat di Supabase Auth
- [ ] npm run dev running
- [ ] Login berhasil
- [ ] Dashboard menampilkan data

Jika semua ✅, kamu siap!

---

## 📞 Quick Reference

| Command | Purpose |
|---------|---------|
| `npm install` | Install dependencies |
| `npm run dev` | Start development server |
| `npm run build` | Build for production |

| File | Purpose |
|------|---------|
| `.env.local` | **EDIT INI!** Supabase credentials |
| `src/App.tsx` | Main app routing |
| `src/pages/` | Dashboard, Orders, Reports pages |
| `src/components/` | Reusable components |

---

## 💡 Jadi Supabase credentials itu dapat dari mana?

1. https://app.supabase.com → login
2. Select project
3. Settings → API
4. Copy:
   - Project URL → VITE_SUPABASE_URL
   - anon public key → VITE_SUPABASE_ANON_KEY

---

## 🎊 Siap?

1. ✅ `npm install`
2. ✅ Edit `.env.local`
3. ✅ `npm run dev`
4. ✅ Login & enjoy!

**Kapan ready deploy?** Baca DEPLOYMENT_GUIDE.md

---

**Happy coding! Owner bisa monitor bisnis dari iPhone sekarang! 📱✨**
