const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// เชื่อมต่อฐานข้อมูล
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'project',
});

db.connect(err => {
  if (err) {
    console.error('Database connection error:', err);
    return;
  }
  console.log('Connected to MySQL database.');
});

// ---------------------- ครู (Teacher) ----------------------

// ดึงข้อมูลครูทั้งหมด
app.get('/teacher', (req, res) => {
  db.query('SELECT * FROM teacher', (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
});

// ลงทะเบียนครู
app.post('/teacher', (req, res) => {
  const { name, email, password, subject } = req.body;
  db.query(
    'INSERT INTO teacher (name, email, password, subject) VALUES (?, ?, ?, ?)',
    [name, email, password, subject],
    (err, results) => {
      if (err) return res.status(500).send(err);
      res.json({ id: results.insertId, name, email });
    }
  );
});

// ตรวจสอบอีเมลครู
app.post('/teachers/check-email', (req, res) => {
  const { email } = req.body;
  db.query('SELECT * FROM teacher WHERE email = ?', [email], (err, results) => {
    if (err) return res.status(500).send(err);
    res.json({ exists: results.length > 0 });
  });
});

// รีเซ็ตรหัสผ่านครู
app.put('/teachers/reset-password', (req, res) => {
  const { email, newPassword } = req.body;
  db.query(
    'UPDATE teacher SET password = ? WHERE email = ?',
    [newPassword, email],
    (err, results) => {
      if (err) return res.status(500).send(err);
      res.json({ success: true });
    }
  );
});

// ---------------------- นักเรียน (Student) ----------------------

// ดึงข้อมูลนักเรียนทั้งหมด
app.get('/students', (req, res) => {
  db.query('SELECT * FROM student', (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
});

// ลงทะเบียนนักเรียน
app.post('/students', (req, res) => {
  const { name, email, password } = req.body;
  db.query(
    'INSERT INTO student (name, email, password) VALUES (?, ?, ?)',
    [name, email, password],
    (err, results) => {
      if (err) return res.status(500).send(err);
      res.json({ id: results.insertId, name, email });
    }
  );
});

// ตรวจสอบอีเมลนักเรียน
app.post('/students/check-email', (req, res) => {
  const { email } = req.body;
  db.query('SELECT * FROM student WHERE email = ?', [email], (err, results) => {
    if (err) return res.status(500).send(err);
    res.json({ exists: results.length > 0 });
  });
});

// รีเซ็ตรหัสผ่านนักเรียน
app.put('/students/reset-password', (req, res) => {
  const { email, newPassword } = req.body;
  db.query(
    'UPDATE student SET password = ? WHERE email = ?',
    [newPassword, email],
    (err, results) => {
      if (err) return res.status(500).send(err);
      res.json({ success: true });
    }
  );
});

app.get('/classrooms', (req, res) => {
  db.query('SELECT * FROM classroom', (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
});

app.post('/classrooms', (req, res) => {
  const { classname } = req.body;

  // ตรวจสอบว่าได้กรอกชื่อห้องเรียนหรือไม่
  if (!classname) {
    return res.status(400).json({ message: 'กรุณากรอกข้อมูลห้องเรียน' });
  }

  // ดำเนินการสร้างห้องเรียน
  db.query(
    'INSERT INTO classroom (classname) VALUES (?)',
    [classname],
    (err, results) => {
      if (err) return res.status(500).send(err);
      res.json({ id: results.insertId, classname });
    }
  );
});
// ---------------------- ตั้งค่า Server ----------------------

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:3000`);
});
