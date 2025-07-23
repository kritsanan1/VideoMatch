import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ExternalLink, Unlink } from "lucide-react";
import { FaFacebook, FaTwitter, FaInstagram, FaTiktok } from "react-icons/fa";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface SocialConnectionProps {
  platform: 'facebook' | 'twitter' | 'instagram' | 'tiktok';
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  isConnected: boolean;
}

function SocialPlatformCard({ platform, title, description, icon: Icon, color, isConnected }: SocialConnectionProps) {
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);

  // Get social insights when connected
  const { data: insights } = useQuery({
    queryKey: ['/api/social/insights', platform],
    enabled: isConnected,
    queryFn: async () => {
      const res = await fetch(`/api/social/insights/${platform}`);
      if (!res.ok) throw new Error('Failed to fetch insights');
      return res.json();
    }
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', `/api/social/disconnect/${platform}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/social/insights', platform] });
      toast({
        title: "Disconnected",
        description: `${title} account has been disconnected.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: `Failed to disconnect ${title} account.`,
        variant: "destructive",
      });
    }
  });

  const handleConnect = () => {
    setIsConnecting(true);
    // Redirect to OAuth flow
    window.location.href = `/auth/${platform}`;
  };

  const handleDisconnect = () => {
    if (window.confirm(`Are you sure you want to disconnect your ${title} account?`)) {
      disconnectMutation.mutate();
    }
  };

  return (
    <Card className="relative overflow-hidden">
      <div className={`absolute top-0 left-0 w-full h-1 ${color}`}></div>
      
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center`}>
              <Icon className={`h-5 w-5 ${color.includes('gradient') ? 'text-purple-500' : color.replace('bg-', 'text-')}`} />
            </div>
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              <p className="text-sm text-gray-600">{description}</p>
            </div>
          </div>
          
          {isConnected ? (
            <Badge variant="default" className="bg-green-100 text-green-800">
              Connected
            </Badge>
          ) : (
            <Badge variant="secondary">
              Not Connected
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {isConnected && insights ? (
          <div className="space-y-3">
            {/* Display platform-specific insights */}
            {platform === 'facebook' && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">Name:</span>
                  <span className="text-sm text-gray-600">{insights.name}</span>
                </div>
                {insights.location && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">Location:</span>
                    <span className="text-sm text-gray-600">{insights.location}</span>
                  </div>
                )}
                {insights.ageRange && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">Age Range:</span>
                    <span className="text-sm text-gray-600">{insights.ageRange.min}+</span>
                  </div>
                )}
              </div>
            )}

            {platform === 'twitter' && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">Username:</span>
                  <span className="text-sm text-gray-600">@{insights.username}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">Followers:</span>
                  <span className="text-sm text-gray-600">{insights.followersCount?.toLocaleString()}</span>
                </div>
                {insights.location && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">Location:</span>
                    <span className="text-sm text-gray-600">{insights.location}</span>
                  </div>
                )}
              </div>
            )}

            {platform === 'instagram' && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">Username:</span>
                  <span className="text-sm text-gray-600">@{insights.username}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">Account Type:</span>
                  <span className="text-sm text-gray-600 capitalize">{insights.accountType}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">Posts:</span>
                  <span className="text-sm text-gray-600">{insights.mediaCount}</span>
                </div>
              </div>
            )}

            {platform === 'tiktok' && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">Display Name:</span>
                  <span className="text-sm text-gray-600">{insights.displayName}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">Followers:</span>
                  <span className="text-sm text-gray-600">{insights.followerCount?.toLocaleString()}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">Videos:</span>
                  <span className="text-sm text-gray-600">{insights.videoCount}</span>
                </div>
                {insights.isVerified && (
                  <Badge variant="default" className="bg-blue-100 text-blue-800">
                    Verified Account
                  </Badge>
                )}
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleDisconnect}
              disabled={disconnectMutation.isPending}
              className="w-full mt-4 text-red-600 hover:text-red-700"
            >
              {disconnectMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Unlink className="h-4 w-4 mr-2" />
              )}
              Disconnect
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Connect your {title} account to import profile information and enhance your dating profile.
            </p>
            
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-xs">Profile Import</Badge>
              <Badge variant="outline" className="text-xs">Social Verification</Badge>
              {platform === 'instagram' && <Badge variant="outline" className="text-xs">Photo Import</Badge>}
              {platform === 'tiktok' && <Badge variant="outline" className="text-xs">Video Import</Badge>}
            </div>

            <Button
              onClick={handleConnect}
              disabled={isConnecting}
              className={`w-full bg-gradient-to-r ${color.includes('gradient') ? color.replace('bg-gradient-to-r ', '') : color} hover:opacity-90`}
            >
              {isConnecting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <ExternalLink className="h-4 w-4 mr-2" />
              )}
              Connect {title}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function SocialConnection() {
  const { user } = useAuth();

  if (!user) return null;

  const platforms = [
    {
      platform: 'facebook' as const,
      title: 'Facebook',
      description: 'Import basic profile and verify identity',
      icon: FaFacebook,
      color: 'bg-blue-600',
      isConnected: user.facebookConnected || false
    },
    {
      platform: 'instagram' as const,
      title: 'Instagram',
      description: 'Show your best photos and lifestyle',
      icon: FaInstagram,
      color: 'bg-gradient-to-r from-purple-500 to-pink-500',
      isConnected: user.instagramConnected || false
    },
    {
      platform: 'twitter' as const,
      title: 'Twitter/X',
      description: 'Share your thoughts and personality',
      icon: FaTwitter,
      color: 'bg-gray-900',
      isConnected: user.twitterConnected || false
    },
    {
      platform: 'tiktok' as const,
      title: 'TikTok',
      description: 'Showcase your creativity and humor',
      icon: FaTiktok,
      color: 'bg-black',
      isConnected: user.tiktokConnected || false
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Connect Social Media</h2>
        <p className="text-gray-600">
          Link your social accounts to create a more authentic and engaging dating profile
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {platforms.map((platform) => (
          <SocialPlatformCard key={platform.platform} {...platform} />
        ))}
      </div>

      {/* Summary Stats */}
      <Card className="bg-gradient-to-r from-lovematch-pink/10 to-lovematch-orange/10">
        <CardContent className="p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Social Verification Score</h3>
            <div className="flex justify-center items-center space-x-4">
              <div className="text-3xl font-bold text-lovematch-pink">
                {platforms.filter(p => p.isConnected).length}/4
              </div>
              <div className="text-sm text-gray-600">
                Platforms Connected
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Connected accounts help other users trust your profile and improve match quality
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}