# ProteIN AI v2 — Setup Guide

## File Structure
```
ProteINApp/          ← React Native app (Expo)
  App.js
  index.js
  babel.config.js
  app.json
  package.json
  src/
    screens/
      AuthScreen.js
      OnboardingScreen.js
      HomeScreen.js
      ScanScreen.js
      ProgressScreen.js
      ProfileScreen.js
    hooks/
      useApp.js
      useLang.js
      useVoice.js
      useStreak.js
      usePremium.js
    components/
      UI.js
    data/
      theme.js
      i18n.js
      nutritionDB.js
    lib/
      supabase.js      ← ADD YOUR KEYS
      config.js        ← ADD YOUR IP
      notifications.js

ProteINServer/        ← Node.js backend
  server.js
  package.json        ← (use server_package.json)
  .env                ← CREATE THIS (see server_env_example)
```

## Step 1 — Supabase Setup
1. Create project at supabase.com
2. SQL Editor → paste supabase_schema.sql → Run
3. Copy your Project URL and anon key
4. Paste into src/lib/supabase.js

## Step 2 — Server Setup
```bash
cd ProteINServer
cp server_package.json package.json
npm install
# Create .env from server_env_example:
echo "GROQ_API_KEY=your_key_here" > .env
echo "PORT=3000" >> .env
node server.js
# → ProteIN AI Server v2.0 on port 3000
```
Get free Groq key: console.groq.com

## Step 3 — App Setup
1. Edit src/lib/config.js → set SERVER_URL to your local IP
   - Windows: run `ipconfig` → IPv4 Address
   - Mac/Linux: run `ifconfig` → inet
   - Example: 'http://192.168.1.42:3000'

2. Install and run:
```bash
cd ProteINApp
npm install
npx expo start --clear
# Scan QR with Expo Go app
```

## Step 4 — Supabase Storage (for profile photos)
1. Supabase Dashboard → Storage → New Bucket
2. Name: avatars, Public: OFF
3. The SQL schema already adds the storage policies

## Key Features in v2
- 🎯 Action-first home: see remaining protein + suggestions instantly
- 📷 Scan → Fix This Meal flow (4 steps)
- 🔥 Streak system (tracked in AsyncStorage)
- 👑 Premium paywall UI (triggered by Fix This Meal)
- 🌐 6 languages: EN, FA, ES, AR, JA, ZH (RTL for FA/AR)
- 🔑 Remember me (saves credentials in AsyncStorage)
- 📋 My Plan (nutrition + exercise) in Profile
- 💡 Smart suggestions engine (protein/effort scoring)
- 🔔 Smart contextual notifications

## Switching to GPT-4o (better scan accuracy)
When you get an OpenAI API key, in server.js replace:
```js
// Old (Groq vision):
model: 'meta-llama/llama-4-scout-17b-16e-instruct',
// New (GPT-4o mini):
model: 'gpt-4o-mini',
```
And change the API call to use OpenAI SDK. Cost: ~$0.001/scan.
