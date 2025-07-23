import { useState } from "react";
import BottomNavigation from "@/components/bottom-navigation";
import SwipeCard from "@/components/swipe-card";
import MatchesPage from "./matches-page";
import ChatPage from "./chat-page";
import ProfilePage from "./profile-page";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Bell, Settings } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { User } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

type Page = "discover" | "matches" | "chat" | "profile";

export default function HomePage() {
  const [currentPage, setCurrentPage] = useState<Page>("discover");
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [currentUserIndex, setCurrentUserIndex] = useState(0);
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: discoveryUsers = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/discovery"],
  });

  const likeMutation = useMutation({
    mutationFn: async ({ toUserId, isLike }: { toUserId: number; isLike: boolean }) => {
      const res = await apiRequest("POST", "/api/like", { toUserId, isLike });
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.isMatch) {
        setShowMatchModal(true);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/discovery"] });
      queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to process your action",
        variant: "destructive",
      });
    },
  });

  const handleSwipe = (isLike: boolean) => {
    const currentUser = discoveryUsers[currentUserIndex];
    if (!currentUser) return;

    likeMutation.mutate({
      toUserId: currentUser.id,
      isLike,
    });

    setCurrentUserIndex(prev => prev + 1);
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case "discover":
        return (
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <header className="flex items-center justify-between p-4 bg-white border-b">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-lovematch-pink to-lovematch-orange flex items-center justify-center">
                  <span className="text-white text-sm">💕</span>
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-lovematch-pink to-lovematch-orange bg-clip-text text-transparent">
                  LoveMatch
                </h1>
              </div>
              <div className="flex items-center space-x-3">
                <Button variant="ghost" size="icon">
                  <Settings className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Bell className="h-5 w-5" />
                </Button>
              </div>
            </header>

            {/* Swipe Area */}
            <div className="flex-1 relative p-4">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">Loading potential matches...</p>
                </div>
              ) : discoveryUsers.length === 0 || currentUserIndex >= discoveryUsers.length ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <p className="text-gray-500 mb-4">No more potential matches</p>
                    <Button onClick={() => window.location.reload()}>
                      Refresh
                    </Button>
                  </div>
                </div>
              ) : (
                <SwipeCard
                  user={discoveryUsers[currentUserIndex]}
                  onSwipe={handleSwipe}
                />
              )}
            </div>
          </div>
        );
      case "matches":
        return <MatchesPage onOpenChat={() => setCurrentPage("chat")} />;
      case "chat":
        return <ChatPage onBack={() => setCurrentPage("matches")} />;
      case "profile":
        return <ProfilePage />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen flex flex-col relative">
      {renderCurrentPage()}
      <BottomNavigation currentPage={currentPage} onPageChange={setCurrentPage} />
      
      {/* Match Modal */}
      <Dialog open={showMatchModal} onOpenChange={setShowMatchModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">
              <div className="flex items-center justify-center mb-4">
                <div className="w-20 h-20 bg-gradient-to-r from-lovematch-pink to-lovematch-orange rounded-full flex items-center justify-center animate-pulse">
                  <span className="text-white text-3xl">💕</span>
                </div>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-lovematch-pink to-lovematch-orange bg-clip-text text-transparent">
                It's a Match!
              </span>
            </DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-4">
            <p className="text-gray-600">
              You and {discoveryUsers[currentUserIndex - 1]?.displayName} liked each other
            </p>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowMatchModal(false)}
              >
                Keep Swiping
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-lovematch-pink to-lovematch-orange hover:from-lovematch-pink/90 hover:to-lovematch-orange/90"
                onClick={() => {
                  setShowMatchModal(false);
                  setCurrentPage("chat");
                }}
              >
                Send Message
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
