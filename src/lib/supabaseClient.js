import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase environment variables are missing.');
}

export const supabase = createClient(supabaseUrl || 'https://izfyebdwuzwpgyllaxjk.supabase.co', supabaseKey || 'sb_publishable_AwQsSlG-Q1lF2rHjYlAIJA_bPCI9rY5');
