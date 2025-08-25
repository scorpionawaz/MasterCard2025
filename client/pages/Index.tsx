import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Users, Gift, ArrowRight, CheckCircle, MapPin, Clock, AlertTriangle, User, Home, Phone, Info, Menu } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Request, ItemCategory } from "@shared/api";

interface DonationActivity {
  id: string;
  type: 'donation' | 'request';
  userName: string;
  itemName: string;
  quantity: string;
  location: string;
  timestamp: string;
}

const donationCategories = [
  {
    id: 'food',
    title: 'Food Donations',
    description: 'Non-perishable items, meals, groceries',
    icon: '📦',
    color: 'bg-orange-50 border-orange-200',
    iconBg: 'bg-orange-100',
  },
  {
    id: 'clothes',
    title: 'Clothes Donations',
    description: 'New or gently used clothes, shoes',
    icon: '👕',
    color: 'bg-blue-50 border-blue-200',
    iconBg: 'bg-blue-100',
  },
  {
    id: 'books',
    title: 'Books & Stationery',
    description: 'For schools, kids, education materials',
    icon: '📚',
    color: 'bg-green-50 border-green-200',
    iconBg: 'bg-green-100',
  },
  {
    id: 'furniture',
    title: 'Furniture & Household',
    description: 'Beds, chairs, utensils, appliances',
    icon: '🛋',
    color: 'bg-purple-50 border-purple-200',
    iconBg: 'bg-purple-100',
  },
  {
    id: 'medical',
    title: 'Medical Support',
    description: 'Medicines, equipment, health supplies',
    icon: '💊',
    color: 'bg-red-50 border-red-200',
    iconBg: 'bg-red-100',
  },
  {
    id: 'other',
    title: 'Other Help',
    description: 'Electronics, toys, miscellaneous items',
    icon: '🧑‍🤝‍🧑',
    color: 'bg-gray-50 border-gray-200',
    iconBg: 'bg-gray-100',
  },
];

export default function Index() {
  const [activities, setActivities] = useState<DonationActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const response = await fetch("/api/public/activities");
      if (response.ok) {
        const data = await response.json();
        setActivities(data.activities || []);
      }
    } catch (error) {
      console.error("Error fetching activities:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - activityTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header / Navigation Bar */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo + Website Name */}
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-600 to-green-500 p-2 rounded-lg">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold text-gray-900">Revive</span>
                <span className="hidden sm:inline text-sm text-gray-600 ml-2">Give & Receive with Care</span>
              </div>
            </div>

            {/* Navigation Links - Desktop */}
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/" className="text-gray-700 hover:text-blue-600 flex items-center space-x-1">
                <Home className="h-4 w-4" />
                <span>Home</span>
              </Link>
              <Link to="#about" className="text-gray-700 hover:text-blue-600 flex items-center space-x-1">
                <Info className="h-4 w-4" />
                <span>About Us</span>
              </Link>
              <Link to="/register" className="text-gray-700 hover:text-blue-600">Donate</Link>
              <Link to="/register" className="text-gray-700 hover:text-blue-600">Receive</Link>
              <Link to="#contact" className="text-gray-700 hover:text-blue-600 flex items-center space-x-1">
                <Phone className="h-4 w-4" />
                <span>Contact</span>
              </Link>
            </div>

            {/* Login / Register */}
            <div className="flex items-center space-x-3">
              <Link to="/login">
                <Button variant="ghost" className="text-gray-700">Login</Button>
              </Link>
              <Link to="/register">
                <Button className="bg-blue-600 hover:bg-blue-700">Register</Button>
              </Link>
              {/* Mobile Menu */}
              <Button variant="ghost" size="sm" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-green-500 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center">
            {/* Eye-catching banner with helping hands visual */}
            <div className="mb-8 flex justify-center">
              <div className="relative">
                <div className="text-8xl mb-4">🤝</div>
                <div className="absolute -top-4 -right-4 text-4xl animate-bounce">💝</div>
              </div>
            </div>
            
            {/* Motivational tagline */}
            <h1 className="text-4xl lg:text-6xl font-bold mb-6">
              One donation can{" "}
              <span className="text-yellow-300">change a life.</span>
            </h1>
            <p className="text-xl text-blue-100 mb-10 max-w-3xl mx-auto">
              Revive connects generous hearts with those in need. Every act of kindness 
              creates ripples of hope in our community.
            </p>

            {/* Call-to-Action buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button size="lg" className="text-lg px-8 py-6 bg-yellow-500 text-gray-900 hover:bg-yellow-400 font-semibold">
                  <Gift className="mr-2 h-5 w-5" />
                  Donate Now
                </Button>
              </Link>
              <Link to="/register">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-2 border-white text-white hover:bg-white hover:text-blue-600 font-semibold">
                  <Heart className="mr-2 h-5 w-5" />
                  Request Help
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Information Cards - Amazon-style grid */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              How Can We Help You Today?
            </h2>
            <p className="text-xl text-gray-600">
              Choose a category to donate items or request support
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {donationCategories.map((category) => (
              <Card key={category.id} className={`${category.color} hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-blue-300 group`}>
                <CardHeader className="text-center pb-4">
                  <div className={`w-16 h-16 ${category.iconBg} rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                    <span className="text-2xl">{category.icon}</span>
                  </div>
                  <CardTitle className="text-xl font-semibold text-gray-900">{category.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    {category.description}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Link to="/register" className="flex-1">
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                        Donate
                      </Button>
                    </Link>
                    <Link to="/register" className="flex-1">
                      <Button variant="outline" className="w-full border-blue-600 text-blue-600 hover:bg-blue-50">
                        Request
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Donation Activity / Live Updates */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Community Activity
            </h2>
            <p className="text-xl text-gray-600">
              See the latest donations and requests from our caring community
            </p>
          </div>

          {/* Live Updates Ticker */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <div className="flex items-center mb-4">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse mr-2"></div>
              <span className="text-sm font-medium text-gray-700">LIVE UPDATES</span>
            </div>
            
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading community activity...</p>
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-8">
                <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No recent activity. Be the first to make a difference!</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      activity.type === 'donation' ? 'bg-green-100' : 'bg-blue-100'
                    }`}>
                      {activity.type === 'donation' ? (
                        <Gift className="h-5 w-5 text-green-600" />
                      ) : (
                        <Heart className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm">
                        <span className="font-semibold text-gray-900">{activity.userName}</span>
                        <span className="text-gray-700">
                          {activity.type === 'donation' ? ' donated ' : ' requested '}
                        </span>
                        <span className="font-medium text-gray-900">{activity.quantity} {activity.itemName}</span>
                        {activity.location && (
                          <>
                            <span className="text-gray-700"> to </span>
                            <span className="text-gray-900">{activity.location}</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center mt-1 text-xs text-gray-500">
                        <Clock className="h-3 w-3 mr-1" />
                        {getTimeAgo(activity.timestamp)}
                        {activity.location && (
                          <>
                            <MapPin className="h-3 w-3 ml-3 mr-1" />
                            Near you
                          </>
                        )}
                      </div>
                    </div>
                    <Badge variant={activity.type === 'donation' ? 'default' : 'secondary'} className="text-xs">
                      {activity.type === 'donation' ? 'Donated' : 'Requested'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Call to action */}
          <div className="text-center">
            <Link to="/register">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-green-500 hover:from-blue-700 hover:to-green-600 text-white px-8 py-4">
                Join Our Community Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              About Revive
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We believe in the power of community. Revive connects those who want to give 
              with those who need support, creating meaningful relationships and lasting impact.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Heart className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-gray-900">Our Mission</h3>
                <p className="text-gray-600">
                  To create a world where no one goes without basic necessities, 
                  fostering compassion and community support.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-gray-900">Our Community</h3>
                <p className="text-gray-600">
                  Thousands of caring individuals, families, and organizations 
                  working together to make a difference.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Gift className="h-8 w-8 text-yellow-600" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-gray-900">Our Impact</h3>
                <p className="text-gray-600">
                  Every donation is verified and tracked, ensuring your generosity 
                  reaches those who need it most.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Get in Touch
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Have questions? We're here to help you make a difference.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
              <Phone className="mr-2 h-5 w-5" />
              Call Us
            </Button>
            <Button size="lg" variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
              Email Us
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-gradient-to-r from-blue-600 to-green-500 p-2 rounded-lg">
                  <Heart className="h-6 w-6 text-white" />
                </div>
                <div>
                  <span className="text-xl font-bold">Revive</span>
                  <div className="text-sm text-gray-400">Give & Receive with Care</div>
                </div>
              </div>
              <p className="text-gray-400">
                Connecting hearts, changing lives, one donation at a time.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/" className="hover:text-white">Home</Link></li>
                <li><Link to="#about" className="hover:text-white">About Us</Link></li>
                <li><Link to="/register" className="hover:text-white">Get Started</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#contact" className="hover:text-white">Contact Us</a></li>
                <li><a href="#" className="hover:text-white">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2024 Revive - Give & Receive with Care. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
