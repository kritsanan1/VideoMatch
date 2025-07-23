import { Button } from "@/components/ui/button";
import { Heart, Users, MessageCircle, User } from "lucide-react";

type Page = "discover" | "matches" | "chat" | "profile";

interface BottomNavigationProps {
  currentPage: Page;
  onPageChange: (page: Page) => void;
}

export default function BottomNavigation({ currentPage, onPageChange }: BottomNavigationProps) {
  const navItems = [
    { id: "discover" as const, icon: Heart, label: "Discover" },
    { id: "matches" as const, icon: Users, label: "Matches" },
    { id: "chat" as const, icon: MessageCircle, label: "Chat" },
    { id: "profile" as const, icon: User, label: "Profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 max-w-md w-full bg-white border-t border-gray-200 z-50">
      <div className="flex justify-around items-center py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          
          return (
            <Button
              key={item.id}
              variant="ghost"
              onClick={() => onPageChange(item.id)}
              className={`flex flex-col items-center py-2 px-4 ${
                isActive ? "text-lovematch-pink" : "text-gray-400"
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? "text-lovematch-pink" : "text-gray-400"}`} />
              <span className={`text-xs mt-1 ${
                isActive ? "text-lovematch-pink font-medium" : "text-gray-400"
              }`}>
                {item.label}
              </span>
            </Button>
          );
        })}
      </div>
    </nav>
  );
}
