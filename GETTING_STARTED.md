# 🚀 Kopay Owner Dashboard - Getting Started

Selamat! Kamu sudah punya owner dashboard yang lengkap. Ini adalah panduan cepat.

## 📁 Struktur Folder

```
owner-dashboard/
├── src/
│   ├── components/      # Reusable components
│   ├── pages/          # Dashboard, Orders, Reports pages
│   ├── lib/            # Supabase & utilities
│   ├── types/          # TypeScript definitions
│   ├── App.tsx         # Main app
│   ├── main.tsx        # Entry point
│   └── index.css       # Tailwind CSS
├── public/             # Static files
├── package.json        # Dependencies
├── tsconfig.json       # TypeScript config
├── vite.config.ts      # Vite config
├── tailwind.config.js  # Tailwind config
├── .env.local          # Environment variables (EDIT THIS!)
└── README.md           # Full documentation
```

## ✅ Quick Setup (5 minutes)

### 1️⃣ Install Dependencies
```bash
cd d:\Kopay\owner-dashboard
npm install
```

### 2️⃣ Setup .env.local
Edit `d:\Kopay\owner-dashboard\.env.local`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Cari di Supabase:**
- Login: https://app.supabase.com
- Select project
- Settings → API
- Copy Project URL dan anon key

### 3️⃣ Create Owner User
Di Supabase Dashboard:
- Authentication → Users → Add user
- Email: owner@example.com
- Password: (buat yang aman)
- Save

### 4️⃣ Run Development Server
```bash
npm run dev
```
Akan buka browser di `http://localhost:5173`

### 5️⃣ Login
Gunakan:
- Email: owner@example.com
- Password: (password yang dibuat)

## 📊 Pages yang Sudah Ada

### Dashboard
- Real-time sales metrics
- Today's revenue & orders
- Recent orders list
- Live data updates

### Orders
- Filter by date (today, week, month)
- Search orders
- Payment status
- Revenue summary

### Reports
- 7-day & 30-day analytics
- Daily breakdown
- Export to CSV
- Trend analysis

## 🌐 Deploy to Production

### Opsi 1: Vercel (Paling mudah)

```bash
npm install -g vercel
vercel
```

Ikuti prompt, pilih "Deploy as is", dan selesai!

### Opsi 2: Netlify

1. Push code ke GitHub
2. Connect repo ke Netlify
3. Build command: `npm run build`
4. Publish directory: `dist`

### Opsi 3: Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase deploy
```

## 📱 Akses dari iPhone Safari

1. Deploy ke Vercel/Netlify (dapat URL publik)
2. Bagikan URL ke owner
3. Owner buka di Safari
4. Add to home screen (dapat icon di home screen)
5. Buka seperti native app!

## 🔑 Key Features

✅ Real-time dashboard
✅ Order tracking
✅ Sales reports
✅ Revenue analytics
✅ Export data
✅ Responsive design
✅ Supabase integration
✅ Clean UI

## 📝 Environment Variables

Hanya perlu 2 variabel:
- `VITE_SUPABASE_URL` - URL project Supabase
- `VITE_SUPABASE_ANON_KEY` - Anon key untuk public queries

## 🔒 Security Notes

- Jangan share .env.local file
- Gunakan Row Level Security (RLS) di Supabase untuk owner-only data
- Set proper permissions di Supabase

## 🐛 Troubleshooting

**npm install error:**
- Install Node.js dari nodejs.org
- Restart terminal/VS Code

**Blank page atau error:**
- Check .env.local values
- Open DevTools (F12) lihat console errors
- Verify Supabase project exists

**No data showing:**
- Verify kasir app creating orders
- Check orders table exists di Supabase
- Verify JWT token permissions

## 📚 File Penting

| File | Purpose |
|------|---------|
| `.env.local` | **EDIT INI!** Supabase credentials |
| `package.json` | Dependencies & scripts |
| `src/App.tsx` | Main app routing |
| `src/lib/supabase.ts` | Supabase client |
| `src/types/index.ts` | TypeScript types |

## 🚀 Next Steps

1. ✅ Install dependencies
2. ✅ Setup .env.local
3. ✅ Create owner user
4. ✅ Run dev server
5. ✅ Test locally
6. ✅ Deploy to Vercel/Netlify
7. ✅ Share URL dengan owner

## 💡 Pro Tips

- **Development:** Run `npm run dev` saat development
- **Build:** Run `npm run build` sebelum push/deploy
- **Styling:** Edit `tailwind.config.js` untuk custom colors
- **Icons:** Dari Lucide React, check lucide.dev
- **Types:** Add types di `src/types/index.ts`

## 📞 Need Help?

- Check `README.md` untuk dokumentasi lengkap
- Check `SETUP.md` untuk step-by-step guide
- Check console errors (F12 → Console tab)

---

**Happy coding! 🎉**

Owner bisa monitor bisnis dari iPhone sekarang! 📱✨
