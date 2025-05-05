const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

// เชื่อมต่อฐานข้อมูล MySQL
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'project',  // ชื่อฐานข้อมูลที่ใช้
});

db.connect((err) => {
  if (err) {
    console.error('Database connection error:', err);
    return;
  }
  console.log('Connected to MySQL database.');
});

// ---------------------- API สำหรับเพิ่มข้อสอบวิทย์ ----------------------
app.post('/science_questions', (req, res) => {
  console.log('Received body:', req.body);  // เพิ่มบรรทัดนี้เพื่อตรวจสอบข้อมูลที่รับเข้ามาจาก frontend
  const { examTitle, question, choices, answer } = req.body;

  if (choices.length !== 4) {
    return res.status(400).json({ error: 'กรุณากรอกตัวเลือกคำตอบให้ครบ 4 ตัวเลือก' });
  }

  if (!answer || !choices.includes(answer)) {
    return res.status(400).json({ error: 'กรุณากรอกเฉลยที่ถูกต้อง และต้องเป็นหนึ่งในตัวเลือก' });
  }

  db.query(
    'INSERT INTO science_questions (examTitle, question, choice1, choice2, choice3, choice4, answer) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [examTitle, question, choices[0], choices[1], choices[2], choices[3], answer],
    (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการบันทึกข้อสอบ', details: err.message });
      }
      res.json({ id: results.insertId, examTitle, question, choices, answer });
    }
  );
});
//ตรวจสอบเมลที่ใช้ลงทะเบียน
app.post('/check-email', (req, res) => {
  const { email } = req.body;

  // Check if the email already exists in the database
  db.query('SELECT * FROM teacher WHERE email = ? UNION SELECT * FROM student WHERE email = ?', [email, email], (err, results) => {
    if (err) {
      console.error('Error checking email:', err);
      return res.status(500).send(err);
    }
    res.json({ exists: results.length > 0 });
  });
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

// ---------------------- ห้องเรียน (Classroom) ----------------------

// ดึงข้อมูลห้องเรียนทั้งหมด
app.get('/classrooms', (req, res) => {
  db.query('SELECT * FROM classroom', (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
});

// ลงทะเบียนห้องเรียน
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
// ---------------------- API สำหรับตรวจสอบการเข้าสู่ระบบ ----------------------
app.post('/login', (req, res) => {
  const { username, password, userType } = req.body; // ดึงข้อมูลจากฝั่ง Frontend

  let table = '';
  if (userType === 'teacher') {
    table = 'teacher';
  } else if (userType === 'student') {
    table = 'student';
  } else {
    return res.status(400).send('ไม่พบประเภทผู้ใช้');
  }

  // ตรวจสอบชื่อผู้ใช้และรหัสผ่าน
  db.query(
    `SELECT * FROM ${table} WHERE email = ? AND password = ?`,
    [username, password],
    (err, results) => {
      if (err) {
        console.error('Error checking login:', err);
        return res.status(500).send(err);
      }

      if (results.length > 0) {
        // หากข้อมูลตรงกัน
        res.json({ success: true, message: 'เข้าสู่ระบบสำเร็จ' });
      } else {
        // หากข้อมูลไม่ตรง
        res.json({ success: false, message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
      }
    }
  );
});

app.get('/examTitle', (req, res) => {
  // คำสั่ง SQL สำหรับดึงชื่อข้อสอบทั้งหมดจากฐานข้อมูล
  db.query('SELECT DISTINCT examTitle FROM science_questions', (err, results) => {
    if (err) {
      console.error('Error fetching exam titles:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    // ตรวจสอบว่ามีผลลัพธ์หรือไม่
    if (!results || results.length === 0) {
      return res.status(404).json({ message: 'No exam titles found' });
    }

    // ส่งชื่อข้อสอบที่ดึงมา
    res.json({ exams: results }); // ส่งผลลัพธ์เป็น "exams" field
  });
});

app.get('/science_questions', (req, res) => {
  const examTitle = req.query.examTitle; // รับพารามิเตอร์ examTitle จาก URL เช่น ?examTitle=Science
  if (!examTitle) {
    return res.status(400).send('examTitle is required');
  }
  const query = 'SELECT * FROM science_questions WHERE examTitle = ?';
  db.query(query, [examTitle], (err, results) => {
    if (err) {
      console.error('Error fetching science questions:', err);
      return res.status(500).json({ error: 'Error fetching questions' });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: 'No questions found for this examTitle' });
    }
    res.json(results);
  });
});



app.post('/science_answers', (req, res) => {
  const { answers, examTitle, studentId } = req.body;  // รับ studentId จากฝั่ง frontend
  if (!studentId) {
    return res.status(400).json({ error: 'ต้องระบุ Student ID' });
  }

  let correctAnswers = 0;

  // บันทึกคำตอบลงในฐานข้อมูล
  Object.keys(answers).forEach((questionId) => {
    // ตรวจสอบคำถามที่นักเรียนเลือก
    db.query('SELECT question, answer FROM science_questions WHERE id = ?', [questionId], (err, results) => {
      if (err) {
        console.error('เกิดข้อผิดพลาดในการดึงคำถามและคำตอบที่ถูกต้อง:', err);
        return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงคำถามและคำตอบที่ถูกต้อง' });
      }

      if (results.length > 0) {
        const question = results[0].question;  // คำถามจากฐานข้อมูล
        const correctAnswer = results[0].answer;  // คำตอบที่ถูกต้องจากฐานข้อมูล

        // ตรวจสอบว่าคำตอบที่นักเรียนเลือกถูกต้องหรือไม่
        const isCorrect = answers[questionId] === correctAnswer;
        if (isCorrect) {
          correctAnswers++;
        }

        // บันทึกคำตอบลงในฐานข้อมูล พร้อมคะแนน และคำถาม
        db.query(
          'INSERT INTO science_answers (studentId, examTitle, question, selected_choices, score) VALUES (?, ?, ?, ?, ?)',
          [studentId, examTitle, question, answers[questionId], isCorrect ? 1 : 0], // บันทึกคะแนนเป็น 1 หรือ 0
          (err, results) => {
            if (err) {
              console.error('เกิดข้อผิดพลาดในการบันทึกคำตอบ:', err);
              return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการบันทึกคำตอบ' });
            }
          }
        );
      }
    });
  });

  // ส่งคะแนนที่นักเรียนทำได้กลับไปที่ frontend
  res.json({ success: true, correctAnswers });
});

//หน้าข้อสอบของครู
db.connect((err) => {
  if (err) {
    console.error('ไม่สามารถเชื่อมต่อกับฐานข้อมูลได้:', err);
    return;
  }
  console.log('เชื่อมต่อกับฐานข้อมูลสำเร็จ');
});

// API สำหรับดึงข้อมูลข้อสอบ
app.get('/science_questions', (req, res) => {
  try {
    const examTitle = req.query.examTitle; // รับพารามิเตอร์ examTitle
    if (!examTitle) {
      return res.status(400).send('examTitle is required');
    }

    const query = 'SELECT * FROM science_questions WHERE examTitle = ?';
    db.query(query, [examTitle], (err, results) => {
      if (err) {
        console.error('Error fetching science questions:', err);
        return res.status(500).json({ error: 'Error fetching questions' });
      }
      if (results.length === 0) {
        return res.status(404).json({ message: 'No questions found for this examTitle' });
      }
      res.json(results);
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return res.status(500).json({ error: 'Unexpected error occurred' });
  }
});

// ---------------------- ตั้งค่า Server ----------------------

// ตั้งค่า Server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

