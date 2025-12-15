const Assignment = require('../models/Assignment');
const AssignmentSubmission = require('../models/AssignmentSubmission');
const UserPoints = require('../models/UserPoints');
const { body, validationResult } = require('express-validator');

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

    // If user is authenticated, include their submission status
    if (userId) {
      for (let assignment of assignments) {
        const submission = await AssignmentSubmission.findByUserAndAssignment(userId, assignment.id);
        assignment.user_submission = submission;
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
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const userId = req.user.id;
    const { submission_text, submission_links = [], submission_files = [] } = req.body;

    // Check if assignment exists
    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Check if user already submitted
    const existingSubmission = await AssignmentSubmission.findByUserAndAssignment(userId, id);
    if (existingSubmission) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted this assignment'
      });
    }

    // Create submission
    const submission = await AssignmentSubmission.create({
      assignment_id: id,
      user_id: userId,
      submission_text,
      submission_links,
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

// Get points leaderboard
const getLeaderboard = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const leaderboard = await UserPoints.getLeaderboard(parseInt(limit));

    res.json({
      success: true,
      data: { leaderboard }
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