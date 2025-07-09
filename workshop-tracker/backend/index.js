const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Basic route for testing
app.get('/', (req, res) => {
  res.json({ message: 'Workshop Tracker API is running' });
});

// Import routes
const expenseRoutes = require('./routes/expense');
const incomeRoutes = require('./routes/income');
const summaryRoutes = require('./routes/summary');

// Use routes
app.use('/api/expense', expenseRoutes);
app.use('/api/income', incomeRoutes);
app.use('/api/summary', summaryRoutes);

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ error: 'Not Found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 3000;

// Wrap server startup in try-catch
try {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log('Environment:', process.env.NODE_ENV || 'development');
  });
} catch (error) {
  console.error('Failed to start server:', error);
  process.exit(1);
} 