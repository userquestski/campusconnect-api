# 🎓 CampusConnect — Backend API

## 📁 Project Structure
```
campusconnect-backend/
├── server.js              ← Entry point, starts the server
├── .env                   ← Your secret keys (create this yourself)
├── .env.example           ← Template for .env
├── config/
│   ├── db.js              ← MongoDB connection
│   └── cloudinary.js      ← Image upload setup
├── models/
│   ├── User.js            ← Student / Admin schema
│   ├── Club.js            ← Club schema
│   └── Event.js           ← Event schema
├── controllers/
│   ├── authController.js  ← Register, Login
│   ├── eventController.js ← Event CRUD + Registration
│   ├── clubController.js  ← Club CRUD
│   └── adminController.js ← Admin actions
├── routes/
│   ├── authRoutes.js
│   ├── eventRoutes.js
│   ├── clubRoutes.js
│   ├── userRoutes.js
│   └── adminRoutes.js
├── middleware/
│   └── authMiddleware.js  ← JWT token verification
└── utils/
    ├── generateToken.js   ← Create JWT tokens
    └── emailService.js    ← Send emails via Gmail
```

---

## 🚀 Setup Guide (Windows — Step by Step)

### Step 1 — Install Node.js
1. Go to https://nodejs.org
2. Download the **LTS version**
3. Run the installer, click Next → Next → Finish
4. Open **Command Prompt** and type: `node -v`  
   You should see something like: `v20.x.x` ✅

### Step 2 — Get a free MongoDB database
1. Go to https://mongodb.com/atlas
2. Sign up for free
3. Create a **Free Cluster** (M0)
4. Click **Connect** → **Drivers** → Copy the connection string
5. It looks like: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/`

### Step 3 — Get Gmail App Password
1. Go to your **Google Account** → Security
2. Enable **2-Step Verification** (if not already)
3. Go to **App Passwords** → Select "Mail" → Generate
4. Copy the 16-character password

### Step 4 — Get free Cloudinary account
1. Go to https://cloudinary.com → Sign up free
2. From your dashboard copy: Cloud Name, API Key, API Secret

### Step 5 — Setup the project
Open **Command Prompt** in the project folder:
```bash
# Install all packages
npm install

# Create your .env file (copy from .env.example)
copy .env.example .env
```

Then open `.env` in Notepad and fill in your values:
```
MONGO_URI=mongodb+srv://youruser:yourpass@cluster0.xxxxx.mongodb.net/campusconnect
JWT_SECRET=any_long_random_string_here
EMAIL_USER=yourgmail@gmail.com
EMAIL_PASS=your_16char_app_password
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLIENT_URL=http://localhost:3000
```

### Step 6 — Run the server
```bash
# Development mode (auto-restarts on file changes)
npm run dev

# OR normal mode
npm start
```

You should see:
```
✅ MongoDB connected successfully
🚀 Server running on http://localhost:5000
```

---

## 📡 API Endpoints

### Auth
| Method | URL | Description |
|--------|-----|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login |
| GET  | /api/auth/me | Get my profile (requires token) |
| PUT  | /api/auth/update-interests | Update interests |

### Events
| Method | URL | Description |
|--------|-----|-------------|
| GET    | /api/events | Get all events |
| GET    | /api/events/:id | Get event details |
| POST   | /api/events | Create event (Club Admin) |
| POST   | /api/events/:id/register | Register for event (Student) |
| DELETE | /api/events/:id | Delete event |

### Clubs
| Method | URL | Description |
|--------|-----|-------------|
| GET    | /api/clubs | Get all approved clubs |
| GET    | /api/clubs/:id | Get club details |
| POST   | /api/clubs | Create club (Club Admin) |
| GET    | /api/clubs/my-club | Get my club |
| PUT    | /api/clubs/:id | Update my club |

### Admin (Super Admin only)
| Method | URL | Description |
|--------|-----|-------------|
| GET    | /api/admin/analytics | Platform stats |
| GET    | /api/admin/pending-clubs | Clubs awaiting approval |
| PUT    | /api/admin/approve-club/:id | Approve a club |
| GET    | /api/admin/users | All users |
| DELETE | /api/admin/users/:id | Remove user |

---

## 🔐 How to send authenticated requests

After login, you get a `token`. Send it in every protected request:
```
Headers:
  Authorization: Bearer eyJhbGci...your_token_here
```

---

## 🧪 Test with Postman
1. Download **Postman** (free): https://postman.com
2. Create a POST request to `http://localhost:5000/api/auth/register`
3. Body → raw → JSON:
```json
{
  "name": "Test Student",
  "email": "test@college.edu",
  "password": "password123",
  "role": "student",
  "interests": ["Technical", "Hackathons"]
}
```
