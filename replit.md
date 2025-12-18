# Prescriber Manager

## Overview

A complete web system for managing prescribers/doctors, processing orders via CSV upload, and generating financial reports in PDF format. The application handles monthly order tracking and payment control for pharmaceutical prescribers with commission-based compensation.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with custom plugins for Replit integration
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: TanStack Query for server state, React Context for UI state
- **Styling**: TailwindCSS v4 with shadcn/ui component library (New York style)
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript (ESM modules)
- **API Design**: RESTful endpoints under `/api/*` prefix
- **Development**: Vite dev server with HMR proxied through Express

### Data Storage
- **Database**: PostgreSQL via Drizzle ORM
- **Schema Location**: `shared/schema.ts` (shared between client and server)
- **Migrations**: Drizzle Kit with `drizzle-kit push` command

### Key Data Separation Rule
The system maintains **two separate order sources** that must never be mixed:
1. **CSV Orders** (`csv_orders` table) - Imported via CSV upload, displayed only in Reports tab
2. **Manual Orders** (`manual_orders` table) - Created manually, displayed only in Orders tab

### Directory Structure
```
client/src/           # Frontend React application
  components/         # Reusable UI components
  pages/              # Route-level page components
  hooks/              # Custom React hooks (useApi.ts for data fetching)
  lib/                # Utilities (CSV parser, order grouping, API client)
  context/            # React context providers
  types/              # TypeScript type definitions

server/               # Backend Express application
  index.ts            # Server entry point
  routes.ts           # API route definitions
  storage.ts          # Database operations interface
  db.ts               # Database connection

shared/               # Shared code between client and server
  schema.ts           # Drizzle ORM schema definitions
```

### PDF Generation
- Uses jsPDF with jspdf-autotable plugin
- Generated client-side for prescriber financial reports
- Includes order summaries, commission calculations, and conversion rates

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via `DATABASE_URL` environment variable
- **Drizzle ORM**: Type-safe database queries and schema management

### UI Components
- **Radix UI**: Headless UI primitives for accessibility
- **shadcn/ui**: Pre-built component library based on Radix
- **Lucide React**: Icon library

### Data Processing
- **date-fns**: Date formatting and manipulation
- **Zod**: Runtime schema validation for forms and API data
- **react-dropzone**: File upload handling for CSV imports

### Replit Integration
- Custom Vite plugins for development banner and error overlay
- Meta images plugin for OpenGraph tags
- Cartographer plugin for project mapping