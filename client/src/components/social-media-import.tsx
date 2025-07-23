import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Download, Image, Video, Users, TrendingUp, Loader2 } from "lucide-react";
import { FaInstagram, FaTiktok, FaFacebook } from "react-icons/fa";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

interface SocialMediaImportProps {
  platform: 'instagram' | 'tiktok' | 'facebook';
  isConnected: boolean;
  insights?: any;
}

export default function SocialMediaImport({ platform, isConnected, insights }: SocialMediaImportProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isImporting, setIsImporting] = useState(false);

  const platformConfig = {
    instagram: {
      name: 'Instagram',
      icon: FaInstagram,
      color: 'from-purple-500 to-pink-500',
      importOptions: [
        { type: 'photos', label: 'Profile Photos', icon: Image, description: 'Import your best photos for your dating profile' },
        { type: 'bio', label: 'Bio Text', icon: Users, description: 'Use your Instagram bio as dating profile description' }
      ]
    },
    tiktok: {
      name: 'TikTok',
      icon: FaTiktok,
      color: 'from-black to-gray-800',
      importOptions: [
        { type: 'videos', label: 'Popular Videos', icon: Video, description: 'Showcase your most liked TikTok videos' },
        { type: 'bio', label: 'Bio & Stats', icon: TrendingUp, description: 'Import bio and follower stats for verification' }
      ]
    },
    facebook: {
      name: 'Facebook',
      icon: FaFacebook,
      color: 'from-blue-600 to-blue-700',
      importOptions: [
        { type: 'photos', label: 'Profile Pictures', icon: Image, description: 'Use Facebook profile photos' },
        { type: 'info', label: 'Basic Info', icon: Users, description: 'Import location, work, and education' }
      ]
    }
  };

  const config = platformConfig[platform];
  const Icon = config.icon;

  const handleImport = async (importType: string) => {
    if (!isConnected) {
      toast({
        title: "Not Connected",
        description: `Please connect your ${config.name} account first.`,
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    
    try {
      const response = await fetch(`/api/social/import/${platform}/${importType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Import failed');
      }

      const result = await response.json();
      
      toast({
        title: "Import Successful",
        description: `Successfully imported ${result.data.count || 0} items from ${config.name}!`,
      });

      console.log(`Imported ${importType} from ${platform}:`, result.data);
    } catch (error) {
      toast({
        title: "Import Failed",
        description: `Failed to import ${importType} from ${config.name}.`,
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  if (!isConnected) {
    return (
      <Card className="opacity-60">
        <CardContent className="p-4 text-center">
          <Icon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-500">Connect {config.name} to import content</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${config.color} flex items-center justify-center`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">{config.name}</h3>
                  <p className="text-sm text-gray-600">Import content</p>
                </div>
              </div>
              <Download className="h-5 w-5 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Icon className="h-6 w-6" />
            <span>Import from {config.name}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {config.importOptions.map((option) => {
            const OptionIcon = option.icon;
            return (
              <Card key={option.type} className="border-2">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <OptionIcon className="h-5 w-5 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{option.label}</h4>
                      <p className="text-sm text-gray-600 mb-3">{option.description}</p>
                      
                      {/* Show availability based on platform data */}
                      {platform === 'instagram' && option.type === 'photos' && insights?.mediaCount && (
                        <Badge variant="secondary" className="mb-3">
                          {insights.mediaCount} photos available
                        </Badge>
                      )}
                      
                      {platform === 'tiktok' && option.type === 'videos' && insights?.videoCount && (
                        <Badge variant="secondary" className="mb-3">
                          {insights.videoCount} videos available
                        </Badge>
                      )}

                      <Button
                        size="sm"
                        onClick={() => handleImport(option.type)}
                        disabled={isImporting}
                        className="w-full"
                      >
                        {isImporting ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Download className="h-4 w-4 mr-2" />
                        )}
                        Import {option.label}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          <div className="pt-4 border-t">
            <p className="text-xs text-gray-500 text-center">
              Imported content will be reviewed and can be edited before appearing on your profile
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}