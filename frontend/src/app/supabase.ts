import { createClient, SupabaseClient } from '@supabase/supabase-js';

// const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
// const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const supabaseUrl = 'https://jqqqszsqntiyuxfvqtra.supabase.co';
const supabaseAnonKey = 'sb_publishable_X8Ldg0Fkyh2doMoTq0d5UQ_BEMzh-BY';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Env değişkenleri set edilmeden client'ı oluşturmaya çalışmıyoruz;
// bu, geliştirme sırasında "supabaseUrl is required" hatasını engeller.
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
