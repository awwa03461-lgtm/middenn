# 🎮 Flappy Miden — Real On-Chain Edition

بازی Flappy Bird با **تراکنش‌های واقعی** روی Miden testnet.

## 🎯 چه چیزی این نسخه فرق داره؟

| ویژگی | نسخه قبلی (Mock) | این نسخه (Real) |
|------|----------|------|
| Wallet | جعلی | **واقعی** (Miden Web SDK) |
| تراکنش | شبیه‌سازی | **واقعی روی testnet** |
| TX Hash | رندوم | **واقعی، قابل verify** |
| Explorer | نه | **بله، testnet.midenscan.com** |
| Export/Import | نه | **بله** ✅ |

## ⚠️ هشدار صادقانه

این پروژه از Miden Web SDK v0.14 استفاده می‌کنه که **هنوز جوانه** و در حال تکامله. ممکنه:

- SDK API در نسخه‌های بعدی تغییر کنه
- بعضی توابع (مثل ارسال Note با metadata) نیاز به تنظیم داشته باشن
- پروسه proving در مرورگر ۱۰-۳۰ ثانیه طول بکشه (طبیعیه)

اگه ارور دیدی، اول `npm install` رو دوباره بزن، بعد `npm run dev` و خطا رو بررسی کن.

## 📦 ساختار پروژه

```
flappy-miden-final/
├── src/                     # سورس کد فرانت‌اند (ES Modules)
│   ├── main.js             # کنترلر اصلی
│   ├── miden.js            # ⭐ Miden Web SDK integration
│   ├── game.js             # موتور بازی
│   └── styles.css
├── api/                     # Vercel Serverless Functions
│   ├── _lib/db.js          # Supabase client
│   ├── health.js
│   ├── leaderboard.js
│   ├── validate-score.js
│   ├── record-score.js
│   └── stats/[address].js
├── index.html              # Vite entry point
├── package.json
├── vite.config.js          # ⭐ Vite + WASM config
├── vercel.json
├── supabase-schema.sql
└── README.md
```

## 🚀 راهنمای deploy روی Vercel

### مرحله ۱: تست محلی (اول این)

```bash
cd flappy-miden-final
npm install
npm run dev
```

برو به http://localhost:5173 و ببین کار می‌کنه. در console مرورگر هیچ خطایی نباید باشه.

### مرحله ۲: ساخت دیتابیس (مثل قبل)

اگه قبلاً ساختی، رد شو. اگه نه:
1. https://supabase.com → پروژه جدید
2. SQL Editor → `supabase-schema.sql` رو run کن
3. Settings → API → Secret key رو کپی کن

### مرحله ۳: آپلود به GitHub

```bash
git init
git add .
git commit -m "Real Miden integration"
git remote add origin https://github.com/USERNAME/flappy-miden.git
git push -u origin main
```

### مرحله ۴: Import به Vercel

1. https://vercel.com → Add New Project
2. Repo رو انتخاب کن
3. تنظیمات:
   - **Framework Preset:** Vite (خودکار detect می‌شه)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

### مرحله ۵: Environment Variables

| Name | Value |
|------|-------|
| `SUPABASE_URL` | URL پروژه‌ت |
| `SUPABASE_KEY` | secret key |
| `SCORE_SECRET` | رشته تصادفی |

### مرحله ۶: Deploy

کلیک Deploy. ۲-۳ دقیقه طول می‌کشه (Vite build + SDK bundling).

## 🎮 نحوه کار سایت

```
کاربر سایت رو باز می‌کنه
    ↓
Miden Web SDK لود می‌شه (5-10 ثانیه اولین بار)
    ↓
SDK چک می‌کنه: wallet موجوده؟
    ↓ نه                          ↓ بله
ساخت wallet جدید            لود wallet قبلی
    ↓                              ↓
            وضعیت: CONNECTED ✅
    ↓
کاربر بازی می‌کنه
    ↓
Game Over → Submit
    ↓
اگه توکن نداره → صفحه faucet نشون داده می‌شه
    ↓ بعد از گرفتن توکن:
    ↓
SDK تراکنش رو می‌سازه
    ↓
ZK proof در مرورگر کاربر تولید می‌شه (10-30s)
    ↓
ارسال به Miden testnet
    ↓
TX Hash واقعی برمی‌گرده
    ↓
ذخیره در Supabase + نمایش در leaderboard
    ↓
کاربر می‌تونه روی explorer تأیید کنه
```

## 💾 Export/Import Wallet

این قابلیت برای کاربری‌ست که می‌خواد:
- روی دستگاه دیگه‌ای ادامه بده
- backup داشته باشه
- اگه کش پاک شد، بازیابی کنه

**Export:**
1. روی دکمه `EXPORT` در بالای صفحه کلیک کن
2. روی `DOWNLOAD WALLET FILE` بزن
3. فایل JSON دانلود می‌شه

**Import:**
1. روی دکمه `IMPORT` کلیک کن
2. فایل JSON قبلی رو انتخاب کن
3. روی `IMPORT` بزن

⚠️ Import کردن **wallet فعلی رو جایگزین می‌کنه**.

## 🪙 فلو دریافت توکن از faucet

کاربر اولین بار نیاز به توکن testnet داره:

```
کاربر «Submit to Chain» می‌زنه
    ↓
ارسال تراکنش fail می‌شه (NO_TOKENS)
    ↓
صفحه «Need Tokens» نشون داده می‌شه
    ↓
کاربر آدرس wallet رو copy می‌کنه
    ↓
میره به faucet.testnet.miden.io
    ↓
آدرس رو paste و توکن می‌گیره
    ↓
برمی‌گرده، «I've Got Tokens — Check» می‌زنه
    ↓
سایت sync می‌کنه، توکن رو می‌بینه
    ↓
خودکار submit رو دوباره می‌زنه
    ↓
✅ تراکنش موفق
```

## 🐛 عیب‌یابی

### "Failed to initialize Miden"
- Vite در حال build هست، صبر کن
- در console مرورگر خطای دقیق رو ببین
- شاید مرورگرت WASM یا Web Worker ساپورت نمی‌کنه

### "Transaction failed"
- shaye توکن نداری → برو faucet
- شاید شبکه قطعه → یک‌بار دیگه امتحان کن
- شاید SDK API تغییر کرده → خطا رو بررسی کن

### "Module not found: @miden-sdk/miden-sdk"
- `npm install` رو دوباره بزن
- اگه نشد، `rm -rf node_modules && npm install`

### Vercel build fail می‌شه
- مطمئن شو Node 18+ استفاده می‌کنه (در Settings → General)
- مطمئن شو Framework Preset روی Vite تنظیم شده

## 📊 محدودیت‌های فعلی

این رو صادقانه می‌گم:

1. **ZK Proof generation کنده:** هر تراکنش ۱۰-۳۰ ثانیه (طبیعیه برای Miden)
2. **اولین بار loading ۵-۱۰ ثانیه:** WASM لود می‌شه
3. **حجم bundle:** ~۲-۳ مگابایت (Miden SDK سنگینه)
4. **Note metadata syntax:** ممکنه نیاز به تنظیم داشته باشه با نسخه‌های جدید SDK

## 📚 منابع

- [Miden Web SDK Docs](https://docs.miden.xyz/builder/tools/clients/web-client/)
- [Miden Accounts API](https://docs.miden.xyz/builder/tools/clients/web-client/accounts)
- [Miden Transactions API](https://docs.miden.xyz/builder/tools/clients/web-client/transactions)
- [Testnet Explorer](https://testnet.midenscan.com)
- [Testnet Faucet](https://faucet.testnet.miden.io)

## ⚖️ License

MIT
