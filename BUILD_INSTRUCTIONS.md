# 📱 Build React Native Child App

## Android APK Build

```bash
# Navigate to React Native project
cd /app/ScreenTimeChild

# Install dependencies
npm install

# Generate debug APK
cd android
./gradlew assembleDebug

# APK location: android/app/build/outputs/apk/debug/app-debug.apk
```

## iOS IPA Build

```bash
# Navigate to React Native project  
cd /app/ScreenTimeChild

# Install iOS dependencies
cd ios && pod install && cd ..

# Open Xcode project
open ios/ScreenTimeChild.xcworkspace

# In Xcode:
# 1. Select your device
# 2. Product > Archive
# 3. Distribute App > Development
```

## Install on Devices

**Android:**
1. Transfer APK to child's Android device
2. Enable "Install from Unknown Sources"
3. Install the APK
4. Open "Screen Time Child" app

**iOS:**
1. Use Xcode to install directly on device
2. Or use TestFlight for distribution
3. Trust developer certificate in Settings
4. Open "Screen Time Child" app

## Testing Network Setup

**Local Testing:**
- Both devices must be on same Wi-Fi network
- Parent uses: `http://[your-local-ip]:3000`
- Ensure port 8001 is accessible for WebSocket

**Production Testing:**
- Deploy app to public URL
- Both devices use same production URL
- Ensure WebSocket connections work through firewall