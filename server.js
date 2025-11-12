const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const app = express();
const port = 3000;

app.use(bodyParser.json());

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

// --- CHỈ CẦN 1 ROUTE GET DUY NHẤT ---
// Bất kể người dùng truy cập route nào (/), server cũng trả về file index.html
// Trình duyệt (JavaScript) sẽ tự quyết định hiện trang nào (login, home, v.v.)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// XÓA app.get("/register.html") - Không cần nữa
// XÓA app.get("/home") - Không cần nữa


// --- CÁC API (POST/GET) VẪN GIỮ NGUYÊN ---
// JavaScript vẫn cần các API này để hoạt động

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
    res.json({ message: "Đăng ký thành công! Sẽ chuyển về trang đăng nhập." });
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
