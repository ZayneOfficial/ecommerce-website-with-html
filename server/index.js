const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const User = require('./models/User');
const authRoutes = require('./routes/authRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const adminRoutes = require('./routes/adminRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const ensureDefaultUsers = async () => {
  const existingUsers = await User.countDocuments();
  if (existingUsers > 0) return;

  await User.create([
    {
      name: 'NovaStack Admin',
      email: 'admin@novastack.edu',
      password: 'Admin123!',
      role: 'admin',
      className: 'Administration'
    },
    {
      name: 'Alicia Mokoena',
      email: 'teacher@novastack.edu',
      password: 'Teacher123!',
      role: 'teacher',
      className: 'Grade 10A'
    },
    {
      name: 'Sam Ndlovu',
      email: 'student@novastack.edu',
      password: 'Student123!',
      role: 'student',
      className: 'Grade 10A',
      grade: 'Grade 10'
    }
  ]);
};

app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'NovaStack Maths API running.' });
});

app.use('/api/auth', authRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/admin', adminRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong.' });
});

connectDB().then(async () => {
  await ensureDefaultUsers();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
