const express = require('express');
const { getAssignments, createAssignment, getAssignmentById, submitAssignment, getSubmissions, gradeSubmission } = require('../controllers/assignmentController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, getAssignments);
router.post('/', protect, authorize('teacher', 'admin'), createAssignment);
router.get('/submissions', protect, getSubmissions);
router.get('/:id', protect, getAssignmentById);
router.post('/:id/submit', protect, authorize('student'), submitAssignment);
router.put('/submissions/:id/grade', protect, authorize('teacher', 'admin'), gradeSubmission);

module.exports = router;
