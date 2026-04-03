# EscrowHub: Web3 Marketplace & Escrow Platform

EscrowHub is a decentralized gig marketplace and escrow platform built on **Starknet**. It enables clients to hire freelancers with secure, smart-contract-based payments, ensuring that funds are only released when milestones are completed and approved.

## 🚀 Features

- **Decentralized Escrow**: Secure payments held in Starknet smart contracts.
- **Milestone-Based Payments**: Release funds incrementally as work progresses.
- **Gig Marketplace**: Browse and post jobs, or search for specialized freelancers.
- **Web3 Auth**: Simple login with **Privy** (Google, Email, Wallets).
- **Starknet Integration**: Native support for Argent X and Braavos wallets.
- **Real-time Data**: Powered by **Supabase** for fast, reliable data synchronization.

## 🛠 Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, Starknet-React
- **Backend/Database**: Supabase
- **Authentication**: Privy
- **Smart Contracts**: Cairo (Starknet)
- **Blockchain**: Starknet Sepolia Testnet

## ⚙️ Development Setup

### 1. Prerequisites
- Node.js (v18+)
- A Supabase account
- A Privy account (for authentication)

### 2. Environment Variables
Create a `.env` file in the `frontend` directory based on `.env.example`:
```env
VITE_PRIVY_APP_ID=your_privy_id
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
```

### 3. Database Setup
Run the SQL script provided in [supabase_setup.sql](./supabase_setup.sql) in your Supabase SQL Editor. This will:
- Create the necessary tables (`escrowhub_profiles`, `escrowhub_jobs`, `escrowhub_offers`).
- Enable Row-Level Security (RLS) for data protection.

### 4. Install & Run
```bash
# From the root directory:
npm install
npm run dev --prefix frontend
```

## 📜 Usage

1.  **Register**: Choose your role as a Client or Freelancer.
2.  **Post/Apply**: Clients can post jobs; Freelancers can apply.
3.  **Hire**: Clients can send contract offers directly to freelancers.
4.  **Escrow**: Once an offer is accepted, a Starknet escrow contract is created.
5.  **Deliver**: Freelancers complete milestones and request release of funds.

## 🔗 Links
- **Starknet Contract**: `0x03dfb3a4a7536d7fbca153676c5b26639c0dc11ea35d7fbca26639c0dc11ea35d`
- **Network**: Starknet Sepolia

## 📄 License
MIT
