const supabase = require('../config/supabase');

class Payment {
  static async create(paymentData) {
    const { 
      userId, 
      sessionId, 
      mpesaCode, 
      amount, 
      expectedAmount, 
      actualAmount, 
      amountMismatch, 
      fullMpesaMessage,
      status = 'pending' 
    } = paymentData;
    
    try {
      // Check if payment already exists for this user and session
      const { data: existingPayment, error: checkError } = await supabase
        .from('payments')
        .select('payment_id')
        .eq('user_id', userId)
        .eq('session_id', sessionId)
        .eq('mpesa_code', mpesaCode)
        .single();
      
      if (existingPayment && !checkError) {
        // Payment already exists, return existing payment
        return { id: existingPayment.payment_id, ...paymentData };
      }
      
      // Create new payment
      const { data, error } = await supabase
        .from('payments')
        .insert([{
          user_id: userId,
          session_id: sessionId,
          mpesa_code: mpesaCode,
          amount,
          expected_amount: expectedAmount,
          actual_amount: actualAmount,
          amount_mismatch: amountMismatch,
          full_mpesa_message: fullMpesaMessage,
          status
        }])
        .select()
        .single();
      
      if (error) {
        // If it's a duplicate key error, try to find the existing payment
        if (error.code === '23505' && error.message.includes('duplicate key')) {
          // Duplicate payment detected
          const { data: existingData, error: fetchError } = await supabase
            .from('payments')
            .select('payment_id')
            .eq('user_id', userId)
            .eq('session_id', sessionId)
            .eq('mpesa_code', mpesaCode)
            .single();
          
          if (existingData && !fetchError) {
            return { id: existingData.payment_id, ...paymentData };
          }
        }
        throw error;
      }
      
      return { id: data.payment_id, ...paymentData };
    } catch (error) {
      // PERFORMANCE: Removed excessive error logging
      throw error;
    }
  }

  static async getAllPayments() {
    try {
      // Fetching payments from database
      const { data, error } = await supabase
        .from('payments')
        .select(`
          payment_id,
          user_id,
          session_id,
          mpesa_code,
          amount,
          actual_amount,
          amount_mismatch,
          status,
          full_mpesa_message,
          submitted_at,
          users!inner(name, email),
          sessions(title, google_meet_link)
        `)
        .order('submitted_at', { ascending: false });
      
      if (error) {
        // PERFORMANCE: Removed excessive error logging
        throw error;
      }
      
      // Raw data retrieved from database
      
      // Transform the data to match the expected format
      const transformedData = data?.map(payment => ({
        payment_id: payment.payment_id,
        user_id: payment.user_id,
        session_id: payment.session_id,
        mpesa_code: payment.mpesa_code,
        amount: payment.amount,
        actual_amount: payment.actual_amount,
        amount_mismatch: payment.amount_mismatch,
        status: payment.status,
        full_mpesa_message: payment.full_mpesa_message,
        submission_date: payment.submitted_at,
        user_name: payment.users?.name,
        user_email: payment.users?.email,
        session_title: payment.sessions?.title,
        session_google_meet_link: payment.sessions?.google_meet_link
      })) || [];
      
      // Data transformed successfully
      return transformedData;
    } catch (error) {
      // PERFORMANCE: Removed excessive error logging
      throw error;
    }
  }

  static async updateStatus(paymentId, status, adminNotes = null) {
    try {
      const { data, error } = await supabase
        .from('payments')
        .update({
          status,
          admin_notes: adminNotes,
          updated_at: new Date().toISOString()
        })
        .eq('payment_id', paymentId)
        .select();
      
      if (error) {
        throw error;
      }
      
      return data && data.length > 0;
    } catch (error) {
      // PERFORMANCE: Removed excessive error logging
      throw error;
    }
  }
}

module.exports = Payment;