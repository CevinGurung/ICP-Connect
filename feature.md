# 🚀 ICP Connect - Project Features

A comprehensive breakdown of all features implemented in the **ICP Connect** platform.

---

## 🔐 Authentication & Security
- **Secure JWT-Based Auth**: Robust authentication using JSON Web Tokens.
- **OTP Verification**: Email-based One-Time Password verification for new registrations.
- **Password Recovery**: Secure 'Forgot Password' workflow with OTP validation.
- **Role-Based Access Control (RBAC)**: Distinctions between **Student**, **Teacher**, and **Admin** roles.
- **Encrypted Storage**: Sensitive user data and passwords are encrypted using BCrypt.

## 📱 Social Networking (The Feed)
- **Dynamic Content Feed**: Real-time display of community posts.
- **Post Lifecycle**: Users can create, edit, and delete their own posts.
- **Rich Engagement**:
  - **Likes**: Instant reaction system.
  - **Commenting**: Nested discussion threads on every post.
- **Media Support**: Support for image uploads with high-aesthetic grid previews.
- **Detailed View Modal**: Cinematic split-view modal for immersive content consumption.

## 👤 Profile & Connections
- **Rich User Profiles**: Customizable Bios, Programs, Years, and Specialties.
- **Connection System**: Dynamic **Follow/Unfollow** logic with state-aware status (Follow Back, Connection).
- **People Discovery**: Connection management page to explore and follow peers/instructors.
- **Profile Feed**: Dedicated view of all posts by a specific user.

## 💬 Real-Time Communications
- **Instant Messaging**: WebSocket-powered chat for real-time interaction.
- **Presence Tracking**: Identifiers for online/offline user states.
- **Read Receipts**: Indicators for delivered and read messages.

## 🔔 Intelligent Notifications
- **Real-Time Alerts**: Instant pop-ups for Likes, Comments, and New Followers.
- **Activity Center**: A centralized location to review and manage all social notifications.
- **Navbar Integration**: Live unread count badges.

## 🛡️ Admin Control Center (The Authority)
- **Professional Dashboard**: High-level stats overview (Total Users, Posts, Donations, Reports).
- **User Management Suite**:
  - Promote users to **Admin**.
  - **Soft-Delete/Deactivate** users to restrict system access.
  - Custom confirmation modals for critical identity changes.
- **Post Moderation**: Admins can audit and delete any post on the platform.
- **Report Management**: 
  - Dedicated queue for flagged content.
  - Resolve or Ignore reports with a standard moderation workflow.
- **Activity Tracker**: Live log of all system-wide events (Joins, Reports, Donations).
- **Security Guard**: Social interactions (Like/Comment) are automatically restricted for admins while in moderation mode.

## 💰 Donation System
- **Community Support**: Integrate contributions to support campus initiatives.
- **eSewa Integration**: Seamless payment gateway for secure financial transactions.
- **Transaction Monitoring**: Admin oversight of all community donations.

---

## 🎨 UI/UX Philosophy
- **Dark Developer Theme**: Modern, high-contrast dark mode for reduced eye strain and premium feel.
- **Glassmorphism**: Subtle blur effects and transcluent layers for depth.
- **Micro-Animations**: Smooth transitions and hover effects using Framer Motion.
- **Responsive Design**: Fully optimized for Desktop, Tablet, and Mobile viewing.
