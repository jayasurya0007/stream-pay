# StreamPay Demo

This project demonstrates StreamPay, a micropayment streaming platform built with Nitrolite state channels.

The core goal is to show how to use `@erc7824/nitrolite`, a state channel framework for EVM chains, to enable off-chain micropayments with on-chain security. This allows you to build a user experience with instant finality that feels as responsive as a traditional Web2 application.

## Workshop Goal

In this workshop, we will use StreamPay as a practical example of a micropayment streaming platform. We will walk through the process of integrating Nitrolite to enable features like instant micropayments for content creators. The principles you learn here can be applied to any dApp to significantly improve user experience by removing transaction friction.

## Technology Stack

- **Framework:** Preact with Hooks
- **Language:** TypeScript
- **Build Tool:** Vite
- **Styling:** CSS Modules
- **Key Library:** `@erc7824/nitrolite`

## Refactor: Modular Hooks Architecture

The main app logic was reorganized from a single `src/App.tsx` into dedicated hooks for clarity and reuse. Functionality remains identical.

### New Hook Modules

- `src/hooks/useWallet.ts`: Connects MetaMask via viem, exposes `account`, `walletClient`, `connectWallet`.
- `src/hooks/useSessionKey.ts`: Generates/loads a session key, caches in `localStorage`.
- `src/hooks/useWebSocketStatus.ts`: Manages WebSocket connection to `VITE_NITROLITE_WS_URL` and status updates.
- `src/hooks/useAuth.ts`: Runs EIP‑712 authentication (challenge/verify), stores JWT, exposes `isAuthenticated`.
- `src/hooks/useBalances.ts`: Fetches ledger balances after auth and listens for live balance updates.
- `src/hooks/useNitroliteAppSessions.ts`: Create/get/close app sessions over Nitrolite RPC.
- `src/hooks/useNitroliteState.ts`: Submit app state and query channels/RPC history (with derive-from-history helper).
- `src/hooks/useTransfer.ts`: Signs and sends transfers using the session key.

### Updated `src/App.tsx`

- Replaced inlined effects and handlers with the hooks above.
- Keeps minimal UI state for transfer progress and a small listener for transfer/error notifications.
- Existing UI remains the same (wallet connect, balances, app sessions, app state, channels/RPC history).

### Notes

- `VITE_NITROLITE_WS_URL` is still required (see Setup below).
- Two helper pieces are intentionally kept for future use: `handleSupport` (not wired to UI) and the derive-from-history toggle.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- A WebSocket RPC endpoint for Nitrolite.

### Installation & Setup

1.  **Clone the repository:**

    ```bash
    git clone <your-repo-url>
    cd stream-pay-demo
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a file named `.env.local` in the root of the project and add your Nitrolite configuration:

    ```env
    # .env.local
    VITE_NITROLITE_WS_URL=wss://your-rpc-endpoint.com/ws
    VITE_CUSTODY_ADDRESS=0x0000000000000000000000000000000000000000
    VITE_ADJUDICATOR_ADDRESS=0x0000000000000000000000000000000000000000
    VITE_USDC_TOKEN_ADDRESS=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:5173` (or the next available port).

## Workshop Chapters

This repository uses branches to guide you through the workshop. You can switch between branches to see the code evolve at each stage.

- `main`: The initial project setup.
- `chapter-1-wallet-connect`: Solution for Chapter 1 (Connecting to a user's wallet).
- `chapter-2-ws-connection`: Solution for Chapter 2 (Initializing the WebSocket connection).
- `chapter-3-session-auth`: Solution for Chapter 3 (Authenticating the session via WebSocket).
- `chapter-4-display-balances`: Solution for Chapter 4 (Fetching and displaying asset balances).
- `final-p2p-transfer`: The final, completed application with peer-to-peer transfers.

## Micropayment Streaming Platform Implementation

### New Features Added

#### 1. Pay-As-You-Watch Streaming Platform
- **Video Cards**: Hardcoded video selection with creator addresses
- **Session Budget**: User sets spending limit per video session (optional)
- **Real-time Micropayments**: Automatic payments every 10 seconds while video plays
- **Rate Configuration**: Fixed at 0.01 USDC per minute (0.00167 USDC per 10-second tick)
- **Flexible Budgeting**: Stream with current ledger balance when no budget is set
- **Platform Fees**: Automatic 5% platform fee on all user-to-creator transfers

#### 2. Enhanced UI Components
- **Video Grid**: Card-based video selection interface
- **Funding Section**: Deposit/Withdraw controls for ledger balance management
- **Streaming Status**: Real-time display of payment status and total spent
- **Balance Display**: Shows available ledger balance for selected asset

#### 3. New Hooks Added
- `src/hooks/useStreamingPayments.ts`: Manages micropayment streaming logic
  - Handles interval-based payments
  - Enforces session budget limits
  - Provides start/stop controls
  - Tracks total sent amounts

#### 4. Network Configuration
- **Base Network**: Switched from Ethereum mainnet to Base (chainId 8453)
- **Wallet Integration**: Updated to use Base network for all transactions
- **Asset Support**: USDC and ETH with proper decimal handling (6 and 18 decimals)

#### 5. Complete Deposit/Withdraw Implementation ✅
- **Full Nitrolite Client Integration**: Complete implementation using `@erc7824/nitrolite` client methods
- **Deposit Function**: `client.deposit()` for funding ledger accounts with proper error handling
- **Withdraw Function**: `client.withdrawal()` for reclaiming funds with balance validation
- **Contract Configuration**: Uses environment variables for custody, adjudicator, and token addresses
- **Type Safety**: Handles TypeScript version conflicts with proper type assertions
- **User Experience**: Confirmation dialogs, success/error messages, and automatic form clearing

### Technical Implementation Details

#### Micropayment Flow
1. **Authentication**: User connects wallet and authenticates with session key
2. **Funding**: User deposits funds from wallet to Nitrolite ledger (onchain)
3. **Video Selection**: User selects video and sets session budget
4. **Streaming**: On play, micropayments stream from user ledger to creator ledger (off-chain)
5. **Settlement**: Creator can withdraw funds from their ledger (onchain)

#### Key Features
- **Off-chain Micropayments**: No gas fees per payment tick
- **Budget Enforcement**: Automatic stop when session budget reached
- **Real-time Updates**: Live balance and spending tracking
- **Complete Error Handling**: Comprehensive error management and user feedback
- **Full Onchain Integration**: Working deposit/withdraw with Nitrolite contracts
- **Input Validation**: Amount validation, balance checks, and confirmation dialogs
- **Video Control**: Automatic video pause when insufficient funds detected
- **Platform Revenue**: Automatic fee collection on all streaming payments

#### Configuration Required
- **Environment Variables**: 
  - `VITE_NITROLITE_WS_URL` for WebSocket connection
  - `VITE_CUSTODY_ADDRESS` for Nitrolite custody contract
  - `VITE_ADJUDICATOR_ADDRESS` for Nitrolite adjudicator contract
  - `VITE_USDC_TOKEN_ADDRESS` for USDC token contract on Base

### Usage Instructions

1. **Connect Wallet**: Ensure MetaMask is on Base network
2. **Fund Account**: Use Deposit button to add funds to ledger (requires gas fees)
3. **Select Video**: Choose from available video cards
4. **Set Budget** (Optional): Enter session spending limit, or leave empty to use current balance
5. **Watch & Pay**: Click Watch, then Play to start micropayment streaming
6. **Monitor**: Track spending in real-time, pause/stop anytime
7. **Withdraw**: Use Withdraw button to reclaim funds from ledger to wallet

### Budget Options

#### **With Session Budget:**
- User sets a specific spending limit (e.g., 5 USDC)
- Streaming stops when budget is reached
- Provides spending control and predictability

#### **Without Session Budget:**
- Uses current ledger balance as spending limit
- Streaming continues until balance reaches zero
- Maximum flexibility - spend all available funds

### Platform Fee System

#### **Automatic Fee Collection:**
- **5% Platform Fee**: Automatically deducted from each user payment
- **Creator Receives**: 95% of each payment
- **Platform Receives**: 5% of each payment
- **Transparent Display**: Real-time breakdown of fees in streaming status

#### **Fee Distribution:**
```
User Payment: 0.00167 USDC (per 10-second tick)
├── Creator: 0.00159 USDC (95%)
└── Platform: 0.00008 USDC (5%)
```

#### **Revenue Model:**
- **Sustainable Platform**: Automatic revenue generation
- **Fair Creator Compensation**: Creators receive majority of payments
- **Transparent Fees**: Clear breakdown shown to users
- **Configurable**: Platform fee percentage can be adjusted in code

### Deposit/Withdraw Features

#### Deposit Process
- **Input Validation**: Checks for valid amounts and required fields
- **Environment Validation**: Verifies all contract addresses are configured
- **Network Validation**: Automatically detects and switches to Base network if needed
- **USDC Approval**: Automatically checks and requests USDC token approval for custody contract
- **User Confirmation**: Shows confirmation dialog before transaction
- **Gas Fee Warning**: Informs user about onchain transaction costs
- **Success Feedback**: Displays transaction hash and amount deposited
- **Error Handling**: Specific error messages for common issues (insufficient funds, user rejection, gas estimation)

#### Withdraw Process
- **Balance Validation**: Checks if user has sufficient ledger balance
- **Amount Validation**: Ensures withdrawal amount is greater than 0
- **Network Validation**: Automatically detects and switches to Base network if needed
- **User Confirmation**: Shows confirmation dialog before transaction
- **Gas Fee Warning**: Informs user about onchain transaction costs
- **Success Feedback**: Displays transaction hash and amount withdrawn
- **Error Handling**: Specific error messages including challenge period warnings

### Files Modified
- `src/App.tsx`: Added streaming platform UI, complete deposit/withdraw functions, and platform fee system
- `src/hooks/useWallet.ts`: Updated to use Base network
- `src/hooks/useStreamingPayments.ts`: New hook for micropayment management
- `README.md`: Updated documentation with complete implementation details and platform fee system

### Technical Notes

#### TypeScript Integration
- **Version Conflicts**: Resolved TypeScript conflicts between `@erc7824/nitrolite` and `viem` using type assertions
- **Dynamic Imports**: Used dynamic imports to avoid static type checking issues
- **Type Safety**: Maintained type safety while handling version incompatibilities

#### Error Handling
- **Comprehensive Coverage**: Handles insufficient funds, user rejection, gas estimation failures, and challenge periods
- **User-Friendly Messages**: Converts technical errors into actionable user messages
- **Graceful Degradation**: Provides fallback error messages for unknown issues

#### Security Considerations
- **Environment Variables**: All sensitive contract addresses stored in environment variables
- **User Confirmation**: All onchain transactions require explicit user confirmation
- **Balance Validation**: Prevents withdrawals exceeding available ledger balance

## Note for Presenters

A special `presenter` branch is available for conducting the live workshop.

This branch contains the final, completed code, but the logic for **Chapter 3 onwards** is commented out in sequential blocks. To present, stay on this branch and uncomment each block as you progress through the workshop. This ensures a smooth, typo-free demonstration. The `chapter-*` branches serve as clean checkpoints for attendees.
