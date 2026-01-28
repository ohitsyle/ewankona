# NUCash Mobile - Monorepo

A comprehensive cashless transaction system for National University motorpool services, including admin dashboard, merchant portal, and mobile app.

## 📁 Project Structure

```
nucash-mobile/
├── client/                    # All Frontend Applications
│   ├── admin/                 # Admin Dashboard (React Web)
│   ├── merchant/              # Merchant Portal (React Web)
│   └── mobile/                # Mobile App (React Native)
│
├── server/                    # Backend API (Node.js/Express)
│   ├── config/                (Database, constants)
│   ├── controllers/           (Route handlers)
│   ├── middlewares/           (Auth, error handling)
│   ├── models/                (MongoDB schemas)
│   ├── routes/                (API endpoints)
│   └── services/              (Business logic)
│
└── package.json               # Workspace root
```

## 🚀 Quick Start

### Installation
```bash
npm install
npm run install:all
```

### Development

**Backend Server** (Port 5000):
```bash
npm run server:dev
```

**Admin Dashboard** (Port 3001):
```bash
npm run admin:dev
```

**Merchant Portal** (Port 3002):
```bash
npm run merchant:dev
```

**Mobile App**:
```bash
npm run mobile:start      # Start Metro bundler
npm run mobile:android    # Run Android
npm run mobile:ios        # Run iOS
```

## 🔧 Configuration

Create `.env` files in each workspace:

**client/admin/.env**:
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_GOOGLE_MAPS_API_KEY=your_key
```

**server/.env**:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/nucash
JWT_SECRET=your_secret
NODE_ENV=development
```

## 📦 Building for Production

```bash
npm run admin:build       # Build admin dashboard
npm run merchant:build    # Build merchant portal
```

## 🎯 Features

### Admin Dashboard
- 📊 Real-time analytics
- 🚐 Shuttle & driver management
- 🗺️ Route management with Google Maps
- 📱 Device management
- 📋 Activity logs

### Merchant Portal
- 💳 Transaction management
- 📊 Sales reports
- ⚙️ Configurations

### Mobile App
- 📱 NFC payments
- 🗺️ Route tracking
- 💰 Balance management
- 📜 Transaction history

## 🛠️ Tech Stack

- **Frontend**: React 19, React Native 0.82
- **Backend**: Node.js, Express, MongoDB
- **Build**: Webpack 5
- **Auth**: JWT

## 📚 Documentation

- [Restructuring Complete](./RESTRUCTURE_COMPLETE.md) - Full migration summary
- [New Structure Guide](./README-NEW-STRUCTURE.md) - Detailed usage
- [Old README](./README-OLD.md) - Previous documentation

## 🤝 Team Collaboration

Each team member works in their respective workspace:
- Admin features: `client/admin/src/`
- Merchant features: `client/merchant/src/`
- Mobile features: `client/mobile/src/`
- Backend: `server/`

## 🐛 Troubleshooting

**Import errors?** Run `npm install` in the workspace directory

**Backend not connecting?** Check MongoDB is running and `.env` is configured

**Google Maps not loading?** Verify API key in `.env`

---

**Built with ❤️ for National University**
