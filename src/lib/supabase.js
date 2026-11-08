import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://izfyebdwuzwpgyllaxjk.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_AwQsSlG-Q1lF2rHjYlAIJA_bPCI9rY5';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
