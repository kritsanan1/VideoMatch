// Social Media API Integration Layer
// This module handles actual API calls to social media platforms

interface FacebookAPI {
  getUserProfile(accessToken: string): Promise<any>;
  getUserPhotos(accessToken: string): Promise<any>;
}

interface InstagramAPI {
  getUserProfile(accessToken: string): Promise<any>;
  getUserMedia(accessToken: string): Promise<any>;
}

interface TwitterAPI {
  getUserProfile(accessToken: string, tokenSecret: string): Promise<any>;
  getUserTweets(accessToken: string, tokenSecret: string): Promise<any>;
}

interface TikTokAPI {
  getUserProfile(accessToken: string): Promise<any>;
  getUserVideos(accessToken: string): Promise<any>;
}

export class SocialMediaAPI {
  // Facebook Graph API
  static async fetchFacebookProfile(accessToken: string) {
    try {
      const response = await fetch(`https://graph.facebook.com/me?fields=id,name,email,picture.width(500).height(500),age_range,location&access_token=${accessToken}`);
      if (!response.ok) throw new Error('Facebook API error');
      return await response.json();
    } catch (error) {
      console.error('Facebook API error:', error);
      throw error;
    }
  }

  static async fetchFacebookPhotos(accessToken: string) {
    try {
      const response = await fetch(`https://graph.facebook.com/me/photos/uploaded?fields=source,created_time&limit=10&access_token=${accessToken}`);
      if (!response.ok) throw new Error('Facebook photos API error');
      return await response.json();
    } catch (error) {
      console.error('Facebook photos API error:', error);
      throw error;
    }
  }

  // Instagram Basic Display API
  static async fetchInstagramProfile(accessToken: string) {
    try {
      const response = await fetch(`https://graph.instagram.com/me?fields=id,username,account_type,media_count&access_token=${accessToken}`);
      if (!response.ok) throw new Error('Instagram API error');
      return await response.json();
    } catch (error) {
      console.error('Instagram API error:', error);
      throw error;
    }
  }

  static async fetchInstagramMedia(accessToken: string) {
    try {
      const response = await fetch(`https://graph.instagram.com/me/media?fields=id,media_type,media_url,thumbnail_url,permalink,caption&limit=10&access_token=${accessToken}`);
      if (!response.ok) throw new Error('Instagram media API error');
      return await response.json();
    } catch (error) {
      console.error('Instagram media API error:', error);
      throw error;
    }
  }

  // Twitter API v2
  static async fetchTwitterProfile(bearerToken: string, userId: string) {
    try {
      const response = await fetch(`https://api.twitter.com/2/users/${userId}?user.fields=name,username,profile_image_url,public_metrics,location,description`, {
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
          'Content-Type': 'application/json',
        }
      });
      if (!response.ok) throw new Error('Twitter API error');
      return await response.json();
    } catch (error) {
      console.error('Twitter API error:', error);
      throw error;
    }
  }

  static async fetchTwitterTweets(bearerToken: string, userId: string) {
    try {
      const response = await fetch(`https://api.twitter.com/2/users/${userId}/tweets?tweet.fields=created_at,public_metrics&max_results=10`, {
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
          'Content-Type': 'application/json',
        }
      });
      if (!response.ok) throw new Error('Twitter tweets API error');
      return await response.json();
    } catch (error) {
      console.error('Twitter tweets API error:', error);
      throw error;
    }
  }

  // TikTok API
  static async fetchTikTokProfile(accessToken: string) {
    try {
      const response = await fetch('https://open-api.tiktok.com/user/info/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_token: accessToken,
          fields: ['open_id', 'union_id', 'avatar_url', 'display_name', 'bio_description', 'profile_deep_link', 'is_verified', 'follower_count', 'following_count', 'likes_count', 'video_count']
        })
      });
      if (!response.ok) throw new Error('TikTok API error');
      return await response.json();
    } catch (error) {
      console.error('TikTok API error:', error);
      throw error;
    }
  }

  static async fetchTikTokVideos(accessToken: string) {
    try {
      const response = await fetch('https://open-api.tiktok.com/video/list/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_token: accessToken,
          cursor: 0,
          max_count: 10,
          fields: ['id', 'title', 'video_description', 'duration', 'cover_image_url', 'share_url', 'view_count', 'like_count', 'comment_count', 'share_count']
        })
      });
      if (!response.ok) throw new Error('TikTok videos API error');
      return await response.json();
    } catch (error) {
      console.error('TikTok videos API error:', error);
      throw error;
    }
  }

  // Utility method to refresh access tokens
  static async refreshTokenIfNeeded(platform: string, refreshToken: string) {
    switch (platform) {
      case 'facebook':
        // Facebook tokens are long-lived (60 days)
        return null;
      case 'instagram':
        // Instagram tokens need refresh every 60 days
        return null;
      case 'twitter':
        // Twitter OAuth 2.0 with refresh tokens
        return null;
      case 'tiktok':
        // TikTok tokens expire and need refresh
        return null;
      default:
        throw new Error('Unknown platform');
    }
  }

  // General method to sync user data from social platforms
  static async syncUserData(platform: string, accessToken: string, additionalParams?: any) {
    try {
      switch (platform) {
        case 'facebook':
          const fbProfile = await this.fetchFacebookProfile(accessToken);
          const fbPhotos = await this.fetchFacebookPhotos(accessToken);
          return { profile: fbProfile, photos: fbPhotos.data || [] };

        case 'instagram':
          const igProfile = await this.fetchInstagramProfile(accessToken);
          const igMedia = await this.fetchInstagramMedia(accessToken);
          return { profile: igProfile, media: igMedia.data || [] };

        case 'twitter':
          if (!additionalParams?.userId) throw new Error('Twitter userId required');
          const twitterProfile = await this.fetchTwitterProfile(accessToken, additionalParams.userId);
          const tweets = await this.fetchTwitterTweets(accessToken, additionalParams.userId);
          return { profile: twitterProfile.data, tweets: tweets.data || [] };

        case 'tiktok':
          const ttProfile = await this.fetchTikTokProfile(accessToken);
          const ttVideos = await this.fetchTikTokVideos(accessToken);
          return { profile: ttProfile.data?.user, videos: ttVideos.data?.videos || [] };

        default:
          throw new Error('Unsupported platform');
      }
    } catch (error) {
      console.error(`Error syncing ${platform} data:`, error);
      throw error;
    }
  }
}

// Rate limiting configuration for each platform
export const RATE_LIMITS = {
  facebook: {
    requests_per_hour: 200,
    requests_per_day: 25000
  },
  instagram: {
    requests_per_hour: 200,
    requests_per_day: 25000
  },
  twitter: {
    requests_per_15_min: 75,
    requests_per_day: 500000
  },
  tiktok: {
    requests_per_day: 1000,
    requests_per_hour: 100
  }
};

// Error handling for social media APIs
export class SocialAPIError extends Error {
  constructor(
    public platform: string,
    public statusCode: number,
    public apiError: string,
    message: string
  ) {
    super(message);
    this.name = 'SocialAPIError';
  }
}