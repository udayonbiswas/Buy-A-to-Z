import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rdrdejdqgfzxupfitbio.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkcmRlamRxZ2Z6eHVwZml0YmlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2OTQwMjYsImV4cCI6MjA5NDI3MDAyNn0.aNcOt4AwU8fbo2weHMaqooHDz67TveynwBPD2LxTQXc';

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.info('Using default Supabase credentials.');
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);
