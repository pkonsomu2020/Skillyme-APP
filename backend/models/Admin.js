const supabase = require('../config/supabase');
const bcrypt = require('bcryptjs');

class Admin {
  static async create(adminData) {
    const { name, email, password, role = 'admin' } = adminData;
    
    // Validate required fields
    if (!name || !email || !password) {
      throw new Error('Missing required fields: name, email, password');
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Sanitize inputs
    const sanitizedData = {
      name: name?.trim()?.substring(0, 255),
      email: email?.trim()?.toLowerCase()?.substring(0, 255),
      password: hashedPassword,
      role: role?.trim()?.substring(0, 50),
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    try {
      const { data, error } = await supabase
        .from('admins')
        .insert([sanitizedData])
        .select(`
          id, name, email, role, is_active, created_at, updated_at
        `)
        .single();
      
      if (error) {
        if (error.code === '23505') {
          throw new Error('Admin with this email already exists');
        }
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error creating admin:', error);
      throw error;
    }
  }

  static async findByEmail(email) {
    if (!email || typeof email !== 'string') {
      throw new Error('Invalid email parameter');
    }
    
    try {
      const { data, error } = await supabase
        .from('admins')
        .select('*')
        .eq('email', email.trim().toLowerCase())
        .eq('is_active', true)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      return data || null;
    } catch (error) {
      console.error('Error finding admin by email:', error);
      throw error;
    }
  }

  static async findById(id) {
    try {
      const { data, error } = await supabase
        .from('admins')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      return data || null;
    } catch (error) {
      console.error('Error finding admin by ID:', error);
      throw error;
    }
  }

  static async verifyPassword(hashedPassword, plainPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static async updateLastLogin(adminId) {
    try {
      const { data, error } = await supabase
        .from('admins')
        .update({
          last_login: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', adminId)
        .select();
      
      if (error) {
        throw error;
      }
      
      return data && data.length > 0;
    } catch (error) {
      console.error('Error updating last login:', error);
      throw error;
    }
  }

  static async getAllAdmins() {
    try {
      const { data, error } = await supabase
        .from('admins')
        .select(`
          id, name, email, role, is_active, last_login, created_at, updated_at
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Error getting all admins:', error);
      throw error;
    }
  }

  static async updateStatus(adminId, isActive) {
    try {
      const { data, error } = await supabase
        .from('admins')
        .update({
          is_active: isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', adminId)
        .select();
      
      if (error) {
        throw error;
      }
      
      return data && data.length > 0;
    } catch (error) {
      console.error('Error updating admin status:', error);
      throw error;
    }
  }
}

module.exports = Admin;
