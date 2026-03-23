const Assignment = require('../models/Assignment');
const AssignmentSubmission = require('../models/AssignmentSubmission');
const UserPoints = require('../models/UserPoints');

// Get all assignments (for users)
const getAllAssignments = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { session_id } = req.query;

    let assignments;
    if (session_id) {
      assignments = await Assignment.findBySessionId(session_id);
    } else {
      assignments = await Assignment.getAll({ is_active: true });
    }

    // Batch-fetch all user submissions in one query instead of N+1
    if (userId && assignments.length > 0) {
      const assignmentIds = assignments.map(a => a.id);
      const submissions = await AssignmentSubmission.findByUserAndAssignments(userId, assignmentIds);
      const submissionMap = {};
      submissions.forEach(s => { submissionMap[s.assignment_id] = s; });
      for (const assignment of assignments) {
        assignment.user_submission = submissionMap[assignment.id] || null;
      }
    }

    res.json({
      success: true,
      data: { assignments }
    });
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assignments'
    });
  }
};

// Get single assignment
const getAssignmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Include user's submission if authenticated
    if (userId) {
      const submission = await AssignmentSubmission.findByUserAndAssignment(userId, assignment.id);
      assignment.user_submission = submission;
    }

    res.json({
      success: true,
      data: { assignment }
    });
  } catch (error) {
    console.error('Error fetching assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assignment'
    });
  }
};

// Submit assignment (for users)
const submitAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Validate assignment ID
    const assignmentId = parseInt(id);
    if (isNaN(assignmentId) || assignmentId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid assignment ID' });
    }

    // Require at least one file
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one file is required' });
    }

    const submission_files = req.files.map(file => ({
      filename: file.filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: `/uploads/assignments/${file.filename}`
    }));

    // Check if assignment exists
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    // Check assignment is still active
    if (!assignment.is_active) {
      return res.status(400).json({ success: false, message: 'This assignment is no longer active' });
    }

    // Check if user already submitted — if so, update instead (resubmission allowed before deadline)
    const existingSubmission = await AssignmentSubmission.findByUserAndAssignment(userId, assignmentId);
    if (existingSubmission) {
      // Block resubmission after deadline
      if (assignment.due_date && new Date() > new Date(assignment.due_date)) {
        return res.status(400).json({
          success: false,
          message: 'The deadline has passed. You can no longer edit this submission.'
        });
      }

      // Block resubmission if already approved
      if (existingSubmission.status === 'approved') {
        return res.status(400).json({
          success: false,
          message: 'This submission has already been approved and cannot be changed.'
        });
      }

      // Update the existing submission
      const updated = await AssignmentSubmission.update(existingSubmission.id, {
        submission_files,
        status: 'pending',
        submitted_at: new Date().toISOString(),
        admin_feedback: null,
        reviewed_by: null,
        reviewed_at: null
      });

      return res.json({
        success: true,
        message: 'Submission updated successfully',
        data: { submission: updated }
      });
    }

    // Create new submission
    const submission = await AssignmentSubmission.create({
      assignment_id: assignmentId,
      user_id: userId,
      submission_files
    });

    res.status(201).json({
      success: true,
      message: 'Assignment submitted successfully',
      data: { submission }
    });
  } catch (error) {
    console.error('Error submitting assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit assignment'
    });
  }
};

// Get user's submissions
const getUserSubmissions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    const submissions = await AssignmentSubmission.getUserSubmissions(userId, { status });

    res.json({
      success: true,
      data: { submissions }
    });
  } catch (error) {
    console.error('Error fetching user submissions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch submissions'
    });
  }
};

// Get user points and stats
const getUserPoints = async (req, res) => {
  try {
    const userId = req.user.id;
    const stats = await UserPoints.getUserStats(userId);

    res.json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    console.error('Error fetching user points:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user points'
    });
  }
};

// Get points leaderboard with filters
const getLeaderboard = async (req, res) => {
  try {
    const allowedPeriods = ['weekly', 'monthly', 'all'];
    const allowedGroups = ['form4', 'undergraduate', 'all'];
    const allowedMetrics = ['points', 'assignments'];

    const rawLimit = parseInt(req.query.limit);
    const limit = (!isNaN(rawLimit) && rawLimit > 0 && rawLimit <= 100) ? rawLimit : 10;
    const period = allowedPeriods.includes(req.query.period) ? req.query.period : 'all';
    const target_group = allowedGroups.includes(req.query.target_group) ? req.query.target_group : 'all';
    const metric = allowedMetrics.includes(req.query.metric) ? req.query.metric : 'points';

    const userId = req.user?.id;

    // Initialize user points if they don't exist (for existing users)
    if (userId) {
      try {
        await UserPoints.getUserPoints(userId);
      } catch (error) {
        // If user points don't exist, initialize them
        console.log(`Initializing points for user ${userId}`);
        await UserPoints.initializeUserPoints(userId);
      }
    }

    // Get leaderboard data
    const leaderboard = await UserPoints.getLeaderboard({
      limit: parseInt(limit),
      period,
      target_group,
      metric
    });

    // Add rank numbers to leaderboard entries
    const rankedLeaderboard = leaderboard.map((entry, index) => ({
      ...entry,
      rank: index + 1,
      name: entry.users?.name || 'Unknown User',
      total_points: entry.total_points || entry.period_points || entry.assignments_completed || 0,
      level_name: entry.level_name || UserPoints.calculateLevel(entry.total_points || 0)
    }));

    // Get statistics
    const stats = await UserPoints.getLeaderboardStats(period, userId);

    res.json({
      success: true,
      data: { 
        leaderboard: rankedLeaderboard,
        stats,
        filters: {
          period,
          target_group,
          metric,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leaderboard'
    });
  }
};

module.exports = {
  getAllAssignments,
  getAssignmentById,
  submitAssignment,
  getUserSubmissions,
  getUserPoints,
  getLeaderboard
};