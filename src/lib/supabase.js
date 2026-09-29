import { createClient } from "@supabase/supabase-js";

const supabaseURL = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
   if(!supabaseURL || !supabaseAnonKEY){
    console.log("❌ supabase env missing!",{supabaseURL,supabaseAnonKEY});
   }
export const supabase = createClient(supabaseURL, supabaseAnonKEY);
