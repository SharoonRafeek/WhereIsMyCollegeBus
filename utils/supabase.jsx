import { createClient } from "@supabase/supabase-js";
import AsyncStorage from '@react-native-async-storage/async-storage';

// Replace with your Supabase project credentials
const SUPABASE_URL = "https://zydwgsppgdrysdyyzcif.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5ZHdnc3BwZ2RyeXNkeXl6Y2lmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE2NzcwNjgsImV4cCI6MjA1NzI1MzA2OH0.G7t5pwy1FkUr00v0AQMen-qBzZivm7gvHB4wN6PYqkg";

// Configure Supabase with AsyncStorage for better mobile support
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    headers: { 
      'Content-Type': 'application/json',
      'Accept': 'application/json' 
    },
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Helper to check if Supabase connection is working
export const checkSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('fee_payments').select('count', { count: 'exact', head: true });
    if (error) throw error;
    return { connected: true };
  } catch (error) {
    console.error('Supabase connection error:', error);
    return { 
      connected: false, 
      error: error.message || 'Could not connect to database'
    };
  }
};
