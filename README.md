# NovaStack Maths Assignment Management System

NovaStack Maths is a responsive full-stack mathematics assignment platform for administrators, teachers, and students. It combines a React frontend with an Express + Mongoose backend and supports role-based permissions, assignment creation, answer submissions, grading, and teacher/student dashboards.

## Features

- Secure authentication with JWT and password hashing
- Role-based access control for admin, teacher, and student users
- Dashboard summaries for each role
- Assignment creation and management
- Student assignment submission with math-focused question prompts
- Teacher grading workflow and feedback
- Math rendering with KaTeX
- Responsive layout for desktop, tablet, and mobile views
- Local MongoDB fallback via MongoDB Memory Server when no Atlas URI is configured

## Local development

1. Install dependencies:
   npm install
   npm --prefix client install
2. Start the backend and frontend together:
   npm run dev
3. Open the app:
   http://localhost:5173

Default users are bootstrapped automatically when the backend starts without an existing database:

- Admin: admin@novastack.edu / Admin123!
- Teacher: teacher@novastack.edu / Teacher123!
- Student: student@novastack.edu / Student123!

## Production deployment

1. Create a MongoDB Atlas cluster and copy your connection URI.
2. Add environment variables in Render or your deployment platform:
   PORT=5000
   JWT_SECRET=your-long-random-secret
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/novastack-maths
   CLIENT_URL=https://your-frontend-domain
3. Build the frontend:
   npm run build
4. Start the backend in production mode:
   npm run start

## Project structure

- server/ — Express API, models, controllers, and auth logic
- client/ — React frontend and dashboard UI
- .env.example — sample environment configuration

## Notes

This project is designed to be deployment-ready for Render while still working locally without a MongoDB Atlas connection by automatically spinning up an in-memory Mongo instance in development mode.
