import { createClient } from '@supabase/supabase-js';

// This initializes the connection using the keys you added to .env.local
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
