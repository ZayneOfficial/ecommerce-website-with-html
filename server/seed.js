const dotenv = require('dotenv');
dotenv.config();

const connectDB = require('./config/db');
const User = require('./models/User');
const Assignment = require('./models/Assignment');
const Submission = require('./models/Submission');

const seedData = async () => {
  await connectDB();
  await User.deleteMany({});
  await Assignment.deleteMany({});
  await Submission.deleteMany({});

  const admin = await User.create({
    name: 'NovaStack Admin',
    email: 'admin@novastack.edu',
    password: 'Admin123!',
    role: 'admin',
    className: 'Administration'
  });

  const teacher = await User.create({
    name: 'Alicia Mokoena',
    email: 'teacher@novastack.edu',
    password: 'Teacher123!',
    role: 'teacher',
    className: 'Grade 10A'
  });

  const student = await User.create({
    name: 'Sam Ndlovu',
    email: 'student@novastack.edu',
    password: 'Student123!',
    role: 'student',
    className: 'Grade 10A',
    grade: 'Grade 10'
  });

  const assignment = await Assignment.create({
    title: 'Algebra Practice Set',
    subject: 'Mathematics',
    className: 'Grade 10A',
    teacher: teacher._id,
    description: 'Solve expressions and equations using algebraic reasoning.',
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10),
    instructions: 'Answer each question using the correct algebraic method. Show your working where needed.',
    totalMarks: 20,
    questions: [
      {
        id: 'q1',
        prompt: 'Solve the equation: \\(3x + 5 = 20\\)',
        type: 'short-answer',
        points: 5,
        expectedAnswer: '5'
      },
      {
        id: 'q2',
        prompt: 'Simplify: \\(2x + 3x - 4\\)',
        type: 'short-answer',
        points: 5,
        expectedAnswer: '5x-4'
      },
      {
        id: 'q3',
        prompt: 'Evaluate \\((4^2) + 3\\)',
        type: 'short-answer',
        points: 10,
        expectedAnswer: '19'
      }
    ]
  });

  await Submission.create({
    assignment: assignment._id,
    student: student._id,
    responses: [
      { questionId: 'q1', answer: '5' },
      { questionId: 'q2', answer: '5x-4' },
      { questionId: 'q3', answer: '19' }
    ],
    score: 20,
    totalMarks: 20,
    percentage: 100,
    status: 'graded',
    feedback: 'Excellent work. Full marks awarded.',
    submittedAt: new Date(),
    gradedAt: new Date()
  });

  console.log('Seed completed.');
  process.exit(0);
};

seedData().catch((error) => {
  console.error(error);
  process.exit(1);
});
