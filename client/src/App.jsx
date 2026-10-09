import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  BrowserRouter,
  Link,
  Navigate,
  NavLink,
  Outlet,
  Route,
  Routes,
  useNavigate,
  useParams
} from 'react-router-dom';
import { BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const apiFetch = async (path, options = {}, token = '') => {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
};

const formatDate = (value) => {
  if (!value) return 'No due date';
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('novastackToken') || '');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    localStorage.setItem('novastackToken', token);

    apiFetch('/api/auth/me', {}, token)
      .then((data) => setUser(data.user))
      .catch(() => {
        localStorage.removeItem('novastackToken');
        setToken('');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const logout = () => {
    localStorage.removeItem('novastackToken');
    setToken('');
    setUser(null);
  };

  const value = useMemo(() => ({ token, setToken, user, setUser, logout, loading }), [token, user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

const AuthContext = createContext(null);

function useAuth() {
  const context = useContext(AuthContext);
  return context;
}

function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, token, loading } = useAuth();

  if (loading) {
    return <div className="page-shell"><div className="loading-box">Loading your workspace...</div></div>;
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return <Outlet />;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark">N</div>
          <div>
            <strong>NovaStack Maths</strong>
            <small>Learn Mathematics. Practice with Purpose.</small>
          </div>
        </div>

        <nav className="nav-menu">
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/assignments">Assignments</NavLink>
          {user.role !== 'student' && <NavLink to="/submissions">Submissions</NavLink>}
          {user.role === 'admin' && <NavLink to="/register">Manage Users</NavLink>}
        </nav>

        <div className="user-card">
          <div className="avatar">{user.name?.charAt(0).toUpperCase()}</div>
          <div>
            <strong>{user.name}</strong>
            <small>{user.role}</small>
          </div>
        </div>

        <button className="primary-button danger" onClick={handleLogout}>Logout</button>
      </aside>

      <main className="content-panel">
        <header className="topbar">
          <div>
            <p className="eyebrow">{user.role.toUpperCase()} PORTAL</p>
            <h2>NovaStack Maths Dashboard</h2>
          </div>
          <div className="status-pill">{user.className || 'General'}</div>
        </header>

        <div className="page-body">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function LoginPage() {
  const { setToken, setUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: 'admin@novastack.edu', password: 'Admin123!' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(form)
      });

      setToken(data.token);
      setUser(data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="brand-row">
          <div className="brand-mark large">N</div>
          <div>
            <h1>NovaStack Maths</h1>
            <p>Learn Mathematics. Practice with Purpose. Achieve More.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="form-grid">
          <div className="field-row">
            <label>Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="field-row">
            <label>Password</label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </div>
          {error && <div className="alert error">{error}</div>}
          <button type="submit" className="primary-button" disabled={loading}>{loading ? 'Signing in...' : 'Login'}</button>
          <Link to="/register" className="secondary-link">Create an account</Link>
        </form>
      </div>
    </div>
  );
}

function RegisterPage() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student', className: 'Grade 10A', grade: 'Grade 10' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const data = await apiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(form)
      }, token || '');

      setSuccess(data.message || 'Account created successfully.');
      if (!token) {
        navigate('/login');
      } else if (user?.role === 'admin') {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page small-page">
      <div className="auth-card">
        <div className="brand-row">
          <div className="brand-mark large">N</div>
          <div>
            <h1>Create Account</h1>
            <p>Register a teacher or student in the NovaStack Maths portal.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="form-grid">
          <div className="field-row">
            <label>Full name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="field-row">
            <label>Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="field-row">
            <label>Password</label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </div>
          <div className="field-row">
            <label>Role</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="field-row">
            <label>Class</label>
            <input value={form.className} onChange={(e) => setForm({ ...form, className: e.target.value })} />
          </div>
          <div className="field-row">
            <label>Grade</label>
            <input value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} />
          </div>
          {error && <div className="alert error">{error}</div>}
          {success && <div className="alert success">{success}</div>}
          <button type="submit" className="primary-button" disabled={loading}>{loading ? 'Creating...' : 'Create Account'}</button>
          <Link to="/login" className="secondary-link">Back to login</Link>
        </form>
      </div>
    </div>
  );
}

function DashboardPage() {
  const { user, token } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;

    const fetchOverview = async () => {
      try {
        const endpoint = user.role === 'admin' ? '/api/admin/overview' : user.role === 'teacher' ? '/api/admin/teacher-overview' : '/api/admin/student-overview';
        const data = await apiFetch(endpoint, {}, token);
        setStats(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOverview();
  }, [token, user.role]);

  if (loading) return <div className="loading-box">Loading dashboard...</div>;
  if (error) return <div className="alert error">{error}</div>;

  if (user.role === 'admin') {
    return (
      <>
        <div className="stats-grid">
          <StatCard title="Total students" value={stats?.stats?.totalStudents || 0} tone="blue" />
          <StatCard title="Total teachers" value={stats?.stats?.totalTeachers || 0} tone="green" />
          <StatCard title="Assignments" value={stats?.stats?.totalAssignments || 0} tone="orange" />
          <StatCard title="Average mark" value={`${stats?.stats?.averageMark || 0}%`} tone="purple" />
        </div>

        <div className="two-column">
          <Panel title="Recent assignments">
            <div className="table-list">
              {stats?.recentAssignments?.map((assignment) => (
                <div className="table-row" key={assignment._id}>
                  <div>
                    <strong>{assignment.title}</strong>
                    <small>{assignment.subject} · {assignment.className}</small>
                  </div>
                  <span className="chip neutral">{assignment.teacher?.name}</span>
                </div>
              )) || <p>No assignments yet.</p>}
            </div>
          </Panel>

          <Panel title="Recent users">
            <div className="table-list">
              {stats?.userSummary?.map((entry) => (
                <div className="table-row" key={entry._id}>
                  <div>
                    <strong>{entry.name}</strong>
                    <small>{entry.role}</small>
                  </div>
                  <span className={`chip ${entry.isActive ? 'success' : 'danger'}`}>{entry.isActive ? 'Active' : 'Inactive'}</span>
                </div>
              )) || <p>No users found.</p>}
            </div>
          </Panel>
        </div>
      </>
    );
  }

  if (user.role === 'teacher') {
    return (
      <>
        <div className="stats-grid">
          <StatCard title="Assignments" value={stats?.totalAssignments || 0} tone="blue" />
          <StatCard title="Submissions" value={stats?.totalSubmissions || 0} tone="green" />
          <StatCard title="Classes" value="1" tone="orange" />
        </div>

        <div className="two-column">
          <Panel title="Your assignments">
            <div className="table-list">
              {stats?.assignments?.map((assignment) => (
                <div className="table-row" key={assignment._id}>
                  <div>
                    <strong>{assignment.title}</strong>
                    <small>{assignment.subject} · {assignment.className}</small>
                  </div>
                  <Link to={`/assignment/${assignment._id}`} className="secondary-link">Open</Link>
                </div>
              )) || <p>No assignments created yet.</p>}
            </div>
          </Panel>

          <Panel title="Latest submissions">
            <div className="table-list">
              {stats?.submissions?.map((entry) => (
                <div className="table-row" key={entry._id}>
                  <div>
                    <strong>{entry.student?.name}</strong>
                    <small>{entry.assignment?.title}</small>
                  </div>
                  <span className="chip neutral">{entry.percentage}%</span>
                </div>
              )) || <p>No submissions received yet.</p>}
            </div>
          </Panel>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="stats-grid">
        <StatCard title="Assignments" value={stats?.totalAssignments || 0} tone="blue" />
        <StatCard title="Submitted" value={stats?.totalSubmissions || 0} tone="green" />
        <StatCard title="Class" value={user.className || 'General'} tone="orange" />
      </div>

      <div className="two-column">
        <Panel title="Available assignments">
          <div className="table-list">
            {stats?.assignments?.map((assignment) => (
              <div className="table-row" key={assignment._id}>
                <div>
                  <strong>{assignment.title}</strong>
                  <small>{assignment.subject} · Due {formatDate(assignment.dueDate)}</small>
                </div>
                <Link to={`/assignment/${assignment._id}`} className="secondary-link">View</Link>
              </div>
            )) || <p>No assignments available.</p>}
          </div>
        </Panel>

        <Panel title="Your marks">
          <div className="table-list">
            {stats?.submissions?.map((entry) => (
              <div className="table-row" key={entry._id}>
                <div>
                  <strong>{entry.assignment?.title}</strong>
                  <small>{entry.status}</small>
                </div>
                <span className="chip success">{entry.percentage}%</span>
              </div>
            )) || <p>No marks available yet.</p>}
          </div>
        </Panel>
      </div>
    </>
  );
}

function AssignmentsPage() {
  const { token, user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAssignments = async () => {
      try {
        const data = await apiFetch('/api/assignments', {}, token);
        setAssignments(data.assignments || []);
      } finally {
        setLoading(false);
      }
    };

    if (token) loadAssignments();
  }, [token]);

  if (loading) return <div className="loading-box">Loading assignments...</div>;

  return (
    <Panel title="Assignments">
      <div className="table-list">
        {assignments.map((assignment) => (
          <div className="table-row" key={assignment._id}>
            <div>
              <strong>{assignment.title}</strong>
              <small>{assignment.subject} · {assignment.className}</small>
            </div>
            <div className="compact-actions">
              <span className="chip neutral">Due {formatDate(assignment.dueDate)}</span>
              <Link to={`/assignment/${assignment._id}`} className="secondary-link">Open</Link>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function AssignmentPage() {
  const { id } = useParams();
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState(null);
  const [answers, setAnswers] = useState({});
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAssignment = async () => {
      try {
        const data = await apiFetch(`/api/assignments/${id}`, {}, token);
        setAssignment(data.assignment);
        setAnswers(Object.fromEntries((data.assignment.questions || []).map((q) => [q.id, ''])));
      } finally {
        setLoading(false);
      }
    };

    if (token) loadAssignment();
  }, [id, token]);

  const handleChange = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      answers: Object.entries(answers).map(([questionId, answer]) => ({ questionId, answer }))
    };

    try {
      const result = await apiFetch(`/api/assignments/${id}/submit`, {
        method: 'POST',
        body: JSON.stringify(payload)
      }, token);

      setMessage(`${result.message} Score: ${result.score}/${result.totalMarks} (${result.percentage}%)`);
      setTimeout(() => navigate('/dashboard'), 1800);
    } catch (err) {
      setMessage(err.message);
    }
  };

  if (loading) return <div className="loading-box">Loading assignment...</div>;
  if (!assignment) return <div className="alert error">Assignment not found.</div>;

  return (
    <div className="assignment-page">
      <Panel title={assignment.title}>
        <div className="assignment-meta">
          <span>{assignment.subject}</span>
          <span>{assignment.className}</span>
          <span>Due {formatDate(assignment.dueDate)}</span>
        </div>
        <p>{assignment.description}</p>
        <p>{assignment.instructions}</p>

        <form onSubmit={handleSubmit} className="question-stack">
          {assignment.questions.map((question, index) => (
            <div className="question-card" key={question.id || index}>
              <div className="question-head">
                <strong>Question {index + 1}</strong>
                <span>{question.points} marks</span>
              </div>
              <BlockMath math={question.prompt} />
              <textarea
                value={answers[question.id] || ''}
                onChange={(e) => handleChange(question.id, e.target.value)}
                disabled={user.role !== 'student'}
                placeholder="Type your answer here..."
              />
            </div>
          ))}

          {user.role === 'student' && (
            <button type="submit" className="primary-button">Submit assignment</button>
          )}
          {message && <div className="alert success">{message}</div>}
        </form>
      </Panel>
    </div>
  );
}

function SubmissionsPage() {
  const { token, user } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState('');
  const [feedback, setFeedback] = useState('');
  const [score, setScore] = useState('');

  useEffect(() => {
    const loadSubmissions = async () => {
      try {
        const data = await apiFetch('/api/assignments/submissions', {}, token);
        setSubmissions(data.submissions || []);
      } finally {
        setLoading(false);
      }
    };

    if (token) loadSubmissions();
  }, [token]);

  const grade = async (id) => {
    try {
      await apiFetch(`/api/assignments/submissions/${id}/grade`, {
        method: 'PUT',
        body: JSON.stringify({ feedback, score: Number(score) || 0 })
      }, token);
      window.location.reload();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="loading-box">Loading submissions...</div>;

  if (user.role === 'student') {
    return (
      <Panel title="My submission history">
        <div className="table-list">
          {submissions.map((item) => (
            <div className="table-row" key={item._id}>
              <div>
                <strong>{item.assignment?.title}</strong>
                <small>{item.status}</small>
              </div>
              <span className="chip success">{item.percentage || 0}%</span>
            </div>
          ))}
        </div>
      </Panel>
    );
  }

  return (
    <Panel title="Mark submissions">
      <div className="submission-panel">
        {submissions.map((item) => (
          <div className="submission-item" key={item._id}>
            <div>
              <strong>{item.student?.name}</strong>
              <small>{item.assignment?.title}</small>
            </div>
            <div className="grading-box">
              <input type="number" value={selectedId === item._id ? score : item.score || ''} onChange={(e) => {
                setSelectedId(item._id);
                setScore(e.target.value);
              }} placeholder="Score" />
              <textarea value={selectedId === item._id ? feedback : item.feedback || ''} onChange={(e) => {
                setSelectedId(item._id);
                setFeedback(e.target.value);
              }} placeholder="Feedback" />
              <button className="primary-button" onClick={() => grade(item._id)}>Save grade</button>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function StatCard({ title, value, tone }) {
  return (
    <div className={`stat-card ${tone}`}>
      <span>{title}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <section className="panel-card">
      <header>{title}</header>
      <div>{children}</div>
    </section>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/assignments" element={<AssignmentsPage />} />
            <Route path="/assignment/:id" element={<AssignmentPage />} />
            <Route path="/submissions" element={<SubmissionsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
