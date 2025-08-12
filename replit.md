# Overview

This is ChatGroove - a unique modern messaging application that combines the best features from WhatsApp, Facebook Messenger, and Telegram with innovative additions. The app features global chat rooms, email registration, video/audio calls, voice/video notes, mobile-optimized UI, and social media-inspired interactions. It's architected as a full-stack TypeScript application with React frontend, Express backend, and PostgreSQL database using Drizzle ORM.

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
**PostgreSQL** database with **Drizzle ORM** for type-safe database operations:
- **Schema Design**: Normalized relational structure with proper foreign key relationships
- **Tables**: Users, chats, messages, chat participants, message reads, and sessions
- **Connection**: Uses Neon serverless PostgreSQL with connection pooling
- **Migrations**: Drizzle Kit for schema management and migrations

## Authentication System
**Replit Auth** integration using OpenID Connect:
- **Session Management**: PostgreSQL-backed sessions with connect-pg-simple
- **User Management**: Automatic user creation/updates from OAuth claims
- **Security**: HTTP-only cookies, CSRF protection, and proper session validation
- **Profile Management**: User profiles with customizable display names, bios, and avatars

## Chat System Architecture
**Multi-participant chat support** with both direct messages and group functionality:
- **Message Types**: Text messages with planned support for images and files
- **Read Receipts**: Track message read status per user
- **Online Status**: Real-time user presence indicators
- **Search**: User discovery and chat search functionality
- **Message History**: Paginated message loading with proper ordering

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