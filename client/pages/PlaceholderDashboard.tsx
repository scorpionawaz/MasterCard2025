import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Construction, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface PlaceholderDashboardProps {
  role: "donor" | "receiver" | "admin";
}

export default function PlaceholderDashboard({ role }: PlaceholderDashboardProps) {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    
    if (!token || !userData) {
      navigate("/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.role !== role) {
        // Redirect to correct dashboard
        navigate(`/${parsedUser.role}/dashboard`);
        return;
      }
      setUser(parsedUser);
    } catch {
      navigate("/login");
    }
  }, [role, navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const getRoleTitle = () => {
    switch (role) {
      case "donor":
        return "Donor Dashboard";
      case "receiver":
        return "Receiver Dashboard";
      case "admin":
        return "Admin Dashboard";
    }
  };

  const getRoleDescription = () => {
    switch (role) {
      case "donor":
        return "Manage your donations and see their impact";
      case "receiver":
        return "Post your needs and track requests";
      case "admin":
        return "Manage the platform, approve requests, and match donations";
    }
  };

  const getUpcomingFeatures = () => {
    switch (role) {
      case "donor":
        return [
          "Add new donations with photos and descriptions",
          "View your donation history and status",
          "Track matched donations and their recipients",
          "Donation impact analytics"
        ];
      case "receiver":
        return [
          "Post new requests with urgency levels",
          "View your request history and status",
          "Track approved requests and matches",
          "Communication with donors"
        ];
      case "admin":
        return [
          "Review and approve donations",
          "Review and approve requests",
          "Match donations with requests",
          "Platform analytics and reports",
          "User management"
        ];
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-sm border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2F6fd2ab6a19b640de95da58a05ad12a50%2Fab0fe33fd60348a89b1dfbcda37d96e2?format=webp&width=800"
                alt="Seva Sahayog Foundation"
                className="h-10 w-auto"
              />
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {user.name}
              </span>
              <Button variant="outline" onClick={handleLogout} className="border-[#2C5F7F] text-[#2C5F7F] hover:bg-[#2C5F7F] hover:text-white">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-4 pt-8">
        <Card className="mb-8">
          <CardHeader className="text-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Construction className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-3xl font-bold">{getRoleTitle()}</CardTitle>
            <CardDescription className="text-lg">
              {getRoleDescription()}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="bg-muted/50 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold mb-3">🚧 Coming Soon!</h3>
              <p className="text-muted-foreground">
                This dashboard is currently under development. The features below will be available soon.
              </p>
            </div>

            <div className="text-left max-w-2xl mx-auto">
              <h4 className="font-semibold mb-4">Upcoming Features:</h4>
              <ul className="space-y-2">
                {getUpcomingFeatures().map((feature, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-primary mt-1">•</span>
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <Link to="/">
                <Button variant="outline">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Home
                </Button>
              </Link>
              <Button onClick={() => window.location.reload()}>
                Check for Updates
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-muted-foreground">
          <p>
            Continue prompting to have me build out specific pages and features for your {role} dashboard!
          </p>
        </div>
      </div>
    </div>
  );
}
