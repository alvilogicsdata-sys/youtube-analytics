# Node.js + Express Backend Boilerplate

A complete backend boilerplate using Node.js, Express, PostgreSQL, Redis, and JWT authentication.

## Features

- Express.js server with middleware
- PostgreSQL database integration
- Redis caching
- JWT-based authentication
- Request validation with Joi
- Error handling middleware
- Environment configuration
- CORS and security headers
- Rate limiting

## Project Structure

```
nodejs-backend/
├── server.js                 # Entry point of the application
├── .env                      # Environment variables
├── package.json
├── routes/                   # API routes
│   ├── auth.js               # Authentication routes
│   └── user.js               # User management routes
├── controllers/              # Business logic
│   ├── authController.js     # Authentication logic
│   └── userController.js     # User management logic
├── middleware/               # Custom middleware
│   ├── auth.js               # Authentication middleware
│   ├── errorHandler.js       # Global error handler
│   └── validation.js         # Request validation
├── config/                   # Configuration files
│   ├── database.js           # PostgreSQL connection
│   └── redis.js              # Redis connection
└── utils/                    # Utility functions (empty for now)
```

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file in the root directory based on `.env.example`:
   ```bash
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=your_postgres_user
   DB_PASSWORD=your_postgres_password
   DB_NAME=your_database_name
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=your_redis_password
   JWT_SECRET=your_jwt_secret
   PORT=3000
   ```

3. Make sure PostgreSQL and Redis are running on your system

4. Start the development server:
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/profile` - Get user profile (requires authentication)

### User Management
- `GET /api/users` - Get all users (requires authentication)
- `GET /api/users/:id` - Get user by ID (requires authentication)
- `PUT /api/users/:id` - Update user by ID (requires authentication)
- `DELETE /api/users/:id` - Delete user by ID (requires authentication)

### Health Check
- `GET /health` - Health check endpoint

## Environment Variables

- `DB_HOST` - PostgreSQL host (default: localhost)
- `DB_PORT` - PostgreSQL port (default: 5432)
- `DB_USER` - PostgreSQL user
- `DB_PASSWORD` - PostgreSQL password
- `DB_NAME` - PostgreSQL database name
- `REDIS_HOST` - Redis host (default: localhost)
- `REDIS_PORT` - Redis port (default: 6379)
- `REDIS_PASSWORD` - Redis password (if any)
- `JWT_SECRET` - Secret key for JWT tokens
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)

## Scripts

- `npm start` - Start the production server
- `npm run dev` - Start the development server with hot reloading
- `npm test` - Run tests

## Dependencies

- `express` - Web framework
- `pg` - PostgreSQL client
- `redis` - Redis client
- `jsonwebtoken` - JWT implementation
- `bcryptjs` - Password hashing
- `cors` - Cross-origin resource sharing
- `dotenv` - Environment variable management
- `express-rate-limit` - Rate limiting
- `joi` - Object schema validation
- `helmet` - Security headers

## Development Dependencies

- `nodemon` - Automatic server restart during development
- `jest` - Testing framework
- `supertest` - HTTP assertion library for testing