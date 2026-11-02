# Requirements Document

## Introduction

WagerX Features extends the platform with four user-facing and operator-facing capabilities built on top of the wagerx-foundations spec (which introduced the `wagerType` column, atomic transactions, and API authentication):

1. **Global and Weekly Leaderboard** — a ranked display of all players by winnings and wagers played, with tier badges, a weekly reset cycle, a Friends tab, and a top-5 homepage widget.
2. **Admin Event Wagers with Odds** — admin-created wagers with explicit static odds per option, a separate odds-based payout path in the resolution service, an EVENT badge on the wager feed, and the `oddsAtBet` value captured at participant join time.
3. **Friend Management** — a social graph allowing users to send, accept, and reject friend requests, manage their friends list, and receive in-app notifications for pending requests.
4. **Event Wager Confirmation UI** — a BetConfirmationModal layout that shows odds and potential return for event wagers, and hides the CashoutButton on event wager detail pages.

---

## Glossary

- **Leaderboard**: The ranked table of users displayed on the `/leaderboard` page and the top-5 widget on the homepage.
- **GlobalLeaderboard**: The all-time leaderboard ranked by `users.totalWinnings` descending.
- **WeeklyLeaderboard**: The rolling-week leaderboard ranked by `users.weeklyWinnings` descending; resets to zero every Monday at 00:00 WAT.
- **FriendsLeaderboard**: A filtered view of the GlobalLeaderboard showing only the authenticated user's accepted friends plus the authenticated user.
- **WAT**: West Africa Time, UTC+1; the timezone used for the weekly reset cron schedule.
- **TierBadge**: A visual label computed from `users.gamePoints` using fixed thresholds: Bronze (0–99), Silver (100–499), Gold (500–999), Platinum (1000–4999), Diamond (5000+).
- **TiedRank**: When two or more users share the same rank-determining score, they receive the same rank number and the next rank number is skipped by the count of tied users.
- **PinnedRow**: The authenticated user's leaderboard row displayed at the bottom of the visible list when the user's rank exceeds 50, in addition to the user's position within the ranked list.
- **WeeklyReset**: The cron job that runs every Monday at 00:00 WAT and sets `weeklyWinnings = 0` and `weeklyWagerCount = 0` for all users.
- **WeeklyEmptyState**: The UI state shown on the WeeklyLeaderboard tab when no wager has been resolved since the last WeeklyReset.
- **EventWager**: A wager with `wagerType = 'event'`; each option carries an explicit static odds multiplier set by an admin.
- **P2PWager**: A wager with `wagerType = 'p2p'`; payouts are determined by proportional pool share.
- **OddsAtBet**: The odds multiplier frozen from `wager.options[selectedOption].odds` at the moment a Participant joins an EventWager, stored in `wager_participants.oddsAtBet`.
- **EventPayout**: The gross winnings for an EventWager winner: `participant.amount × participant.oddsAtBet`.
- **EventPlatformFee**: The platform's cut for an EventWager resolution: `SUM(winner.amount × winner.oddsAtBet) × PlatformFeeRate`.
- **PlatformFeeRate**: As defined in wagerx-foundations — a runtime-configurable decimal in `admin_settings.data.platformFeeRate`; defaults to `0.05`.
- **NetEventPayout**: `EventPayout × (1 - PlatformFeeRate)`, the amount credited to an EventWager winner's balance.
- **Friendship**: A row in the `friendships` table representing a directed or mutual relationship between two users.
- **FriendRequest**: A Friendship row with `status = 'pending'`, initiated by the requester toward an addressee.
- **AcceptedFriendship**: A Friendship row with `status = 'accepted'`; both users are considered friends.
- **RejectedFriendship**: A Friendship row with `status = 'rejected'`; the addressee declined the request.
- **FriendshipService**: The service module responsible for all `friendships` table operations.
- **FriendRequestNotification**: A notification row created when a FriendRequest is submitted, containing a `buttonLink` to the sender's profile and `buttonText` "View Request".
- **BetConfirmationModal**: The `components/wagers/modals/BetConfirmationModal.tsx` component shown before a user confirms a bet placement.
- **CashoutButton**: The UI control on the WagerDetails page that allows a user to exit an active P2P wager position early.
- **WagerService**: The `services/wagerService.ts` module.
- **ParticipantService**: The `services/wagerParticipantService.ts` module.
- **NotificationService**: The `services/notificationService.ts` module.
- **LeaderboardAPI**: The `GET /api/leaderboard` Next.js route handler.
- **FriendsAPI**: The set of Next.js route handlers under `/api/friends`.

---

## Requirements

### Requirement 1: Leaderboard Schema Additions

**User Story:** As a platform operator, I want dedicated leaderboard columns on the users table so that leaderboard queries are fast and do not require aggregating participation history at read time.

#### Acceptance Criteria

1. THE WagerService schema migration SHALL add the column `totalWinnings DECIMAL(15,2) NOT NULL DEFAULT 0.00` to the `users` table if the column does not already exist.

2. THE WagerService schema migration SHALL add the column `wagersPlayed INT NOT NULL DEFAULT 0` to the `users` table if the column does not already exist.

3. THE WagerService schema migration SHALL add the column `weeklyWinnings DECIMAL(15,2) NOT NULL DEFAULT 0.00` to the `users` table if the column does not already exist.

4. THE WagerService schema migration SHALL add the column `weeklyWagerCount INT NOT NULL DEFAULT 0` to the `users` table if the column does not already exist.

5. WHEN `resolveWagerService` processes a winner and credits the winner's balance, THE WagerService SHALL also increment `users.totalWinnings` and `users.weeklyWinnings` by the winner's net payout amount within the same ResolutionTransaction.

6. WHEN `resolveWagerService` resolves a wager, THE WagerService SHALL increment `users.wagersPlayed` and `users.weeklyWagerCount` by 1 for every Participant in that wager, regardless of whether the participant won or lost, within the same ResolutionTransaction.

---

### Requirement 2: Weekly Leaderboard Reset

**User Story:** As a player, I want the weekly leaderboard to reset every Monday so that every week gives all players an equal chance to appear at the top.

#### Acceptance Criteria

1. THE Cron system SHALL schedule a WeeklyReset job using the cron expression `0 0 * * 1` (every Monday at 00:00) in the WAT timezone (`Africa/Lagos`).

2. WHEN the WeeklyReset job executes, THE Cron system SHALL run `UPDATE users SET weeklyWinnings = 0, weeklyWagerCount = 0` covering all user rows.

3. WHEN the WeeklyReset job executes, THE Cron system SHALL log the count of affected rows and the execution timestamp to the server console.

4. IF the WeeklyReset database update throws an error, THEN THE Cron system SHALL log the error and continue without crashing the process.

---

### Requirement 3: Leaderboard API

**User Story:** As a player, I want to retrieve leaderboard data via a stable API so that the leaderboard page and homepage widget can display current rankings.

#### Acceptance Criteria

1. WHEN the LeaderboardAPI receives `GET /api/leaderboard?type=global`, THE LeaderboardAPI SHALL return up to 50 users ordered by `totalWinnings DESC`, including each user's `id`, `nickname`, `avatarUrl`, `totalWinnings`, `wagersPlayed`, and `gamePoints`.

2. WHEN the LeaderboardAPI receives `GET /api/leaderboard?type=weekly`, THE LeaderboardAPI SHALL return up to 50 users ordered by `weeklyWinnings DESC`, including each user's `id`, `nickname`, `avatarUrl`, `weeklyWinnings`, `weeklyWagerCount`, and `gamePoints`.

3. WHEN the LeaderboardAPI receives `GET /api/leaderboard?type=friends`, THE LeaderboardAPI SHALL verify the caller's JwtSession and return HTTP 401 if the token is absent; otherwise it SHALL return the authenticated user's accepted friends plus the authenticated user, ordered by `totalWinnings DESC`, with the same fields as the global response.

4. WHEN the LeaderboardAPI receives `GET /api/leaderboard?type=weekly` and no wager has been resolved since the last WeeklyReset, THE LeaderboardAPI SHALL return an empty `users` array and a `isEmpty: true` flag in the response body.

5. IF the `type` query parameter is absent or not one of `global`, `weekly`, or `friends`, THEN THE LeaderboardAPI SHALL return HTTP 400 with `{ success: false, message: 'Invalid leaderboard type' }`.

---

### Requirement 4: Leaderboard Page UI

**User Story:** As a player, I want to browse ranked leaderboards with meaningful context — tier badges, highlighted self-row, and tab-based navigation — so that I can assess my standing and that of my friends.

#### Acceptance Criteria

1. THE Leaderboard page at `/leaderboard` SHALL render three tabs: Global, Weekly, and Friends.

2. WHEN the Leaderboard page renders a user row, THE Leaderboard page SHALL display the user's rank number, avatar, nickname, totalWinnings (Global/Friends tabs) or weeklyWinnings (Weekly tab), wagersPlayed or weeklyWagerCount, and TierBadge.

3. WHEN two or more users have identical rank-determining scores, THE Leaderboard page SHALL display the same rank number for all tied users and skip subsequent rank numbers by the count of tied users (TiedRank behavior).

4. WHEN the TierBadge is computed for a user, THE Leaderboard page SHALL assign Bronze for `gamePoints < 100`, Silver for `100 ≤ gamePoints < 500`, Gold for `500 ≤ gamePoints < 1000`, Platinum for `1000 ≤ gamePoints < 5000`, and Diamond for `gamePoints ≥ 5000`.

5. WHEN the authenticated user's rank on the active tab exceeds 50, THE Leaderboard page SHALL render the authenticated user's row a second time at the bottom of the list, visually pinned, in addition to the user's position within the top-50 list if applicable (PinnedRow behavior).

6. WHEN the authenticated user's row is rendered anywhere in the leaderboard, THE Leaderboard page SHALL apply a distinct highlight style to that row to differentiate it from other rows.

7. WHEN the Weekly tab is active and the LeaderboardAPI returns `isEmpty: true`, THE Leaderboard page SHALL display a WeeklyEmptyState message indicating that the weekly contest has just started and no results are available yet.

8. WHEN the Friends tab is active and the authenticated user has no accepted friends, THE Leaderboard page SHALL display an empty state message inviting the user to add friends.

---

### Requirement 5: Leaderboard Homepage Widget

**User Story:** As a visitor, I want to see a compact top-5 leaderboard on the homepage so that I can immediately see who the top players are.

#### Acceptance Criteria

1. THE homepage SHALL render a leaderboard widget displaying the top 5 users from the GlobalLeaderboard, showing each user's rank, avatar, nickname, and totalWinnings.

2. WHEN the homepage widget data is fetched, THE homepage SHALL use the LeaderboardAPI with `type=global` and a `limit=5` parameter, or an equivalent server-side query.

3. WHEN the homepage widget fails to load leaderboard data, THE homepage SHALL render the widget section with a graceful empty state and SHALL NOT throw an unhandled error.

---

### Requirement 6: Event Wager Odds in Admin Modal

**User Story:** As an admin, I want to set explicit odds per option when creating an event wager so that players know their fixed return multiplier before placing a bet.

#### Acceptance Criteria

1. WHEN the AddWagerModal renders, THE AddWagerModal SHALL include a wagerType selector with options `p2p` and `event`.

2. WHEN the wagerType selector value is `event`, THE AddWagerModal SHALL enable the odds input field for each wager option so that the admin can enter a numeric odds multiplier.

3. WHEN the wagerType selector value is `p2p`, THE AddWagerModal SHALL disable the odds input fields and display them as read-only, consistent with the existing behavior.

4. WHEN the AddWagerModal submits a wager with `wagerType = 'event'`, THE AddWagerModal SHALL include the `wagerType` field and the per-option `odds` values in the POST body sent to `POST /api/wagers`.

5. WHEN a wager is created via `POST /api/wagers` with `wagerType = 'event'`, THE WagerService SHALL persist the `wagerType` value and the `odds` field on each option object within the `options` JSON column.

---

### Requirement 7: OddsAtBet Capture on Participant Join

**User Story:** As a platform operator, I want the odds at the time a participant places a bet to be frozen and stored so that a subsequent odds change cannot affect an existing position.

#### Acceptance Criteria

1. THE ParticipantService schema migration SHALL add the column `oddsAtBet DECIMAL(5,2) NOT NULL DEFAULT 1.00` to the `wager_participants` table if the column does not already exist.

2. WHEN `createWagerParticipant` is called for an EventWager, THE ParticipantService SHALL read `wager.options[selectedOption].odds` at join time and store that value in `wager_participants.oddsAtBet` within the AtomicTransaction.

3. WHEN `createWagerParticipant` is called for a P2PWager, THE ParticipantService SHALL store `1.00` in `wager_participants.oddsAtBet`.

4. IF `wager.options[selectedOption].odds` is absent or null for an EventWager at join time, THEN THE ParticipantService SHALL store `1.00` in `wager_participants.oddsAtBet` and log a warning.

---

### Requirement 8: Event Wager Payout Resolution

**User Story:** As a platform operator, I want event wager resolutions to pay winners based on their locked-in odds multiplier, with the platform fee calculated on the gross winner pool, so that the payout model is correct for event-style wagers.

#### Acceptance Criteria

1. WHEN `resolveWagerService` resolves an EventWager, THE WagerService SHALL compute each winner's NetEventPayout as `participant.amount × participant.oddsAtBet × (1 - PlatformFeeRate)` and credit that amount to the winner's balance within the ResolutionTransaction.

2. WHEN `resolveWagerService` resolves an EventWager, THE WagerService SHALL compute the EventPlatformFee as `SUM(winner.amount × winner.oddsAtBet) × PlatformFeeRate` and insert a PlatformFeeTransaction row for the total fee within the ResolutionTransaction.

3. WHEN `resolveWagerService` resolves a P2PWager, THE WagerService SHALL use the existing pool-proportional payout logic (as defined in wagerx-foundations Requirement 2) without modification.

4. WHEN `resolveWagerService` begins processing a wager, THE WagerService SHALL read the `wagerType` field from the locked wager row and branch to the event payout path if `wagerType = 'event'`, or the P2P path if `wagerType = 'p2p'`.

5. WHEN `resolveWagerService` resolves an EventWager, THE WagerService SHALL insert WagerCredit transaction rows per winner using `amount` equal to the winner's NetEventPayout, consistent with the transaction record format defined in wagerx-foundations Requirement 2.

---

### Requirement 9: Event Badge and Odds Display on Wager Feed

**User Story:** As a player browsing wagers, I want event wagers to be visually distinct with their odds visible on cards so that I can quickly identify and evaluate event-style betting opportunities.

#### Acceptance Criteria

1. WHEN the wager feed renders a wager card for an EventWager, THE wager feed component SHALL display an "EVENT" badge on the card.

2. WHEN the wager feed renders a wager card for an EventWager, THE wager feed component SHALL display the odds for each option in the format `<value>x` alongside the option name.

3. WHEN the wager feed renders a wager card for a P2PWager, THE wager feed component SHALL NOT display an EVENT badge or static odds values.

---

### Requirement 10: Cashout Disabled for Event Wagers

**User Story:** As a platform operator, I want cashout to be unavailable for event wagers so that the fixed-odds payout model is not undermined by early exits.

#### Acceptance Criteria

1. WHEN the WagerDetails page renders for an EventWager, THE WagerDetails page SHALL not render the CashoutButton.

2. WHEN the WagerDetails page renders for a P2PWager, THE WagerDetails page SHALL render the CashoutButton according to its existing visibility rules.

---

### Requirement 11: Friendships Table and Service

**User Story:** As a platform operator, I want a persistent friendships table and service layer so that the social graph is stored reliably and can be queried efficiently.

#### Acceptance Criteria

1. THE FriendshipService schema migration SHALL create the `friendships` table with columns: `id VARCHAR(36) NOT NULL PRIMARY KEY`, `requesterId VARCHAR(36) NOT NULL`, `addresseeId VARCHAR(36) NOT NULL`, `status ENUM('pending','accepted','rejected') NOT NULL DEFAULT 'pending'`, `createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP`, `updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`, a `UNIQUE KEY uq_friendship (requesterId, addresseeId)`, and foreign keys referencing `users(id)` with `ON DELETE CASCADE` for both `requesterId` and `addresseeId`.

2. WHEN `POST /api/friends` receives a request with a valid JwtSession and a `addresseeId` body parameter, THE FriendsAPI SHALL insert a Friendship row with `status = 'pending'`, `requesterId` set to the TokenUserId, and return HTTP 201 with the created friendship.

3. WHEN `POST /api/friends` receives a request where the TokenUserId equals the `addresseeId`, THE FriendsAPI SHALL return HTTP 400 with `{ success: false, message: 'Cannot send a friend request to yourself' }`.

4. WHEN `POST /api/friends` receives a request and a Friendship row already exists for the same `(requesterId, addresseeId)` pair regardless of status, THE FriendsAPI SHALL return HTTP 409 with `{ success: false, message: 'Friend request already exists' }`.

5. WHEN `PUT /api/friends/[id]` receives a request with `status = 'accepted'` or `status = 'rejected'`, THE FriendsAPI SHALL verify that the TokenUserId matches the Friendship's `addresseeId`, update the `status` field and `updatedAt` timestamp, and return HTTP 200 with the updated friendship.

6. IF `PUT /api/friends/[id]` is called by a user who is not the `addresseeId` of the target Friendship, THEN THE FriendsAPI SHALL return HTTP 403 with `{ success: false, message: 'Forbidden' }`.

7. WHEN `DELETE /api/friends/[id]` receives a request, THE FriendsAPI SHALL verify that the TokenUserId matches either the `requesterId` or `addresseeId` of the target Friendship, delete the row, and return HTTP 200.

8. WHEN `GET /api/friends` receives a request with a valid JwtSession, THE FriendsAPI SHALL return all Friendship rows where `status = 'accepted'` and either `requesterId` or `addresseeId` equals the TokenUserId, including the partner user's `id`, `nickname`, and `avatarUrl`.

9. WHEN `GET /api/friends/requests` receives a request with a valid JwtSession, THE FriendsAPI SHALL return all Friendship rows where `status = 'pending'` and `addresseeId` equals the TokenUserId (incoming requests), including the requester's `id`, `nickname`, and `avatarUrl`.

10. WHEN any FriendsAPI endpoint receives a request without a valid JwtSession, THE FriendsAPI SHALL return HTTP 401 with `{ success: false, message: 'Unauthorized' }`.

---

### Requirement 12: Friend Request Notifications

**User Story:** As a user, I want to receive an in-app notification when someone sends me a friend request so that I can respond promptly.

#### Acceptance Criteria

1. WHEN a FriendRequest is created successfully, THE FriendshipService SHALL call `createNotification` with `userId` set to the addresseeId, `category = 'social'`, `type = 'friend_request'`, `title = 'New Friend Request'`, `message` containing the requester's nickname, `buttonLink` set to the requester's profile URL in the format `/profile?userId=<requesterId>`, and `buttonText = 'View Request'`.

2. THE NotificationService `createNotification` function SHALL accept `buttonLink` and `buttonText` as optional input parameters and persist the caller-supplied values to the `notifications` table instead of hardcoding them to `null`.

3. WHEN `createNotification` is called without `buttonLink` or `buttonText`, THE NotificationService SHALL default both fields to `null`, preserving backward compatibility with existing callers.

---

### Requirement 13: Friends Management Page

**User Story:** As a user, I want a dedicated page to manage my friends, view incoming requests, and see requests I have sent so that I have full visibility and control over my social connections.

#### Acceptance Criteria

1. THE platform SHALL expose a `/friends` page accessible only to authenticated users; unauthenticated visitors SHALL be redirected to the authentication page.

2. WHEN the `/friends` page renders, THE Friends page SHALL display three tabs: My Friends, Requests, and Sent.

3. WHEN the My Friends tab is active, THE Friends page SHALL list all users with `status = 'accepted'` friendships with the authenticated user, showing each friend's avatar, nickname, and an Unfriend button.

4. WHEN the Requests tab is active, THE Friends page SHALL list all incoming FriendRequests (`status = 'pending'` and `addresseeId` equals authenticated user), showing the requester's avatar, nickname, Accept button, and Reject button.

5. WHEN the Sent tab is active, THE Friends page SHALL list all outgoing FriendRequests (`status = 'pending'` and `requesterId` equals authenticated user), showing the addressee's avatar, nickname, and a Cancel Request button.

6. WHEN the authenticated user clicks Unfriend on a friend entry, THE Friends page SHALL call `DELETE /api/friends/[id]` and remove the friend from the list upon success.

7. WHEN the authenticated user clicks Accept on an incoming request, THE Friends page SHALL call `PUT /api/friends/[id]` with `status = 'accepted'` and move the entry from the Requests tab to the My Friends tab.

8. WHEN the authenticated user clicks Reject on an incoming request, THE Friends page SHALL call `PUT /api/friends/[id]` with `status = 'rejected'` and remove the entry from the Requests tab.

9. WHEN the authenticated user clicks Cancel Request on a sent request, THE Friends page SHALL call `DELETE /api/friends/[id]` and remove the entry from the Sent tab.

---

### Requirement 14: Add Friend and Unfriend on Profile Pages

**User Story:** As a user, I want to send or remove a friend connection directly from another user's profile page so that I do not need to navigate away to manage my connections.

#### Acceptance Criteria

1. WHEN the authenticated user views another user's profile page and no Friendship exists between them, THE profile page SHALL display an "Add Friend" button.

2. WHEN the authenticated user clicks "Add Friend", THE profile page SHALL call `POST /api/friends` with the profile owner's id as `addresseeId` and replace the button with a "Request Sent" indicator upon a 201 response.

3. WHEN the authenticated user views another user's profile page and an AcceptedFriendship exists, THE profile page SHALL display an "Unfriend" button in place of "Add Friend".

4. WHEN the authenticated user clicks "Unfriend", THE profile page SHALL call `DELETE /api/friends/[id]` and replace the button with "Add Friend" upon a 200 response.

5. WHEN the authenticated user views another user's profile page and a FriendRequest is pending with the authenticated user as requester, THE profile page SHALL display a "Cancel Request" button.

---

### Requirement 15: InviteFriendsModal Wired to Real Friends Endpoint

**User Story:** As a user, I want the Invite Friends modal to show only my actual friends so that I am not shown an empty or placeholder list.

#### Acceptance Criteria

1. WHEN the InviteFriendsModal loads, THE InviteFriendsModal SHALL call `GET /api/friends` to retrieve the authenticated user's accepted friends and populate the friends list.

2. WHEN `GET /api/friends` returns an empty array, THE InviteFriendsModal SHALL display the message "No friends available" in the list area.

3. WHEN the InviteFriendsModal search input is non-empty, THE InviteFriendsModal SHALL filter the loaded friends list client-side by matching the search term against each friend's nickname or email.

---

### Requirement 16: BetConfirmationModal Event Wager Layout

**User Story:** As a player placing an event wager, I want the bet confirmation modal to display my stake, the locked-in odds, and my potential net return so that I can verify my bet details before confirming.

#### Acceptance Criteria

1. THE BetConfirmationModal SHALL accept a `wagerType` prop of type `'p2p' | 'event'` and an `oddsAtBet` prop of type `number`.

2. WHEN the BetConfirmationModal renders for an EventWager, THE BetConfirmationModal SHALL display: the stake amount, the `oddsAtBet` value formatted as `<value>x`, the potential return computed as `stake × oddsAtBet × (1 - platformFeeRate)` formatted to two decimal places in ₦, and a disclaimer that the displayed return is subject to the platform fee.

3. WHEN the BetConfirmationModal renders for a P2PWager, THE BetConfirmationModal SHALL use the existing layout without displaying odds or a disclaimer, preserving backward compatibility.

4. WHEN the BetConfirmationModal renders for an EventWager and the `oddsAtBet` prop is absent or zero, THE BetConfirmationModal SHALL display "—" as the potential return and omit the odds line.
