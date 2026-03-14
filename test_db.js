import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tqxdeapeqqzibalkfmku.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxeGRlYXBlcXF6aWJhbGtmbWt1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTgyNTIsImV4cCI6MjA4ODg5NDI1Mn0.9CSq2H99pbCkAk4JqQBYtOnY0gvUYG1JN_kwDVkv9q0';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDb() {
  const { data, error } = await supabase.from('orders').select('*');
  console.log("Orders count:", data?.length);
  console.log("Orders error:", error?.message);
  
  if (data && data.length > 0) {
    console.log("Keys of first order:", Object.keys(data[0]));
  }
}

checkDb();
