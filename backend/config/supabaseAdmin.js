const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// SECURITY: Validate Supabase configuration for admin operations
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 [SUPABASE ADMIN DEBUG] Initializing admin Supabase client...');
console.log('🔍 [SUPABASE ADMIN DEBUG] URL:', supabaseUrl ? 'Present' : 'Missing');
console.log('🔍 [SUPABASE ADMIN DEBUG] Service Key:', supabaseServiceKey ? 'Present' : 'Missing');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ CRITICAL: Supabase admin configuration missing. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file');
  console.error('❌ Current URL:', supabaseUrl);
  console.error('❌ Current Service Key:', supabaseServiceKey ? 'Present but hidden' : 'Missing');
  process.exit(1);
}

// SECURITY: Validate URL format
if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
  console.error('❌ CRITICAL: Invalid Supabase URL format');
  process.exit(1);
}

// SECURITY: Validate service key format (should be a JWT-like string)
if (!supabaseServiceKey || supabaseServiceKey.length < 100) {
  console.error('❌ CRITICAL: Invalid Supabase service key format');
  process.exit(1);
}

let supabaseAdmin;

try {
  // Create admin client with service role key (bypasses RLS)
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  console.log('✅ [SUPABASE ADMIN DEBUG] Admin Supabase client created successfully');
} catch (error) {
  console.error('❌ [SUPABASE ADMIN DEBUG] Failed to create admin Supabase client:', error);
  process.exit(1);
}

// Test admin connection (only when explicitly called)
async function testAdminConnection() {
  try {
    console.log('🔍 [SUPABASE ADMIN DEBUG] Testing admin connection...');
    const { data, error } = await supabaseAdmin.from('users').select('count').limit(1);
    if (error) {
      console.error('❌ Supabase admin connection failed:', error.message);
    } else {
      console.log('✅ Supabase admin connected successfully');
    }
  } catch (error) {
    console.error('❌ Supabase admin connection failed:', error.message);
  }
}

// Verify the client is properly exported
if (!supabaseAdmin) {
  console.error('❌ [SUPABASE ADMIN DEBUG] Admin Supabase client is undefined after creation!');
  process.exit(1);
}

console.log('✅ [SUPABASE ADMIN DEBUG] Admin Supabase module ready for export');

module.exports = supabaseAdmin;