import { createClient } from "@supabase/supabase-js";

//export const supabase = createClient(
//  import.meta.env.VITE_SUPABASE_URL!,
//  import.meta.env.VITE_SUPABASE_ANON_KEY!,
//);

export const supabase = createClient(
  "https://ecnasowhigllrhkbvphr.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjbmFzb3doaWdsbHJoa2J2cGhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyMTQ0OTUsImV4cCI6MjA4NDc5MDQ5NX0.AjLK8AH4XI7AtyDkYI_EKhJvsNFkEdu_TnD3uE-9U8Q",
);

//const SUPABASE_URL = https://ecnasowhigllrhkbvphr.supabase.co
//VITE_SUPABASE_ANON_KEY=sb_publishable_y0dqiMyFn7If7FsEewM_lA_qbnga24i
