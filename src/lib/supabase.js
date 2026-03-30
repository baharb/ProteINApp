import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── PASTE YOUR SUPABASE CREDENTIALS HERE ──────────────────────────────────
// Get them free at: https://supabase.com → New Project → Settings → API
const SUPABASE_URL  = 'https://epftxauxegbqdunctqqp.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwZnR4YXV4ZWdicWR1bmN0cXFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5MDA1ODYsImV4cCI6MjA5MDQ3NjU4Nn0.pWc06DdU-VK8f6X0pkVuYVXpVIkvRuFkJ22JBPkPNPY';
// ────────────────────────────────────────────────────────────────────────────

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
