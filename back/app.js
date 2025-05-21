const express = require('express');
require('dotenv').config();
const cors = require('cors');
const app = express();
const authRoutes = require('./routes/authRoutes');
const articleHierarchyRoutes = require('./routes/articleHierarchyRoutes');
const articleParamRoutes = require('./routes/articleParamRoutes');
const fournisseurRoutes = require('./routes/fournisseurRoutes');
const clientRoutes = require('./routes/clientRoutes');
const articleRoutes = require('./routes/articleRoutes');
const stockRoutes = require('./routes/stockRoutes');

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(cors());
app.use(express.json());
app.use('/auth', authRoutes);
app.use('/article-hierarchy', articleHierarchyRoutes);
app.use('/article-params', articleParamRoutes);
app.use('/fournisseurs', fournisseurRoutes);
app.use('/clients', clientRoutes);
app.use('/articles', articleRoutes);
app.use('/stock', stockRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
