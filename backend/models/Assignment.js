const supabase = require('../config/supabase');

class Assignment {
  static async create(assignmentData) {
    const {
      title,
      description,
      instructions,
      session_id,
      difficulty_level = 'easy',
      points_reward,
      submission_type = 'text',
      due_date,
      created_by
    } = assignmentData;

    // Calculate points based on difficulty if not provided
    const defaultPoints = {
      easy: 10,
      medium: 25,
      hard: 50
    };

    const finalPointsReward = points_reward || defaultPoints[difficulty_level] || 10;

    const { data, error } = await supabase
      .from('assignments')
      .insert([{
        title: title?.trim(),
        description: description?.trim(),
        instructions: instructions?.trim(),
        session_id,
        difficulty_level,
        points_reward: finalPointsReward,
        submission_type,
        due_date,
        created_by,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async findById(id) {
    const { data, error } = await supabase
      .from('assignments')
      .select(`
        *,
        sessions(title, company, recruiter),
        admins(name)
      `)
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async findBySessionId(sessionId) {
    const { data, error } = await supabase
      .from('assignments')
      .select(`
        *,
        sessions(title, company, recruiter)
      `)
      .eq('session_id', sessionId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getAll(filters = {}) {
    let query = supabase
      .from('assignments')
      .select(`
        *,
        sessions(title, company, recruiter, date),
        admins(name),
        assignment_submissions(count)
      `);

    if (filters.session_id) {
      query = query.eq('session_id', filters.session_id);
    }

    if (filters.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }

    if (filters.difficulty_level) {
      query = query.eq('difficulty_level', filters.difficulty_level);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  static async update(id, updateData) {
    const { data, error } = await supabase
      .from('assignments')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async delete(id) {
    const { error } = await supabase
      .from('assignments')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }

  static async getAssignmentsForUser(userId) {
    const { data, error } = await supabase
      .from('assignments')
      .select(`
        *,
        sessions(title, company, recruiter, date),
        assignment_submissions!left(
          id, status, points_earned, submitted_at, admin_feedback
        )
      `)
      .eq('is_active', true)
      .eq('assignment_submissions.user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}

module.exports = Assignment;