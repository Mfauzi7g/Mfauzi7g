# Screen Time Parental Control App - Backend Integration Contracts

## API Contracts

### Authentication Endpoints
```
POST /api/auth/register - Register parent account
POST /api/auth/login - Login parent
POST /api/auth/logout - Logout
GET /api/auth/me - Get current user info
```

### Family Management
```
GET /api/family - Get family and children
POST /api/family/children - Add child to family
PUT /api/family/children/{child_id} - Update child info
DELETE /api/family/children/{child_id} - Remove child
```

### Screen Time Tracking
```
GET /api/screen-time/{child_id} - Get child's screen time data
POST /api/screen-time/{child_id}/usage - Log app usage
GET /api/screen-time/{child_id}/weekly - Get weekly analytics
```

### App Limits & Controls
```
GET /api/limits/{child_id} - Get child's app limits
POST /api/limits/{child_id} - Set app limits
PUT /api/limits/{child_id}/{app_id} - Update specific app limit
```

### Downtime Scheduling
```
GET /api/downtime/{child_id} - Get downtime schedule
POST /api/downtime/{child_id} - Set downtime schedule
```

### Reward System (NEW FEATURE)
```
GET /api/rewards/{child_id} - Get child's tasks and rewards
POST /api/rewards/{child_id}/tasks - Create task for child
PUT /api/rewards/tasks/{task_id}/complete - Mark task as completed
POST /api/rewards/{child_id}/redeem - Redeem earned time
```

### Subscription
```
GET /api/subscription - Get current subscription status
POST /api/subscription/subscribe - Create subscription
POST /api/subscription/cancel - Cancel subscription
```

## Database Models

### Users (Parents)
- id, email, password_hash, name, created_at, subscription_status

### Children
- id, user_id (parent), name, age, device_name, avatar_url, status, earned_minutes

### ScreenTime
- id, child_id, date, app_name, minutes_used, category

### AppLimits  
- id, child_id, app_name, daily_limit_minutes, category

### DowntimeSchedules
- id, child_id, day_of_week, start_time, end_time

### Tasks (NEW)
- id, child_id, title, description, reward_minutes, status, created_at, completed_at

### Subscriptions
- id, user_id, plan_type, status, expires_at

## Mock Data Replacement

### Current Mock Data in `/app/frontend/src/data/mock.js`:
1. `mockChildren` -> Replace with API call to `/api/family`
2. `mockAppUsage` -> Replace with `/api/screen-time/{child_id}`  
3. `mockWeeklyData` -> Replace with `/api/screen-time/{child_id}/weekly`
4. `mockDowntimeSchedule` -> Replace with `/api/downtime/{child_id}`
5. `mockSubscriptionData` -> Replace with `/api/subscription`

### New Frontend Components Needed:
1. **TaskManager** - For parents to create tasks
2. **RewardCenter** - For kids to see available tasks and earned time
3. **TimeBank** - Shows earned extra minutes that can be used

## Frontend-Backend Integration Plan

### Phase 1: Authentication & Family Setup
- Replace hardcoded family data with real user system
- Add login/register flow
- Family member management

### Phase 2: Screen Time Data
- Real screen time tracking and storage
- Replace mock usage data with database
- Weekly/monthly analytics

### Phase 3: Parental Controls
- App limits with real enforcement
- Downtime scheduling with active monitoring
- Content restrictions

### Phase 4: Reward System Implementation  
- Task creation by parents
- Task completion by children
- Time bank for earned minutes
- Redemption system

### Phase 5: Subscription Integration
- Payment processing 
- Feature restrictions based on plan
- Subscription management

## Reward System Features

### For Parents:
- Create tasks with custom reward minutes (5-60 min)
- Task categories: Chores, Homework, Reading, Exercise, Creativity
- Set task deadlines and descriptions
- Approve completed tasks
- View task completion history

### For Children:
- View available tasks with time rewards
- Mark tasks as completed (pending parent approval)  
- See earned time bank balance
- Redeem earned minutes for extra screen time
- Achievement badges for consistency

### Task Examples:
- "Make your bed" → 10 minutes
- "Complete homework" → 30 minutes  
- "Read for 20 minutes" → 25 minutes
- "Help with dishes" → 15 minutes
- "Exercise for 15 minutes" → 20 minutes