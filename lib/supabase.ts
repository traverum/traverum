/**
 * Supabase Client Configuration
 * 
 * This file provides utilities for connecting to Supabase
 * in different contexts (client-side, server-side, Edge Functions)
 */

// Example client-side Supabase client
// Uncomment and use when you have a frontend application

/*
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// For server-side operations with elevated permissions
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)
*/

// For Edge Functions, use:
// import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
// 
// Deno.serve(async (req) => {
//   const supabaseClient = createClient(
//     Deno.env.get('SUPABASE_URL') ?? '',
//     Deno.env.get('SUPABASE_ANON_KEY') ?? '',
//     {
//       global: {
//         headers: { Authorization: req.headers.get('Authorization')! },
//       },
//     }
//   )
//   // ... your function logic
// })
