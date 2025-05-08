const express = require('express');
require('dotenv').config();

const app = express();
const authRoutes = require('./routes/authRoutes');

app.use(express.json());
app.use('/auth', authRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
