# ProteIN AI — Full Setup Guide

## 1. Supabase (Database + Auth) — FREE

1. Go to https://supabase.com → New Project
2. Settings → API → copy URL and anon key
3. Paste into: src/lib/supabase.js

Run this SQL in Supabase SQL Editor:

```sql
-- Profiles table
create table profiles (
  id uuid references auth.users primary key,
  age int,
  weight_kg float,
  height_cm float,
  gender text,
  activity text,
  goals text[],
  goal_calories int,
  goal_protein int,
  goal_carbs int,
  goal_fat int,
  weight_unit text default 'kg',
  height_unit text default 'cm',
  updated_at timestamptz default now()
);

-- Meals table
create table meals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  date date not null,
  slot int default 0,
  calories int default 0,
  protein int default 0,
  carbs int default 0,
  fat int default 0,
  created_at timestamptz default now()
);

-- Weight log table
create table weight_log (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  weight_kg float not null,
  logged_at timestamptz default now()
);

-- Row Level Security (users only see their own data)
alter table profiles  enable row level security;
alter table meals     enable row level security;
alter table weight_log enable row level security;

create policy "own profile"   on profiles   for all using (auth.uid() = id);
create policy "own meals"     on meals      for all using (auth.uid() = user_id);
create policy "own weight"    on weight_log for all using (auth.uid() = user_id);
```

## 2. Groq API Key (AI Coach) — FREE

1. https://console.groq.com → sign up → Create API Key
2. Paste into ProteINServer/.env

## 3. Run the server locally

```bash
cd ProteINServer
npm install
npm run dev
```

Find your computer's local IP:
- Mac: System Preferences → Network
- Windows: ipconfig in terminal

In CoachScreen.js set:
const SERVER_URL = 'http://YOUR_IP:3000';

## 4. Run the app

```bash
cd ProteINApp
npm install
npx expo start
```

Scan QR with Expo Go on your phone.

## 5. Deploy server (Render — free)

Push ProteINServer/ to GitHub → render.com → New Web Service
Add GROQ_API_KEY env var → Deploy
Update SERVER_URL in CoachScreen.js with your Render URL.
