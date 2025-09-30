const { body, validationResult } = require('express-validator');
const Payment = require('../models/Payment');
const User = require('../models/User');
const emailService = require('../services/emailService');

// Extract M-Pesa code from full message
const extractMpesaCodeFromMessage = (fullMessage) => {
  if (!fullMessage) return null;
  
  // Common M-Pesa code patterns
  const patterns = [
    /TID[A-Z0-9]{6,12}/g,  // TID followed by alphanumeric
    /[A-Z]{3}[0-9]{6,12}/g, // 3 letters + numbers
    /[A-Z0-9]{6,20}/g       // General alphanumeric 6-20 chars
  ];
  
  for (const pattern of patterns) {
    const matches = fullMessage.match(pattern);
    if (matches && matches.length > 0) {
      return matches[0];
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

    // Note: Email will be sent when admin updates payment status
    // This prevents duplicate emails to users

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
    console.error('M-Pesa submission error:', error);
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