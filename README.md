# 🎨 Workshop Tracker

A modern, full-stack web application for managing creative workshops, tracking income and expenses, and providing insightful analytics for workshop instructors.

## ✨ Features

### 🎯 Core Functionality
- **Workshop Management**: Create, schedule, and manage creative workshops
- **Income Tracking**: Record workshop payments and revenue
- **Expense Management**: Track workshop-related expenses and materials
- **Financial Analytics**: Comprehensive financial insights and reporting

### 🎨 Workshop Types Supported
- Terrarium Design
- Candle Making
- Botanical Wall Art
- Mosaic Crafts
- Pottery & Clay Work
- And many more creative workshops!

### 📊 Dashboard Features
- **Real-time Financial Summary**: Income, expenses, and profit overview
- **Quick Metrics Cards**: Key performance indicators at a glance
- **Upcoming Events**: Smart calendar with workshop scheduling
- **AI-powered Insights**: Intelligent suggestions for business optimization
- **Performance Charts**: Visual analytics with interactive charts
- **Recent Activity Feed**: Timeline of all workshop activities

### 🌟 Modern UI/UX
- **Responsive Design**: Beautiful on desktop, tablet, and mobile
- **Dark Mode Support**: Toggle between light and dark themes
- **Modern Navigation**: Dropdown menus with organized sections
- **Smooth Animations**: Professional hover effects and transitions
- **Accessibility**: WCAG compliant design patterns

## 🛠 Tech Stack

### Frontend
- **React 18** - Modern React with hooks
- **Tailwind CSS** - Utility-first CSS framework
- **Flowbite React** - Professional UI components
- **Lucide React** - Beautiful, customizable icons
- **React Router** - Client-side routing
- **Recharts** - Interactive data visualization
- **Vite** - Fast development build tool

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Real-time subscriptions
  - Authentication & authorization
  - Row Level Security (RLS)

### Development Tools
- **ESLint** - Code linting and formatting
- **Git** - Version control
- **GitHub** - Repository hosting and CI/CD

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/workshop-tracker.git
   cd workshop-tracker
   ```

2. **Install Frontend Dependencies**
   ```bash
   cd frontend
   npm install
   ```

3. **Install Backend Dependencies**
   ```bash
   cd ../backend
   npm install
   ```

4. **Environment Setup**
   ```bash
   # Copy environment templates
   cp .env.example .env
   
   # Add your Supabase credentials
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. **Start Development Servers**
   ```bash
   # Frontend (runs on http://localhost:5173)
   cd frontend
   npm run dev
   
   # Backend (runs on http://localhost:3000)
   cd ../backend
   npm run dev
   ```

## 📱 Project Structure

```
workshop-tracker/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Application pages
│   │   ├── contexts/       # React contexts (Auth, etc.)
│   │   ├── lib/           # Utility libraries
│   │   └── supabase/      # Supabase client configuration
│   ├── public/            # Static assets
│   └── package.json       # Frontend dependencies
├── backend/               # Node.js backend application
│   ├── routes/           # API route handlers
│   ├── supabase/         # Supabase server configuration
│   └── package.json      # Backend dependencies
├── .gitignore            # Git ignore rules
└── README.md            # Project documentation
```

## 🗄 Database Schema

### Core Tables
- **`users`** - User authentication and profiles
- **`incomes`** - Workshop income records
- **`expenses`** - Workshop expense tracking
- **`profiles`** - Extended user profile information

### Key Features
- Row Level Security (RLS) enabled
- Real-time subscriptions
- Automatic timestamps
- Foreign key relationships

## 🎨 Component Architecture

### Enhanced Dashboard Components
- **`QuickMetricsCards`** - Key performance indicators
- **`UpcomingEvents`** - Workshop calendar and reminders
- **`FinancialInsights`** - AI-powered business insights
- **`MiniChartsPanel`** - Interactive data visualizations
- **`UserProfileSnapshot`** - User statistics and achievements
- **`RecentActivityFeed`** - Activity timeline
- **`Navbar`** - Modern responsive navigation

## 🔐 Authentication

- Supabase Auth integration
- Email/password authentication
- Protected routes with context
- Automatic session management
- Row Level Security (RLS)

## 📊 Analytics & Insights

- Financial trend analysis
- Workshop popularity metrics
- Participant engagement tracking
- Revenue optimization suggestions
- Expense category breakdowns

## 🌙 Theming

- Light/Dark mode toggle
- System preference detection
- Persistent theme storage
- Tailwind CSS theming
- Consistent color schemes

## 📱 Responsive Design

- Mobile-first approach
- Tablet optimization
- Desktop enhancements
- Touch-friendly interactions
- Accessible navigation

## 🚀 Deployment

### Frontend Deployment (Vercel/Netlify)
```bash
cd frontend
npm run build
```

### Backend Deployment (Railway/Heroku)
```bash
cd backend
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Convention
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation updates
- `style:` - Formatting changes
- `refactor:` - Code refactoring
- `test:` - Test additions
- `chore:` - Maintenance tasks

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Supabase](https://supabase.com) - Backend infrastructure
- [Tailwind CSS](https://tailwindcss.com) - Styling framework
- [Flowbite](https://flowbite.com) - UI components
- [Lucide](https://lucide.dev) - Icon library
- [Recharts](https://recharts.org) - Chart library

## 📞 Support

For support, email cavgaa228@gmail.com or create an issue in this repository.

---

**Built with ❤️ for creative workshop instructors** 