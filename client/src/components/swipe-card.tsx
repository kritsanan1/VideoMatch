import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Heart, Star, Info, VolumeX } from "lucide-react";
import { User } from "@shared/schema";

interface SwipeCardProps {
  user: User;
  onSwipe: (isLike: boolean) => void;
}

export default function SwipeCard({ user, onSwipe }: SwipeCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragX, setDragX] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    const startX = e.clientX;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      setDragX(deltaX);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      
      if (Math.abs(dragX) > 100) {
        onSwipe(dragX > 0);
      }
      
      setDragX(0);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    const startX = e.touches[0].clientX;

    const handleTouchMove = (e: TouchEvent) => {
      const deltaX = e.touches[0].clientX - startX;
      setDragX(deltaX);
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
      
      if (Math.abs(dragX) > 100) {
        onSwipe(dragX > 0);
      }
      
      setDragX(0);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };

    document.addEventListener("touchmove", handleTouchMove);
    document.addEventListener("touchend", handleTouchEnd);
  };

  return (
    <div className="relative h-full">
      {/* Background cards for depth */}
      <div className="absolute inset-4 top-8">
        <div className="bg-white rounded-2xl shadow-lg transform rotate-2 scale-95 opacity-50 h-full"></div>
        <div className="bg-white rounded-2xl shadow-lg transform -rotate-1 scale-97 opacity-75 absolute inset-0 h-full"></div>
      </div>
      
      {/* Active card */}
      <div
        className="bg-white rounded-2xl shadow-xl relative z-10 h-full overflow-hidden cursor-grab select-none"
        style={{
          transform: `translateX(${dragX}px) rotate(${dragX * 0.1}deg)`,
          transition: isDragging ? "none" : "transform 0.3s ease-out",
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* Profile image/video background */}
        <div className="absolute inset-0 bg-gradient-to-br from-lovematch-pink via-lovematch-orange to-lovematch-teal">
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
        </div>
        
        {/* Video controls overlay */}
        <div className="absolute top-4 right-4 z-20">
          <Button
            variant="ghost"
            size="icon"
            className="w-10 h-10 bg-black/30 hover:bg-black/50 rounded-full text-white"
          >
            <VolumeX className="h-4 w-4" />
          </Button>
        </div>
        
        {/* User info overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white z-20">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">
                {user.displayName}, {user.age}
              </h2>
              <p className="text-sm opacity-90">{user.location}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-sm"
            >
              <Info className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Interests tags */}
          {user.interests && user.interests.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {user.interests.slice(0, 3).map((interest) => (
                <Badge
                  key={interest}
                  variant="secondary"
                  className="bg-white/20 text-white backdrop-blur-sm border-none"
                >
                  {interest}
                </Badge>
              ))}
            </div>
          )}
          
          {/* Bio */}
          {user.bio && (
            <p className="text-sm opacity-90 mb-4 line-clamp-2">{user.bio}</p>
          )}
          
          {/* Social media indicators */}
          <div className="flex items-center space-x-2">
            {user.instagramConnected && <span className="text-pink-300">📷</span>}
            {user.tiktokConnected && <span className="text-white">🎵</span>}
            {user.facebookConnected && <span className="text-blue-300">👥</span>}
            {user.twitterConnected && <span className="text-blue-400">🐦</span>}
          </div>
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-6 z-20">
        <Button
          onClick={() => onSwipe(false)}
          size="icon"
          variant="outline"
          className="w-14 h-14 rounded-full bg-white hover:bg-gray-50 hover:scale-110 transition-transform"
        >
          <X className="h-6 w-6 text-gray-500" />
        </Button>
        <Button
          size="icon"
          variant="outline"
          className="w-12 h-12 rounded-full bg-white hover:bg-gray-50 hover:scale-110 transition-transform"
        >
          <Star className="h-5 w-5 text-blue-500" />
        </Button>
        <Button
          onClick={() => onSwipe(true)}
          size="icon"
          variant="outline"
          className="w-14 h-14 rounded-full bg-white hover:bg-gray-50 hover:scale-110 transition-transform"
        >
          <Heart className="h-6 w-6 text-lovematch-pink" />
        </Button>
      </div>

      {/* Swipe indicators */}
      {dragX !== 0 && (
        <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
          <div
            className={`text-6xl font-bold transform rotate-12 ${
              dragX > 0
                ? "text-green-500 opacity-80"
                : "text-red-500 opacity-80"
            }`}
          >
            {dragX > 0 ? "LIKE" : "NOPE"}
          </div>
        </div>
      )}
    </div>
  );
}
