import 'server-only';

import { createClient } from '@supabase/supabase-js';

import { env } from '../env';

// The service-role client must stay server-side so the private key never reaches the browser.
export const supabaseServer = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false, // A backend client should not attempt to manage user sessions.
      persistSession: false, // Keep the privileged client stateless between requests.
    },
  },
);