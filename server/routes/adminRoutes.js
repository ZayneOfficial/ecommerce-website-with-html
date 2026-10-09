const express = require('express');
const { getOverview, getTeacherOverview, getStudentOverview } = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/overview', protect, authorize('admin'), getOverview);
router.get('/teacher-overview', protect, authorize('teacher'), getTeacherOverview);
router.get('/student-overview', protect, authorize('student'), getStudentOverview);

module.exports = router;
