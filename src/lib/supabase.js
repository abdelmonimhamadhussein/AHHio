import { createClient } from "@supabase/supabase-js";

const supabaseURL = import.meta.env.VITE_URL;
const supabaseKEY = import.meta.env.VITE_KEY;

export const supabase = createClient(supabaseURL, supabaseKEY);
