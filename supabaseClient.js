import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rkbrlriwffcsmimfiwhv.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrYnJscml3ZmZjc21pbWZpd2h2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0Njk2NjgsImV4cCI6MjA3MjA0NTY2OH0.q61nMNaEcqJth_fS-ze2112GFKkKOVb6TH8xREZkNrs'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
