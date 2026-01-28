# NUCash Quick Start Guide

## 🚀 Your Server is Running!

**Current Status:** ✅ Server is accessible on your mobile data network

**Access URLs:**
- **Health Check:** http://172.20.10.2:3000/health
- **API Test:** http://172.20.10.2:3000/api/test
- **Admin Dashboard:** http://172.20.10.2:3000/admin
- **Motorpool Admin:** http://172.20.10.2:3000/motorpool
- **Merchant Admin:** http://172.20.10.2:3000/merchant

**Your Current IP:** `172.20.10.2` (Mobile Data Hotspot)

---

## 📱 For Mobile App Development

Update your API configuration to use your network IP:

**File:** `/mobile/src/config/api.config.js`
```javascript
export const API_CONFIG = {
  baseURL: 'http://172.20.10.2:3000/api',  // ← Update this!
  timeout: 30000
};
```

---

## 🖥️ Server Management

### Check Server Status
```bash
curl http://172.20.10.2:3000/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "...",
  "database": "connected",
  "uptime": ...
}
```

### View Server Logs
```bash
cd server
tail -f server.log
```

### Stop Server
```bash
pkill -f "node server.js"
```

### Start Server
```bash
cd server
npm start
```

### Start Server in Background
```bash
cd server
nohup npm start > server.log 2>&1 &
```

---

## 🔍 Find Your IP When It Changes

Your IP address will change when you:
- Reconnect to mobile data
- Switch networks
- Restart your phone's hotspot

To find your new IP:
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

Or check the server startup message:
```
🌐 Network Access:    http://YOUR_IP:3000/api
```

---

## 🧪 Testing the Setup

### 1. Test Health Endpoint
```bash
curl http://172.20.10.2:3000/health
```

### 2. Test API Endpoint
```bash
curl http://172.20.10.2:3000/api/test
```

### 3. Open Admin Dashboard
Open in your browser:
```
http://172.20.10.2:3000/admin
```

### 4. Test from Your Phone
1. Make sure your computer is connected to your phone's hotspot
2. Open browser on your phone
3. Navigate to: `http://172.20.10.2:3000/admin`

---

## 📚 Important Documents

- **PILOT_TESTING_FIXES.md** - Complete overview of all UI fixes and improvements
- **NETWORK_ACCESS_GUIDE.md** - Detailed guide for network access and troubleshooting
- **BUILD_FIXES_SUMMARY.md** - Build and dependency fixes
- **SETUP_COMPLETE.md** - Initial setup documentation

---

## 🎨 UI Improvements (Ready for Pilot)

### Mobile App (User Interface)
- ✅ Standardized theme constants
- ✅ Consistent colors and typography
- ✅ User dashboard with balance, transactions, concerns
- ✅ Profile management and PIN changes
- ✅ Concern submission and feedback

### Motorpool Admin Dashboard
- ✅ Live shuttle tracking with Google Maps
- ✅ Route management with interactive map picker
- ✅ Driver and fleet management
- ✅ Trip monitoring
- ✅ Concerns/feedback management
- ✅ Standardized pagination (20 items/page)
- ✅ Consistent refresh intervals

### Merchant Admin Dashboard
- ✅ Merchant account management
- ✅ Transaction management with filters
- ✅ Activity logs
- ✅ Automated export configurations
- ✅ Matching UI with Motorpool Admin

---

## 🔧 Common Issues

### "Site can't be reached"
1. Check if server is running: `ps aux | grep "node server.js"`
2. Verify your IP hasn't changed: `ifconfig | grep "inet " | grep -v 127.0.0.1`
3. Make sure your device is on the same network
4. Check firewall settings (System Settings → Network → Firewall)

### "Cannot connect to MongoDB"
```bash
# Start MongoDB
brew services start mongodb-community
```

### "Port 3000 already in use"
```bash
# Find and kill the process
lsof -ti:3000 | xargs kill -9
```

---

## 🎯 Next Steps for Pilot Testing

1. **Test User Mobile App**
   - Update API config with network IP
   - Test login flow
   - Test dashboard features
   - Test concern submission

2. **Test Motorpool Admin**
   - Open http://172.20.10.2:3000/motorpool
   - Test live tracking
   - Test route creation
   - Test concern management

3. **Test Merchant Admin**
   - Open http://172.20.10.2:3000/merchant
   - Test merchant management
   - Test transaction viewing
   - Test export features

4. **Monitor Server**
   - Keep an eye on `server.log`
   - Check for errors or warnings
   - Monitor API response times

---

## 📞 Quick Commands Reference

| Task | Command |
|------|---------|
| Check IP | `ifconfig \| grep "inet " \| grep -v 127.0.0.1` |
| Test API | `curl http://172.20.10.2:3000/api/test` |
| View logs | `tail -f server/server.log` |
| Stop server | `pkill -f "node server.js"` |
| Start server | `cd server && npm start` |
| MongoDB status | `brew services list \| grep mongodb` |

---

**Server Started:** 2026-01-26 8:50 AM
**Network:** Mobile Data Hotspot
**IP Address:** 172.20.10.2
**Status:** ✅ Running and accessible

---

**Pro Tip:** Bookmark `http://172.20.10.2:3000/health` to quickly check if your server is running!
