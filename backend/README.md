# Backend Setup Guide

## MongoDB Atlas Connection

1. **Create a `.env` file** in the backend directory with your MongoDB Atlas connection string:

```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/ExpenseDB?retryWrites=true&w=majority
PORT=5000
```

2. **Replace the connection string** with your actual MongoDB Atlas credentials:
   - Replace `username` with your MongoDB username
   - Replace `password` with your MongoDB password
   - Replace `cluster` with your cluster name

## Database Structure

The application connects to your **existing** `ExpenseDB` database and uses the following collections:

### Collections:
- **users** - User accounts and authentication (existing)
- **companies** - Company information (existing)
- **expenses** - Expense records (existing)
- **approvals** - Approval workflow (existing)
- **approvalRules** - Approval rules configuration (existing)

## Running the Backend

1. **Install dependencies:**
```bash
cd backend
npm install
```

2. **Start the server:**
```bash
npm run dev
```

The server will run on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Admin signup (adds to existing users collection)
- `POST /api/auth/login` - User login (authenticates against existing users)
- `GET /api/auth/users` - Get all users (from existing users collection)
- `POST /api/auth/users` - Create new user (adds to existing users collection)
- `POST /api/auth/send-password/:userId` - Send password to user

## Test Credentials

Based on your existing database, you can login with:
- **Email:** `harsh21@gmail.com`
- **Password:** `harsh21`

## Important Notes

- ✅ **Uses your existing ExpenseDB database** - no new database creation
- ✅ **Connects to existing users collection** - no data loss
- ✅ **Signup adds users to existing collection** - maintains data integrity
- ✅ **Login authenticates against existing users** - uses your current data
- The backend uses simple password comparison (not hashed) for demo purposes
- In production, implement proper password hashing with bcrypt
- The send password feature generates random passwords and logs them to console
- In production, implement actual email sending functionality
