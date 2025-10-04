# Expense Management System

A full-stack expense management application built with React frontend and Node.js/Express backend with MongoDB database.

## Features

### Backend Features
- User authentication and authorization
- Company management
- Expense CRUD operations
- Approval workflow system
- RESTful API endpoints

### Frontend Features
- Modern, responsive UI matching the provided wireframe
- Expense summary cards showing:
  - To Submit expenses (draft state)
  - Waiting Approval expenses (submitted but not approved)
  - Approved expenses
- Data table displaying all expenses with:
  - Employee information
  - Description and category
  - Date and amount
  - Status badges
- Upload functionality for receipt processing (placeholder)
- Navigation between dashboard and expense management

## Database Structure

The system uses MongoDB with the following collections:
- **users**: User accounts with roles (Admin, Manager, Employee)
- **companies**: Company information
- **expenses**: Expense records with status tracking
- **approvals**: Approval workflow records
- **approvalRules**: Company-specific approval rules

## Installation & Setup

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd Odoo25/backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with your MongoDB connection string:
   ```
   MONGO_URI=mongodb://localhost:27017/ExpenseDB
   PORT=5000
   ```

4. Start the backend server:
   ```bash
   npm start
   # or for development with auto-restart:
   npm run dev
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd Odoo25/Frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## Adding Sample Data

To populate the database with sample expenses for testing:

1. Make sure your backend server is running
2. Run the test script:
   ```bash
   cd Odoo25/backend
   node test-expenses.js
   ```

This will create sample expenses in different statuses to demonstrate the UI.

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new user
- `POST /api/auth/login` - User login
- `GET /api/auth/users` - Get all users (Admin only)
- `POST /api/auth/users` - Create new user (Admin only)

### Expenses
- `GET /api/expenses` - Get all expenses
- `GET /api/expenses/summary` - Get expense summary data
- `POST /api/expenses` - Create new expense
- `PUT /api/expenses/:id/status` - Update expense status
- `DELETE /api/expenses/:id` - Delete expense

## Usage

1. **Sign Up/Login**: Create an admin account or login with existing credentials
2. **User Management**: Add new users with different roles (Admin, Manager, Employee)
3. **Expense Management**: Navigate to the expense management page to:
   - View expense summary cards
   - See all expenses in a data table
   - Upload receipts (placeholder functionality)
   - Create new expenses

## UI Design

The expense management interface matches the provided wireframe with:
- Instructions section with upload and new expense buttons
- Three summary cards showing expense totals by status
- Comprehensive data table with all expense details
- Status badges for visual status indication
- Responsive design for mobile and desktop

## Technology Stack

- **Frontend**: React 19, Vite, CSS3
- **Backend**: Node.js, Express.js, MongoDB, Mongoose
- **Database**: MongoDB
- **Styling**: Custom CSS with modern design principles

## Future Enhancements

- OCR integration for receipt processing
- File upload functionality
- Advanced filtering and search
- Email notifications
- Mobile app development
- Advanced reporting and analytics
