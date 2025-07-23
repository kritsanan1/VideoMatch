import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Heart, Zap, Crown, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface PricingPageProps {
  onBack: () => void;
}

export default function PricingPage({ onBack }: PricingPageProps) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const { user } = useAuth();

  const plans = [
    {
      id: "basic",
      name: "LoveMatch Free",
      price: "Free",
      period: "",
      icon: Heart,
      color: "from-gray-500 to-gray-600",
      features: [
        "10 likes per day",
        "Basic profile creation",
        "Limited messaging",
        "Standard matching",
        "Basic filters"
      ],
      limitations: [
        "No super likes",
        "No rewind feature",
        "Ads included"
      ]
    },
    {
      id: "premium",
      name: "LoveMatch Premium",
      price: "₿299",
      period: "/month",
      icon: Star,
      color: "from-lovematch-pink to-lovematch-orange",
      popular: true,
      features: [
        "Unlimited likes",
        "5 super likes daily",
        "See who liked you",
        "Rewind last swipe",
        "Advanced filters",
        "Ad-free experience",
        "Priority matching",
        "Video call feature"
      ],
      savings: "Most Popular"
    },
    {
      id: "gold",
      name: "LoveMatch Gold",
      price: "₿499",
      period: "/month",
      icon: Crown,
      color: "from-yellow-400 to-yellow-600",
      features: [
        "Everything in Premium",
        "Unlimited super likes",
        "Profile boost (2x visibility)",
        "Read receipts",
        "Message before matching",
        "Top picks feature",
        "Travel mode",
        "Premium support"
      ],
      savings: "Ultimate Experience"
    }
  ];

  const yearlyPlans = [
    {
      id: "premium-yearly",
      name: "LoveMatch Premium",
      price: "₿2,499",
      originalPrice: "₿3,588",
      period: "/year",
      savings: "Save 30%"
    },
    {
      id: "gold-yearly",
      name: "LoveMatch Gold", 
      price: "₿4,199",
      originalPrice: "₿5,988",
      period: "/year",
      savings: "Save 30%"
    }
  ];

  const handleSelectPlan = async (planId: string) => {
    setSelectedPlan(planId);
    
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ planId }),
      });
      
      if (!res.ok) {
        throw new Error("Failed to subscribe");
      }
      
      const data = await res.json();
      
      // Show success message and go back to profile
      window.location.reload(); // Refresh to update user data
    } catch (error) {
      console.error("Subscription error:", error);
      // In a real app, show error toast
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-br from-lovematch-pink/5 via-lovematch-orange/5 to-lovematch-teal/5">
      {/* Header */}
      <header className="flex items-center p-4 bg-white border-b">
        <Button variant="ghost" size="icon" onClick={onBack} className="mr-3">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-gray-800">Choose Your Plan</h1>
          <p className="text-sm text-gray-600">Unlock premium features to find love faster</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 pb-20">
        {/* Current Status */}
        {user && (
          <Card className="mb-6 bg-gradient-to-r from-lovematch-blue/10 to-lovematch-teal/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-800">Current Plan</p>
                  <p className="text-sm text-gray-600">
                    {user.isPremium === true ? "Premium Active" : "Free Plan"}
                  </p>
                </div>
                <Badge variant={user.isPremium === true ? "default" : "secondary"}>
                  {user.isPremium === true ? "Premium" : "Free"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Monthly Plans */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-800 mb-4 text-center">Monthly Plans</h2>
          <div className="space-y-4">
            {plans.map((plan) => {
              const Icon = plan.icon;
              return (
                <Card 
                  key={plan.id}
                  className={`relative ${plan.popular ? 'ring-2 ring-lovematch-pink' : ''} ${
                    selectedPlan === plan.id ? 'ring-2 ring-lovematch-blue' : ''
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-lovematch-pink to-lovematch-orange">
                        {plan.savings}
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${plan.color} flex items-center justify-center`}>
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{plan.name}</CardTitle>
                          <div className="flex items-baseline space-x-1">
                            <span className="text-2xl font-bold text-gray-900">{plan.price}</span>
                            <span className="text-sm text-gray-500">{plan.period}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-3">
                      {plan.features.map((feature, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{feature}</span>
                        </div>
                      ))}
                      
                      {plan.limitations && plan.limitations.map((limitation, index) => (
                        <div key={index} className="flex items-center space-x-2 opacity-60">
                          <div className="h-4 w-4 flex-shrink-0">
                            <div className="h-0.5 w-3 bg-gray-400 rounded"></div>
                          </div>
                          <span className="text-sm text-gray-600">{limitation}</span>
                        </div>
                      ))}
                    </div>

                    <Button
                      onClick={() => handleSelectPlan(plan.id)}
                      className={`w-full mt-4 ${
                        plan.id === 'basic' 
                          ? 'bg-gray-600 hover:bg-gray-700' 
                          : 'bg-gradient-to-r from-lovematch-pink to-lovematch-orange hover:from-lovematch-pink/90 hover:to-lovematch-orange/90'
                      }`}
                      disabled={plan.id === 'basic' && user && user.isPremium !== true}
                    >
                      {plan.id === 'basic' ? 'Current Plan' : 'Choose Plan'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Yearly Plans */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 text-center">Yearly Plans - Save More!</h2>
          <div className="space-y-4">
            {yearlyPlans.map((plan) => (
              <Card key={plan.id} className="border-2 border-green-200 bg-green-50/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-800">{plan.name}</h3>
                      <div className="flex items-center space-x-2">
                        <span className="text-xl font-bold text-gray-900">{plan.price}</span>
                        <span className="text-sm text-gray-500 line-through">{plan.originalPrice}</span>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          {plan.savings}
                        </Badge>
                      </div>
                      <span className="text-sm text-gray-600">{plan.period}</span>
                    </div>
                    <Button
                      onClick={() => handleSelectPlan(plan.id)}
                      className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                    >
                      Choose Annual
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Features Comparison */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-center">Why Upgrade?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Zap className="h-5 w-5 text-lovematch-orange" />
                  <div>
                    <h4 className="font-semibold">Get More Matches</h4>
                    <p className="text-sm text-gray-600">Unlimited likes and super likes</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Heart className="h-5 w-5 text-lovematch-pink" />
                  <div>
                    <h4 className="font-semibold">See Who Likes You</h4>
                    <p className="text-sm text-gray-600">Match instantly with interested users</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <div>
                    <h4 className="font-semibold">Boost Your Profile</h4>
                    <p className="text-sm text-gray-600">Get 2x more visibility</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Crown className="h-5 w-5 text-yellow-600" />
                  <div>
                    <h4 className="font-semibold">Premium Features</h4>
                    <p className="text-sm text-gray-600">Video calls, travel mode, and more</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Testimonials */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Success Stories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-lovematch-pink/10 to-lovematch-orange/10 p-4 rounded-lg">
                <p className="text-sm italic text-gray-700 mb-2">
                  "I found my soulmate within 2 weeks of upgrading to Premium! The unlimited likes made all the difference."
                </p>
                <p className="text-xs font-semibold text-gray-600">- Siriporn, Bangkok</p>
              </div>
              <div className="bg-gradient-to-r from-lovematch-blue/10 to-lovematch-teal/10 p-4 rounded-lg">
                <p className="text-sm italic text-gray-700 mb-2">
                  "Gold plan's profile boost helped me get 5x more matches. Best investment for my love life!"
                </p>
                <p className="text-xs font-semibold text-gray-600">- Krit, Chiang Mai</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}