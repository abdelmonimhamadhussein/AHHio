import { createClient } from "@supabase/supabase-js";

const supabaseURL = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
if (!supabaseURL || !supabaseAnonKEY) {
   throw new Error("Missing required environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY");
}
export const supabase = createClient(supabaseURL, supabaseAnonKEY);
