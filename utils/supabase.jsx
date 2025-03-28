import { createClient } from "@supabase/supabase-js";

// Replace with your Supabase project credentials
const SUPABASE_URL = "https://zydwgsppgdrysdyyzcif.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5ZHdnc3BwZ2RyeXNkeXl6Y2lmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE2NzcwNjgsImV4cCI6MjA1NzI1MzA2OH0.G7t5pwy1FkUr00v0AQMen-qBzZivm7gvHB4wN6PYqkg";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
