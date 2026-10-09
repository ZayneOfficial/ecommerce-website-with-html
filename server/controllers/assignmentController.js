const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const User = require('../models/User');

const calculateScore = (questions, answers = []) => {
  const answerMap = new Map(answers.map((entry) => [entry.questionId, String(entry.answer || '').trim().toLowerCase()]));

  let totalMarks = 0;
  let earnedMarks = 0;

  questions.forEach((question) => {
    totalMarks += Number(question.points || 0);
    const studentAnswer = answerMap.get(question.id);
    const expectedAnswer = String(question.expectedAnswer || '').trim().toLowerCase();

    if (studentAnswer && studentAnswer === expectedAnswer) {
      earnedMarks += Number(question.points || 0);
    }
  });

  const percentage = totalMarks === 0 ? 0 : Math.round((earnedMarks / totalMarks) * 100);

  return { earnedMarks, totalMarks, percentage };
};

const getAssignments = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'teacher') {
      query = { teacher: req.user._id };
    }

    if (req.user.role === 'student') {
      query = { className: req.user.className };
    }

    const assignments = await Assignment.find(query).populate('teacher', 'name email role').sort({ createdAt: -1 });
    return res.json({ assignments });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Unable to fetch assignments.' });
  }
};

const createAssignment = async (req, res) => {
  try {
    const { title, subject, className, description, dueDate, instructions, questions } = req.body;

    if (!title || !subject || !className || !questions || questions.length === 0) {
      return res.status(400).json({ message: 'Title, subject, class and questions are required.' });
    }

    const totalMarks = questions.reduce((sum, q) => sum + Number(q.points || 0), 0);

    const assignment = await Assignment.create({
      title,
      subject,
      className,
      teacher: req.user._id,
      description,
      dueDate,
      instructions,
      totalMarks,
      questions: questions.map((q) => ({
        id: q.id || `q${Math.floor(Math.random() * 100000)}`,
        prompt: q.prompt,
        type: q.type || 'short-answer',
        points: Number(q.points || 0),
        expectedAnswer: q.expectedAnswer,
        options: q.options || []
      }))
    });

    return res.status(201).json({ message: 'Assignment created successfully.', assignment });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Unable to create assignment.' });
  }
};

const getAssignmentById = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id).populate('teacher', 'name email');

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found.' });
    }

    if (req.user.role === 'student' && assignment.className !== req.user.className) {
      return res.status(403).json({ message: 'This assignment is not available for your class.' });
    }

    return res.json({ assignment });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Unable to fetch assignment.' });
  }
};

const submitAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found.' });
    }

    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can submit assignments.' });
    }

    const { answers } = req.body;
    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ message: 'Answers are required.' });
    }

    const { earnedMarks, totalMarks, percentage } = calculateScore(assignment.questions, answers);

    const submission = await Submission.findOneAndUpdate(
      { assignment: assignment._id, student: req.user._id },
      {
        assignment: assignment._id,
        student: req.user._id,
        responses: answers,
        score: earnedMarks,
        totalMarks,
        percentage,
        status: 'submitted',
        feedback: ''
      },
      { upsert: true, new: true }
    );

    return res.json({
      message: 'Assignment submitted successfully.',
      submission,
      score: earnedMarks,
      totalMarks,
      percentage
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Unable to submit assignment.' });
  }
};

const getSubmissions = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'student') {
      query.student = req.user._id;
    }

    if (req.user.role === 'teacher') {
      const assignments = await Assignment.find({ teacher: req.user._id }).select('_id');
      const ids = assignments.map((assignment) => assignment._id);
      query.assignment = { $in: ids };
    }

    const submissions = await Submission.find(query)
      .populate('student', 'name email className')
      .populate('assignment', 'title subject className')
      .sort({ submittedAt: -1 });

    return res.json({ submissions });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Unable to fetch submissions.' });
  }
};

const gradeSubmission = async (req, res) => {
  try {
    const { feedback, score } = req.body;
    const submission = await Submission.findById(req.params.id).populate('assignment');

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found.' });
    }

    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only teachers and administrators can grade submissions.' });
    }

    const maxScore = submission.totalMarks || 0;
    const finalScore = Math.min(Math.max(Number(score || submission.score || 0), 0), maxScore);
    const percentage = maxScore === 0 ? 0 : Math.round((finalScore / maxScore) * 100);

    submission.score = finalScore;
    submission.percentage = percentage;
    submission.feedback = feedback || submission.feedback || 'Marked by teacher.';
    submission.status = 'graded';
    submission.gradedAt = new Date();
    await submission.save();

    return res.json({ message: 'Submission graded successfully.', submission });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Unable to grade submission.' });
  }
};

module.exports = {
  getAssignments,
  createAssignment,
  getAssignmentById,
  submitAssignment,
  getSubmissions,
  gradeSubmission
};
