# Overview

ChatGroove is a fully functional modern social messaging application that successfully combines the best features from WhatsApp, Facebook Messenger, and Telegram with innovative ChatGroove-specific branding and functionality. The app is production-ready with complete authentication, real-time messaging, global chat rooms, group functionality, private messaging, multimedia support, and a comprehensive admin dashboard.

## Current Status: Production-Ready ✓
- **Complete Authentication System**: JWT-based auth with Google OAuth integration and email verification
- **PostgreSQL Integration**: Full PostgreSQL database with Drizzle ORM for persistent data storage
- **Real-time Messaging**: Multi-participant chat support with read receipts and message types
- **Global Room Discovery**: Public chat rooms users can browse and join
- **Group Chat Management**: Create and manage group conversations
- **Private Messaging**: One-on-one direct messaging with multimedia support
- **Admin Dashboard**: Complete administrative interface for user and content management
- **Modern UI**: Responsive design with dark/light theme support
- **Role-based Permissions**: User, moderator, and admin roles with proper access control
- **Email System**: SMTP integration for email verification and notifications
- **Multimedia Support**: Text, image, file, voice, and video message types

# User Preferences

Preferred communication style: Simple, everyday language.
UI/UX Style: Modern, unique ChatGroove branding - NOT like Telegram. Should have its own distinct visual identity.
Global Rooms: Large public rooms users can browse and join, different from regular groups/channels.
Dark Theme: Beautiful, well-designed dark mode with proper contrast and modern styling.

# System Architecture

## Frontend Architecture
The client is built with **React 18** and **TypeScript**, using Vite as the build tool. The UI follows a modern component-based architecture:
- **State Management**: React Query (TanStack Query) for server state management with optimistic updates and caching
- **Routing**: Wouter for lightweight client-side routing
- **UI Components**: Radix UI primitives with shadcn/ui components for consistent, accessible design
- **Styling**: Tailwind CSS with CSS custom properties for theming support
- **Form Handling**: React Hook Form with Zod validation

The architecture separates concerns with dedicated folders for pages, components (chat, profile, ui), hooks, and utilities. The component structure emphasizes reusability and follows atomic design principles.

## Backend Architecture
The server uses **Express.js** with TypeScript in ESM format:
- **API Design**: RESTful endpoints organized by resource (auth, users, chats, messages)
- **Middleware**: Custom logging, error handling, and authentication middleware
- **Real-time Updates**: Polling-based approach for message updates (2-5 second intervals)
- **File Structure**: Modular design with separate files for routes, storage layer, database connection, and authentication

## Data Storage
**PostgreSQL** with **Drizzle ORM** for reliable relational database operations:
- **Schema Design**: Type-safe relational schema with proper foreign key relationships
- **Tables**: Users, chats, messages, and sessions with JSONB for flexible participant management
- **Connection**: PostgreSQL with WebSocket support via Neon serverless driver
- **ORM Features**: Automatic schema generation, type-safe queries, and migrations

## Authentication System
**JWT-based authentication** with **Google OAuth** integration:
- **JWT Tokens**: Secure token-based authentication with configurable expiration
- **Google OAuth**: Full Google sign-in integration with automatic account linking
- **Email Verification**: SMTP-based email verification system
- **Role Management**: User, moderator, and admin roles with permission-based access control
- **Password Security**: bcrypt hashing for secure password storage

## Chat System Architecture
**Multi-participant chat support** with comprehensive messaging features:
- **Message Types**: Text, image, file, voice note, video note, video call, and audio call support
- **Read Receipts**: Track message read status per user with timestamps
- **Online Status**: Real-time user presence indicators with last seen timestamps
- **Global Rooms**: Public chat rooms with categories (General, Gaming, Music, Technology, Creative, Food & Travel)
- **Group Management**: Create, join, and manage group conversations
- **Direct Messages**: Private one-on-one conversations
- **Message History**: Paginated message loading with proper ordering and reply support

## Admin Dashboard
**Comprehensive administrative interface** for platform management:
- **User Management**: View, edit roles, and delete user accounts
- **Chat Moderation**: Monitor and delete inappropriate chat rooms
- **Message Moderation**: Review and remove individual messages
- **Statistics Dashboard**: Real-time metrics for users, chats, and messages
- **Role Assignment**: Promote users to moderator or admin status
- **Access Control**: Admin-only routes with proper authentication middleware

## Development Tools
- **Build System**: Vite for fast development and optimized production builds
- **Code Quality**: TypeScript strict mode with comprehensive type checking
- **Development**: Hot module replacement and error overlay for enhanced DX
- **Deployment**: Production-ready build process with static asset optimization

# External Dependencies

## Core Framework Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL database connection and querying
- **drizzle-orm & drizzle-kit**: Type-safe ORM and schema management for PostgreSQL
- **@tanstack/react-query**: Server state management, caching, and synchronization
- **wouter**: Lightweight client-side routing for React
- **express**: Node.js web application framework for the backend API

## UI and Styling
- **@radix-ui/react-***: Comprehensive set of accessible UI primitives (dialogs, dropdowns, forms, etc.)
- **tailwindcss**: Utility-first CSS framework for rapid UI development
- **class-variance-authority**: Utility for creating type-safe CSS class variants
- **lucide-react**: Modern icon library with React components

## Authentication and Session
- **openid-client**: OpenID Connect client for Replit Auth integration
- **passport**: Authentication middleware for Express
- **express-session**: Session middleware for Express
- **connect-pg-simple**: PostgreSQL session store for persistent sessions

## Development and Build Tools
- **vite**: Fast build tool and development server
- **tsx**: TypeScript execution engine for Node.js
- **esbuild**: Fast JavaScript bundler for production builds
- **@replit/vite-plugin-***: Replit-specific development plugins

## Form Handling and Validation
- **react-hook-form**: Performant forms library with minimal re-renders
- **@hookform/resolvers**: Validation resolvers for react-hook-form
- **zod**: TypeScript-first schema validation
- **drizzle-zod**: Integration between Drizzle schemas and Zod validation

## Utility Libraries
- **date-fns**: Modern date utility library for JavaScript
- **clsx & twMerge**: Utility functions for conditional CSS classes
- **nanoid**: URL-safe unique string ID generator
- **memoizee**: Memoization library for performance optimization