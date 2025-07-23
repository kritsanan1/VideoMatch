import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Phone, Video, Camera, Send } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Message, User } from "@shared/schema";

interface ChatPageProps {
  onBack: () => void;
}

export default function ChatPage({ onBack }: ChatPageProps) {
  const [message, setMessage] = useState("");
  const [selectedMatchId] = useState(1); // Mock match ID for demo
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: messages = [] } = useQuery<(Message & { sender: User })[]>({
    queryKey: ["/api/matches", selectedMatchId, "messages"],
    refetchInterval: 1000, // Poll for new messages
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("POST", `/api/matches/${selectedMatchId}/messages`, {
        content,
        messageType: "text",
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/matches", selectedMatchId, "messages"] 
      });
      setMessage("");
    },
  });

  const handleSendMessage = () => {
    if (message.trim()) {
      sendMessageMutation.mutate(message);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mock chat partner data
  const chatPartner = {
    id: 2,
    displayName: "Milk",
    profileVideoUrl: null,
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Chat Header */}
      <header className="flex items-center p-4 bg-white border-b">
        <Button variant="ghost" size="icon" onClick={onBack} className="mr-3">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Avatar className="w-10 h-10 mr-3">
          <AvatarImage src={chatPartner.profileVideoUrl || undefined} />
          <AvatarFallback>{chatPartner.displayName.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h2 className="font-semibold text-gray-800">{chatPartner.displayName}</h2>
          <p className="text-xs text-green-500 flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
            Online
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="ghost" size="icon">
            <Video className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Phone className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto" style={{ paddingBottom: "120px" }}>
        {/* Encryption notice */}
        <div className="text-center">
          <div className="inline-flex items-center px-3 py-1 bg-green-100 rounded-full text-xs text-green-800">
            <span className="mr-1">🔒</span>
            End-to-end encrypted
          </div>
        </div>

        {messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Start your conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.senderId === user?.id;
            
            return (
              <div
                key={msg.id}
                className={`flex items-end space-x-2 ${isOwn ? "justify-end" : ""}`}
              >
                {!isOwn && (
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={msg.sender.profileVideoUrl || undefined} />
                    <AvatarFallback>{msg.sender.displayName.charAt(0)}</AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`max-w-xs px-4 py-2 rounded-2xl ${
                    isOwn
                      ? "bg-gradient-to-r from-lovematch-pink to-lovematch-orange text-white rounded-br-sm"
                      : "bg-gray-100 text-gray-800 rounded-bl-sm"
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                  <div className={`flex items-center mt-1 space-x-1 ${isOwn ? "justify-end" : ""}`}>
                    <span className={`text-xs ${isOwn ? "text-white opacity-90" : "text-gray-500"}`}>
                      {new Date(msg.createdAt!).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                    {isOwn && (
                      <span className="text-xs text-white opacity-90">✓✓</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="fixed bottom-16 left-1/2 transform -translate-x-1/2 max-w-md w-full bg-white border-t p-4">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="icon">
            <Camera className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              className="bg-gray-100 border-none rounded-full"
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            />
          </div>
          <Button
            size="icon"
            onClick={handleSendMessage}
            className="bg-gradient-to-r from-lovematch-pink to-lovematch-orange hover:from-lovematch-pink/90 hover:to-lovematch-orange/90"
            disabled={!message.trim() || sendMessageMutation.isPending}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
