const supabase = require('../config/supabase');

class Session {
  static async findById(id) {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      return data || null;
    } catch (error) {
      console.error('Error finding session by ID:', error);
      throw error;
    }
  }

  static async getAllSessions() {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          id, title, description, date, time, google_meet_link,
          recruiter, company, price, is_active, paybill_number, business_number,
          created_at, updated_at
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Error fetching sessions:', error);
      throw error;
    }
  }

  static async create(sessionData) {
    const { 
      title, description, date, time, google_meet_link, 
      recruiter, company, paybill_number, business_number, price 
    } = sessionData;
    
    try {
      const { data, error } = await supabase
        .from('sessions')
        .insert([{
          title,
          description,
          date,
          time,
          google_meet_link,
          recruiter,
          company,
          paybill_number,
          business_number,
          price
        }])
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return { id: data.id, ...sessionData };
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  static async update(id, updateData) {
    try {
      const { data, error } = await supabase
        .from('sessions')
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
      console.error('Error updating session:', error);
      throw error;
    }
  }
}

module.exports = Session;
