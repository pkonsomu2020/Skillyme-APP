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
        console.log('Payment already exists, returning existing payment');
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
          console.log('Duplicate payment detected, fetching existing payment');
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
      console.error('Error creating payment:', error);
      throw error;
    }
  }

  static async getAllPayments() {
    try {
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
        throw error;
      }
      
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
      
      console.log(`Found ${transformedData.length} payments`);
      return transformedData;
    } catch (error) {
      console.error('Error fetching payments:', error);
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
      console.error('Error updating payment status:', error);
      throw error;
    }
  }
}

module.exports = Payment;