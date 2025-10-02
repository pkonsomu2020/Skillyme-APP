const supabase = require('../config/supabase');

class User {
  static async create(userData) {
    const { name, email, password, phone, country, county, field_of_study, institution, level_of_study } = userData;
    
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([{
          name,
          email,
          password,
          phone,
          country,
          county,
          field_of_study,
          institution,
          level_of_study
        }])
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return { id: data.id, ...userData };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  static async findByEmail(email) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
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