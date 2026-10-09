const mongoose = require('mongoose');

const responseSchema = new mongoose.Schema({
  questionId: { type: String, required: true },
  answer: { type: String, default: '' }
}, { _id: false });

const submissionSchema = new mongoose.Schema({
  assignment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  responses: [responseSchema],
  score: { type: Number, default: 0 },
  totalMarks: { type: Number, default: 0 },
  percentage: { type: Number, default: 0 },
  status: { type: String, enum: ['submitted', 'graded', 'pending'], default: 'submitted' },
  feedback: { type: String, default: '' },
  submittedAt: { type: Date, default: Date.now },
  gradedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Submission', submissionSchema);
