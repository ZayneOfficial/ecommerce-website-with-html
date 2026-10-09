const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const User = require('../models/User');

const getOverview = async (req, res) => {
  try {
    const [studentCount, teacherCount, assignmentCount, submissionCount] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'teacher' }),
      Assignment.countDocuments(),
      Submission.countDocuments()
    ]);

    const recentAssignments = await Assignment.find().populate('teacher', 'name').limit(5).sort({ createdAt: -1 });
    const userSummary = await User.find().select('name role className isActive').sort({ createdAt: -1 }).limit(8);

    const averageMark = await Submission.aggregate([
      { $match: { percentage: { $gte: 0 } } },
      { $group: { _id: null, avg: { $avg: '$percentage' } } }
    ]);

    return res.json({
      stats: {
        totalStudents: studentCount,
        totalTeachers: teacherCount,
        totalAssignments: assignmentCount,
        totalSubmissions: submissionCount,
        averageMark: averageMark[0]?.avg ? Math.round(averageMark[0].avg) : 0
      },
      recentAssignments,
      userSummary
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Unable to fetch admin overview.' });
  }
};

const getTeacherOverview = async (req, res) => {
  const assignments = await Assignment.find({ teacher: req.user._id }).lean();
  const assignmentIds = assignments.map((item) => item._id);
  const submissions = await Submission.find({ assignment: { $in: assignmentIds } }).populate('student', 'name email').sort({ submittedAt: -1 });

  return res.json({
    assignments,
    submissions,
    totalAssignments: assignments.length,
    totalSubmissions: submissions.length
  });
};

const getStudentOverview = async (req, res) => {
  const assignments = await Assignment.find({ className: req.user.className }).sort({ dueDate: 1 });
  const submissions = await Submission.find({ student: req.user._id }).populate('assignment', 'title subject dueDate').sort({ submittedAt: -1 });

  return res.json({
    assignments,
    submissions,
    totalAssignments: assignments.length,
    totalSubmissions: submissions.length
  });
};

module.exports = { getOverview, getTeacherOverview, getStudentOverview };
