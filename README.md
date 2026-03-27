# ProteIN AI — React Native Expo App

A protein-first AI nutrition tracking app built with React Native + Expo.

---

## 📱 Quick Start (3 steps)

### 1. Install dependencies
```bash
cd ProteINApp
npm install
```

### 2. Start the app
```bash
npx expo start
```

### 3. Run on your phone
- Download **Expo Go** from the App Store (iOS) or Google Play (Android)
- Scan the QR code shown in the terminal
- The app opens instantly on your phone!

> **If you see a cache error**, run: `npx expo start --clear`

---

## 🖥️ Run on simulator (optional)

### iOS Simulator (Mac only)
```bash
npx expo start --ios
```
Requires Xcode installed.

### Android Emulator
```bash
npx expo start --android
```
Requires Android Studio installed.

---

## 📁 Project Structure

```
ProteINApp/
├── App.js                    # Root navigation + providers
├── src/
│   ├── screens/
│   │   ├── OnboardingScreen.js   # 4-step profile setup
│   │   ├── DashboardScreen.js    # Home with macros & meals
│   │   ├── ScanScreen.js         # AI meal scan + lazy logging
│   │   ├── AddFoodScreen.js      # Food search + meal builder + grocery
│   │   ├── ProgressScreen.js     # Charts + weight log + badges
│   │   ├── ProfileScreen.js      # Goals + settings
│   │   └── CoachScreen.js        # AI chat coach
│   ├── components/
│   │   └── UI.js                 # Reusable components
│   ├── hooks/
│   │   └── useApp.js             # Global state (Context API)
│   └── data/
│       └── constants.js          # Food DB, colors, tips
├── package.json
└── app.json
```

## ✨ Features Included

- ✅ 4-step onboarding with BMR calculation (Mifflin-St Jeor)
- ✅ Daily dashboard with health score, macro bars, meal slots
- ✅ AI meal scanner (simulated with realistic results)
- ✅ Lazy logging — type "chicken sandwich" → instant estimate
- ✅ Quick protein fix buttons
- ✅ Food search database (20 items)
- ✅ Quick add manual entry
- ✅ AI meal builder based on protein gap
- ✅ Smart grocery list with checkboxes
- ✅ Weekly progress charts
- ✅ Weight log with trend tracking
- ✅ Streaks & achievement badges
- ✅ AI health coach chat
- ✅ Profile screen with daily goals
- ✅ Premium upgrade banner
- ✅ Demo mode (skip onboarding)

## 🎨 Design

- Dark theme with green accent (#7effa0)
- Protein-first UI philosophy
- Mobile-optimized for iOS and Android
