import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  "https://ecnasowhigllrhkbvphr.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjbmFzb3doaWdsbHJoa2J2cGhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyMTQ0OTUsImV4cCI6MjA4NDc5MDQ5NX0.AjLK8AH4XI7AtyDkYI_EKhJvsNFkEdu_TnD3uE-9U8Q",
);
