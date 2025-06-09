require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

// 미들웨어 설정
app.use(cors());
app.use(express.json());

// 라우트 import
const authRoutes = require('./routes/auth');

// API 라우트 등록
app.use('/api/auth', authRoutes);

app.get('/api/test', (req, res) => {
  res.send('Server is running');
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));