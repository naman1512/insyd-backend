import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const app = express();
const server = createServer(app);

// CORS configuration for different environments
const corsOrigins = process.env.NODE_ENV === 'production' 
  ? [process.env.FRONTEND_URL || 'https://insyd-assesment.vercel.app'] 
  : ['http://localhost:3000'];

const io = new Server(server, {
  cors: {
    origin: corsOrigins,
    methods: ["GET", "POST", "DELETE", "PATCH"]
  }
});

const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: corsOrigins,
  methods: ['GET', 'POST', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// Store active socket connections
const activeConnections = new Map<string, string>(); // userId -> socketId

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // User joins with their ID
  socket.on('join', (userId: string) => {
    activeConnections.set(userId, socket.id);
    socket.join(userId);
    console.log(`User ${userId} joined with socket ${socket.id}`);
  });

  socket.on('disconnect', () => {
    // Remove from active connections
    for (const [userId, socketId] of activeConnections.entries()) {
      if (socketId === socket.id) {
        activeConnections.delete(userId);
        break;
      }
    }
    console.log('User disconnected:', socket.id);
  });
});

// Helper function to send real-time notifications
const sendRealTimeNotification = (userId: string, notification: unknown) => {
  if (activeConnections.has(userId)) {
    io.to(userId).emit('notification', notification);
  }
};

// API Routes

// Get all users
app.get('/api/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
        _count: {
          select: {
            followers: true,
            following: true,
            posts: true
          }
        }
      }
    });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Create a new user
app.post('/api/users', async (req, res) => {
  try {
    const { username, email } = req.body;
    const user = await prisma.user.create({
      data: {
        id: uuidv4(),
        username,
        email
      }
    });
    res.json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Follow a user
app.post('/api/users/:userId/follow', async (req, res) => {
  try {
    const { userId } = req.params;
    const { followerId } = req.body;

    // Check if already following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId: userId
        }
      }
    });

    if (existingFollow) {
      return res.status(400).json({ error: 'Already following this user' });
    }

    // Create follow relationship
    await prisma.follow.create({
      data: {
        id: uuidv4(),
        followerId,
        followingId: userId
      }
    });

    // Get follower details
    const follower = await prisma.user.findUnique({
      where: { id: followerId },
      select: { username: true }
    });

    // Create notification
    const notification = await prisma.notification.create({
      data: {
        id: uuidv4(),
        userId: userId,
        type: 'FOLLOW',
        title: 'New Follower',
        message: `${follower?.username} started following you`,
        data: JSON.stringify({ followerId, followerUsername: follower?.username })
      }
    });

    // Send real-time notification
    sendRealTimeNotification(userId, notification);

    res.json({ message: 'Successfully followed user' });
  } catch (error) {
    console.error('Error following user:', error);
    res.status(500).json({ error: 'Failed to follow user' });
  }
});

// Unfollow a user
app.delete('/api/users/:userId/follow', async (req, res) => {
  try {
    const { userId } = req.params;
    const { followerId } = req.body;

    await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId,
          followingId: userId
        }
      }
    });

    res.json({ message: 'Successfully unfollowed user' });
  } catch (error) {
    console.error('Error unfollowing user:', error);
    res.status(500).json({ error: 'Failed to unfollow user' });
  }
});

// Create a new post
app.post('/api/posts', async (req, res) => {
  try {
    const { userId, title, content } = req.body;

    const post = await prisma.post.create({
      data: {
        id: uuidv4(),
        userId,
        title,
        content
      }
    });

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true }
    });

    // Get all followers
    const followers = await prisma.follow.findMany({
      where: { followingId: userId },
      select: { followerId: true }
    });

    // Create notifications for all followers
    const notifications = await Promise.all(
      followers.map(async (follow) => {
        const notification = await prisma.notification.create({
          data: {
            id: uuidv4(),
            userId: follow.followerId,
            type: 'POST',
            title: 'New Post',
            message: `${user?.username} created a new post: ${title}`,
            data: JSON.stringify({ postId: post.id, authorId: userId, authorUsername: user?.username })
          }
        });

        // Send real-time notification
        sendRealTimeNotification(follow.followerId, notification);

        return notification;
      })
    );

    res.json({ post, notificationsSent: notifications.length });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Get all posts
app.get('/api/posts', async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      include: {
        user: {
          select: {
            username: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    res.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Get user's notifications
app.get('/api/users/:userId/notifications', async (req, res) => {
  try {
    const { userId } = req.params;
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark notification as read
app.patch('/api/notifications/:notificationId/read', async (req, res) => {
  try {
    const { notificationId } = req.params;
    const notification = await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true }
    });
    res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Get user's following list
app.get('/api/users/:userId/following', async (req, res) => {
  try {
    const { userId } = req.params;
    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      include: {
        following: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      }
    });
    res.json(following.map(f => f.following));
  } catch (error) {
    console.error('Error fetching following list:', error);
    res.status(500).json({ error: 'Failed to fetch following list' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
