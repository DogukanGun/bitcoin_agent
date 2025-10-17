# PayGuard - Bitcoin Subscription Platform

A comprehensive Bitcoin subscription payment platform built on Mezo chain with agent delegation, underwriting, and NFT-based credit scoring.

## Architecture

This project is structured as a monorepo with three main components:

```
bitcoin_agent/
├── app/                    # NextJS + TypeScript Frontend
├── backend/               # Fastify + TypeScript API Server  
├── smart_contracts/       # Solidity Contracts + Tests
└── README.md
```

## Key Features

### Core Platform
- Agent-Delegated Subscriptions: Users delegate payment authority to AI agents
- Automatic Payment Processing: Smart contracts handle recurring payments with grace periods
- Underwriting & Credit: Companies stake funds to provide credit lines for users
- Pool-Based Coverage: Reserve pool covers missed payments with automatic repayment
- NFT Point System: Soulbound tokens track payment history and creditworthiness
- Gas Abstraction: Relayer system sponsors transactions for seamless UX

### User Experience
- Modern Web Interface: NextJS frontend with TypeScript and Tailwind CSS
- Wallet Integration: Connect with MetaMask and other Web3 wallets using ConnectKit
- Real-time Updates: Live subscription status and payment notifications
- Mobile-Responsive: Works seamlessly across all devices

### Developer Experience
- TypeScript Throughout: Full type safety across frontend, backend, and tests
- Comprehensive Testing: 95%+ test coverage for smart contracts
- API Documentation: Auto-generated Swagger docs for backend
- Modular Architecture: Easy to extend and customize

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Git

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd bitcoin_agent
```

2. Install dependencies for all components:
```bash
# Smart contracts
cd smart_contracts
npm install

# Backend
cd ../backend  
npm install

# Frontend
cd ../app
npm install
```

3. Set up environment variables:

Copy the example environment files and update with your values:
```bash
# Smart contracts
cp smart_contracts/.env.example smart_contracts/.env

# Backend  
cp backend/.env.example backend/.env

# Frontend
cp app/.env.example app/.env.local
```

### Development Setup

1. Deploy smart contracts:
```bash
cd smart_contracts
npm run build
npm run deploy:local  # or npm run deploy:mezo for mainnet
```

2. Start the backend API:
```bash
cd backend
npm run dev
```

3. Start the frontend:
```bash
cd app
npm run dev
```

4. Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- API Docs: http://localhost:3001/docs

## Component Details

### Smart Contracts (/smart_contracts)

Core Contracts:
- SubscriptionFactory.sol - Creates and manages payment agreements
- SubscriptionContract.sol - Individual subscription logic with payment tracking  
- UserAgent.sol - ERC-1271 compatible contract for signature delegation
- ReservePool.sol - Manages underwriting funds and credit lines
- PaymentPointNFT.sol - Soulbound tokens for credit scoring

Key Scripts:
- npm run build - Compile contracts
- npm test - Run comprehensive test suite
- npm run deploy:mezo - Deploy to Mezo chain
- npm run coverage - Generate test coverage report

### Backend API (/backend)

Tech Stack:
- Fastify - High-performance web framework
- TypeScript - Type safety and developer experience
- Zod - Runtime type validation
- Prisma - Database ORM (optional)
- Redis - Caching and session management

API Endpoints:
- /api/subscriptions - Manage user subscriptions
- /api/payments - Handle payment processing
- /api/providers - Provider management
- /api/plans - Subscription plans
- /api/analytics - Usage analytics
- /api/health - Health checks

Key Scripts:
- npm run dev - Start development server
- npm run build - Build for production
- npm test - Run API tests
- npm run lint - Code linting

### Frontend (/app)

Tech Stack:
- Next.js 14 - React framework with app router
- TypeScript - Type safety throughout
- Tailwind CSS - Utility-first styling
- ConnectKit + Wagmi - Web3 wallet integration
- TanStack Query - Data fetching and caching
- Zustand - State management

Key Pages:
- / - Landing page and feature overview
- /deploy - Deploy user agent contract and receive NFT
- /subscribe - Browse and subscribe to services
- /dashboard - User dashboard with subscription management
- /providers - Company dashboard for creating subscription models

Key Scripts:
- npm run dev - Start development server
- npm run build - Build for production
- npm run lint - Code linting
- npm run type-check - TypeScript validation

## User Flows

### 1. User Onboarding Flow
1. Connect Wallet - User connects MetaMask or other Web3 wallet
2. Deploy User Agent - Deploy personal subscription management contract
3. Receive NFT - Get initial payment point NFT for credit building
4. Browse Plans - Explore available subscription services

### 2. Subscription Creation Flow
1. Select Plan - Choose subscription service and terms
2. Sign Agreement - EIP-712 signature for payment agreement
3. Deploy Contract - Individual subscription contract created
4. Authorize Agent - Delegate payment authority to AI agent

### 3. Company Provider Flow
1. Register Provider - Create provider profile
2. Create Plans - Define subscription terms and pricing
3. Sign Agreements - Use EIP-712 to sign user agreements
4. Monitor Subscriptions - Track payments and manage services

## Configuration

### Environment Variables

Smart Contracts:
```env
MEZO_RPC_URL=https://rpc.mezo.org
MEZO_API_KEY=your_api_key
PRIVATE_KEY=your_deployer_private_key
```

Backend:
```env
PORT=3001
DATABASE_URL=postgresql://user:pass@localhost:5432/payguard
REDIS_URL=redis://localhost:6379
MEZO_RPC_URL=https://rpc.mezo.org
SUBSCRIPTION_FACTORY_ADDRESS=0x...
JWT_SECRET=your_jwt_secret
```

Frontend:
```env
NEXT_PUBLIC_MEZO_CHAIN_ID=686868
NEXT_PUBLIC_MEZO_RPC_URL=https://rpc.mezo.org
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api
NEXT_PUBLIC_SUBSCRIPTION_FACTORY_ADDRESS=0x...
```

## Testing

### Smart Contract Tests
```bash
cd smart_contracts
npm test                    # Run all tests
npm run test:coverage      # Generate coverage report
npm run test:gas          # Analyze gas usage
```

### Backend Tests
```bash
cd backend
npm test                   # Run API tests
npm run test:watch        # Watch mode
```

### Frontend Tests
```bash
cd app
npm run test              # Run component tests
npm run test:e2e         # End-to-end tests
```

## Monitoring & Analytics

### Health Checks
- Backend: GET /api/health
- Database connectivity
- Redis connectivity  
- Blockchain connectivity

### Metrics
- Subscription creation rate
- Payment success rate
- Pool utilization
- User credit scores
- Transaction gas costs

## Security

### Smart Contract Security
- OpenZeppelin base contracts
- Comprehensive test coverage (95%+)
- EIP-712 signature validation
- Reentrancy guards
- Access controls

### Backend Security
- JWT authentication
- Rate limiting
- Input validation with Zod
- CORS configuration
- Helmet security headers

### Frontend Security
- Content Security Policy
- Secure wallet connections
- Transaction verification
- Environment variable protection

## Deployment

### Smart Contracts
```bash
cd smart_contracts
npm run deploy:mezo
npm run verify  # Verify on block explorer
```

### Backend
```bash
cd backend
npm run build
npm start
# Or deploy to your preferred cloud provider
```

### Frontend
```bash
cd app
npm run build
npm start
# Or deploy to Vercel/Netlify
```

## Contributing

1. Fork the repository
2. Create a feature branch: git checkout -b feature/amazing-feature
3. Make your changes and add tests
4. Run tests: npm test in relevant directories
5. Commit changes: git commit -m 'Add amazing feature'
6. Push to branch: git push origin feature/amazing-feature
7. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Maintain test coverage above 90%
- Use conventional commit messages
- Update documentation for new features
- Run linting before commits

## Additional Resources

### Documentation
- Smart Contract API (./smart_contracts/docs/)
- Backend API (./backend/docs/)
- Frontend Components (./app/docs/)

### External Links
- Mezo Chain Documentation (https://docs.mezo.org)
- EIP-712 Specification (https://eips.ethereum.org/EIPS/eip-712)
- OpenZeppelin Contracts (https://docs.openzeppelin.com/contracts/)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Disclaimer

This software is experimental and under active development. Use at your own risk. Never store large amounts or use real funds in test environments.

Built for the Bitcoin and Mezo communities