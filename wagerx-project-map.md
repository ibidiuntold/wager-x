# WagerX - Social Wagering Platform Documentation

## Project Overview
WagerX is a Next.js 15 social wagering platform integrating gaming, social interactions, and reward systems. The platform enables users to engage in player-to-player wagers, participate in admin-created events, and earn rewards through various mechanisms.

### Tech Stack
- Next.js 15 (App Router)
- Firebase/Firestore backend
- Firebase Authentication
- Paystack Payment Integration (NGN)
- Tailwind CSS
- Radix UI & ShadCN components
- TypeScript
- Context API for state management
- Firebase Realtime for live updates

### Core Features
1. **Authentication & User Management**
   - Email/Password and Google OAuth
   - Nigerian phone number verification
   - Role-based access (Admin, Manager, User)
   - Customizable user profiles with avatars

2. **Financial System**
   - Paystack integration for bank deposits
   - Admin-managed withdrawals
   - Separate wallet and bonus balances
   - Configurable transaction limits

3. **Gaming & Wagering**
   - P2P wagers
   - Admin-created event wagers with odds
   - Multiple game types
   - Weekly global and friend leaderboards
   - Game-specific points system

4. **Rewards & Bonuses**
   - Point-based tier system
   - Welcome bonus
   - Referral rewards
   - Non-withdrawable bonus balance
   - Configurable bonus restrictions

5. **Social Features**
   - Friend management system
   - Referral tracking
   - Game favorites (max 5)
   - Profile viewing
   - Leaderboard rankings

6. **Admin Features**
   - Complete user management
   - Transaction oversight
   - Game configuration
   - Event creation & odds setting
   - Reward management
   - Global notifications
   - Analytics & reporting

### Business Rules
- Single active wager limitation (except casino games)
- Restricted bonus balance usage
- Admin-configurable transaction limits
- Game-specific point systems
- Tier-based betting limits
- Multi-outcome event system

[Detailed Project Structure Follows...]

## Project Structure Index

### `/app` Directory (Next.js App Router)
### Page Routes
| File | Purpose | Status |
|------|---------|--------|
| `page.tsx` | Home page | Exists |
| `layout.tsx` | Root layout | Exists |
| `metadata.tsx` | SEO metadata | Exists |
| `globals.css` | Global styles | Exists |

### Authentication & User Pages
| File | Purpose | Status |
|------|---------|--------|
| `login/page.tsx` | Login page | Exists |
| `profile/page.tsx` | User profile | Exists |
| `register/page.tsx` | Registration page | Exists |

### Information Pages
| File | Purpose | Status |
|------|---------|--------|
| `about/page.tsx` | About page | Exists |
| `privacy-policy/page.tsx` | Privacy policy | Exists |
| `terms-and-conditions/page.tsx` | Terms | Exists |
| `bonus-policy/page.tsx` | Bonus info | Exists |
| `support/page.tsx` | Support page | Exists |
| `license/page.tsx` | License info | Exists |

### Dashboard Pages
| File | Purpose | Status |
|------|---------|--------|
| `dashboard/broadcast/page.tsx` | Send notifications | Exists |
| `dashboard/deposit/page.tsx` | Manage deposits | Exists |
| `dashboard/withdrawal/page.tsx` | Manage withdrawals | Exists |
| `dashboard/manage-game/page.tsx` | Game management | Exists |
| `dashboard/manage-users/page.tsx` | User management | Exists |
| `dashboard/referral/page.tsx` | Referral system | Exists |
| `dashboard/report/page.tsx` | Analytics | Exists |
| `dashboard/settings/page.tsx` | Site settings | Exists |
| `dashboard/subscriber/page.tsx` | User subscriptions | Exists |
| `dashboard/support-ticket/page.tsx` | Support system | Exists |

### Game Pages
| File | Purpose | Status |
|------|---------|--------|
| `game/layout.tsx` | Game layout | Exists |
| `game/[id]/page.tsx` | Individual game | Need to add |
| `game/leaderboard/page.tsx` | Rankings | Need to add |

## `/components` Directory
### Layout Components
| File | Purpose | Status |
|------|---------|--------|
| `layouts/MainLayout.tsx` | Main layout wrapper | Exists |
| `layouts/GameLayout.tsx` | Game layout wrapper | Exists |
| `layouts/DashboardLayout.tsx` | Admin layout wrapper | Exists |
| `Footer.tsx` | Footer component | Exists |
| `Sidebar.tsx` | Sidebar navigation | Exists |

### Core Components
| File | Purpose | Status |
|------|---------|--------|
| `FirebaseProviders.tsx` | Firebase context wrapper | Exists, Review |
| `Notification.tsx` | Notification component | Exists |
| `modals/AuthModal.tsx` | Auth modal component | Need to add |
| `modals/WagerModal.tsx` | Wager creation modal | Need to add |
| `modals/TransactionModal.tsx` | Transaction modal | Need to add |

### User Interface Components
| File | Purpose | Status |
|------|---------|--------|
| `UserProfile.tsx` | Profile display/edit | Need to add |
| `WalletCard.tsx` | Balance display | Need to add |
| `GameCard.tsx` | Game display | Need to add |
| `LeaderboardTable.tsx` | Rankings display | Need to add |
| `BonusCard.tsx` | Bonus display | Need to add |

## `/hooks` Directory
| File | Purpose | Current Status |
|------|---------|----------------|
| `useFirebaseAuth.ts` | Auth management | Exists, Review |
| `useNotification.ts` | Notification management | Exists, Review |
| `useToast.ts` | Toast notifications | Exists |
| `useUser.ts` | User data management | Need to add |
| `useWager.ts` | Wager management | Need to add |
| `useTransaction.ts` | Transaction handling | Need to add |
| `useGame.ts` | Game state management | Need to add |

## `/context` Directory
| File | Purpose | Current Status |
|------|---------|----------------|
| `ThemeContext.tsx` | Theme management | Exists |
| `NotificationContext.tsx` | Notification state | Exists, Review |
| `UIContext.tsx` | UI state management | Exists, Review |
| `FullScreenContext.tsx` | Full screen mode | Exists, Review |
| `WagerContext.tsx` | Wager state | Need to add |
| `GameContext.tsx` | Game state | Need to add |

## `/firebase` Directory
| File | Purpose | Current Status |
|------|---------|----------------|
| `auth.ts` | Auth functions | Exists, Review |
| `user.ts` | User operations | Exists, Review |
| `wager.ts` | Wager operations | Need to add |
| `transaction.ts` | Transaction operations | Need to add |
| `game.ts` | Game operations | Need to add |
| `admin.ts` | Admin operations | Need to add |

## `/types` Directory
| File | Purpose | Status |
|------|---------|--------|
| `user.types.ts` | User interfaces | Need to add |
| `wager.types.ts` | Wager interfaces | Need to add |
| `game.types.ts` | Game interfaces | Need to add |
| `transaction.types.ts` | Transaction interfaces | Need to add |
| `notification.types.ts` | Notification interfaces | Need to add |

## `/utils` Directory
| File | Purpose | Current Status |
|------|---------|----------------|
| `form-validators.ts` | Form validation | Exists |
| `utils.ts` | General utilities | Exists |
| `firebase-config.ts` | Firebase config | Exists |
| `paystack.ts` | Payment integration | Need to add |
| `format.ts` | Data formatting | Need to add |

### Key Implementation Notes
- Modular architecture for easy feature expansion
- Real-time updates for critical features
- Role-based access control throughout
- Extensive form validation
- Comprehensive error handling
- Mobile-responsive design
- Dark/Light theme support

### Configuration Requirements
1. Firebase Configuration
2. Paystack API Keys
3. Admin Account Setup
4. Game Rules Configuration
5. Tier System Parameters
6. Transaction Limits
7. Bonus/Reward Parameters

[End of Documentation]

Note: This document should be used in conjunction with new chat sessions to maintain project consistency and track implementation progress.
