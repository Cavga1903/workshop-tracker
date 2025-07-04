import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Menu, 
  X, 
  ChevronDown,
  BarChart3,
  DollarSign,
  CreditCard,
  FileText,
  TrendingUp,
  PieChart,
  Plus,
  User,
  LogOut,
  Sun,
  Moon,
  Settings
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Check for dark mode preference
  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true' || 
                   (!localStorage.getItem('darkMode') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setIsDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (!error) {
      navigate('/login');
    }
  };

  const toggleDropdown = (dropdown) => {
    setOpenDropdown(openDropdown === dropdown ? null : dropdown);
  };

  const closeDropdowns = () => {
    setOpenDropdown(null);
  };

  const actionItems = [
    { path: '/add-income', name: 'Add Income', icon: Plus },
    { path: '/add-expense', name: 'Add Expense', icon: Plus },
    { path: '/incomes', name: 'Income Records', icon: DollarSign },
    { path: '/expenses', name: 'Expense Records', icon: CreditCard },
    ...(profile?.role === 'admin' ? [{ path: '/admin/class-types', name: 'Manage Class Types', icon: Settings }] : []),
  ];

  const analyticsItems = [
    { path: '/category-breakdown', name: 'Category Breakdown', icon: PieChart },
    { path: '/class-income-breakdown', name: 'Class Income', icon: BarChart3 },
    { path: '/monthly-trend', name: 'Monthly Trend', icon: TrendingUp },
  ];

  const DropdownMenu = ({ items, isOpen, onClose }) => (
    <div className={`
      absolute top-full left-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg 
      border border-gray-200 dark:border-gray-700 py-2 z-50 transform transition-all duration-200
      ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}
    `}>
      {items.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          onClick={onClose}
          className={({ isActive }) => `
            flex items-center gap-3 px-4 py-2 text-sm transition-colors duration-200
            ${isActive 
              ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300' 
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }
          `}
        >
          <item.icon className="h-4 w-4" />
          {item.name}
        </NavLink>
      ))}
    </div>
  );

  const MobileMenu = () => (
    <div className={`
      md:hidden fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity duration-300
      ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
    `}>
      <div className={`
        fixed inset-y-0 left-0 w-80 bg-white dark:bg-gray-800 shadow-xl transform transition-transform duration-300
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <span className="text-xl font-bold text-blue-600 dark:text-blue-400">Workshop Tracker</span>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-4 space-y-4">
          <NavLink
            to="/"
            onClick={() => setIsMobileMenuOpen(false)}
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200
              ${isActive 
                ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300' 
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }
            `}
          >
            <BarChart3 className="h-5 w-5" />
            Dashboard
          </NavLink>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-4">
              Actions
            </h3>
            {actionItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) => `
                  flex items-center gap-3 px-4 py-2 rounded-lg transition-colors duration-200
                  ${isActive 
                    ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }
                `}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </NavLink>
            ))}
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-4">
              Analytics
            </h3>
            {analyticsItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) => `
                  flex items-center gap-3 px-4 py-2 rounded-lg transition-colors duration-200
                  ${isActive 
                    ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }
                `}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </NavLink>
            ))}
          </div>

          <NavLink
            to="/who-paid"
            onClick={() => setIsMobileMenuOpen(false)}
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200
              ${isActive 
                ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300' 
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }
            `}
          >
            <FileText className="h-5 w-5" />
            Who Paid
          </NavLink>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <NavLink to="/" className="flex items-center space-x-2">
              <BarChart3 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                Workshop Tracker
              </span>
            </NavLink>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <NavLink
                to="/"
                className={({ isActive }) => `
                  flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200
                  ${isActive 
                    ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }
                `}
              >
                <BarChart3 className="h-5 w-5" />
                Dashboard
              </NavLink>

              {/* Actions Dropdown */}
              <div className="relative">
                <button
                  onClick={() => toggleDropdown('actions')}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 
                           text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <Plus className="h-5 w-5" />
                  Actions
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${
                    openDropdown === 'actions' ? 'rotate-180' : ''
                  }`} />
                </button>
                <DropdownMenu 
                  items={actionItems} 
                  isOpen={openDropdown === 'actions'} 
                  onClose={closeDropdowns}
                />
              </div>

              {/* Analytics Dropdown */}
              <div className="relative">
                <button
                  onClick={() => toggleDropdown('analytics')}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 
                           text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <PieChart className="h-5 w-5" />
                  Analytics
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${
                    openDropdown === 'analytics' ? 'rotate-180' : ''
                  }`} />
                </button>
                <DropdownMenu 
                  items={analyticsItems} 
                  isOpen={openDropdown === 'analytics'} 
                  onClose={closeDropdowns}
                />
              </div>

              <NavLink
                to="/who-paid"
                className={({ isActive }) => `
                  flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200
                  ${isActive 
                    ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }
                `}
              >
                <FileText className="h-5 w-5" />
                Who Paid
              </NavLink>
            </div>

            {/* Right Side - User Menu and Dark Mode Toggle */}
            <div className="flex items-center space-x-4">
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {isDarkMode ? (
                  <Sun className="h-5 w-5 text-yellow-500" />
                ) : (
                  <Moon className="h-5 w-5 text-gray-600" />
                )}
              </button>

              {/* User Menu */}
              {user && (
                <div className="relative">
                  <button
                    onClick={() => toggleDropdown('user')}
                    className="flex items-center gap-2 p-2 rounded-lg transition-all duration-200 
                             hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <div className="w-8 h-8 bg-blue-600 dark:bg-blue-500 rounded-full flex items-center justify-center">
                      {profile?.avatar_url ? (
                        <img 
                          src={profile.avatar_url} 
                          alt="Avatar" 
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <User className="h-5 w-5 text-white" />
                      )}
                    </div>
                    <div className="hidden sm:block text-left">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {profile?.full_name || 'User'}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {user.email}
                      </div>
                    </div>
                    <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${
                      openDropdown === 'user' ? 'rotate-180' : ''
                    }`} />
                  </button>
                  
                  <div className={`
                    absolute top-full right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg 
                    border border-gray-200 dark:border-gray-700 py-2 z-50 transform transition-all duration-200
                    ${openDropdown === 'user' ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}
                  `}>
                    <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {profile?.full_name || 'User'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {user.email}
                      </p>
                    </div>
                    <NavLink
                      to="/profile"
                      onClick={closeDropdowns}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 
                               hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                    >
                      <Settings className="h-4 w-4" />
                      Profile Settings
                    </NavLink>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 
                               hover:bg-red-50 dark:hover:bg-red-900 transition-colors duration-200 w-full text-left"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden p-2 rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <MobileMenu />

      {/* Click Outside to Close Dropdowns */}
      {openDropdown && (
        <div 
          className="fixed inset-0 z-30" 
          onClick={closeDropdowns}
        />
      )}
    </>
  );
} 