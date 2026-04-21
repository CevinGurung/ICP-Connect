# 🧪 ICP Connect - Quality Assurance & Testing Checklist

Use this document to track the verification of features across the **ICP Connect** platform. Each item represents a core functional requirement or a critical user flow.

---

## 🔐 Authentication & Security
- [ ] **New User Registration**: Successful account creation with valid Email and Role (Student/Teacher).
- [ ] **Password Strength Validation**: Rejects passwords shorter than 8 characters.
- [ ] **Email OTP Delivery**: OTP is sent to the registered email address immediately.
- [ ] **OTP Verification Logic**: User is only activated after entering the correct 6-digit code.
- [ ] **OTP Resend Timeout**: "Resend OTP" button is disabled until the timer expires.
- [ ] **Login Credentials**: Standard login with a verified email and password.
- [ ] **Failed Login Handling**: Appropriate error messages for incorrect passwords or non-existent users.
- [ ] **Password Recovery (Forgot Password)**: Full sequence: request OTP -> verify OTP -> reset password.
- [ ] **JWT Persistence**: Browser refresh keeps the user logged in (token storage).
- [ ] **Unauthorized Page Access**: Attempting to visit `/admin` as a Student redirects to home.

## 📱 Social Feed & Post Lifecycle
- [ ] **Text Post Creation**: Basic text-based status update appears in the home feed.
- [ ] **Image Upload Integration**: Image uploads with high-aesthetic grid previews.
- [ ] **Post Editing**: Modifying content reflects in real-time across the feed.
- [ ] **Post Deletion**: Users can delete their own posts; post disappears permanently.
- [ ] **Infinite Scroll (Feed)**: The feed loads more posts as the user reaches the bottom.
- [ ] **Post Like Toggle**: Instant reaction toggle and counter update.
- [ ] **Commenting System**: Adding a comment displays it instantly in the post thread.
- [ ] **Comment Deletion**: Authors can remove their own comments.
- [ ] **Detailed Post View**: Clicking a post opens the cinematic lightbox modal.
- [ ] **Post Deep-Linking**: Sharing a specific post URL opens that exact post in modal state.

## 👤 Profile & Connections
- [ ] **Avatar Customization**: Uploading a new profile picture updates all UI components.
- [ ] **Bio & Program Update**: Editing academic profile details (Bio, Program, Year).
- [ ] **Profile Feed Filtering**: User profiles only show post history authored by them.
- [ ] **Follow Interaction**: State changes from "Follow" to "Followed" immediately.
- [ ] **Unfollow Interaction**: Removing a connection updates the state-aware buttons.
- [ ] **"Follow Back" Logic**: UI displays "Follow Back" if the user is followed but hasn't returned the follow.
- [ ] **"Connection" Status**: Displays "Connection" once users mutually follow each other.
- [ ] **People Discovery**: Searching for specific students or teachers on the Connections page.

## 💬 Real-Time Messaging & Notifications
- [ ] **Instant Chat Message**: Messages appear on recipient's screen via WebSocket without refresh.
- [ ] **WebSocket Reconnection**: System attempts to reconnect after an internet dropout.
- [ ] **Online Presence**: Green indicators transition correctly for active/inactive users.
- [ ] **Read Receipts**: "Seen" indicators update when the recipient views the chat window.
- [ ] **Notification: Like**: User receives a badge/toast when their post is liked.
- [ ] **Notification: Comment**: Alerts for new interactions on owned posts.
- [ ] **Notification: New Follower**: Notifications for new connections.
- [ ] **Notification Quick-Read**: Clicking a notification clears the "Unread" count.

## 🛡️ Admin Control & Moderation
- [ ] **Analytics Dashboard Stats**: Validated counts for Total Users, Posts, and Donations.
- [ ] **User Promotion**: Promoting a "Student" to "Admin" grants immediate dashboard access.
- [ ] **Account Deactivation**: Deactivated users are restricted from system access.
- [ ] **Post Moderation (Global)**: Admin can delete any post via the moderation suite.
- [ ] **Report Management**: Flagged posts appear correctly in the Admin's report queue.
- [ ] **Report Resolution**: Resolving or ignoring reports works as expected.
- [ ] **Live Activity Tracker**: Verify new system-wide events are logged in the dashboard.

## 💰 Donations & Payments
- [ ] **eSewa Gateway Initiation**: Redirection to eSewa sandbox on "Donate" click.
- [ ] **Payment Success Callback**: Validation of payment signature and redirect to Success page.
- [ ] **Payment Failure Handling**: Graceful return to the app on cancelled or failed transactions.
- [ ] **Donation Logs (Admin)**: Transaction IDs and amounts are recorded correctly in the DB.

## 🎨 UI/UX & Responsiveness
- [ ] **Mobile Navigation**: Hamburger menu and mobile layout are fully functional.
- [ ] **Theme Consistency**: High-contrast dark mode aesthetics applied to all elements.
- [ ] **Micro-Animations**: Presence of smooth transitions and hover states.

---
*Created for ICP Connect QA Phase*
