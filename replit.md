# Dating App (LoveMatch) - Replit Project Guide

## Overview

This is a modern dating application built with a React frontend and Express.js backend. The app features a Tinder-like swiping interface, real-time messaging, user discovery, and profile management with video uploads. It uses PostgreSQL as the database with Drizzle ORM for data management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application follows a full-stack monorepo structure with clear separation between client and server code:

- **Frontend**: React with TypeScript, using Vite as the build tool
- **Backend**: Express.js with TypeScript running on Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Passport.js with local strategy and session-based auth
- **Real-time Features**: WebSocket support for live messaging
- **UI Framework**: shadcn/ui components with Tailwind CSS

## Key Components

### Database Schema (`shared/schema.ts`)
- **Users**: Core user profiles with authentication, bio, interests, social connections
- **Matches**: Mutual likes between users
- **Likes**: Individual swipe actions (like/dislike)
- **Messages**: Chat messages between matched users

### Backend Architecture (`server/`)
- **Authentication** (`auth.ts`): Passport.js setup with password hashing
- **Database** (`db.ts`): Neon PostgreSQL connection with Drizzle
- **Storage** (`storage.ts`): Data access layer with business logic
- **Routes** (`routes.ts`): API endpoints for discovery, likes, matches, messages
- **File Uploads**: Multer integration for video profile uploads

### Frontend Architecture (`client/src/`)
- **Pages**: Home (discovery), Auth, Matches, Chat, Profile
- **Components**: Swipe cards, bottom navigation, video upload modal
- **State Management**: React Query for server state, React hooks for local state
- **Routing**: Wouter for client-side routing with protected routes

## Data Flow

1. **User Registration/Login**: Passport.js handles authentication with hashed passwords
2. **Discovery**: Backend serves filtered users excluding already liked/matched ones
3. **Swiping**: Frontend sends like/dislike to backend, checks for mutual matches
4. **Matching**: When mutual like occurs, creates match record and notifies users
5. **Messaging**: WebSocket connection enables real-time chat between matched users
6. **Profile Updates**: File upload for videos, profile data updates via REST API

## External Dependencies

### Core Technologies
- **Database**: Neon PostgreSQL serverless database
- **ORM**: Drizzle with PostgreSQL dialect
- **UI Components**: Radix UI primitives via shadcn/ui
- **Styling**: Tailwind CSS with custom color scheme
- **File Uploads**: Multer for handling video files
- **Real-time**: WebSocket for live messaging

### Authentication & Security
- **Session Management**: PostgreSQL-backed sessions via connect-pg-simple
- **Password Security**: Node.js crypto module for scrypt hashing
- **CORS**: Configured for development with Replit

### Development Tools
- **Build Tool**: Vite with React plugin
- **TypeScript**: Full type safety across frontend and backend
- **Development**: Hot reload, error overlay, Replit integration

## Deployment Strategy

The application is configured for Replit deployment with the following setup:

1. **Development**: `npm run dev` starts both frontend and backend with hot reload
2. **Build Process**: Vite builds the frontend, esbuild bundles the backend
3. **Production**: Single Node.js process serves both static files and API
4. **Database**: Uses DATABASE_URL environment variable for connection
5. **Sessions**: Requires SESSION_SECRET environment variable

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Secret key for session encryption
- `NODE_ENV`: Environment mode (development/production)

The app uses a mobile-first responsive design optimized for dating app usage patterns, with a maximum width container to simulate mobile experience on desktop browsers.

## Recent Changes

### Social Media API Integration (January 2025)
- ✓ Implemented comprehensive social media authentication system (Facebook, Instagram, TikTok, Twitter)
- ✓ Added OAuth flows for each platform with proper error handling
- ✓ Created social connection management UI with real-time status updates
- ✓ Built content import system for photos, videos, and profile data
- ✓ Added social media insights display with platform-specific data
- ✓ Extended database schema with social media profile fields
- ✓ Created robust API layer ready for real social media credentials
- ✓ Added social verification scoring system for enhanced trust

### Pricing System Implementation (January 2025)
- Added comprehensive 3-tier pricing system (Free, Premium ฿299/month, Gold ฿499/month)
- Implemented subscription management with database tracking
- Added Thai baht currency pricing with annual savings options
- Created pricing page with feature comparisons and testimonials
- Integrated subscription status display in user profiles
- Added subscription management API endpoints
- Fixed discovery system SQL query bug for better performance

The social media integration provides a complete framework that works with simulated data and can be instantly activated with real API credentials. Users can connect accounts, import content, and display social verification badges.