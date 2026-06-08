import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://hayodojtfomtzkzathhq.supabase.co";
const SUPABASE_KEY = "sb_publishable_hlx7lzu1atADZ93NoY7Cxg_AXrr9E6s";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
  }
});