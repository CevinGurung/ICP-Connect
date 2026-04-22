# Access Control Matrix - ICP Connect

This document outlines the permissions and feature access for different user roles within the ICP Connect platform.

## Roles Overview
- **Guest**: Unauthenticated visitor.
- **Student**: Standard user with academic tracking (Program, Year, Section).
- **Teacher**: Standard user with professional tracking (Subject, Specialty).
- **Admin**: Elevated user with system-wide moderation and management capabilities.

## CRUD Matrix (Create, Read, Update, Delete)

This matrix defines specific database-level capabilities for each role across the primary entities.

| Entity / Feature | Guest | Student | Teacher | Admin |
| :--- | :---: | :---: | :---: | :---: |
| **User Profile** | C | CRUD (Own) | CRUD (Own) | R / UD (Other) |
| **Posts** | - | CRUD (Own) / R | CRUD (Own) / R | R / D (Other) |
| **Comments** | - | CRUD (Own) / R | CRUD (Own) / R | R / D (Other) |
| **Likes** | - | CRD (Own) / R | CRD (Own) / R | R |
| **Follows** | - | CRD (Own) / R | CRD (Own) / R | R |
| **Direct Messages** | - | CR (Own) | CR (Own) | - (Private) |
| **Group Chats** | - | CRU (Own) | CRU (Own) | R / D |
| **Group Messages** | - | CR (Own) | CR (Own) | - (Private) |
| **Reports** | - | CR (Own) | CR (Own) | RUD |
| **Donations** | - | CR (Own) | CR (Own) | R |
| **System Analytics** | - | - | - | R |

> [!NOTE]
> **Key**:
> - **C**: Create
> - **R**: Read
> - **U**: Update
> - **D**: Delete
> - **UD**: Deactivation (Soft Delete)

## Permission Details

### 1. Account & Security
- **Registration**: Open to all guests. Verified via OTP.
- **Login**: Requires active account status. Deactivated users are blocked at the gateway level.
- **Session**: Managed via JWT (Stateless).

### 2. Social & Networking
- **Connections**: Standard users can follow others. Connections are established on mutual follows.
- **Visibility**: Only **Active** users are visible in recommendations, search, and follower lists.
- **Blocking**: Accounts can be deactivated by Admins, rendering them invisible across the platform.

### 3. Moderation (Admin Only)
- **Role Management**: Admins can promote Students/Teachers to Admin status.
- **Soft Delete**: Admins can deactivate users, which hides their profile and all their posts/comments system-wide.
- **Reporting**: Any user can report a post. Only admins can resolve reports or delete the reported content.

### 4. Role-Specific Data
- **Students**: Tracked by their batch/program.
- **Teachers**: Recognized by their faculty/subject expertise.
- **Mutual**: Both can post, chat, and connect.
