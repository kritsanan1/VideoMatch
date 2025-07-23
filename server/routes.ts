import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { setupAuth } from "./auth";
import { setupSocialAuth } from "./social-auth";
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
  setupSocialAuth(app);

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

  // Cancel subscription
  app.post("/api/cancel-subscription", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const updatedUser = await storage.updateUser(req.user.id, {
        isPremium: false,
        subscriptionPlan: "free",
        subscriptionExpiry: null
      });

      res.json({ 
        success: true, 
        user: updatedUser,
        message: "Subscription cancelled successfully"
      });
    } catch (error) {
      console.error("Cancellation error:", error);
      res.status(500).json({ message: "Failed to cancel subscription" });
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

  // Import content from social media platforms
  app.post('/api/social/import/:platform/:type', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { platform, type } = req.params;
    const user = req.user;

    try {
      // Check if platform is connected
      const isConnected = user[`${platform}Connected`];
      if (!isConnected) {
        return res.status(400).json({ error: `${platform} account not connected` });
      }

      // Simulate content import - in real implementation, this would use SocialMediaAPI
      let importedContent = {};
      
      switch (platform) {
        case 'instagram':
          if (type === 'photos') {
            importedContent = {
              type: 'photos',
              count: 5,
              photos: [
                { id: '1', url: 'https://via.placeholder.com/400x400?text=Instagram+Photo+1', caption: 'Beautiful sunset' },
                { id: '2', url: 'https://via.placeholder.com/400x400?text=Instagram+Photo+2', caption: 'Coffee time' },
                { id: '3', url: 'https://via.placeholder.com/400x400?text=Instagram+Photo+3', caption: 'Travel memories' }
              ]
            };
          } else if (type === 'bio') {
            importedContent = {
              type: 'bio',
              bio: 'Lifestyle blogger | Travel enthusiast | Coffee lover ☕',
              location: 'Bangkok, Thailand'
            };
          }
          break;
          
        case 'tiktok':
          if (type === 'videos') {
            importedContent = {
              type: 'videos',
              count: 3,
              videos: [
                { id: '1', thumbnail: 'https://via.placeholder.com/300x400?text=TikTok+Video+1', title: 'Dance Challenge', views: 10000 },
                { id: '2', thumbnail: 'https://via.placeholder.com/300x400?text=TikTok+Video+2', title: 'Cooking Tutorial', views: 5000 },
                { id: '3', thumbnail: 'https://via.placeholder.com/300x400?text=TikTok+Video+3', title: 'Daily Vlog', views: 8000 }
              ]
            };
          } else if (type === 'bio') {
            const profile = JSON.parse(user.tiktokProfile || '{}');
            importedContent = {
              type: 'bio',
              bio: profile.bio_description || 'Creative content creator',
              stats: {
                followers: profile.follower_count || 0,
                videos: profile.video_count || 0,  
                likes: profile.likes_count || 0
              }
            };
          }
          break;
          
        case 'facebook':
          if (type === 'photos') {
            importedContent = {
              type: 'photos',
              count: 4,
              photos: [
                { id: '1', url: 'https://via.placeholder.com/400x400?text=Facebook+Photo+1', caption: 'Family gathering' },
                { id: '2', url: 'https://via.placeholder.com/400x400?text=Facebook+Photo+2', caption: 'Weekend adventure' }
              ]
            };
          } else if (type === 'info') {
            const profile = JSON.parse(user.facebookProfile || '{}');
            importedContent = {
              type: 'info',
              name: profile.name,
              location: profile.location?.name,
              ageRange: profile.age_range?.min ? `${profile.age_range.min}+` : null
            };
          }
          break;
      }

      // In a real app, you would save the imported content to the database
      res.json({
        success: true,
        platform,
        type,
        data: importedContent
      });

    } catch (error) {
      console.error(`Error importing ${type} from ${platform}:`, error);
      res.status(500).json({ error: `Failed to import ${type} from ${platform}` });
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
