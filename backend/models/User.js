const supabase = require('../config/supabase');

class User {
  static async create(userData) {
    // SECURITY: Input validation and sanitization
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
        // Adjust age if birthday hasn't occurred this year
        const actualAge = age - 1;
        if (actualAge < 13) {
          throw new Error('Users must be at least 13 years old to register');
        }
      } else if (age < 13) {
        throw new Error('Users must be at least 13 years old to register');
      }
    }
    
    // Sanitize inputs - include all available fields
    const sanitizedData = {
      name: name?.trim()?.substring(0, 255),
      email: email?.trim()?.toLowerCase()?.substring(0, 255),
      password, // Will be hashed by bcrypt
      phone: phone?.trim()?.substring(0, 50),
      country: country?.trim()?.substring(0, 100),
      county: county?.trim()?.substring(0, 100),
      field_of_study: field_of_study?.trim()?.substring(0, 255),
      institution: institution?.trim()?.substring(0, 255),
      level_of_study: level_of_study?.trim()?.substring(0, 100),
      // Enhanced signup fields
      preferred_name: preferred_name?.trim()?.substring(0, 255) || null,
      date_of_birth: date_of_birth || null,
      course_of_study: course_of_study?.trim()?.substring(0, 255) || null,
      degree: degree?.trim()?.substring(0, 100) || null,
      year_of_study: year_of_study?.trim()?.substring(0, 50) || null,
      primary_field_interest: primary_field_interest?.trim()?.substring(0, 255) || null,
      signup_source: signup_source?.trim()?.substring(0, 255) || null
    };
    
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([sanitizedData])
        .select(`
          id, name, email, phone, country, county, field_of_study, institution, level_of_study,
          created_at, updated_at
        `)
        .single();
      
      if (error) {
        // Handle specific Supabase errors
        if (error.code === '23505') {
          throw new Error('User with this email already exists');
        }
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  static async findByEmail(email) {
    // SECURITY: Input validation
    if (!email || typeof email !== 'string') {
      throw new Error('Invalid email parameter');
    }
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.trim().toLowerCase())
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
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

  // Get user analytics data
  static async getAnalytics() {
    try {
      const { data, error } = await supabase
        .from('user_analytics')
        .select('*');
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error getting user analytics:', error);
      throw error;
    }
  }

  // Get signup source statistics
  static async getSignupSourceStats() {
    try {
      const { data, error } = await supabase
        .from('signup_source_stats')
        .select('*');
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error getting signup source stats:', error);
      throw error;
    }
  }

  // Get field interest statistics
  static async getFieldInterestStats() {
    try {
      const { data, error } = await supabase
        .from('field_interest_stats')
        .select('*');
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error getting field interest stats:', error);
      throw error;
    }
  }

  // Get users with enhanced details for admin
  static async getAllUsersWithDetails(limit = 50, offset = 0, filters = {}) {
    try {
      let query = supabase
        .from('users')
        .select(`
          id, name, preferred_name, email, phone, country, county,
          field_of_study, course_of_study, degree, year_of_study,
          primary_field_interest, institution, level_of_study,
          signup_source, date_of_birth, created_at, updated_at
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      // Apply filters
      if (filters.field_of_study) {
        query = query.eq('field_of_study', filters.field_of_study);
      }
      if (filters.institution) {
        query = query.ilike('institution', `%${filters.institution}%`);
      }
      if (filters.county) {
        query = query.eq('county', filters.county);
      }
      if (filters.primary_field_interest) {
        query = query.eq('primary_field_interest', filters.primary_field_interest);
      }

      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error getting users with details:', error);
      throw error;
    }
  }
}

module.exports = User;