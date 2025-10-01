# Screen Time Child Device App (React Native)

This is the companion mobile app that runs on children's devices to enforce screen time controls from the parent dashboard.

## Features

- **Device Pairing**: Easy QR code or pairing code setup
- **Real-time Control**: WebSocket connection to parent dashboard
- **App Monitoring**: Track and limit app usage
- **Downtime Enforcement**: Lock device during scheduled downtime
- **Emergency Override**: Allow parent to instantly unlock device
- **Usage Reporting**: Send usage data back to parent dashboard

## Setup Instructions

### For Parents:
1. Generate pairing code in parent dashboard
2. Install this app on child's device
3. Enter pairing code to link devices
4. Grant necessary permissions

### Required Permissions:

#### iOS:
- Screen Time API access
- Family Sharing participation
- Background App Refresh
- Notifications

#### Android:
- Device Administrator
- Usage Access (Digital Wellbeing)
- Display over other apps
- Accessibility Service
- Notifications

## Technical Implementation

### iOS Integration
```swift
// Screen Time API
import FamilyControls
import DeviceActivity

class ScreenTimeEnforcer {
    func enforceAppLimit(bundleID: String, limit: TimeInterval) {
        // Use FamilyControls to block app when limit reached
    }
    
    func enforceDowntime(schedule: DeviceActivitySchedule) {
        // Use DeviceActivity to enforce downtime
    }
}
```

### Android Integration
```kotlin
// Digital Wellbeing API
class AppUsageEnforcer {
    fun enforceAppLimit(packageName: String, limitMs: Long) {
        // Use UsageStatsManager to monitor and block apps
    }
    
    fun enforceDowntime(startTime: LocalTime, endTime: LocalTime) {
        // Use DevicePolicyManager to enforce downtime
    }
}
```

## Communication Protocol

### WebSocket Commands from Parent:
- `set_app_limits`: Update app time limits
- `set_downtime`: Update downtime schedule
- `emergency_unlock`: Temporarily disable all restrictions
- `get_status`: Request current device status

### WebSocket Responses to Parent:
- `status_update`: Send current restriction status
- `usage_report`: Send app usage data
- `command_executed`: Confirm command execution
- `error`: Report any errors

## Installation

```bash
npx react-native init ScreenTimeChild
cd ScreenTimeChild
npm install @react-native-async-storage/async-storage react-native-device-info socket.io-client
```

### iOS Specific
```bash
cd ios && pod install
```

### Android Specific
- Add permissions to AndroidManifest.xml
- Configure device admin receiver
- Set up accessibility service

## App Store Distribution

### iOS App Store
- Apply for Screen Time API entitlements
- Request "Parental Control" category
- Follow App Store Review Guidelines for parental control apps

### Google Play Store
- Request sensitive permissions justification
- Provide detailed app description for device admin usage
- Include privacy policy for child data protection

## Privacy & Security

- All communication encrypted (HTTPS/WSS)
- No personal data stored on device
- Parent authentication required for all commands
- Tamper detection and reporting
- Compliance with COPPA (Children's Online Privacy Protection Act)

## Testing

- Test app blocking/unblocking
- Test downtime enforcement
- Test emergency unlock scenarios
- Test offline behavior
- Test battery optimization impact
- Test with various Android OEM customizations (Samsung, Xiaomi, etc.)