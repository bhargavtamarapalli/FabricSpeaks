import { createClient } from "@supabase/supabase-js";
import { getRuntimeEnv } from "./runtime-config";

const supabaseUrl = getRuntimeEnv('SUPABASE_URL', 'VITE_SUPABASE_URL');
const supabaseAnonKey = getRuntimeEnv('SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseAnonKey) {
  // Log a warning; the app will show an error if the config is truly missing
  console.warn('Supabase environment variables not found yet. Initialization might fail if not loaded during startup.');
}

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder', {
  auth: {
    detectSessionInUrl: false
  }
});