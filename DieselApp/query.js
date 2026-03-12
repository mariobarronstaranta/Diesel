import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config({ path: './.env' }); // Adjust if needed

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

async function run() {
  const t1 = await supabase.from('TanqueMovimiento').select('*').limit(1)
  console.log('TanqueMovimiento:', Object.keys(t1.data[0]))
  
  const t2 = await supabase.from('InformacionGeneral_Cierres').select('*').limit(1)
  console.log('InformacionGeneral_Cierres:', Object.keys(t2.data[0]))
}
run()
