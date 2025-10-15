// src/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

// Pega a URL e a Chave 'anon' das variáveis de ambiente
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

// Cria e exporta o cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);