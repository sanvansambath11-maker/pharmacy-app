import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tqxdeapeqqzibalkfmku.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxeGRlYXBlcXF6aWJhbGtmbWt1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTgyNTIsImV4cCI6MjA4ODg5NDI1Mn0.9CSq2H99pbCkAk4JqQBYtOnY0gvUYG1JN_kwDVkv9q0';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDb() {
  const { data: oData, error: oError } = await supabase.from('orders').select('*').limit(1);
  console.log("Orders error:", oError?.message);
  
  const { data: pData, error: pError } = await supabase.from('products').select('*').limit(1);
  console.log("Products count:", pData?.length);
  console.log("Products error:", pError?.message);
}

checkDb();
