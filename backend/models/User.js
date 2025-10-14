const supabase = require('../config/supabase');

class User {
  static async create(userData) {
    console.log('🔍 [USER CREATE] Starting user creation with data:', {
      ...userData,
      password: userData.password ? '[REDACTED]' : 'MISSING'
    });

    // Extract and validate required fields
    const {
      name, email, password, phone, country, county, field_of_study, institution, level_of_study,
      preferred_name, date_of_birth, course_of_study, degree, year_of_study,
      primary_field_interest, signup_source
    } = userData;

    // Validate required fields
    if (!name || !email || !password) {
      throw new Error('Missing required fields: name, email, password');
    }

    // Validate date of birth if provided
    if (date_of_birth) {
      const birthDate = new Date(date_of_birth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        const actualAge = age - 1;
        if (actualAge < 13) {
          throw new Error('Users must be at least 13 years old to register');
        }
      } else if (age < 13) {
        throw new Error('Users must be at least 13 years old to register');
      }
    }

    // Prepare data exactly matching CSV columns (excluding id, created_at, updated_at)
    const sanitizedData = {
      name: name?.trim()?.substring(0, 255) || null,
      email: email?.trim()?.toLowerCase()?.substring(0, 255) || null,
      phone: phone?.trim()?.substring(0, 50) || null,
      country: country?.trim()?.substring(0, 100) || null,
      county: county?.trim()?.substring(0, 100) || null,
      field_of_study: field_of_study?.trim()?.substring(0, 255) || null,
      institution: institution?.trim()?.substring(0, 255) || null,
      level_of_study: level_of_study?.trim()?.substring(0, 100) || null,
      preferred_name: preferred_name?.trim()?.substring(0, 100) || null,
      date_of_birth: date_of_birth || null,
      course_of_study: course_of_study?.trim()?.substring(0, 255) || null,
      degree: degree?.trim()?.substring(0, 100) || null,
      year_of_study: year_of_study?.trim()?.substring(0, 50) || null,
      primary_field_interest: primary_field_interest?.trim()?.substring(0, 255) || null,
      signup_source: signup_source?.trim()?.substring(0, 100) || null,
      password: password // Will be hashed by bcrypt
    };

    console.log('🔍 [USER CREATE] Sanitized data:', {
      ...sanitizedData,
      password: sanitizedData.password ? '[REDACTED]' : 'MISSING'
    });

    try {
      const { data, error } = await supabase
        .from('users')
        .insert([sanitizedData])
        .select(`
          id, name, email, phone, country, county, field_of_study, institution, level_of_study,
          preferred_name, date_of_birth, course_of_study, degree, year_of_study,
          primary_field_interest, signup_source, created_at, updated_at
        `)
        .single();

      if (error) {
        console.error('❌ [USER CREATE] Supabase error:', error);
        if (error.code === '23505') {
          throw new Error('User with this email already exists');
        }
        throw new Error(`Database error: ${error.message}`);
      }

      console.log('✅ [USER CREATE] User created successfully with ID:', data.id);
      return data;
    } catch (error) {
      console.error('❌ [USER CREATE] Error:', error);
      throw error;
    }
  }

  static async findByEmail(email) {
    if (!email || typeof email !== 'string') {
      throw new Error('Invalid email parameter');
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.trim().toLowerCase())
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data || null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  }

  static async findById(id) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data || null;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw error;
    }
  }

  static async update(id, updateData) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select();

      if (error) {
        throw error;
      }

      return data && data.length > 0;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  static async verifyPassword(hashedPassword, plainPassword) {
    const bcrypt = require('bcryptjs');
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static async updatePassword(userId, hashedPassword) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          password: hashedPassword,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select();

      if (error) {
        throw error;
      }

      return data && data.length > 0;
    } catch (error) {
      console.error('Error updating password:', error);
      throw error;
    }
  }
}

module.exports = User;