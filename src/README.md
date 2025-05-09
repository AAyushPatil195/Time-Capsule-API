# Time Capsule API

A secure and time-locked digital messaging backend API. This service enables users to create, manage, and retrieve encrypted time capsules—messages that can only be unlocked at a specified future date and time using a secret code.

## 🧠 Project Overview

The **Time Capsule API** is a RESTful backend system built with modern JavaScript technologies. Users can:
- Register and log in via JWT-based authentication.
- Create time-locked capsules containing messages.
- Retrieve capsules after their unlock time using a unique code.
- Update or delete capsules prior to unlocking.
- Automatically expire capsules 30 days after unlock time.

Each capsule is:
- **Secure**: Protected by an unlock code and user authentication.
- **Time-Locked**: Only accessible at or after a defined `unlock_at` time.
- **Ephemeral**: Auto-expired 30 days post-unlock to ensure data cleanliness.

---
## Screenshots

- Registering a User
![registerUser](https://github.com/user-attachments/assets/7f001595-edf7-47dd-87fb-f82804662b5c)

- User Login
  ![logInUser](https://github.com/user-attachments/assets/45a7f223-9da0-457d-b555-cebc78f10f28)

- Create Capsule
  ![newCapsuleCreated](https://github.com/user-attachments/assets/4ddfd136-171e-411c-87dd-cce240ce9b93)

- Capsule Update
  ![Capsule_PUT_done](https://github.com/user-attachments/assets/7850d5bf-c389-4763-97de-e68521c25eb0)

- All Capsules ( Page:1, Limit:10 )
  ![capsulesPage1Limit10](https://github.com/user-attachments/assets/b1b3e1c4-927b-41cb-8d55-c91834ddb905)

- Capsule Unlock Attempt Fail
  ![unlockFailedCapsule](https://github.com/user-attachments/assets/52d96cac-18dc-4e3d-bfe1-f6ed50d03b6b)

- Capsule Unlocked
  ![messageUnlocked](https://github.com/user-attachments/assets/5982ce00-fadb-43d3-a880-3b98d130e02a)

- Capsule Deleted
  ![capsule_deleted](https://github.com/user-attachments/assets/8f512e43-7bee-4816-93e5-3680ba8f886b)

- Database (SQLite)
   1. User Table
      ![UserTableSQLite](https://github.com/user-attachments/assets/34d1c433-e0a2-4697-8888-cc5b495d220b)

   2. Capsule Table
     ![capsuleTableSQLite](https://github.com/user-attachments/assets/4361f674-e196-4334-991d-6baccc9ecc20)

- Project Console
  ![Screenshot (191)](https://github.com/user-attachments/assets/b19e283f-d022-443d-a81e-0796ad209fee)

## 💡 Real-World Use Cases

This system can be used in various meaningful scenarios:
- **Personal Will Declarations**: Securely schedule a will to be revealed to children on a specific future date.
- **Time-locked Letters**: Send messages to your future self, family, or friends.
- **Confidential Instructions**: Deliver sensitive instructions to be unlocked at a later time.
- **Timed Reminders**: Set future reminders for life events, goals, or tasks.
- **Delayed Content Release**: Authors or creators can schedule content drops for a later date.

---

## ⚙️ How to Run the App

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/time-capsule-api.git
cd time-capsule-api
```
### 2. Install Dependencies
```bash
npm install
```
### 3. Set Environment Variables
Copy the example file and fill in your own values:
```bash
cp .env.example .env
```
### 4. Run the Server
```bash
npm run dev
```
Server will typically run on http://localhost:3000.
---

## 🧪 How to Run Tests
Ensure dependencies are installed and run:

```bash
npm test
```
Tests cover authentication, capsule behavior, pagination, and expiration logic.

## 📦 Endpoints Overview

```http
POST   /auth/register                      → User Registration  
POST   /auth/login                         → User Login (returns JWT)  
POST   /capsules                           → Create a Capsule  
GET    /capsules                           → List User Capsules (with pagination)  
GET    /capsules/:id?code=UNLOCK_CODE     → Retrieve a Capsule  
PUT    /capsules/:id?code=UNLOCK_CODE     → Update a Capsule  
DELETE /capsules/:id?code=UNLOCK_CODE     → Delete a Capsule
```

All capsule-related routes require Authorization: Bearer YOUR_JWT_TOKEN.
---
## 📝 Assumptions & Trade-offs
- Unlock code must be provided in query params; an alternative could be body/header for added security.

- Capsules auto-expire via a simulated background task (cron-like behavior); ideal for cloud functions or queues in production.
---
## 📁 Project Structure
```bash
/src
  /controllers
  /routes
  /models
  /middlewares
  /utils
/tests
.env.example
.gitignore
README.md
```
---
## ✅ Submission Checklist
- JWT authentication implemented

- All capsule endpoints with proper access control

- Pagination supported

- Expiration logic included

- Unit tests written

- .env.example provided

- Clean and well-documented code
