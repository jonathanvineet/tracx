import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://iobhdcqrpnizrwvfgtqt.supabase.co";
const SUPABASE_ANON_KEY ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvYmhkY3FycG5penJ3dmZndHF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk3MDk2NzgsImV4cCI6MjA1NTI4NTY3OH0.V0Si0jS6V1MirBlQB2oMUBlS8tH9VrbvNslVFxmkMKo"
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
