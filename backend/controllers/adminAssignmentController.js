const Assignment = require('../models/Assignment');
const AssignmentSubmission = require('../models/AssignmentSubmission');
const UserPoints = require('../models/UserPoints');
const { body, validationResult } = require('express-validator');

// Get all assignments (admin view)
const getAllAssignments = async (req, res) => {
  try {
    const { session_id, difficulty_level, is_active } = req.query;
    
    const filters = {};
    if (session_id) filters.session_id = session_id;
    if (difficulty_level) filters.difficulty_level = difficulty_level;
    if (is_active !== undefined) filters.is_active = is_active === 'true';

    const assignments = await Assignment.getAll(filters);

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

// Create new assignment
const createAssignment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const adminId = req.admin.id;
    const assignmentData = {
      ...req.body,
      created_by: adminId
    };

    const assignment = await Assignment.create(assignmentData);

    res.status(201).json({
      success: true,
      message: 'Assignment created successfully',
      data: { assignment }
    });
  } catch (error) {
    console.error('Error creating assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create assignment'
    });
  }
};

// Update assignment
const updateAssignment = async (req, res) => {
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
    const assignment = await Assignment.update(id, req.body);

    res.json({
      success: true,
      message: 'Assignment updated successfully',
      data: { assignment }
    });
  } catch (error) {
    console.error('Error updating assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update assignment'
    });
  }
};

// Delete assignment
const deleteAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    await Assignment.delete(id);

    res.json({
      success: true,
      message: 'Assignment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete assignment'
    });
  }
};

// Get all submissions for review
const getAllSubmissions = async (req, res) => {
  try {
    const { assignment_id, status = 'pending' } = req.query;

    let submissions;
    if (assignment_id) {
      submissions = await AssignmentSubmission.getByAssignmentId(assignment_id, { status });
    } else {
      if (status === 'pending') {
        submissions = await AssignmentSubmission.getAllPending();
      } else {
        // Get all submissions with specific status
        submissions = await AssignmentSubmission.getAll({ status });
      }
    }

    res.json({
      success: true,
      data: { submissions }
    });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch submissions'
    });
  }
};

// Review submission
const reviewSubmission = async (req, res) => {
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
    const adminId = req.admin.id;
    const { status, admin_feedback, points_earned } = req.body;

    // Get the submission to determine points
    const submission = await AssignmentSubmission.findById(id);
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    // Calculate points based on status and assignment difficulty
    let finalPoints = 0;
    if (status === 'approved') {
      finalPoints = points_earned || submission.assignments.points_reward;
    }

    const reviewData = {
      status,
      admin_feedback,
      points_earned: finalPoints,
      reviewed_by: adminId
    };

    const reviewedSubmission = await AssignmentSubmission.review(id, reviewData);

    res.json({
      success: true,
      message: `Submission ${status} successfully`,
      data: { submission: reviewedSubmission }
    });
  } catch (error) {
    console.error('Error reviewing submission:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to review submission'
    });
  }
};

// Get assignment statistics
const getAssignmentStats = async (req, res) => {
  try {
    const { id } = req.params;

    const submissions = await AssignmentSubmission.getByAssignmentId(id);
    
    const stats = {
      total_submissions: submissions.length,
      pending_submissions: submissions.filter(s => s.status === 'pending').length,
      approved_submissions: submissions.filter(s => s.status === 'approved').length,
      rejected_submissions: submissions.filter(s => s.status === 'rejected').length,
      average_points: submissions
        .filter(s => s.status === 'approved')
        .reduce((sum, s) => sum + s.points_earned, 0) / 
        Math.max(submissions.filter(s => s.status === 'approved').length, 1)
    };

    res.json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    console.error('Error fetching assignment stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assignment statistics'
    });
  }
};

// Get overall platform stats
const getPlatformStats = async (req, res) => {
  try {
    // This would require more complex queries, but here's a basic implementation
    const assignments = await Assignment.getAll();
    const pendingSubmissions = await AssignmentSubmission.getAllPending();
    const leaderboard = await UserPoints.getLeaderboard(5);

    const stats = {
      total_assignments: assignments.length,
      active_assignments: assignments.filter(a => a.is_active).length,
      pending_reviews: pendingSubmissions.length,
      top_performers: leaderboard
    };

    res.json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    console.error('Error fetching platform stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch platform statistics'
    });
  }
};

module.exports = {
  getAllAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  getAllSubmissions,
  reviewSubmission,
  getAssignmentStats,
  getPlatformStats
};