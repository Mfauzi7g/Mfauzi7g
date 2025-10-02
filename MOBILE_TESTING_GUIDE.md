# 📱 Mobile Testing Guide: Parent-Child Screen Time App

## 🎯 **Testing Scenarios**

### **Scenario 1: Web Parent + Device Simulator (Quick Test)**

**Parent Setup:**
1. Open your mobile browser
2. Navigate to your deployed app URL
3. Login/register as a parent
4. Go to "Device Control" tab
5. Click "Generate Pairing Code" - note the 6-digit code

**Child Simulation:**
1. Open another browser tab
2. Go to `/device-simulator.html` (in your app's public folder)
3. Enter the pairing code
4. Test controls: app limits, device lock, emergency unlock

---

### **Scenario 2: Mobile Web Parent + React Native Child App**

**Step 1: Build Child App for Android**
```bash
# Navigate to React Native project
cd /app/ScreenTimeChild

# Install dependencies
npm install

# Build APK for testing
npx react-native run-android --variant=release

# Or create APK file
cd android
./gradlew assembleRelease
# APK will be in: android/app/build/outputs/apk/release/
```

**Step 2: Build Child App for iOS**
```bash
# Navigate to React Native project
cd /app/ScreenTimeChild

# Install iOS dependencies
cd ios && pod install && cd ..

# Build for iOS device
npx react-native run-ios --device

# Or create IPA using Xcode
# Open ios/ScreenTimeChild.xcworkspace in Xcode
# Archive and create IPA for distribution
```

**Step 3: Testing Workflow**
1. **Parent Device**: Use web browser to access dashboard
2. **Child Device**: Install and run the React Native app
3. **Pairing**: Parent generates code, child enters code
4. **Testing**: Parent sends commands, child app responds

---

### **Scenario 3: PWA Testing (Works on Both Devices)**

**Convert to PWA for easier mobile testing:**

1. **Install PWA Features:**
```bash
cd /app/frontend
npm install workbox-webpack-plugin
```

2. **Parent Device**: 
   - Open web app in mobile browser
   - Add to home screen (PWA install)
   - Use as native-like app

3. **Child Device**: 
   - Create child-specific PWA version
   - Install on child's device
   - Test real-time communication

---

## 🔧 **Real-Time Testing Features**

### **WebSocket Communication Testing**
```javascript
// Test these features between parent and child:

1. **Device Pairing**
   - Parent generates pairing code
   - Child enters code and connects
   - Verify connection status in parent dashboard

2. **App Limits**
   - Parent sets time limit for specific app
   - Child device receives limit and enforces it
   - Child can request more time

3. **Device Lock/Unlock**
   - Parent can lock child's device remotely
   - Child sees lock screen with message
   - Emergency unlock functionality

4. **Real-Time Status Updates**
   - Parent sees child's current app usage
   - Live updates when child switches apps
   - Battery and connectivity status

5. **Family Chat**
   - Parent sends message to child
   - Child receives notification and can reply
   - Emergency communication features
```

---

## 🧪 **Detailed Test Cases**

### **Test Case 1: Device Pairing**
**Parent Actions:**
1. Navigate to Device Control
2. Click "Generate Pairing Code"
3. Share 6-digit code with child

**Child Actions:**
1. Open child app
2. Enter pairing code
3. Confirm device connection

**Expected Results:**
- ✅ Child device appears in parent's device list
- ✅ Real-time status shows "Connected"
- ✅ Parent can see child's device info

### **Test Case 2: App Time Limits**
**Parent Actions:**
1. Select child's device
2. Set app limit (e.g., "Instagram: 30 minutes")
3. Send command to child device

**Child Actions:**
1. Use the restricted app
2. Receive time warning notifications
3. App gets blocked when limit reached

**Expected Results:**
- ✅ Parent sees real-time usage updates
- ✅ Child receives appropriate notifications
- ✅ App blocks correctly when time expires

### **Test Case 3: Emergency Communication**
**Parent Actions:**
1. Go to Family Chat
2. Send emergency message
3. Request immediate call

**Child Actions:**
1. Receive emergency notification
2. Respond to parent message
3. Accept/decline call request

**Expected Results:**
- ✅ Instant notification delivery
- ✅ Two-way communication works
- ✅ Emergency override functions work

---

## 🛠 **Quick Setup Commands**

### **Start Testing Environment:**
```bash
# Terminal 1: Start backend
cd /app/backend
python server.py

# Terminal 2: Start frontend
cd /app/frontend
npm start

# Terminal 3: Build child app
cd /app/ScreenTimeChild
npx react-native start

# Terminal 4: Install on Android device
npx react-native run-android --device
```

### **Testing URLs:**
- **Parent Dashboard**: `http://localhost:3000`
- **Device Simulator**: `http://localhost:3000/device-simulator.html`
- **API Health Check**: `http://localhost:8001/api/`

---

## 📋 **Pre-Testing Checklist**

**Technical Setup:**
- [ ] Backend running on port 8001
- [ ] Frontend running on port 3000
- [ ] MongoDB connected
- [ ] WebSocket server active

**Parent Device Setup:**
- [ ] Web browser with internet connection
- [ ] Access to deployed app or localhost
- [ ] Parent account created

**Child Device Setup:**
- [ ] React Native app installed OR device simulator ready
- [ ] Internet connection
- [ ] Notifications enabled

**Network Requirements:**
- [ ] Both devices on same network (for localhost testing)
- [ ] Or both devices have internet access (for deployed app)

---

## 🔍 **Troubleshooting Common Issues**

**Connection Issues:**
- Ensure both devices have internet access
- Check if WebSocket port (8001) is accessible
- Verify CORS settings allow cross-origin requests

**App Installation Issues:**
- For Android: Enable "Install from Unknown Sources"
- For iOS: Trust developer certificate in Settings
- Check React Native environment setup

**Real-Time Communication Issues:**
- Check WebSocket connection in browser dev tools
- Verify backend logs for socket events
- Test with device simulator first before real devices

---

## 🎯 **Success Metrics**

After testing, you should achieve:
- ✅ Successful device pairing between parent and child
- ✅ Real-time command execution (app limits, device lock)
- ✅ Bi-directional family chat communication
- ✅ Emergency features working correctly
- ✅ Multi-language support on both devices
- ✅ Responsive design on different screen sizes

This comprehensive testing will validate the complete parent-child mobile experience! 📱👨‍👩‍👧‍👦