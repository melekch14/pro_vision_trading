const express = require('express');
require('dotenv').config();
const cors = require('cors');
const initDb = require('./initDb');
const app = express();
const authRoutes = require('./routes/authRoutes');
const articleHierarchyRoutes = require('./routes/articleHierarchyRoutes');
const articleParamRoutes = require('./routes/articleParamRoutes');
const fournisseurRoutes = require('./routes/fournisseurRoutes');
const clientRoutes = require('./routes/clientRoutes');
const articleRoutes = require('./routes/articleRoutes');
const stockRoutes = require('./routes/stockRoutes');
const supplementaryPriceRoutes = require('./routes/supplementaryPriceRoutes');
const opticienRoutes = require('./routes/opticienRoutes');
const orderRoutes = require('./routes/orderRoutes');
const statisticsRoutes = require('./routes/statisticsRoutes');
const profileUpdateRequestRoutes = require('./routes/profileUpdateRequestRoutes');
const blRoutes = require('./routes/blRoutes');
const activityHistoryRoutes = require('./routes/activityHistoryRoutes');
const activityLogger = require('./middleware/activityLogger');

// Debug middleware to log all requests
app.use((req, res, next) => {
    console.log('Incoming request:', req.method, req.originalUrl);
    next();
});

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());

// Activity logging middleware (should be after express.json to access req.body)
app.use(activityLogger);

// Routes
app.use('/auth', authRoutes);
app.use('/article-hierarchy', articleHierarchyRoutes);
app.use('/article-params', articleParamRoutes);
app.use('/fournisseurs', fournisseurRoutes);
app.use('/clients', clientRoutes);
app.use('/articles', articleRoutes);
app.use('/stock', stockRoutes);
app.use('/supplementary-prices', supplementaryPriceRoutes);
app.use('/opticiens', opticienRoutes);
app.use('/orders', orderRoutes);
app.use('/statistics', statisticsRoutes);
app.use('/profile-update-requests', profileUpdateRequestRoutes);
app.use('/bl', blRoutes);
app.use('/activity-history', activityHistoryRoutes);

// Test route to verify server is working
app.get('/test', (req, res) => {
    console.log('Test route hit');
    res.json({ message: 'Server is working' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 3080;

// Initialize DB then start server
initDb().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}).catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
});
