# 🎨 Workshop Tracker

A modern, full-stack web application for managing creative workshops, tracking income and expenses, and providing insightful analytics for workshop instructors.

## ✨ Features

### 🎯 Core Functionality
- **Workshop & Client Management**: Create, schedule, and manage creative workshops and clients.
- **Document Storage**: Upload and manage invoices, receipts, and other documents.
- **Income & Expense Tracking**: Record workshop payments, revenue, and related expenses.
- **Financial Analytics**: Comprehensive financial insights and reporting with interactive charts.
- **Calendar View**: Visualize upcoming workshops in a calendar.

### 📊 Dashboard Features
- **Real-time Financial Summary**: Income, expenses, and profit overview.
- **Quick Metrics Cards**: Key performance indicators at a glance.
- **Upcoming Events**: Smart calendar with workshop scheduling.
- **AI-powered Insights**: Intelligent suggestions for business optimization.
- **Recent Activity Feed**: Timeline of all workshop activities.

### 🌟 Modern UI/UX
- **Responsive Design**: Beautiful on desktop, tablet, and mobile.
- **Dark Mode Support**: Toggle between light and dark themes.
- **Modern Navigation**: Dropdown menus with organized sections.
- **Smooth Animations**: Professional hover effects and transitions.

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
- **Node.js & Express.js**: Powers the backend API.
- **Supabase**: Backend-as-a-Service for:
  - PostgreSQL database
  - Real-time subscriptions
  - Authentication & Authorization (RLS)
  - File Storage

### Development Tools
- **Concurrently**: Runs frontend and backend servers simultaneously.
- **ESLint**: Code linting and formatting.
- **Git & GitHub**: Version control and repository hosting.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)
- A Supabase account

### Installation & Setup

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/Cavga1903/workshop-tracker.git
    cd workshop-tracker
    ```

2.  **Install All Dependencies**
    This single command installs dependencies for the root, frontend, and backend.
    ```bash
    npm run install:all
    ```

3.  **Set Up Environment Variables**

    You need to create two `.env` files, one for the frontend and one for the backend.

    *   **Frontend Environment (`frontend/.env`)**:
        Create a file named `.env` inside the `frontend` directory and add your Supabase credentials. These keys are safe to expose in the browser.
        ```
        VITE_SUPABASE_URL=YOUR_SUPABASE_URL
        VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
        ```

    *   **Backend Environment (`backend/.env`)**:
        Create a file named `.env` inside the `backend` directory. Add your Supabase URL and **Service Role Key**. This key has full access and must be kept secret.
        ```
        SUPABASE_URL=YOUR_SUPABASE_URL
        SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
        ```

4.  **Run Database Migration**
    - Log in to your Supabase project.
    - Go to the **SQL Editor**.
    - Open the `database-migration.sql` file from this project, copy its content, and run it in the Supabase SQL Editor. This will set up all the required tables and policies.

5.  **Start the Development Servers**
    Run the following command from the root directory to start both frontend and backend servers.
    ```bash
    npm run dev
    ```
    - Frontend will be available at `http://localhost:5173`
    - Backend will be available at `http://localhost:3000`

## 📱 Project Structure

```
.
├── backend/            # Node.js & Express.js API
│   ├── routes/
│   ├── supabase/
│   ├── .env            # (Create this) Backend environment variables
│   └── package.json
├── frontend/           # React & Vite Frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── contexts/
│   │   └── utils/
│   ├── .env            # (Create this) Frontend environment variables
│   └── package.json
├── supabase/           # Supabase-specific configurations (e.g., functions)
├── scripts/            # Automation scripts
├── .gitignore
├── database-migration.sql # Main database setup script
├── package.json        # Root package with concurrently script
└── README.md
```

## 🗄 Database Schema

The `database-migration.sql` script creates the following core tables:

- **`profiles`**: Extends `auth.users` with profile data like name, role, etc.
- **`class_types`**: Stores different types of workshops offered (e.g., Terrarium, Pottery).
- **`clients`**: Manages information about clients or companies.
- **`workshops`**: Schedules and details of each workshop event.
- **`workshop_participants`**: Links clients to workshops they attend.
- **`incomes`**: Tracks revenue from workshops.
- **`expenses`** - Tracks workshop-related expenses.
- **`documents`**: Stores uploaded files (invoices, contracts) linked to other records.
- **`email_notifications`**: Logs notifications sent from the system.

## 🔐 Authentication

- **Supabase Auth**: Manages user sign-up, sign-in, and sessions.
- **Email/Password Authentication**: Standard login method.
- **Domain Restriction**: Sign-up and login are restricted to company emails (`@kraftstories.com`, `@kraftuniverse.com`).
- **Protected Routes**: Ensures only authenticated users can access private pages.
- **Row Level Security (RLS)**: Enforces data access rules at the database level, ensuring users can only see their own data.

## 🚀 Deployment

### Frontend (Vercel/Netlify)
```bash
# In the /frontend directory
npm run build
```
Deploy the generated `dist` folder. Remember to set the environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) in your hosting provider's settings.

### Backend (Railway/Heroku/Render)
```bash
# In the /backend directory
npm start
```
Deploy the backend as a Node.js application. Remember to set the environment variables (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `PORT`) in your hosting provider's settings.

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