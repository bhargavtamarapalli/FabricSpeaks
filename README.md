# Fabric Speaks E-Commerce

A premium fashion e-commerce platform with a focus on high-end apparel and accessories.

## Quick Start

1. Start Docker Desktop
2. Run the test script:
```bash
python scripts/test_setup.py
```

This script will:
- Check if Docker is running
- Start the database
- Apply migrations
- Run integration tests

## Manual Setup

If you prefer to run commands manually:

1. Start the database:
```bash
npm run db:up
```

2. Apply migrations:
```bash
npm run migrate:psql
```

3. Run tests:
```bash
# All tests
npm test

# Just integration tests
npm run test:integration
```

## Development

### Database Access
- Adminer UI: http://localhost:8080
  - System: PostgreSQL
  - Server: db
  - Username: fsuser
  - Password: postgres
  - Database: fabric_speaks

### API Server
- Development server: `npm run dev`
- Access at: http://localhost:5000

## Project Structure

- `/server` - Backend API and database logic
- `/client` - Frontend React application
- `/shared` - Shared types and utilities
- `/scripts` - Development and testing utilities
- `/supabase` - Database migrations and seeds

## Current Status

✅ Phase 1: Infrastructure
- Express backend with TypeScript
- Supabase Auth integration
- PostgreSQL database with Drizzle ORM
- Basic integration tests
- Docker setup for local development
- CI pipeline with GitHub Actions

⏳ Phase 2: Core Features (Next)
- Product management
- Shopping cart
- User profiles
- Order processing
- Admin dashboard

## Documentation

- [Project Plan](PROJECT_PLAN.md) - Detailed roadmap and milestones
- [Integration Plan](INTEGRATION_PLAN.md) - Third-party service integration details
- [Design Guidelines](design_guidelines.md) - UI/UX standards