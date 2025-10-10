const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// SECURITY: Validate Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ CRITICAL: Supabase configuration missing. Please set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file');
  process.exit(1);
}

// SECURITY: Validate URL format
if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
  console.error('❌ CRITICAL: Invalid Supabase URL format');
  process.exit(1);
}

// SECURITY: Validate key format (should be a JWT-like string)
if (!supabaseKey || supabaseKey.length < 100) {
  console.error('❌ CRITICAL: Invalid Supabase key format');
  process.exit(1);
}

// Create Supabase client with service role for admin operations
const supabase = createClient(supabaseUrl, supabaseKey);

// Create service role client for bypassing RLS when needed
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY 
  ? createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : supabase;

// Test Supabase connection (only when explicitly called)
async function testConnection() {
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error) {
      console.error('❌ Supabase connection failed:', error.message);
    } else {
      console.log('✅ Supabase connected successfully');
    }
  } catch (error) {
    console.error('❌ Supabase connection failed:', error.message);
  }
}

// Only test connection in production or when explicitly requested
if (process.env.NODE_ENV === 'production') {
  testConnection();
}

module.exports = supabase;
module.exports.supabaseServiceRole = supabaseServiceRole;