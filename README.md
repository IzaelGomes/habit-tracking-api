# Habit Tracking API

A robust habit tracking API built with NestJS, PostgreSQL, Prisma, and JWT authentication.

## Features

- ✅ User authentication with JWT (register, login, logout)
- ✅ Create habits with weekday scheduling
- ✅ List user's habits
- ✅ Global validation with class-validator
- ✅ PostgreSQL database with Docker
- ✅ Prisma ORM for type-safe database access

## Prerequisites

- Node.js (v18 or higher)
- Docker and Docker Compose
- pnpm (recommended) or npm

## Setup Instructions

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment Variables

Create a `.env` file in the project root (use `.env.example` as template):

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/habit_tracking?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
PORT=3000
```

### 3. Start PostgreSQL Database

```bash
docker compose up -d
```

### 4. Run Database Migrations

```bash
npx prisma migrate dev --name init
```

### 5. Generate Prisma Client

```bash
npx prisma generate
```

### 6. Start the Application

```bash
# Development mode
pnpm start:dev

# Production mode
pnpm build
pnpm start:prod
```

The API will be available at `http://localhost:3000`

## API Endpoints

### Authentication

#### Register a New User
```http
POST /auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid",
    "username": "johndoe",
    "createdAt": "2026-01-06T20:00:00.000Z",
    "updatedAt": "2026-01-06T20:00:00.000Z"
  }
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "username": "johndoe",
  "password": "password123"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "username": "johndoe"
  }
}
```

#### Logout
```http
POST /auth/logout
Authorization: Bearer <your-jwt-token>
```

**Response:**
```json
{
  "message": "Logout successful. Please remove the token from the client."
}
```

### Habits (Protected Routes)

All habit endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

#### Create a Habit
```http
POST /habits
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "name": "Morning Exercise",
  "weekDays": [0, 2, 4]
}
```

**Weekday Numbers:**
- 0 = Monday
- 1 = Tuesday
- 2 = Wednesday
- 3 = Thursday
- 4 = Friday
- 5 = Saturday
- 6 = Sunday

**Response:**
```json
{
  "message": "Habit created successfully",
  "habit": {
    "id": "uuid",
    "name": "Morning Exercise",
    "weekDays": [0, 2, 4],
    "createdAt": "2026-01-06T20:00:00.000Z",
    "updatedAt": "2026-01-06T20:00:00.000Z"
  }
}
```

**Validation Rules:**
- `name`: Required, non-empty string
- `weekDays`: Required array with at least 1 day, each value must be 0-6
- Weekdays must be unique (no duplicates)

#### List All Habits
```http
GET /habits
Authorization: Bearer <your-jwt-token>
```

**Response:**
```json
{
  "habits": [
    {
      "id": "uuid",
      "name": "Morning Exercise",
      "weekDays": [0, 2, 4],
      "createdAt": "2026-01-06T20:00:00.000Z",
      "updatedAt": "2026-01-06T20:00:00.000Z"
    }
  ],
  "total": 1
}
```

## Project Structure

```
src/
├── modules/
│   ├── auth/
│   │   ├── dto/
│   │   │   ├── register.dto.ts
│   │   │   └── login.dto.ts
│   │   ├── services/
│   │   │   ├── register.service.ts
│   │   │   ├── login.service.ts
│   │   │   └── logout.service.ts
│   │   ├── strategies/
│   │   │   └── jwt.strategy.ts
│   │   ├── guards/
│   │   │   └── jwt-auth.guard.ts
│   │   ├── auth.controller.ts
│   │   └── auth.module.ts
│   └── habits/
│       ├── dto/
│       │   └── create-habit.dto.ts
│       ├── services/
│       │   ├── create-habit.service.ts
│       │   └── get-habits.service.ts
│       ├── habits.contoller.ts
│       └── habits.module.ts
├── prisma/
│   ├── prisma.service.ts
│   └── prisma.module.ts
├── app.module.ts
└── main.ts
```

## Architecture

### Service-Based Architecture
Each endpoint has its own dedicated service:
- `register.service.ts` - Handles user registration
- `login.service.ts` - Handles authentication
- `logout.service.ts` - Handles logout
- `create-habit.service.ts` - Creates habits
- `get-habits.service.ts` - Lists habits

### Authentication Flow
1. User registers with username/password
2. Password is hashed using bcrypt
3. User logs in and receives JWT token
4. JWT token contains `{ userId: string }`
5. Protected routes verify JWT and extract userId
6. Services use userId to scope operations

### Database Models

**User**
- id (UUID)
- username (unique)
- password (hashed)
- habits (relation)
- tracking (relation)

**Habit**
- id (UUID)
- name (string)
- weekDays (int array)
- userId (foreign key)
- user (relation)

**Tracking** (for future implementation)
- id (UUID)
- userId (foreign key)
- habitId (foreign key)
- checked (boolean)

## Development Commands

```bash
# Start development server
pnpm start:dev

# Build for production
pnpm build

# Run tests
pnpm test

# Run linter
pnpm lint

# Format code
pnpm format

# View Prisma Studio (database GUI)
npx prisma studio
```

## Docker Commands

```bash
# Start database
docker compose up -d

# Stop database
docker compose down

# View logs
docker compose logs -f

# Reset database (WARNING: destroys all data)
docker compose down -v
```

## Security Notes

⚠️ **Important for Production:**
1. Change the `JWT_SECRET` in `.env` to a strong, random value
2. Use environment variables for all sensitive data
3. Enable HTTPS/TLS in production
4. Set appropriate JWT expiration times
5. Implement rate limiting for auth endpoints
6. Add password complexity requirements

## Technologies Used

- **NestJS** - Progressive Node.js framework
- **PostgreSQL** - Relational database
- **Prisma** - Modern ORM with type safety
- **JWT** - JSON Web Tokens for authentication
- **bcrypt** - Password hashing
- **class-validator** - DTO validation
- **Docker** - Containerization

## License

UNLICENSED
