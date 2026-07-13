const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db.js');
const upload = require('./middleware/uploadMiddleware');

// Routes Import
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const timetableRoutes = require('./routes/timetableRoutes');
const feeRoutes = require('./routes/feeRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const noticeRoutes = require('./routes/noticeRoutes');
const supportRoutes = require('./routes/supportRoutes');
const syllabusRoutes = require('./routes/syllabusRoutes');
const libraryRoutes = require('./routes/libraryRoutes');
const liveClassRoutes = require('./routes/liveClassRoutes');
const superAdminRoutes = require('./routes/superAdminRoutes');
const schoolRoutes = require('./routes/schoolRoutes');
const technicalRoutes = require('./routes/technicalRoutes');
const homeworkRoutes = require('./routes/homeworkRoutes');
const feeNoticeRoutes = require('./routes/feeNoticeRoutes');
const leaveRoutes = require('./routes/leaveRoutes');
const studentRoutes = require('./routes/studentRoutes');
const examSyllabusRoutes = require('./routes/examSyllabusRoutes');
const datesheetRoutes = require('./routes/datesheetRoutes');
const admitCardRoutes = require('./routes/admitCardRoutes');
const resultRoutes = require('./routes/resultRoutes');
const academicCalendarRoutes = require('./routes/academicCalendarRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');

dotenv.config();

// Database Connection
connectDB();
require('./utils/paymentCron');
require('./utils/penaltyCron');

const app = express();

/* =========================
   CORS CONFIGURATION
========================= */

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://eduflowai.uk",
  "https://www.eduflowai.uk"
];

app.use(cors({
  origin: function (origin, callback) {
    // Postman ya mobile apps ke liye
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization"
  ]
}));

// Preflight requests handle karega
app.options('*', cors());

/* ========================= */

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Static Uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Upload Route
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  res.send(`/${req.file.path.replace(/\\/g, "/")}`);
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/syllabus', syllabusRoutes);
app.use('/api/library', libraryRoutes);
app.use('/api/liveclass', liveClassRoutes);
app.use('/api/superadmin', superAdminRoutes);
app.use('/api/school', schoolRoutes);
app.use('/api/technical', technicalRoutes);
app.use('/api/homework', homeworkRoutes);
app.use('/api/fee-notices', feeNoticeRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/exam-syllabus', examSyllabusRoutes);
app.use('/api/datesheet', datesheetRoutes);
app.use('/api/admitcard', admitCardRoutes);
app.use('/api/exam-results', resultRoutes);
app.use('/api/academic-calendar', academicCalendarRoutes);
app.use('/api/feedback', feedbackRoutes);

app.get('/', (req, res) => {
  res.send('EduFlowAI API is running...');
});

// 404
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(
    `🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`
  );
});