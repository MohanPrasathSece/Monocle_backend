# Monocle Work Intelligence - Backend

A comprehensive Node.js/Express backend for the Monocle Work Intelligence application, powered by MongoDB and Gemini AI.

## Features

- **User Management**: Complete user CRUD operations with preferences
- **Work Threads**: Organize work into intelligent threads with priority tracking
- **Work Items**: Manage emails, messages, documents, calendar events, and tasks
- **AI-Powered Insights**: Gemini AI generates actionable insights about work patterns
- **Priority Recommendations**: Smart recommendations for what to focus on
- **Cognitive Load Tracking**: Monitor mental workload and context switching
- **Analytics**: Daily statistics and productivity metrics

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose)
- **AI**: Google Gemini AI
- **Authentication**: Native Google OAuth 2.0

## Project Structure

```
backend/
├── src/
│   ├── config/          # Database and Gemini configuration
│   ├── types/           # TypeScript interfaces and types
│   ├── models/          # Mongoose schemas and models
│   ├── services/        # Business logic layer
│   │   ├── user.service.ts
│   │   ├── thread.service.ts
│   │   ├── workitem.service.ts
│   │   ├── insight.service.ts
│   │   ├── priority.service.ts
│   │   └── analytics.service.ts
│   ├── controllers/     # Request handlers
│   │   ├── user.controller.ts
│   │   ├── thread.controller.ts
│   │   ├── workitem.controller.ts
│   │   └── intelligence.controller.ts
│   ├── routes/          # API routes
│   │   ├── user.routes.ts
│   │   ├── thread.routes.ts
│   │   ├── workitem.routes.ts
│   │   └── intelligence.routes.ts
│   └── server.ts        # Main application file
├── .env                 # Environment variables
├── tsconfig.json        # TypeScript configuration
└── package.json         # Dependencies and scripts
```

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables in `.env`:
   - `MONGODB_URI`
   - `GEMINI_API_KEY`

3. Start development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

5. Run production server:
   ```bash
   npm start
   ```

## API Endpoints

### Users (`/api/users`)
- `POST /` - Create user
- `GET /:id` - Get user by ID
- `GET /email/search?email=` - Get user by email
- `PUT /:id` - Update user
- `PUT /:id/preferences` - Update preferences
- `DELETE /:id` - Delete user

### Threads (`/api/threads`)
- `POST /` - Create thread
- `GET /:id` - Get thread by ID
- `GET /user/:userId` - Get all user threads
- `GET /user/:userId/active` - Get active threads
- `GET /user/:userId/high-priority` - Get high priority threads
- `GET /user/:userId/upcoming-deadlines?days=7` - Get threads with deadlines
- `PUT /:id` - Update thread
- `PUT /:id/progress` - Update progress
- `PUT /:id/ignore` - Toggle ignore status
- `DELETE /:id` - Delete thread

### Work Items (`/api/items`)
- `POST /` - Create work item
- `GET /:id` - Get item by ID
- `GET /user/:userId` - Get all user items
- `GET /user/:userId/type/:type` - Get items by type
- `GET /user/:userId/unread` - Get unread items
- `GET /thread/:threadId` - Get thread items
- `PUT /:id` - Update item
- `PUT /:id/read` - Mark as read
- `PUT /:id/assign` - Assign to thread
- `DELETE /:id` - Delete item

### Intelligence (`/api/intelligence`)
- `POST /insights/:userId/generate` - Generate AI insights
- `GET /insights/:userId` - Get active insights
- `PUT /insights/:id/dismiss` - Dismiss insight
- `POST /recommendations/:userId/generate` - Generate priority recommendations
- `GET /recommendations/:userId` - Get active recommendations
- `POST /cognitive-load/:userId/calculate` - Calculate cognitive load
- `GET /cognitive-load/:userId` - Get latest cognitive load
- `GET /stats/:userId?days=7` - Get daily stats
- `PUT /stats/:userId` - Update daily stats
- `POST /context-switch/:userId` - Record context switch

## Environment Variables

- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (development/production)
- `MONGODB_URI` - MongoDB connection string
- `GEMINI_API_KEY` - Google Gemini AI API key
- `CORS_ORIGIN` - Allowed CORS origin

## MongoDB Collections

- `users` - User profiles and preferences
- `workthreads` - Work thread organization
- `workitems` - Individual work items
- `workinsights` - AI-generated insights
- `priorityrecommendations` - Priority suggestions
- `cognitiveloadstates` - Cognitive load measurements
- `dailystats` - Daily productivity statistics
- `activities` - User activity tracking

## Development

The backend uses:
- TypeScript for type safety
- Nodemon for hot reloading
- Express for routing
- MongoDB (Mongoose) for data persistence
- Gemini AI for intelligent insights

## Notes

- All responses follow the pattern: `{ success: boolean, data?: any, error?: string }`
