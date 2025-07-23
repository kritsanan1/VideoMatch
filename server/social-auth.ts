import passport from "passport";
import { Strategy as FacebookStrategy } from "passport-facebook";
import { Strategy as TwitterStrategy } from "passport-twitter";
import { Express } from "express";
import { storage } from "./storage";
import axios from "axios";
import { SocialMediaAPI } from "./api/social-api";

// Social media profile interfaces
export interface FacebookProfile {
  id: string;
  name: string;
  picture: { data: { url: string } };
  email?: string;
  age_range?: { min: number };
  location?: { name: string };
}

export interface TwitterProfile {
  id: string;
  username: string;
  name: string;
  profile_image_url: string;
  location?: string;
  public_metrics?: {
    followers_count: number;
    following_count: number;
  };
}

export interface InstagramProfile {
  id: string;
  username: string;
  account_type: string;
  media_count: number;
  followers_count: number;
}

export interface TikTokProfile {
  open_id: string;
  union_id: string;
  avatar_url: string;
  display_name: string;
  bio_description: string;
  profile_deep_link: string;
  is_verified: boolean;
  follower_count: number;
  following_count: number;
  likes_count: number;
  video_count: number;
}

export function setupSocialAuth(app: Express) {
  // Only configure strategies if API keys are available
  const hasFacebookKeys = process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET;
  const hasTwitterKeys = process.env.TWITTER_API_KEY && process.env.TWITTER_API_SECRET;

  // Facebook Strategy
  if (hasFacebookKeys) {
    passport.use(new FacebookStrategy({
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: "/auth/facebook/callback",
      profileFields: ['id', 'name', 'email', 'picture.type(large)', 'age_range', 'location']
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        // Store Facebook connection data
        const facebookData = {
          facebookId: profile.id,
          facebookAccessToken: accessToken,
          facebookProfile: profile._json
        };
        return done(null, { facebookData, accessToken });
      } catch (error) {
        return done(error, null);
      }
    }));
  }

  // Twitter Strategy  
  if (hasTwitterKeys) {
    passport.use(new TwitterStrategy({
      consumerKey: process.env.TWITTER_API_KEY,
      consumerSecret: process.env.TWITTER_API_SECRET,
      callbackURL: "/auth/twitter/callback"
    }, async (token, tokenSecret, profile, done) => {
      try {
        const twitterData = {
          twitterId: profile.id,
          twitterAccessToken: token,
          twitterTokenSecret: tokenSecret,
          twitterProfile: profile._json
        };
        return done(null, { twitterData, token, tokenSecret });
      } catch (error) {
        return done(error, null);
      }
    }));
  }

  // Social media connection routes
  app.get('/auth/facebook', (req, res, next) => {
    if (!hasFacebookKeys) {
      return res.status(500).json({ error: 'Facebook authentication not configured. Please add FACEBOOK_APP_ID and FACEBOOK_APP_SECRET.' });
    }
    passport.authenticate('facebook', { 
      scope: ['email', 'public_profile', 'user_location', 'user_age_range'] 
    })(req, res, next);
  });

  app.get('/auth/facebook/callback', (req, res, next) => {
    if (!hasFacebookKeys) {
      return res.redirect('/?social=facebook&status=error&message=not_configured');
    }
    
    passport.authenticate('facebook', { session: false }, async (err, user) => {
      try {
        if (err || !user) {
          return res.redirect('/?social=facebook&status=error');
        }

        if (req.isAuthenticated()) {
          const { facebookData } = user as any;
          
          // Update user with Facebook connection
          await storage.updateUser(req.user.id, {
            facebookConnected: true,
            facebookId: facebookData.facebookId,
            facebookProfile: JSON.stringify(facebookData.facebookProfile)
          });

          res.redirect('/?social=facebook&status=connected');
        } else {
          res.redirect('/?social=facebook&status=error');
        }
      } catch (error) {
        console.error('Facebook callback error:', error);
        res.redirect('/?social=facebook&status=error');
      }
    })(req, res, next);
  });

  app.get('/auth/twitter', (req, res, next) => {
    if (!hasTwitterKeys) {
      return res.status(500).json({ error: 'Twitter authentication not configured. Please add TWITTER_API_KEY and TWITTER_API_SECRET.' });
    }
    passport.authenticate('twitter')(req, res, next);
  });

  app.get('/auth/twitter/callback', (req, res, next) => {
    if (!hasTwitterKeys) {
      return res.redirect('/?social=twitter&status=error&message=not_configured');
    }
    
    passport.authenticate('twitter', { session: false }, async (err, user) => {
      try {
        if (err || !user) {
          return res.redirect('/?social=twitter&status=error');
        }

        if (req.isAuthenticated()) {
          const { twitterData } = user as any;
          
          await storage.updateUser(req.user.id, {
            twitterConnected: true,
            twitterId: twitterData.twitterId,
            twitterProfile: JSON.stringify(twitterData.twitterProfile)
          });

          res.redirect('/?social=twitter&status=connected');
        } else {
          res.redirect('/?social=twitter&status=error');
        }
      } catch (error) {
        console.error('Twitter callback error:', error);
        res.redirect('/?social=twitter&status=error');
      }
    })(req, res, next);
  });

  // Instagram OAuth flow
  app.get('/auth/instagram', (req, res) => {
    if (!process.env.INSTAGRAM_CLIENT_ID) {
      return res.status(500).json({ error: 'Instagram client ID not configured' });
    }

    const redirectUri = `${req.protocol}://${req.get('host')}/auth/instagram/callback`;
    const scopes = 'user_profile,user_media';
    const instagramAuthUrl = `https://api.instagram.com/oauth/authorize?client_id=${process.env.INSTAGRAM_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}&response_type=code`;
    
    res.redirect(instagramAuthUrl);
  });

  app.get('/auth/instagram/callback', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.redirect('/auth');
      }

      const { code } = req.query;
      if (!code) {
        return res.redirect('/?social=instagram&status=error');
      }

      // Exchange code for access token
      const tokenResponse = await axios.post('https://api.instagram.com/oauth/access_token', {
        client_id: process.env.INSTAGRAM_CLIENT_ID,
        client_secret: process.env.INSTAGRAM_CLIENT_SECRET,
        grant_type: 'authorization_code',
        redirect_uri: `${req.protocol}://${req.get('host')}/auth/instagram/callback`,
        code: code
      }, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      const { access_token, user_id } = tokenResponse.data;

      // Get user profile
      const profileResponse = await axios.get(`https://graph.instagram.com/me?fields=id,username,account_type,media_count&access_token=${access_token}`);
      
      await storage.updateUser(req.user.id, {
        instagramConnected: true,
        instagramId: user_id,
        instagramProfile: JSON.stringify(profileResponse.data)
      });

      res.redirect('/?social=instagram&status=connected');
    } catch (error) {
      console.error('Instagram callback error:', error);
      res.redirect('/?social=instagram&status=error');
    }
  });

  // TikTok OAuth flow
  app.get('/auth/tiktok', (req, res) => {
    if (!process.env.TIKTOK_CLIENT_KEY) {
      return res.status(500).json({ error: 'TikTok client key not configured' });
    }

    const redirectUri = `${req.protocol}://${req.get('host')}/auth/tiktok/callback`;
    const scopes = 'user.info.basic,user.info.profile,user.info.stats';
    const state = Math.random().toString(36).substring(7);
    
    const tiktokAuthUrl = `https://www.tiktok.com/auth/authorize/?client_key=${process.env.TIKTOK_CLIENT_KEY}&scope=${scopes}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
    
    res.redirect(tiktokAuthUrl);
  });

  app.get('/auth/tiktok/callback', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.redirect('/auth');
      }

      const { code } = req.query;
      if (!code) {
        return res.redirect('/?social=tiktok&status=error');
      }

      // Exchange code for access token
      const tokenResponse = await axios.post('https://open-api.tiktok.com/oauth/access_token/', {
        client_key: process.env.TIKTOK_CLIENT_KEY,
        client_secret: process.env.TIKTOK_CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: `${req.protocol}://${req.get('host')}/auth/tiktok/callback`
      });

      const { access_token, open_id } = tokenResponse.data.data;

      // Get user profile
      const profileResponse = await axios.post('https://open-api.tiktok.com/user/info/', {
        access_token: access_token,
        open_id: open_id,
        fields: ['open_id', 'union_id', 'avatar_url', 'display_name', 'bio_description', 'profile_deep_link', 'is_verified', 'follower_count', 'following_count', 'likes_count', 'video_count']
      });

      await storage.updateUser(req.user.id, {
        tiktokConnected: true,
        tiktokId: open_id,
        tiktokProfile: JSON.stringify(profileResponse.data.data.user)
      });

      res.redirect('/?social=tiktok&status=connected');
    } catch (error) {
      console.error('TikTok callback error:', error);
      res.redirect('/?social=tiktok&status=error');
    }
  });

  // Disconnect social media accounts
  app.post('/api/social/disconnect/:platform', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { platform } = req.params;
    const updates: any = {};

    switch (platform) {
      case 'facebook':
        updates.facebookConnected = false;
        updates.facebookId = null;
        updates.facebookProfile = null;
        break;
      case 'twitter':
        updates.twitterConnected = false;
        updates.twitterId = null;
        updates.twitterProfile = null;
        break;
      case 'instagram':
        updates.instagramConnected = false;
        updates.instagramId = null;
        updates.instagramProfile = null;
        break;
      case 'tiktok':
        updates.tiktokConnected = false;
        updates.tiktokId = null;
        updates.tiktokProfile = null;
        break;
      default:
        return res.status(400).json({ error: 'Invalid platform' });
    }

    try {
      const updatedUser = await storage.updateUser(req.user.id, updates);
      res.json({ success: true, user: updatedUser });
    } catch (error) {
      console.error('Error disconnecting social account:', error);
      res.status(500).json({ error: 'Failed to disconnect account' });
    }
  });

  // Get social media insights
  app.get('/api/social/insights/:platform', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { platform } = req.params;
    const user = req.user;

    try {
      let insights = {};
      
      switch (platform) {
        case 'facebook':
          if (user.facebookProfile) {
            const profile = JSON.parse(user.facebookProfile);
            insights = {
              name: profile.name,
              profilePicture: profile.picture?.data?.url,
              location: profile.location?.name,
              ageRange: profile.age_range
            };
          }
          break;
        case 'twitter':
          if (user.twitterProfile) {
            const profile = JSON.parse(user.twitterProfile);
            insights = {
              username: profile.screen_name,
              name: profile.name,
              profileImage: profile.profile_image_url_https,
              followersCount: profile.followers_count,
              location: profile.location
            };
          }
          break;
        case 'instagram':
          if (user.instagramProfile) {
            const profile = JSON.parse(user.instagramProfile);
            insights = {
              username: profile.username,
              accountType: profile.account_type,
              mediaCount: profile.media_count
            };
          }
          break;
        case 'tiktok':
          if (user.tiktokProfile) {
            const profile = JSON.parse(user.tiktokProfile);
            insights = {
              displayName: profile.display_name,
              avatarUrl: profile.avatar_url,
              isVerified: profile.is_verified,
              followerCount: profile.follower_count,
              videoCount: profile.video_count
            };
          }
          break;
      }

      res.json(insights);
    } catch (error) {
      console.error('Error fetching social insights:', error);
      res.status(500).json({ error: 'Failed to fetch insights' });
    }
  });
}