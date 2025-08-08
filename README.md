# Internal Slack - Authentication System

A modern authentication system built with Node.js, Express, React, and Supabase. Features department-based role management with automatic table creation and seamless user experience.

## 🚀 Features

- **Department-based Role System**: Techlab and BPO departments with specific roles
- **Automatic Table Creation**: Database tables are created on-demand
- **Seamless Authentication**: Auto-signin after signup
- **Modern UI**: Dark glass-morphism design
- **Role Management**: Dynamic role creation based on department
- **Token-based Authentication**: JWT tokens for secure API access

## 📋 Prerequisites

Before running this project, make sure you have:

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **Supabase Account** with a project created
- **Git** (for cloning)

## 🛠️ Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Internal-Slack
```

### 2. Set Up Supabase

1. **Create a Supabase Project**:
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note down your project URL and API keys

2. **Get Your Supabase Credentials**:
   - Go to Settings → API
   - Copy your `Project URL` and `anon public` key
   - Go to Settings → Database → Password
   - Set a database password (you'll need this for migrations)

### 3. Environment Setup

#### Backend Environment
Create a `.env` file in the `Backend` directory:
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
PORT=3000
```

#### Frontend Environment
Create a `.env` file in the `Frontend` directory:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Install Dependencies

#### Backend Dependencies
```bash
cd Backend
npm install
```

#### Frontend Dependencies
```bash
cd Frontend
npm install
```

### 5. Database Setup

1. **Link Your Project**:
   ```bash
   cd Backend
   npx supabase login
   npx supabase link --project-ref your-project-ref
   ```

2. **Push Database Migrations**:
   ```bash
   npx supabase db push
   ```

## 🏃‍♂️ Running the Project

### Start Backend Server
```bash
cd Backend
npm start
```
The server will start at `http://localhost:3000`

### Start Frontend Development Server
```bash
cd Frontend
npm run dev
```
The frontend will start at `http://localhost:5173`

## 🏗️ Project Structure

```
Internal Slack/
├── Backend/
│   ├── config/
│   │   └── supabase.js          # Supabase client configuration
│   ├── models/
│   │   ├── users.js             # Users table schema and creation
│   │   └── roles.js             # Roles table schema and creation
│   ├── services/
│   │   └── authService.js       # Authentication business logic
│   ├── routes/
│   │   └── authRoutes.js        # API endpoints
│   ├── middleware/
│   │   └── auth.js              # Token authentication middleware
│   ├── supabase/
│   │   └── migrations/          # Database migrations
│   ├── server.js                # Express server setup
│   └── package.json
├── Frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth.jsx         # Main auth container
│   │   │   ├── SignUp.jsx       # Signup form with department/role
│   │   │   └── SignIn.jsx       # Signin form
│   │   ├── CSS/
│   │   │   ├── Auth.css         # Dark glass-morphism styling
│   │   │   └── variables.css    # CSS variables for theming
│   │   ├── config/
│   │   │   └── supabase.js      # Frontend Supabase client
│   │   ├── App.jsx              # Main React component
│   │   └── main.jsx             # React entry point
│   └── package.json
└── README.md
```

## 🔐 Authentication Flow

### 1. Signup Process
```
User Input → Validation → Create Auth User → Create Role → Create Public User → Auto Signin → Return Token
```

**Steps:**
1. User fills signup form (name, email, password, department, role)
2. Backend validates input
3. Creates user in `auth.users` (Supabase Auth)
4. Creates/gets role in `public.roles` table
5. Creates user in `public.users` table
6. Automatically signs in the user
7. Returns access token and user data
8. Frontend stores token in localStorage

### 2. Signin Process
```
User Input → Validation → Signin → Get User Details → Return Token
```

**Steps:**
1. User provides email and password
2. Backend validates credentials
3. Signs in user via Supabase Auth
4. Retrieves user details from `public.users`
5. Returns access token and user data
6. Frontend stores token in localStorage

## 🗄️ Database Schema

### Roles Table
```sql
CREATE TABLE public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_name VARCHAR(100) NOT NULL,
    department_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(role_name, department_name)
);
```

### Users Table
```sql
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role_id UUID REFERENCES roles(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🏢 Department and Role System

### Techlab Department
- **software engineer**
- **team lead**
- **manager**
- **admin**

### BPO Department
- **agent**
- **player**
- **admin**
- **executives**

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/signin` - Sign in existing user
- `POST /api/auth/signout` - Sign out user
- `GET /api/auth/me` - Get current user details

### Roles
- `GET /api/auth/roles/:department` - Get roles by department

## 🎨 UI Features

- **Dark Glass-morphism Design**: Modern translucent UI
- **Responsive Layout**: Works on all device sizes
- **Dynamic Role Selection**: Role dropdown updates based on department
- **Form Validation**: Client-side and server-side validation
- **Error Handling**: User-friendly error messages
- **Loading States**: Visual feedback during operations

## 🔒 Security Features

- **JWT Token Authentication**: Secure API access
- **Password Validation**: Minimum 6 characters
- **Email Validation**: Proper email format checking
- **Role-based Access**: Department-specific roles
- **Automatic Cleanup**: Failed signups are cleaned up
- **CORS Protection**: Cross-origin request handling

## 🚀 Key Features

### Automatic Table Creation
- Tables are created on-demand when first user signs up
- Uses `exec_sql` function for dynamic SQL execution
- No manual database setup required

### Seamless User Experience
- Auto-signin after successful signup
- No need to sign in separately after registration
- Token is immediately available for API calls

### Department-based Role Management
- Roles are created automatically when needed
- Department-specific role lists
- Dynamic role creation during signup

## 🐛 Troubleshooting

### Common Issues

1. **"Could not find the function public.exec_sql"**
   - Run `npx supabase db push` to apply migrations

2. **"Access token not provided"**
   - Run `npx supabase login` to authenticate CLI

3. **"Project ref not found"**
   - Check your project reference ID in Supabase dashboard
   - Run `npx supabase link --project-ref YOUR_PROJECT_REF`

4. **CORS Errors**
   - Ensure backend is running on port 3000
   - Check CORS configuration in `server.js`

5. **Environment Variables Not Loading**
   - Verify `.env` files are in correct locations
   - Check for spaces around `=` in `.env` files

### Database Issues
- **Tables not created**: Check if `exec_sql` function exists
- **Foreign key errors**: Ensure roles table is created before users table
- **Connection issues**: Verify Supabase credentials

## 🔄 Development Workflow

1. **Start Backend**: `cd Backend && npm start`
2. **Start Frontend**: `cd Frontend && npm run dev`
3. **Test Signup**: Create new account with department/role
4. **Test Signin**: Sign in with existing account
5. **Check Database**: Verify data in Supabase dashboard

## 📝 Future Enhancements

- [ ] Dashboard interface
- [ ] User profile management
- [ ] Role-based permissions
- [ ] Real-time messaging
- [ ] File upload functionality
- [ ] Admin panel
- [ ] Password reset functionality
- [ ] Email verification

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section
2. Review the Supabase documentation
3. Check the console for error messages
4. Verify environment variables are set correctly

---

**Built with ❤️ using Node.js, Express, React, and Supabase**
