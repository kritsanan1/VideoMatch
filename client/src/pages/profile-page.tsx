import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, Plus, Star } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import VideoUpload from "@/components/video-upload";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ProfilePageProps {
  onNavigateToPage?: (page: "discover" | "matches" | "chat" | "profile" | "pricing") => void;
}

export default function ProfilePage({ onNavigateToPage }: ProfilePageProps = {}) {
  const { user, logoutMutation } = useAuth();
  const [showVideoUpload, setShowVideoUpload] = useState(false);
  const { toast } = useToast();

  const updateProfileMutation = useMutation({
    mutationFn: async (updates: any) => {
      const res = await apiRequest("PATCH", "/api/profile", updates);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    },
  });

  const mockInterests = ["Travel", "Photography", "Cooking", "Fitness", "Music"];
  const mockSocialConnections = [
    { name: "Instagram", icon: "📷", connected: true },
    { name: "TikTok", icon: "🎵", connected: false },
    { name: "Facebook", icon: "👥", connected: true },
    { name: "Twitter", icon: "🐦", connected: false },
  ];

  if (!user) return null;

  return (
    <div className="flex-1 flex flex-col">
      {/* Profile Header */}
      <div className="relative">
        <div className="h-80 bg-gradient-to-br from-lovematch-pink via-lovematch-orange to-lovematch-teal relative">
          <div className="absolute inset-0 bg-black bg-opacity-30"></div>
          <div className="absolute top-4 right-4">
            <Button variant="ghost" size="icon" className="text-white">
              <Edit className="h-5 w-5" />
            </Button>
          </div>
          <div className="absolute bottom-6 left-6 text-white">
            <h1 className="text-3xl font-bold">
              {user.displayName}, {user.age}
            </h1>
            <p className="text-sm opacity-90">{user.location}</p>
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="flex-1 p-4 pb-20 space-y-6">
        {/* Video Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              My Videos
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowVideoUpload(true)}
              >
                <Plus className="h-5 w-5" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {user.profileVideoUrl ? (
                <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <video
                    src={user.profileVideoUrl}
                    className="w-full h-full object-cover"
                    controls={false}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                    <span className="text-white text-2xl">▶️</span>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="aspect-square border-2 border-dashed border-gray-300 hover:border-lovematch-pink"
                  onClick={() => setShowVideoUpload(true)}
                >
                  <Plus className="h-6 w-6" />
                </Button>
              )}
              <Button
                variant="outline"
                className="aspect-square border-2 border-dashed border-gray-300 hover:border-lovematch-pink"
                onClick={() => setShowVideoUpload(true)}
              >
                <Plus className="h-6 w-6" />
              </Button>
              <Button
                variant="outline"
                className="aspect-square border-2 border-dashed border-gray-300 hover:border-lovematch-pink"
                onClick={() => setShowVideoUpload(true)}
              >
                <Plus className="h-6 w-6" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Social Media Connections */}
        <Card>
          <CardHeader>
            <CardTitle>Social Media</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockSocialConnections.map((social) => (
                <div key={social.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">{social.icon}</span>
                    <span className="text-gray-700">{social.name}</span>
                  </div>
                  <Button
                    variant={social.connected ? "default" : "outline"}
                    size="sm"
                    className={social.connected ? "bg-gradient-to-r from-lovematch-pink to-lovematch-orange" : ""}
                  >
                    {social.connected ? "Connected" : "Connect"}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Interests */}
        <Card>
          <CardHeader>
            <CardTitle>Interests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {mockInterests.map((interest, index) => (
                <Badge
                  key={interest}
                  variant="secondary"
                  className={
                    index % 4 === 0
                      ? "bg-lovematch-pink/10 text-lovematch-pink"
                      : index % 4 === 1
                      ? "bg-lovematch-blue/10 text-lovematch-blue"
                      : index % 4 === 2
                      ? "bg-lovematch-mint/10 text-lovematch-mint"
                      : "bg-lovematch-orange/10 text-lovematch-orange"
                  }
                >
                  {interest}
                </Badge>
              ))}
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Premium Upgrade */}
        <Card className="bg-gradient-to-r from-lovematch-pink to-lovematch-orange text-white">
          <CardContent className="p-6 text-center">
            <Star className="h-12 w-12 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Upgrade to Premium</h3>
            <p className="text-sm opacity-90 mb-4">
              Get unlimited likes, see who liked you, and boost your profile
            </p>
            <Button
              variant="secondary"
              className="bg-white text-lovematch-pink hover:bg-gray-100"
              onClick={() => onNavigateToPage?.("pricing")}
            >
              Start Free Trial
            </Button>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button variant="ghost" className="w-full justify-start">
                Edit Profile
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                Notifications
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                Privacy & Safety
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                Help & Support
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-red-600 hover:text-red-700"
                onClick={() => logoutMutation.mutate()}
              >
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Video Upload Modal */}
      <VideoUpload
        open={showVideoUpload}
        onOpenChange={setShowVideoUpload}
        onVideoUploaded={() => {
          setShowVideoUpload(false);
          queryClient.invalidateQueries({ queryKey: ["/api/user"] });
        }}
      />
    </div>
  );
}
