import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SocialConnection from "@/components/social-connection";
import SocialMediaImport from "@/components/social-media-import";
import { useAuth } from "@/hooks/use-auth";

interface SocialPageProps {
  onBack: () => void;
}

export default function SocialPage({ onBack }: SocialPageProps) {
  const { user } = useAuth();

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-br from-lovematch-pink/5 via-lovematch-orange/5 to-lovematch-teal/5">
      {/* Header */}
      <header className="flex items-center p-4 bg-white border-b">
        <Button variant="ghost" size="icon" onClick={onBack} className="mr-3">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-gray-800">Social Connections</h1>
          <p className="text-sm text-gray-600">Connect and import from social media</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 pb-20">
        <Tabs defaultValue="connections" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="connections">Connections</TabsTrigger>
            <TabsTrigger value="import">Import Content</TabsTrigger>
          </TabsList>
          
          <TabsContent value="connections">
            <SocialConnection />
          </TabsContent>
          
          <TabsContent value="import" className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-lg font-bold text-gray-800 mb-2">Import Content</h2>
              <p className="text-gray-600 text-sm">
                Import photos, videos, and profile information from your connected social accounts
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <SocialMediaImport 
                platform="instagram" 
                isConnected={user?.instagramConnected || false}
              />
              <SocialMediaImport 
                platform="tiktok" 
                isConnected={user?.tiktokConnected || false}
              />
              <SocialMediaImport 
                platform="facebook" 
                isConnected={user?.facebookConnected || false}
              />
            </div>

            {(!user?.instagramConnected && !user?.tiktokConnected && !user?.facebookConnected) && (
              <div className="text-center py-8">
                <p className="text-gray-500">Connect social accounts to start importing content</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}