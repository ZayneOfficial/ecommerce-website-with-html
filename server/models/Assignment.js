const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  prompt: { type: String, required: true },
  type: { type: String, default: 'short-answer' },
  points: { type: Number, default: 5 },
  expectedAnswer: { type: String, required: true },
  options: [{ type: String }]
}, { _id: false });

const assignmentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subject: { type: String, required: true },
  className: { type: String, required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  description: { type: String, default: '' },
  dueDate: { type: Date },
  totalMarks: { type: Number, default: 0 },
  instructions: { type: String, default: '' },
  questions: [questionSchema],
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Assignment', assignmentSchema);
