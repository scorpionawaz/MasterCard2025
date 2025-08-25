import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";

export default function QuickLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleQuickLogin = async (role: 'admin' | 'donor' | 'receiver') => {
    setIsLoading(true);
    
    const credentials = {
      admin: { email: 'admin@example.com', password: 'admin123' },
      donor: { email: 'donor@example.com', password: 'donor123' },
      receiver: { email: 'receiver@example.com', password: 'receiver123' }
    };

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials[role]),
      });

      const data = await response.json();
      
      if (data.success && data.token && data.user) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate(`/${role}/dashboard`);
      } else {
        alert(`Login failed: ${data.message}`);
      }
    } catch (error) {
      alert('Login error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>Quick Login for Testing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Choose a role to quickly login and test the CSV functionality:
          </p>
          
          <div className="space-y-3">
            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => handleQuickLogin('receiver')}
              disabled={isLoading}
            >
              Login as Receiver (Test Form Submission)
            </Button>
            
            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => handleQuickLogin('donor')}
              disabled={isLoading}
            >
              Login as Donor
            </Button>
            
            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => handleQuickLogin('admin')}
              disabled={isLoading}
            >
              Login as Admin
            </Button>
          </div>
          
          <div className="text-xs text-gray-500 space-y-1">
            <p><strong>Receiver:</strong> receiver@example.com / receiver123</p>
            <p><strong>Donor:</strong> donor@example.com / donor123</p>
            <p><strong>Admin:</strong> admin@example.com / admin123</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
