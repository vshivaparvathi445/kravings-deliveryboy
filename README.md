# 🍟 Kravings – Full Stack Delivery Boy Module
### React + Flask + MySQL

---

## 📁 Project Structure

```
kravings/
├── frontend/                    ← React App
│   ├── public/index.html
│   ├── package.json
│   └── src/
│       ├── App.js               ← Routes setup
│       ├── index.js             ← Entry point
│       ├── index.css            ← Global styles
│       ├── api/axios.js         ← Axios + JWT interceptor
│       ├── context/AuthContext.js ← Global auth state
│       ├── components/
│       │   ├── AppLayout.js     ← Sidebar + Topbar
│       │   ├── NewOrderModal.js ← Incoming order popup
│       │   └── NotifPanel.js    ← Slide-in notifications
│       └── pages/
│           ├── Login.js         ← Login page
│           ├── Register.js      ← 3-step registration wizard
│           ├── ForgotPass.js    ← OTP-based password reset
│           ├── Dashboard.js     ← Stats + charts + active orders
│           ├── ActiveOrders.js  ← Manage assigned/picked orders
│           ├── NewRequests.js   ← Accept/decline new orders
│           ├── Earnings.js      ← Weekly summary + payouts
│           ├── History.js       ← Delivery history table
│           ├── Profile.js       ← Edit profile + docs + performance
│           ├── TrackOrder.js    ← Order tracking steps
│           └── Support.js       ← Help + FAQ + contact
│
└── backend/                     ← Flask API
    ├── app.py                   ← App factory + blueprints
    ├── config.py                ← Config from .env
    ├── extensions.py            ← SQLAlchemy, JWT, Mail
    ├── models.py                ← All DB models
    ├── schema.sql               ← MySQL schema + sample data
    ├── requirements.txt
    ├── .env.example
    └── routes/
        ├── auth.py              ← Register, Login, OTP, Reset
        ├── orders.py            ← Accept, Pickup, Deliver, Cancel
        ├── earnings.py          ← Summary, Daily, Payouts
        ├── profile.py           ← Edit, Vehicle, Bank, Online
        ├── notifications.py     ← List, Read, Delete
        └── location.py          ← GPS tracking
```

---

## ⚙️ Setup – Backend (Flask + MySQL)

### Step 1 – Create & activate virtual environment
```bash
cd backend
python -m venv venv

# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate
```

### Step 2 – Install Python packages
```bash
pip install -r requirements.txt
```

### Step 3 – Create MySQL database
```bash
mysql -u root -p < schema.sql
```

### Step 4 – Configure environment
```bash
cp .env.example .env
```
Edit `.env`:
```
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=your_mysql_password
MYSQL_DB=kravings_db
SECRET_KEY=any-random-secret
JWT_SECRET_KEY=another-random-secret
```

### Step 5 – Run Flask server
```bash
python app.py
# Runs on http://localhost:5000
# Test: http://localhost:5000/api/health
```

---

## ⚙️ Setup – Frontend (React)

### Step 1 – Install packages
```bash
cd frontend
npm install
```

### Step 2 – Configure API URL (optional)
Create `frontend/.env`:
```
REACT_APP_API_URL=http://localhost:5000/api
```
> The `"proxy": "http://localhost:5000"` in package.json already handles this during dev.

### Step 3 – Start React app
```bash
npm start
# Opens http://localhost:3000
```

---

## 🔌 How Frontend Connects to Backend

All API calls go through `src/api/axios.js`:
```js
const api = axios.create({ baseURL: 'http://localhost:5000/api' });

// JWT auto-attached on every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('kravings_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

After login, the JWT token is stored in `localStorage` and used for all subsequent requests automatically.

---

## 🌐 All API Endpoints

### AUTH  `/api/auth`
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Register delivery boy |
| POST | `/login` | Login → returns JWT |
| POST | `/refresh` | Refresh access token |
| POST | `/logout` | Logout |
| GET  | `/me` | Get current user |
| POST | `/upload-doc` | Upload document (multipart) |
| POST | `/send-otp` | Send OTP to mobile |
| POST | `/verify-otp` | Verify OTP |
| POST | `/reset-password` | Reset password with OTP |

### ORDERS  `/api/orders`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET  | `/active` | My active orders |
| GET  | `/new` | Available new orders |
| GET  | `/history` | Delivery history |
| GET  | `/<id>` | Single order detail |
| POST | `/<id>/accept` | Accept order |
| POST | `/<id>/pickup` | Mark picked up |
| POST | `/<id>/deliver` | Mark delivered (needs OTP) |
| POST | `/<id>/cancel` | Cancel order |
| GET  | `/stats` | Today's stats |

### EARNINGS  `/api/earnings`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/summary?period=week` | Weekly/monthly summary |
| GET | `/daily?days=7` | Day-by-day breakdown |
| GET | `/payouts` | Payout history |

### PROFILE  `/api/profile`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Full profile |
| PUT | `/` | Update info / password |
| PUT | `/vehicle` | Update vehicle |
| PUT | `/bank` | Update bank account |
| PUT | `/toggle-online` | Go online/offline |
| GET | `/performance` | Stats & ratings |

### NOTIFICATIONS  `/api/notifications`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List notifications |
| PUT | `/<id>/read` | Mark read |
| PUT | `/read-all` | Mark all read |
| DELETE | `/<id>` | Delete notification |

### LOCATION  `/api/location`
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/update` | Push GPS coords |
| GET  | `/<order_id>` | Get rider location |

---

## 🖥️ App Pages & Features

| Page | Route | Features |
|------|-------|----------|
| Login | `/login` | Email/mobile + password, show/hide pw, demo login |
| Register | `/register` | 3-step wizard: Personal → Vehicle → Documents |
| Forgot Password | `/forgot-password` | OTP → verify → reset password |
| Dashboard | `/dashboard` | Stats cards, earnings bar chart, map, active orders |
| Active Orders | `/active` | Pickup / Deliver (OTP) / Cancel / Call / Navigate |
| New Requests | `/new` | Accept or decline, auto-refreshes every 10s |
| Earnings | `/earnings` | Weekly/monthly breakdown, daily chart, payout history |
| History | `/history` | Paginated delivery history table with filters |
| Profile | `/profile` | Edit info, performance bars, vehicle, documents |
| Track Order | `/track/:id` | Step-by-step order tracking with live map |
| Support | `/support` | Live chat, call support, FAQ, send message |

---

## 🚀 Quick Start (Both Together)

```bash
# Terminal 1 – Backend
cd backend && source venv/bin/activate && python app.py

# Terminal 2 – Frontend
cd frontend && npm start
```

Open **http://localhost:3000** → Login or Register → Start delivering! 🏍️
