import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertLikeSchema, insertMessageSchema } from "@shared/schema";
import multer from "multer";
import path from "path";

// Configure multer for video uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files allowed'));
    }
  },
});

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Discovery endpoint
  app.get("/api/discovery", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const users = await storage.getDiscoveryUsers(req.user!.id);
      res.json(users);
    } catch (error) {
      console.error("Error fetching discovery users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Like/dislike endpoint
  app.post("/api/like", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const { toUserId, isLike } = insertLikeSchema.parse(req.body);
      
      // Create the like/dislike
      const like = await storage.createLike({
        fromUserId: req.user!.id,
        toUserId,
        isLike
      });

      // Check if it's a match (only for likes)
      let isMatch = false;
      if (isLike) {
        isMatch = await storage.checkMatch(req.user!.id, toUserId);
        if (isMatch) {
          await storage.createMatch(req.user!.id, toUserId);
        }
      }

      res.json({ like, isMatch });
    } catch (error) {
      console.error("Error creating like:", error);
      res.status(500).json({ message: "Failed to process like" });
    }
  });

  // Get user matches
  app.get("/api/matches", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const matches = await storage.getUserMatches(req.user!.id);
      res.json(matches);
    } catch (error) {
      console.error("Error fetching matches:", error);
      res.status(500).json({ message: "Failed to fetch matches" });
    }
  });

  // Get messages for a match
  app.get("/api/matches/:matchId/messages", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const matchId = parseInt(req.params.matchId);
      const messages = await storage.getMatchMessages(matchId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Send message
  app.post("/api/matches/:matchId/messages", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const matchId = parseInt(req.params.matchId);
      const { content, messageType = "text" } = insertMessageSchema.parse({
        ...req.body,
        matchId
      });

      const message = await storage.createMessage({
        matchId,
        senderId: req.user!.id,
        content,
        messageType
      });

      // Broadcast message to WebSocket clients
      const wsMessage = JSON.stringify({
        type: 'new_message',
        matchId,
        message: {
          ...message,
          sender: req.user
        }
      });

      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(wsMessage);
        }
      });

      res.json(message);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Pricing/Subscription routes
  app.post("/api/subscribe", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { planId } = req.body;
    
    try {
      // In a real app, integrate with payment processor (Stripe, etc.)
      let subscriptionPlan = "free";
      let subscriptionExpiry = null;
      let isPremium = false;

      if (planId === "premium" || planId === "premium-yearly") {
        subscriptionPlan = "premium";
        isPremium = true;
        // Set expiry date (1 month or 1 year from now)
        const expiryDate = new Date();
        if (planId === "premium-yearly") {
          expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        } else {
          expiryDate.setMonth(expiryDate.getMonth() + 1);
        }
        subscriptionExpiry = expiryDate;
      } else if (planId === "gold" || planId === "gold-yearly") {
        subscriptionPlan = "gold";
        isPremium = true;
        const expiryDate = new Date();
        if (planId === "gold-yearly") {
          expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        } else {
          expiryDate.setMonth(expiryDate.getMonth() + 1);
        }
        subscriptionExpiry = expiryDate;
      }

      const updatedUser = await storage.updateUser(req.user.id, {
        isPremium,
        subscriptionPlan,
        subscriptionExpiry
      });

      res.json({ 
        success: true, 
        user: updatedUser,
        message: `Successfully subscribed to ${subscriptionPlan} plan!`
      });
    } catch (error) {
      console.error("Subscription error:", error);
      res.status(500).json({ message: "Failed to process subscription" });
    }
  });

  app.get("/api/subscription-status", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = req.user;
    const now = new Date();
    
    // Check if subscription has expired
    if (user.subscriptionExpiry && new Date(user.subscriptionExpiry) < now) {
      // Expire the subscription
      await storage.updateUser(user.id, {
        isPremium: false,
        subscriptionPlan: "free",
        subscriptionExpiry: null
      });
      
      res.json({
        plan: "free",
        expired: true,
        message: "Your subscription has expired"
      });
    } else {
      res.json({
        plan: user.subscriptionPlan || "free",
        isPremium: user.isPremium || false,
        expiryDate: user.subscriptionExpiry,
        expired: false
      });
    }
  });

  // Video upload endpoint
  app.post("/api/upload-video", upload.single('video'), async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      if (!req.file) {
        return res.status(400).json({ message: "No video file provided" });
      }

      // In a real app, you'd upload to a cloud storage service
      // For now, we'll just store the file path
      const videoUrl = `/uploads/${req.file.filename}`;
      
      await storage.updateUser(req.user!.id, { 
        profileVideoUrl: videoUrl 
      });

      res.json({ videoUrl });
    } catch (error) {
      console.error("Error uploading video:", error);
      res.status(500).json({ message: "Failed to upload video" });
    }
  });

  // Update profile
  app.patch("/api/profile", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const updates = req.body;
      delete updates.id; // Don't allow ID updates
      delete updates.password; // Don't allow password updates via this endpoint
      
      const user = await storage.updateUser(req.user!.id, updates);
      res.json(user);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Serve uploaded files
  app.use('/uploads', express.static('uploads'));

  const httpServer = createServer(app);

  // WebSocket setup for real-time messaging
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws) => {
    console.log('New WebSocket connection');

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        // Handle different message types if needed
        console.log('Received message:', message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });

    ws.on('close', () => {
      console.log('WebSocket connection closed');
    });
  });

  global.wss = wss;

  return httpServer;
}

// Make wss globally available for message broadcasting
declare global {
  var wss: WebSocketServer;
}
