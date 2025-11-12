const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const app = express();
const port = 3000;

app.use(bodyParser.json());

// DÒNG NÀY ĐÃ BỊ XÓA (vì chúng ta không còn thư mục "public" nữa)
// app.use(express.static(path.join(__dirname, "public")));

const db = new sqlite3.Database('./users.db', (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('✅ Đã kết nối tới CSDL SQLite.');
});

db.run(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE,
  password TEXT
)`, (err) => {
  if (err) {
    console.error("Lỗi khi tạo bảng:", err.message);
  }
});


// --- CẬP NHẬT CÁC ĐƯỜNG DẪN FILE ---

// 1. Trang chủ (login) -> Bỏ chữ "public"
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// 2. Thêm route cho trang register.html (Vì <a href="/register.html">)
app.get("/register.html", (req, res) => {
  res.sendFile(path.join(__dirname, "register.html"));
});

// 3. Thêm route cho trang home.html (JS chuyển hướng tới "/home")
app.get("/home", (req, res) => {
  res.sendFile(path.join(__dirname, "home.html"));
});


// --- CÁC API (POST) VÀ LOGIC CSDL KHÔNG THAY ĐỔI ---

app.post("/register", (req, res) => {
  const { username, password } = req.body;
  const sql = `INSERT INTO users (username, password) VALUES (?, ?)`;
  
  db.run(sql, [username, password], function(err) {
    if (err) {
      if (err.message.includes("UNIQUE constraint failed")) {
        return res.status(400).json({ message: "Tên người dùng đã tồn tại!" });
      }
      console.error(err.message);
      return res.status(500).json({ message: "Lỗi phía máy chủ." });
    }
    res.json({ message: "Đăng ký thành công! Hãy quay lại đăng nhập." });
  });
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const sql = `SELECT * FROM users WHERE username = ? AND password = ?`;

  db.get(sql, [username, password], (err, user) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ message: "Lỗi phía máy chủ." });
    }
    if (!user) {
      return res.status(401).json({ message: "Sai tên đăng nhập hoặc mật khẩu!" });
    }
    res.json({ message: `Đăng nhập thành công`, username: user.username });
  });
});

// API lấy danh sách user (Nếu bạn có dùng)
app.get("/api/users", (req, res) => {
  const sql = `SELECT username FROM users ORDER BY username`;
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ message: "Lỗi phía máy chủ." });
    }
    res.json(rows);
  });
});

app.listen(port, () => console.log(`✅ Server chạy tại http://localhost:${port}`));
