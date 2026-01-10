const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// SECURITY: Validate Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

console.log('🔍 [SUPABASE DEBUG] Initializing Supabase client...');
console.log('🔍 [SUPABASE DEBUG] URL:', supabaseUrl ? 'Present' : 'Missing');
console.log('🔍 [SUPABASE DEBUG] Key:', supabaseKey ? 'Present' : 'Missing');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ CRITICAL: Supabase configuration missing. Please set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file');
  console.error('❌ Current URL:', supabaseUrl);
  console.error('❌ Current Key:', supabaseKey ? 'Present but hidden' : 'Missing');
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

let supabase;

try {
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log('✅ [SUPABASE DEBUG] Supabase client created successfully');
} catch (error) {
  console.error('❌ [SUPABASE DEBUG] Failed to create Supabase client:', error);
  process.exit(1);
}

// Test Supabase connection (only when explicitly called)
async function testConnection() {
  try {
    console.log('🔍 [SUPABASE DEBUG] Testing connection...');
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

// Verify the client is properly exported
if (!supabase) {
  console.error('❌ [SUPABASE DEBUG] Supabase client is undefined after creation!');
  process.exit(1);
}

console.log('✅ [SUPABASE DEBUG] Supabase module ready for export');

module.exports = supabase;