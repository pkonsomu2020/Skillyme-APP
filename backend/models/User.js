const supabase = require('../config/supabase');

class User {
  static async create(userData) {
    // SECURITY: Input validation and sanitization
    const { name, email, password, phone, country, county, field_of_study, institution, level_of_study } = userData;
    
    // Validate required fields
    if (!name || !email || !password) {
      throw new Error('Missing required fields: name, email, password');
    }
    
    // Sanitize inputs
    const sanitizedData = {
      name: name?.trim()?.substring(0, 255),
      email: email?.trim()?.toLowerCase()?.substring(0, 255),
      password, // Will be hashed by bcrypt
      phone: phone?.trim()?.substring(0, 50),
      country: country?.trim()?.substring(0, 100),
      county: county?.trim()?.substring(0, 100),
      field_of_study: field_of_study?.trim()?.substring(0, 255),
      institution: institution?.trim()?.substring(0, 255),
      level_of_study: level_of_study?.trim()?.substring(0, 100)
    };
    
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([sanitizedData])
        .select()
        .single();
      
      if (error) {
        // Handle specific Supabase errors
        if (error.code === '23505') {
          throw new Error('User with this email already exists');
        }
        throw error;
      }
      
      return { id: data.id, ...sanitizedData };
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
}

module.exports = User;