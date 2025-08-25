import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Heart, User, Gift, Shield, ArrowLeft, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { RegisterRequest, RegisterResponse, UserRole } from "@shared/api";

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "donor" as UserRole
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    setError("");
  };

  const handleRoleChange = (value: UserRole) => {
    setFormData(prev => ({
      ...prev,
      role: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Validation
    if (!formData.name || !formData.email || !formData.password) {
      setError("Please fill in all required fields.");
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      setIsLoading(false);
      return;
    }

    try {
      const registerData: RegisterRequest = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role
      };

      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registerData),
      });

      const data: RegisterResponse = await response.json();

      if (data.success) {
        setSuccess(true);
        // Store token and user data if provided
        if (data.token) {
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));
        }
        
        // Redirect based on role after a short delay
        setTimeout(() => {
          switch (formData.role) {
            case "donor":
              navigate("/donor/dashboard");
              break;
            case "receiver":
              navigate("/receiver/dashboard");
              break;
            case "admin":
              navigate("/admin/dashboard");
              break;
            default:
              navigate("/login");
          }
        }, 2000);
      } else {
        setError(data.message || "Registration failed. Please try again.");
      }
    } catch (err) {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleDescription = (role: UserRole) => {
    switch (role) {
      case "donor":
        return "Share items and resources with those in need";
      case "receiver":
        return "Request help and receive donations from the community";
      case "admin":
        return "Manage the platform and approve donations/requests";
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case "donor":
        return <Gift className="h-5 w-5" />;
      case "receiver":
        return <User className="h-5 w-5" />;
      case "admin":
        return <Shield className="h-5 w-5" />;
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Welcome to GiveShare!</h2>
            <p className="text-muted-foreground mb-6">
              Your account has been created successfully. You'll be redirected to your dashboard shortly.
            </p>
            <div className="flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-sm border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
              <span className="text-sm text-gray-600">Back to Home</span>
            </Link>
            <div className="flex items-center ml-8">
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2F6fd2ab6a19b640de95da58a05ad12a50%2Fab0fe33fd60348a89b1dfbcda37d96e2?format=webp&width=800"
                alt="Seva Sahayog Foundation"
                className="h-10 w-auto"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold">Join Our Community</CardTitle>
            <CardDescription className="text-lg">
              Create your account to start making a difference
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">I want to join as *</Label>
                <RadioGroup
                  value={formData.role}
                  onValueChange={handleRoleChange}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                  {(["donor", "receiver", "admin"] as UserRole[]).map((role) => (
                    <div key={role} className="flex items-center space-x-2">
                      <RadioGroupItem value={role} id={role} className="sr-only" />
                      <Label
                        htmlFor={role}
                        className={`flex-1 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          formData.role === role
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`p-2 rounded-md ${
                            formData.role === role ? "bg-primary text-white" : "bg-muted"
                          }`}>
                            {getRoleIcon(role)}
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold capitalize mb-1">{role}</div>
                            <div className="text-sm text-muted-foreground">
                              {getRoleDescription(role)}
                            </div>
                          </div>
                        </div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>

              {/* Login Link */}
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link to="/login" className="text-primary hover:underline font-medium">
                    Sign in here
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
