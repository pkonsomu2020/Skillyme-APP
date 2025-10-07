const supabase = require('../config/supabase');
const { body, validationResult } = require('express-validator');
const ErrorHandler = require('../middleware/errorHandler');
const emailService = require('../services/emailService');

// Send notification to users
const sendNotification = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await ErrorHandler.logError(new Error('Notification validation failed'), {
        endpoint: '/api/admin/notifications/send',
        errors: errors.array()
      });
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      type,
      subject,
      message,
      recipients,
      session_id,
      field_of_study,
      institution
    } = req.body;

    let targetUsers = [];

    // Determine recipients based on type
    switch (recipients) {
      case 'all':
        const { data: allUsers, error: allError } = await supabase
          .from('users')
          .select('id, name, email, preferred_name');
        
        if (allError) throw allError;
        targetUsers = allUsers;
        break;

      case 'session':
        if (!session_id) {
          return res.status(400).json({
            success: false,
            message: 'Session ID is required for session recipients'
          });
        }

        const { data: sessionUsers, error: sessionError } = await supabase
          .from('user_sessions')
          .select(`
            user_id,
            users!inner(id, name, email, preferred_name)
          `)
          .eq('session_id', session_id);

        if (sessionError) throw sessionError;
        targetUsers = sessionUsers.map(item => item.users);
        break;

      case 'field':
        if (!field_of_study) {
          return res.status(400).json({
            success: false,
            message: 'Field of study is required for field-based recipients'
          });
        }

        const { data: fieldUsers, error: fieldError } = await supabase
          .from('users')
          .select('id, name, email, preferred_name')
          .eq('field_of_study', field_of_study);

        if (fieldError) throw fieldError;
        targetUsers = fieldUsers;
        break;

      case 'institution':
        if (!institution) {
          return res.status(400).json({
            success: false,
            message: 'Institution is required for institution-based recipients'
          });
        }

        const { data: institutionUsers, error: institutionError } = await supabase
          .from('users')
          .select('id, name, email, preferred_name')
          .ilike('institution', `%${institution}%`);

        if (institutionError) throw institutionError;
        targetUsers = institutionUsers;
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid recipient type'
        });
    }

    if (targetUsers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No users found for the specified criteria'
      });
    }

    // Send emails to all target users
    const emailPromises = targetUsers.map(async (user) => {
      try {
        const recipientName = user.preferred_name || user.name;
        
        // Create personalized message
        const personalizedMessage = message.replace(/\{name\}/g, recipientName);
        
        await emailService.sendEmail({
          to: user.email,
          subject: subject,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
                <h1 style="color: white; margin: 0;">Skillyme</h1>
              </div>
              <div style="padding: 30px; background: #f8f9fa;">
                <h2 style="color: #333; margin-bottom: 20px;">${subject}</h2>
                <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  ${personalizedMessage.replace(/\n/g, '<br>')}
                </div>
                <div style="margin-top: 20px; text-align: center;">
                  <p style="color: #666; font-size: 14px;">
                    Best regards,<br>
                    The Skillyme Team
                  </p>
                </div>
              </div>
              <div style="background: #333; color: white; padding: 15px; text-align: center; font-size: 12px;">
                <p>© 2024 Skillyme. All rights reserved.</p>
              </div>
            </div>
          `,
          text: personalizedMessage
        });

        return { success: true, email: user.email };
      } catch (error) {
        console.error(`Failed to send email to ${user.email}:`, error);
        return { success: false, email: user.email, error: error.message };
      }
    });

    const results = await Promise.all(emailPromises);
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    // Log the notification
    await supabase
      .from('admin_notifications')
      .insert([{
        type,
        subject,
        message,
        recipients,
        target_count: targetUsers.length,
        successful_sends: successful,
        failed_sends: failed,
        sent_by: req.admin.id,
        created_at: new Date().toISOString()
      }]);

    res.json({
      success: true,
      message: 'Notification sent successfully',
      data: {
        totalRecipients: targetUsers.length,
        successful,
        failed,
        results: results.filter(r => !r.success) // Only return failed ones
      }
    });
  } catch (error) {
    await ErrorHandler.logError(error, {
      endpoint: '/api/admin/notifications/send',
      adminId: req.admin?.id
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to send notification',
      error: error.message
    });
  }
};

// Get notification history
const getNotificationHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { data: notifications, error } = await supabase
      .from('admin_notifications')
      .select(`
        id, type, subject, message, recipients, target_count,
        successful_sends, failed_sends, sent_by, created_at,
        admins!inner(name, email)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    // Get total count
    const { count, error: countError } = await supabase
      .from('admin_notifications')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      throw countError;
    }

    res.json({
      success: true,
      data: {
        notifications: notifications || [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count || 0,
          pages: Math.ceil((count || 0) / limit)
        }
      }
    });
  } catch (error) {
    await ErrorHandler.logError(error, {
      endpoint: '/api/admin/notifications/history',
      adminId: req.admin?.id
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification history',
      error: error.message
    });
  }
};

// Send session reminder
const sendSessionReminder = async (req, res) => {
  try {
    const { session_id, reminder_type = '24h' } = req.body;

    if (!session_id) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required'
      });
    }

    // Get session details
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select(`
        id, title, date, time, google_meet_link, recruiter, company
      `)
      .eq('id', session_id)
      .single();

    if (sessionError || !session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Get session attendees
    const { data: attendees, error: attendeesError } = await supabase
      .from('user_sessions')
      .select(`
        user_id,
        users!inner(id, name, email, preferred_name)
      `)
      .eq('session_id', session_id);

    if (attendeesError) {
      throw attendeesError;
    }

    if (attendees.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No attendees found for this session'
      });
    }

    // Create reminder message based on type
    let subject, message;
    const sessionDate = new Date(session.date).toLocaleDateString();
    const sessionTime = session.time;

    switch (reminder_type) {
      case '24h':
        subject = `Reminder: ${session.title} starts tomorrow`;
        message = `
          Hi {name},
          
          This is a friendly reminder that you have a session tomorrow:
          
          📅 Session: ${session.title}
          📅 Date: ${sessionDate}
          🕐 Time: ${sessionTime}
          👨‍💼 Recruiter: ${session.recruiter}
          🏢 Company: ${session.company}
          🔗 Google Meet: ${session.google_meet_link}
          
          Please join the session on time. We look forward to seeing you there!
          
          Best regards,
          The Skillyme Team
        `;
        break;

      case '1h':
        subject = `Reminder: ${session.title} starts in 1 hour`;
        message = `
          Hi {name},
          
          Your session is starting in 1 hour:
          
          📅 Session: ${session.title}
          📅 Date: ${sessionDate}
          🕐 Time: ${sessionTime}
          🔗 Google Meet: ${session.google_meet_link}
          
          Please join the session on time. We look forward to seeing you there!
          
          Best regards,
          The Skillyme Team
        `;
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid reminder type'
        });
    }

    // Send reminder emails
    const emailPromises = attendees.map(async (attendee) => {
      try {
        const user = attendee.users;
        const recipientName = user.preferred_name || user.name;
        const personalizedMessage = message.replace(/\{name\}/g, recipientName);
        
        await emailService.sendEmail({
          to: user.email,
          subject: subject,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
                <h1 style="color: white; margin: 0;">Skillyme</h1>
              </div>
              <div style="padding: 30px; background: #f8f9fa;">
                <h2 style="color: #333; margin-bottom: 20px;">${subject}</h2>
                <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  ${personalizedMessage.replace(/\n/g, '<br>')}
                </div>
              </div>
            </div>
          `,
          text: personalizedMessage
        });

        return { success: true, email: user.email };
      } catch (error) {
        console.error(`Failed to send reminder to ${attendee.users.email}:`, error);
        return { success: false, email: attendee.users.email, error: error.message };
      }
    });

    const results = await Promise.all(emailPromises);
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    res.json({
      success: true,
      message: 'Session reminder sent successfully',
      data: {
        session: session.title,
        totalRecipients: attendees.length,
        successful,
        failed
      }
    });
  } catch (error) {
    await ErrorHandler.logError(error, {
      endpoint: '/api/admin/notifications/session-reminder',
      adminId: req.admin?.id
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to send session reminder',
      error: error.message
    });
  }
};

module.exports = {
  sendNotification,
  getNotificationHistory,
  sendSessionReminder
};
