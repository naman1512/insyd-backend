# 📡 Insyd Backend – Real-time Notification System

A scalable **Node.js backend service** for Insyd’s social platform. It provides **real-time notifications**, robust **REST APIs**, and social features like follow/unfollow and posting, built with **Express.js**, **Socket.IO**, **PostgreSQL**, and **Prisma ORM**.

## 🚀 Live Demo

- **API**: [https://insyd-backend-ltze.onrender.com](https://insyd-backend-ltze.onrender.com)
- **Frontend**: [https://insyd-assesment-dep.vercel.app](https://insyd-assesment-dep.vercel.app)
- **Frontend Repository**: [insyd-assesment-dep](https://github.com/naman1512/insyd-assesment-dep)

## ✨ Features

✅ **Real-time Notifications** using WebSockets (Socket.IO)  
✅ **RESTful API** for user management, posts, and social interactions  
✅ **PostgreSQL** with **Prisma ORM** for type-safe database access  
✅ **Follow/Unfollow**, post creation, and notification delivery  
✅ **Scalable Architecture** — designed to handle from 100 DAUs to 1M+ DAUs  
✅ **Horizontal Scaling** and deployment-ready on Render

## 🛠 Tech Stack

- **Node.js**, **Express.js**, **TypeScript**
- **Socket.IO** for real-time WebSocket communication
- **PostgreSQL** with **Prisma ORM**
- **Deployment** on **Render**

## 📋 Core API Endpoints

GET    /api/users                # Get all users  
POST   /api/users                # Create a new user  
GET    /api/users/:id/following  # Get following list for a user  
POST   /api/follow               # Follow a user  
POST   /api/unfollow             # Unfollow a user  
GET    /api/posts                # Get all posts  
POST   /api/posts                # Create a new post

## 🗃️ Database Schema

**Tables & Relationships:**

| Table | Columns |
|----------------|-------------------------------------------------------------------|
| `users` | id, username, email, created_at |
| `posts` | id, user_id (FK), title, content, created_at |
| `follows` | id, follower_id (FK), following_id (FK), created_at |
| `notifications` | id, user_id (FK), type, title, message, read (bool), created_at |

## 🔔 Real-time Notifications

javascript
// Client-side example
socket.on('notification', (data) => {
  console.log('New notification:', data);
});
Server pushes notifications when relevant events occur, such as new followers or new posts.

⚡ Quick Start
bash
Copy
Edit
# Clone repository
git clone https://github.com/naman1512/insyd-backend.git
cd insyd-backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Setup Prisma & database
npx prisma generate
npx prisma db push

# Run development server
npm run dev
🚀 Deployment (Render)
Build Command:
npm install && npx prisma generate && npx prisma db push

Start Command:
npm start

Environment Variables:
NODE_ENV=production
# Add your DATABASE_URL
cp [.env.example](http://_vscodecontentref_/0) .env


📄 Documentation
Full documentation for setup, API usage, and schema details is available in the repository README files.
