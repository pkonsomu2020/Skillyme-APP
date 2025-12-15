const supabase = require('../config/supabase');

class AssignmentSubmission {
  static async create(submissionData) {
    const {
      assignment_id,
      user_id,
      submission_text,
      submission_links = [],
      submission_files = []
    } = submissionData;

    const { data, error } = await supabase
      .from('assignment_submissions')
      .insert([{
        assignment_id,
        user_id,
        submission_text: submission_text?.trim(),
        submission_links,
        submission_files,
        status: 'pending',
        points_earned: 0,
        submitted_at: new Date().toISOString()
      }])
      .select(`
        *,
        assignments(title, points_reward, difficulty_level),
        users(name, email)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  static async findById(id) {
    const { data, error } = await supabase
      .from('assignment_submissions')
      .select(`
        *,
        assignments(title, description, instructions, points_reward, difficulty_level, due_date),
        users(name, email, phone)
      `)
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async findByUserAndAssignment(userId, assignmentId) {
    const { data, error } = await supabase
      .from('assignment_submissions')
      .select(`
        *,
        assignments(title, points_reward, difficulty_level)
      `)
      .eq('user_id', userId)
      .eq('assignment_id', assignmentId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async getByAssignmentId(assignmentId, filters = {}) {
    let query = supabase
      .from('assignment_submissions')
      .select(`
        *,
        users(name, email, phone),
        assignments(title, points_reward)
      `)
      .eq('assignment_id', assignmentId);

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    query = query.order('submitted_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  static async getAllPending() {
    const { data, error } = await supabase
      .from('assignment_submissions')
      .select(`
        *,
        assignments(title, points_reward, difficulty_level, session_id),
        users(name, email)
      `)
      .eq('status', 'pending')
      .order('submitted_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async review(id, reviewData) {
    const { status, points_earned, admin_feedback, reviewed_by } = reviewData;

    const { data, error } = await supabase
      .from('assignment_submissions')
      .update({
        status,
        points_earned: status === 'approved' ? points_earned : 0,
        admin_feedback: admin_feedback?.trim(),
        reviewed_by,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        assignments(title, points_reward),
        users(name, email)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  static async getUserSubmissions(userId, filters = {}) {
    let query = supabase
      .from('assignment_submissions')
      .select(`
        *,
        assignments(title, description, points_reward, difficulty_level, due_date, session_id),
        assignments.sessions(title, company, date)
      `)
      .eq('user_id', userId);

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    query = query.order('submitted_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  static async update(id, updateData) {
    const { data, error } = await supabase
      .from('assignment_submissions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async delete(id) {
    const { error } = await supabase
      .from('assignment_submissions')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }
}

module.exports = AssignmentSubmission;