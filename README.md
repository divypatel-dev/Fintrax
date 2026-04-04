# FinTrack - Premium Expense Tracker

A full-stack expense tracking application built with modern technologies. Track your income, expenses, and savings with beautiful analytics and insights.

## 🛠️ Tech Stack

### Frontend
- **React 19** + **TypeScript**
- **Tailwind CSS v4** for styling
- **ShadCN-inspired** UI components (custom built)
- **Recharts** for interactive charts
- **Framer Motion** for animations
- **Zustand** for state management
- **Axios** with interceptors for API calls
- **React Router** for navigation

### Backend
- **Node.js** + **Express 5** + **TypeScript**
- **MongoDB** with **Mongoose** ODM
- **JWT** authentication (access + refresh tokens)
- **Zod** for input validation
- **bcrypt** for password hashing
- **Helmet**, **CORS**, **Rate Limiting** for security

---

## 📁 Project Structure

```
ExpeanseTracker/
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── ui/         # Reusable UI components (Button, Card, Dialog, etc.)
│       │   └── layout/     # App layout (Sidebar, Navbar, AppLayout)
│       ├── pages/          # Page components
│       ├── store/          # Zustand stores (auth, theme)
│       ├── services/       # API service layers
│       ├── types/          # TypeScript types
│       ├── lib/            # Utility functions
│       └── index.css       # Global styles + design system
├── backend/
│   └── src/
│       ├── controllers/    # Route handlers
│       ├── routes/         # Express routes
│       ├── models/         # Mongoose models
│       ├── middleware/      # Auth + error handling middleware
│       ├── validators/     # Zod validation schemas
│       ├── utils/          # JWT + seed utilities
│       ├── config/         # App config + DB connection
│       ├── types/          # TypeScript types
│       └── server.ts       # Express server entry point
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** >= 18
- **MongoDB** (local or Atlas)

### 1. Clone & Install

```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` in the backend directory and update the values:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/expense-tracker
JWT_ACCESS_SECRET=your_secret_here
JWT_REFRESH_SECRET=your_secret_here
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173,https://expense-tracker-frontend-xgou.vercel.app,https://*.vercel.app
```

You can use comma-separated origins or wildcard patterns like `https://*.vercel.app` for Vercel preview deployments.

### 3. Start Development Servers

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

The frontend will be available at `http://localhost:5173`
The backend API will be at `http://localhost:5000`

---

## 📡 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | User registration |
| POST | `/api/auth/login` | No | User login |
| POST | `/api/auth/refresh` | No | Refresh access token |
| POST | `/api/auth/logout` | Yes | Logout user |
| GET | `/api/auth/profile` | Yes | Get user profile |
| PUT | `/api/auth/profile` | Yes | Update user profile |
| GET | `/api/dashboard` | Yes | Dashboard analytics |
| GET | `/api/expenses` | Yes | List expenses (paginated) |
| POST | `/api/expenses` | Yes | Create expense |
| GET | `/api/expenses/:id` | Yes | Get single expense |
| PUT | `/api/expenses/:id` | Yes | Update expense |
| DELETE | `/api/expenses/:id` | Yes | Delete expense |
| GET | `/api/income` | Yes | List income (paginated) |
| POST | `/api/income` | Yes | Create income |
| PUT | `/api/income/:id` | Yes | Update income |
| DELETE | `/api/income/:id` | Yes | Delete income |
| GET | `/api/categories` | Yes | List categories |
| POST | `/api/categories` | Yes | Create custom category |
| DELETE | `/api/categories/:id` | Yes | Delete custom category |

---

## ✨ Features

- 🔐 JWT authentication with refresh token rotation
- 📊 Interactive dashboard with charts
- 💸 Full CRUD for expenses and income
- 🏷️ Predefined + custom categories with emoji icons
- 🔍 Search, filter, and pagination
- 🌙 Dark/Light mode toggle
- 📱 Fully responsive design
- 🎨 Beautiful animations with Framer Motion
- 🔒 Secure API with rate limiting and validation
- 🔄 Recurring expense/income tracking

---

## 📜 License

MIT
