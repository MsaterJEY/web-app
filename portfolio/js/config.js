// ============================================
// SUPABASE CONFIG
// ============================================
const SUPABASE_URL = 'https://qanqppxfserhquennckn.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // ← ใส่ anon key จาก Supabase Dashboard

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Current user state
let currentUser = null;
let currentProfile = null;
