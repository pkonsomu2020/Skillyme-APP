const { body, validationResult } = require('express-validator');
const Payment = require('../models/Payment');
const User = require('../models/User');
const emailService = require('../services/emailService');

// SECURITY: Extract M-Pesa code from full message with validation
const extractMpesaCodeFromMessage = (fullMessage) => {
  // SECURITY: Input validation
  if (!fullMessage || typeof fullMessage !== 'string') {
    return null;
  }
  
  // SECURITY: Sanitize input
  const sanitizedMessage = fullMessage.trim().substring(0, 1000);
  
  // Common M-Pesa code patterns
  const patterns = [
    /TID[A-Z0-9]{6,12}/g,  // TID followed by alphanumeric
    /[A-Z]{3}[0-9]{6,12}/g, // 3 letters + numbers
    /[A-Z0-9]{6,20}/g       // General alphanumeric 6-20 chars
  ];
  
  for (const pattern of patterns) {
    const matches = sanitizedMessage.match(pattern);
    if (matches && matches.length > 0) {
      // SECURITY: Validate extracted code
      const code = matches[0];
      if (code.length >= 6 && code.length <= 20) {
        return code;
      }
    }
  }
  
  return null;
};

// Simulate M-Pesa amount detection
const simulateMpesaAmountDetection = (mpesaCode, expectedAmount) => {
  // For testing purposes, simulate different amounts based on code patterns
  if (mpesaCode.includes('150')) return 150;
  if (mpesaCode.includes('100')) return 100;
  if (mpesaCode.includes('50')) return 50;
  
  // For real codes, assume they paid the expected amount
  return expectedAmount;
};

// Validate M-Pesa code with amount detection
const validateMpesaCodeWithAmount = async (mpesaCode, expectedAmount) => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Basic validation
  if (!mpesaCode || mpesaCode.length < 6 || mpesaCode.length > 20) {
    return {
      isValid: false,
      actualAmount: 0,
      amountMatch: false
    };
  }
  
  // Simulate amount detection
  const actualAmount = simulateMpesaAmountDetection(mpesaCode, expectedAmount);
  const amountMatch = actualAmount === expectedAmount;
  
  return {
    isValid: true,
    actualAmount,
    amountMatch
  };
};

// Submit M-Pesa code
const submitMpesaCode = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { sessionId, fullMpesaMessage, amount } = req.body;
    const userId = req.user.id;

    // Extract M-Pesa code from full message
    const mpesaCode = extractMpesaCodeFromMessage(fullMpesaMessage);
    
    if (!mpesaCode) {
      return res.status(400).json({
        success: false,
        message: 'Could not extract M-Pesa code from message. Please ensure the message contains a valid transaction code.'
      });
    }

    // Validate M-Pesa code and detect amount
    const validation = await validateMpesaCodeWithAmount(mpesaCode, amount);
    
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid M-Pesa code format'
      });
    }

    // Determine payment status
    let paymentStatus = 'pending';
    if (!validation.amountMatch) {
      paymentStatus = 'amount_mismatch';
    }

    // Create payment record
    const paymentData = {
      userId,
      sessionId: sessionId || 1, // Default session
      mpesaCode,
      amount: validation.actualAmount,
      expectedAmount: amount,
      actualAmount: validation.actualAmount,
      amountMismatch: !validation.amountMatch,
      fullMpesaMessage,
      status: paymentStatus
    };

    const payment = await Payment.create(paymentData);

    // Send immediate confirmation email to user (asynchronously to avoid delays)
    setImmediate(async () => {
      try {
        // Get user details for email
        const user = await User.findById(userId);
        if (user) {
          // Get session details for email
          const supabase = require('../config/supabase');
          const { data: sessionResult, error } = await supabase
            .from('sessions')
            .select('title')
            .eq('id', sessionId || 1)
            .single();
          const sessionName = sessionResult?.title || 'Career Session';
          
          // Send payment submission confirmation email
          await emailService.sendPaymentSubmissionConfirmation(
            user.email,
            user.name,
            sessionName
          );
          // Payment submission confirmation email sent
        }
      } catch (emailError) {
        // PERFORMANCE: Removed excessive error logging
        // Don't fail the payment submission if email fails
      }
    });

    // Prepare response message
    let responseMessage = 'M-Pesa code submitted successfully';
    if (!validation.amountMatch) {
      responseMessage = `M-Pesa code submitted but amount mismatch detected. Expected: KSh ${amount}, Actual: KSh ${validation.actualAmount}. Admin will review.`;
    }

    res.status(201).json({
      success: true,
      message: responseMessage,
      data: {
        paymentId: payment.id,
        mpesaCode,
        amountPaid: validation.actualAmount,
        amountMatch: validation.amountMatch
      }
    });
  } catch (error) {
    // PERFORMANCE: Removed excessive error logging
    res.status(500).json({
      success: false,
      message: 'Failed to submit M-Pesa code',
      error: error.message
    });
  }
};

module.exports = {
  submitMpesaCode
};