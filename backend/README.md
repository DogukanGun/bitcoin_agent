# PayGuard Backend API

Bitcoin subscription platform API for Mezo chain with JWT authentication and MongoDB storage.

## What's Been Implemented

### 1. **Authentication System**
- Wallet signature verification (Web3 authentication)
- JWT token generation and verification  
- Protected routes with Bearer token middleware
- User management with MongoDB

**Endpoints:**
- `GET /api/auth/nonce/:address` - Get message to sign
- `POST /api/auth/login` - Login with signature
- `POST /api/auth/verify` - Verify JWT token
- `GET /api/auth/me` - Get current user (protected)

### 2. **Provider Registration**
- Provider registration with authentication
- MongoDB storage for provider data
- CRUD operations for providers
- Pagination and filtering

**Endpoints:**
- `POST /api/providers/register` - Register new provider (protected)
- `GET /api/providers` - List all providers
- `GET /api/providers/:id` - Get provider details
- `PUT /api/providers/:id` - Update provider (protected)

### 3. **Subscription Management**
- Create subscriptions on blockchain
- Get user subscriptions
- Cancel, pause, resume subscriptions
- Payment history tracking
- Subscription status checks

### 4. **Database & Infrastructure**
- MongoDB integration
- Connection pooling and health checks
- Graceful shutdown handling
- Environment-based configuration

### 5. **Security & Middleware**
- CORS configuration
- Helmet security headers
- Rate limiting
- JWT authentication middleware
- Input validation with Zod schemas

### 6. **API Documentation**
- Swagger/OpenAPI documentation
- Interactive API explorer at `/docs`

## Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB (local or Atlas)
- Deployed smart contracts on Mezo

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp ENV_SETUP.md .env
# Edit .env with your values

# 3. Start MongoDB (if local)
docker run -d --name payguard-mongo -p 27017:27017 mongo:latest

# 4. Build the project
npm run build

# 5. Start the server
npm start
```

### Development Mode

```bash
npm run dev
```

Server will run on `http://localhost:3001`  
API docs available at `http://localhost:3001/docs`

## Project Structure

```
backend/
├── src/
│   ├── middleware/
│   │   └── auth.ts              # JWT authentication middleware
│   ├── routes/
│   │   ├── auth.ts              # Authentication endpoints
│   │   ├── providers.ts         # Provider management
│   │   ├── subscriptions.ts     # Subscription endpoints
│   │   ├── users.ts             # User endpoints (stubs)
│   │   ├── plans.ts             # Plan endpoints (stubs)
│   │   ├── payments.ts          # Payment endpoints (stubs)
│   │   ├── analytics.ts         # Analytics endpoints (stubs)
│   │   ├── health.ts            # Health check endpoints
│   │   └── webhooks.ts          # Webhook endpoints (stubs)
│   ├── types/
│   │   ├── index.ts             # Zod schemas and TypeScript types
│   │   └── jsonwebtoken.d.ts    # JWT type declarations
│   ├── utils/
│   │   ├── blockchain.ts        # Blockchain service (ethers.js)
│   │   ├── mongodb.ts           # MongoDB connection service
│   │   └── jwt.ts               # JWT utilities
│   └── server.ts                # Main server file
├── dist/                        # Compiled JavaScript
├── ENV_SETUP.md                 # Environment setup guide
├── package.json
├── tsconfig.json
└── README.md
```

## Authentication Flow

### 1. Frontend requests nonce
```typescript
const response = await fetch(`/api/auth/nonce/${userAddress}`);
const { message } = await response.json();
```

### 2. User signs message with wallet
```typescript
const signature = await signer.signMessage(message);
```

### 3. Login with signature
```typescript
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ address, message, signature }),
});
const { token, user } = await response.json();
```

### 4. Use token for protected endpoints
```typescript
const response = await fetch('/api/providers/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify(providerData),
});
```

## Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  address: "0x...",           // Ethereum address (lowercase)
  userAgentAddress: "0x...",  // User agent contract address (optional)
  createdAt: ISODate,
  updatedAt: ISODate
}
```

### Providers Collection
```javascript
{
  _id: ObjectId,
  address: "0x...",           // Provider's Ethereum address
  name: "Provider Name",
  description: "...",
  website: "https://...",
  email: "contact@...",
  verified: false,            // Admin verification status
  createdAt: ISODate,
  updatedAt: ISODate
}
```

## API Endpoints

### Health & Docs
- `GET /api/health` - Health check
- `GET /api/health/detailed` - Detailed health status
- `GET /docs` - Swagger API documentation

### Authentication
- `GET /api/auth/nonce/:address` - Get nonce for signing
- `POST /api/auth/login` - Login with wallet signature
- `POST /api/auth/verify` - Verify JWT token
- `GET /api/auth/me` - Get current user info (🔒 Protected)

### Providers
- `POST /api/providers/register` - Register provider (🔒 Protected)
- `GET /api/providers` - List providers
- `GET /api/providers/:id` - Get provider details
- `PUT /api/providers/:id` - Update provider (🔒 Protected)

### Subscriptions
- `GET /api/subscriptions` - Get user subscriptions
- `GET /api/subscriptions/:id` - Get subscription details
- `POST /api/subscriptions` - Create subscription
- `POST /api/subscriptions/:id/cancel` - Cancel subscription
- `POST /api/subscriptions/:id/pause` - Pause subscription
- `POST /api/subscriptions/:id/resume` - Resume subscription
- `GET /api/subscriptions/:id/payments` - Payment history
- `GET /api/subscriptions/:id/status` - Subscription status

### Stub Endpoints (To Be Implemented)
- `/api/users/*` - User management
- `/api/plans/*` - Subscription plans
- `/api/payments/*` - Payment processing
- `/api/analytics/*` - Analytics data
- `/api/webhooks/*` - Webhook management

## Testing

### Test Authentication
```bash
# Get nonce
curl http://localhost:3001/api/auth/nonce/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb

# Login (sign message with wallet first)
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "message": "Sign this message...",
    "signature": "0x..."
  }'
```

### Test Provider Registration
```bash
TOKEN="your-jwt-token"

curl -X POST http://localhost:3001/api/providers/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "name": "Test Provider",
    "description": "A test provider",
    "website": "https://example.com",
    "email": "test@example.com"
  }'
```

## Scripts

```bash
npm run dev          # Start development server with hot reload
npm run build        # Compile TypeScript to JavaScript
npm start            # Start production server
npm run lint         # Run ESLint
npm run lint:fix     # Fix linting issues
npm run typecheck    # Type check without building
npm test             # Run tests (when implemented)
```

## Configuration

### Environment Variables

See `ENV_SETUP.md` for detailed configuration guide.

Key variables:
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `PLATFORM_SIGNER_KEY` - Private key for blockchain transactions
- `MEZO_RPC_URL` - Mezo network RPC endpoint
- Contract addresses for subscription system

### MongoDB Indexes (Recommended)

```javascript
// Users collection
db.users.createIndex({ address: 1 }, { unique: true });

// Providers collection  
db.providers.createIndex({ address: 1 }, { unique: true });
db.providers.createIndex({ verified: 1 });
db.providers.createIndex({ createdAt: -1 });
```

## What's Next

### Immediate Priorities
1. ~~Authentication with signature verification~~ (Done)
2. ~~Provider registration with MongoDB~~ (Done)
3. ~~Remove Redis and unused dependencies~~ (Done)
4. Implement remaining user routes
5. Add subscription plans to MongoDB
6. Implement payment quote endpoints
7. Add webhook system
8. Add analytics endpoints

### Future Enhancements
- [ ] Add refresh token mechanism
- [ ] Implement API keys for providers
- [ ] Add WebSocket support for real-time updates
- [ ] Implement caching layer
- [ ] Add comprehensive test suite
- [ ] Set up CI/CD pipeline
- [ ] Add monitoring and logging (Sentry, DataDog)
- [ ] Implement backup strategy
- [ ] Add admin dashboard endpoints
- [ ] Multi-chain support
