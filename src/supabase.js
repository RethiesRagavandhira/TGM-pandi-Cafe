import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const normalizeSupabaseValue = (value) => {
  if (!value) return value;

  const trimmed = String(value).trim();
  const withoutPrefix = trimmed.replace(/^(VITE_SUPABASE_(?:ANON|PUBLISHABLE)_KEY)\s*=\s*/, '');

  if ((withoutPrefix.startsWith('"') && withoutPrefix.endsWith('"')) || (withoutPrefix.startsWith("'") && withoutPrefix.endsWith("'"))) {
    return withoutPrefix.slice(1, -1).trim();
  }

  return withoutPrefix;
};

const supabaseAnonKey = normalizeSupabaseValue(
  import.meta.env.VITE_SUPABASE_ANON_KEY ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key is missing in .env file');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
