import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://hoodpwdqqxoiqdagxtdf.supabase.co";
const supabaseKey = "sb_publishable_mwzUsLw1mhP2_7haEUyvDg_0pWnJ8fS";

export const supabase = createClient(supabaseUrl, supabaseKey);
