# 🚀 Owner Dashboard - Deployment Guide

## Pilihan Deployment

### ⭐ Option 1: Vercel (RECOMMENDED)

**Kenapa:**
- ✅ Gratis
- ✅ Deploy dari GitHub langsung
- ✅ Auto-update setiap push
- ✅ Fast CDN global
- ✅ Custom domain support
- ✅ SSL gratis

**Steps:**

1. **Push ke GitHub**
```bash
git add .
git commit -m "Add owner dashboard"
git push origin main
```

2. **Go to Vercel**
   - Buka https://vercel.com
   - Sign up dengan GitHub
   - Click "New Project"
   - Import repository `owner-dashboard`

3. **Configure Environment**
   - Project Settings → Environment Variables
   - Add `VITE_SUPABASE_URL`
   - Add `VITE_SUPABASE_ANON_KEY`
   - Click Deploy

4. **Done!**
   - Vercel beri kamu URL publik
   - Setiap push ke GitHub → auto deploy
   - Owner buka di Safari

---

### Option 2: Netlify

**Steps:**

1. **Connect GitHub**
   - Buka https://netlify.com
   - Sign up dengan GitHub

2. **New Site from Git**
   - Click "New site from Git"
   - Select GitHub
   - Authorize
   - Select `owner-dashboard` repo

3. **Build Settings**
   - Build command: `npm run build`
   - Publish directory: `dist`

4. **Environment Variables**
   - Site settings → Build & deploy → Environment
   - Add variables:
     - VITE_SUPABASE_URL
     - VITE_SUPABASE_ANON_KEY

5. **Deploy**
   - Click Deploy
   - Netlify build & publish otomatis

---

### Option 3: Firebase Hosting

**Steps:**

1. **Setup Firebase Project**
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
```

2. **Choose Options**
   - Select your project
   - Public directory: `dist`
   - Configure SPA: Yes

3. **Build & Deploy**
```bash
npm run build
firebase deploy
```

4. **Environment Variables**
   - Create `.env.production.local`
   - Add Supabase credentials

---

## Post-Deployment Steps

### 1. Test Dashboard
- Buka URL publik di browser
- Login dengan owner account
- Verify semua pages working

### 2. Share dengan Owner
- Copy URL
- Kirim ke owner via WhatsApp/email
- Owner buka di Safari iPhone

### 3. Add to Home Screen (iPhone)
Owner perlu:
1. Buka URL di Safari
2. Tap share button (kotak dengan panah)
3. Tap "Add to Home Screen"
4. Tap "Add"
5. Sekarang ada icon di home screen!

### 4. Enable Auto-updates (Optional)
Di Vercel/Netlify, setiap push ke GitHub auto-deploy tanpa owner perlu tahu.

---

## Custom Domain (Optional)

### Vercel
1. Project Settings → Domains
2. Add custom domain
3. Follow DNS instructions
4. SSL auto-setup

### Netlify
1. Site settings → Domain management
2. Add custom domain
3. Update DNS records
4. SSL auto-setup

---

## Environment Variables

**Production harus punya:**
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxxxx
```

**Jangan hardcode di code!** Selalu pakai environment variables.

---

## Monitoring & Logging

### Vercel
- Dashboard → Analytics
- See: requests, CPU, memory
- Logs tab untuk debugging

### Netlify
- Analytics → see traffic
- Deploy logs untuk errors

---

## Update Dashboard

Ketika ada update:

1. **Local Development**
```bash
git checkout main
git pull origin main
npm install
npm run build
npm run dev
```

2. **Commit & Push**
```bash
git add .
git commit -m "Update dashboard features"
git push origin main
```

3. **Auto-Deploy**
   - Vercel/Netlify auto-detect
   - Auto-build & deploy
   - Owner akan lihat update

---

## Security Checklist

- [ ] .env.local tidak di-commit (check .gitignore)
- [ ] Supabase RLS enabled untuk owner-only queries
- [ ] VITE_SUPABASE_ANON_KEY adalah public key saja
- [ ] Environment secrets di Vercel/Netlify, bukan di repo
- [ ] CORS enabled di Supabase untuk domain Vercel/Netlify
- [ ] Rate limiting di Supabase untuk protection

---

## Troubleshooting Deployment

**Build Error:**
- Check Node version (16+)
- Verify all deps: `npm install`
- Check for TypeScript errors: `npm run build`

**Blank Page:**
- Check browser console (F12)
- Verify environment variables set
- Check Network tab untuk CORS errors

**Supabase Connection Error:**
- Verify URL & key in environment
- Check CORS policy di Supabase
- Verify auth tokens valid

**Still 404 on sub-routes?**
- For Vercel: auto-handles
- For Netlify: need `_redirects` file
- For Firebase: check `firebase.json` routing

---

## Vercel Setup .gitignore

Make sure .gitignore has:
```
node_modules/
dist/
.env.local
.env.*.local
.vercel
```

---

## Next: Kasir App Integration

Setelah owner dashboard live:

1. Update Kopay Kasir Flutter app
   - Connect ke same Supabase project
   - Verify orders data synced

2. Test real-time updates
   - Create order di Kasir app
   - Instantly show di Owner dashboard

3. Optimize performance
   - Add caching
   - Optimize queries
   - Monitor usage

---

## Helpful Links

- Vercel Docs: https://vercel.com/docs
- Netlify Docs: https://docs.netlify.com
- Firebase Hosting: https://firebase.google.com/docs/hosting
- Supabase: https://supabase.com/docs

---

**Ready to deploy? Let's go! 🎉**
