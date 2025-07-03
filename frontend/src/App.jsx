import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Flowbite } from 'flowbite-react';

import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

// Auth pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';

// Protected pages
import AddIncome from './pages/AddIncome';
import AddExpense from './pages/AddExpense';
import IncomeList from './pages/IncomeList';
import ExpenseList from './pages/ExpenseList';
import Summary from './pages/Summary';
import WhoPaid from './pages/WhoPaid';
import CategoryBreakdown from './pages/CategoryBreakdown';
import ClassIncomeBreakdown from './pages/ClassIncomeBreakdown';
import MonthlyTrend from './pages/MonthlyTrend';



function AppContent() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />

      {/* Main Content */}
      <div className="pt-20 pb-8 px-4">
        <div className="max-w-7xl mx-auto">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            
            {/* Protected routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <Summary />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/add-income" element={
              <ProtectedRoute>
                <AddIncome />
              </ProtectedRoute>
            } />
            <Route path="/incomes" element={
              <ProtectedRoute>
                <IncomeList />
              </ProtectedRoute>
            } />
            <Route path="/add-expense" element={
              <ProtectedRoute>
                <AddExpense />
              </ProtectedRoute>
            } />
            <Route path="/expenses" element={
              <ProtectedRoute>
                <ExpenseList />
              </ProtectedRoute>
            } />
            <Route path="/summary" element={
              <ProtectedRoute>
                <Summary />
              </ProtectedRoute>
            } />
            <Route path="/who-paid" element={
              <ProtectedRoute>
                <WhoPaid />
              </ProtectedRoute>
            } />
            <Route path="/category-breakdown" element={
              <ProtectedRoute>
                <CategoryBreakdown />
              </ProtectedRoute>
            } />
            <Route path="/class-income-breakdown" element={
              <ProtectedRoute>
                <ClassIncomeBreakdown />
              </ProtectedRoute>
            } />
            <Route path="/monthly-trend" element={
              <ProtectedRoute>
                <MonthlyTrend />
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Flowbite>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </Flowbite>
    </Router>
  );
}

export default App;
