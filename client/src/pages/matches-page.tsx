import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Match, User } from "@shared/schema";

interface MatchesPageProps {
  onOpenChat: () => void;
}

export default function MatchesPage({ onOpenChat }: MatchesPageProps) {
  const { data: matches = [], isLoading } = useQuery<(Match & { user: User })[]>({
    queryKey: ["/api/matches"],
  });

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-500">Loading your matches...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <header className="p-4 bg-white border-b">
        <h1 className="text-2xl font-bold text-gray-800">Your Matches</h1>
        <p className="text-gray-600 text-sm">Start conversations with your matches</p>
      </header>

      {/* Content */}
      <div className="flex-1 p-4 pb-20">
        {matches.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-gray-500 mb-4">No matches yet</p>
              <p className="text-sm text-gray-400">
                Keep swiping to find your perfect match!
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* New matches section */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                New Matches ({matches.length})
              </h2>
              <div className="flex space-x-3 overflow-x-auto pb-2">
                {matches.slice(0, 5).map((match) => (
                  <div key={match.id} className="flex-shrink-0 text-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-lovematch-pink to-lovematch-orange p-0.5">
                      <Avatar className="w-full h-full">
                        <AvatarImage 
                          src={match.user.profileVideoUrl || undefined} 
                          alt={match.user.displayName} 
                        />
                        <AvatarFallback>
                          {match.user.displayName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <p className="text-xs mt-1 text-gray-600">
                      {match.user.displayName}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent conversations */}
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">Messages</h2>
              <div className="space-y-3">
                {matches.map((match) => (
                  <Button
                    key={match.id}
                    variant="ghost"
                    onClick={onOpenChat}
                    className="w-full bg-white rounded-xl p-4 flex items-center space-x-3 shadow-sm hover:shadow-md transition-shadow h-auto"
                  >
                    <Avatar className="w-12 h-12">
                      <AvatarImage 
                        src={match.user.profileVideoUrl || undefined} 
                        alt={match.user.displayName} 
                      />
                      <AvatarFallback>
                        {match.user.displayName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-800">
                          {match.user.displayName}
                        </h3>
                        <span className="text-xs text-gray-500">
                          {new Date(match.createdAt!).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {match.user.location}
                      </p>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
