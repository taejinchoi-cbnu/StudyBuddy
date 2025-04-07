require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/test', (req, res) => {
  res.send('Server is running');
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server on port ${port}`));