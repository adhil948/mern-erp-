require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const admin = require('firebase-admin');

// Routes (ensure filenames match actual case on disk)
const authRoutes = require('./routes/auth');
const orgRoutes = require('./routes/org');        // or './routes/Org' if that’s the real filename
const salesRoutes = require('./routes/Sales');    // lowercase recommended
const productRoutes = require('./routes/products');
const crmRoutes = require('./routes/crm');
const purchaseRoutes = require('./routes/purchase'); // Ensure this is the correct path
const supplierRoutes = require('./routes/suppliers'); 

const authenticateFirebaseToken = require('./middleware/auth');

// Firebase Admin init
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
});

const app = express();
app.use(cors());
app.use(express.json());

// Public auth routes (use “light” verify inside routes/auth.js)
app.use('/api/auth', authRoutes);

// Protected org-scoped routes: require active org via full middleware
app.use('/api/products', authenticateFirebaseToken, productRoutes);
app.use('/api/sales', authenticateFirebaseToken, salesRoutes);
app.use('/api/orgs', authenticateFirebaseToken, orgRoutes);
app.use('/api/crm', authenticateFirebaseToken, crmRoutes);
app.use('/api/purchases', authenticateFirebaseToken, purchaseRoutes);
app.use('/api/suppliers', authenticateFirebaseToken, supplierRoutes);

app.get('/', (req, res) => res.send('ERP Backend Running'));
app.get('/api/__health', (req,res) => res.json({ ok: true, routes: ['purchases','suppliers'] }));


// Mongo connection (works for replica set or standalone)
// Ensure your mongod is running and rs.initiate done if using transactions
mongoose.connect(process.env.MONGO_URI, {})
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
