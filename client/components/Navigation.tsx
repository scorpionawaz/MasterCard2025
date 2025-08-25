import { Button } from "@/components/ui/button";
import { Heart, Home, Info, Phone, Menu, User, LogOut } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface User {
  id: string;
  name: string;
  email: string;
  role: 'donor' | 'receiver' | 'admin';
}

export default function Navigation() {
  const [user, setUser] = useState<User | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (error) {
        console.error('Failed to parse user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
  };

  const getDashboardLink = (role: string) => {
    switch (role) {
      case 'donor': return '/donor/dashboard';
      case 'receiver': return '/receiver/dashboard';
      case 'admin': return '/admin/dashboard';
      default: return '/';
    }
  };

  const NavLinks = ({ mobile = false, onLinkClick = () => {} }) => (
    <>
      <Link 
        to="/" 
        className={`text-gray-700 hover:text-blue-600 flex items-center space-x-1 ${mobile ? 'py-2' : ''}`}
        onClick={onLinkClick}
      >
        <Home className="h-4 w-4" />
        <span>Home</span>
      </Link>
      <Link 
        to="/#about" 
        className={`text-gray-700 hover:text-blue-600 flex items-center space-x-1 ${mobile ? 'py-2' : ''}`}
        onClick={onLinkClick}
      >
        <Info className="h-4 w-4" />
        <span>About Us</span>
      </Link>
      <Link 
        to="/search?type=donations" 
        className={`text-gray-700 hover:text-blue-600 ${mobile ? 'py-2' : ''}`}
        onClick={onLinkClick}
      >
        Browse Donations
      </Link>
      <Link 
        to="/search?type=requests" 
        className={`text-gray-700 hover:text-blue-600 ${mobile ? 'py-2' : ''}`}
        onClick={onLinkClick}
      >
        Browse Requests
      </Link>
      <Link 
        to="/#contact" 
        className={`text-gray-700 hover:text-blue-600 flex items-center space-x-1 ${mobile ? 'py-2' : ''}`}
        onClick={onLinkClick}
      >
        <Phone className="h-4 w-4" />
        <span>Contact</span>
      </Link>
    </>
  );

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo + Website Name */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-blue-600 to-green-500 p-2 rounded-lg">
              <Heart className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-gray-900">Revive</span>
              <span className="hidden sm:inline text-sm text-gray-600 ml-2">Give & Receive with Care</span>
            </div>
          </Link>

          {/* Navigation Links - Desktop */}
          <div className="hidden md:flex items-center space-x-8">
            <NavLinks />
          </div>

          {/* Auth/User Section */}
          <div className="flex items-center space-x-3">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">{user.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link to={getDashboardLink(user.role)} className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  {user.role === 'admin' && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin/approval" className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        Approval Center
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" className="text-gray-700">Login</Button>
                </Link>
                <Link to="/register">
                  <Button className="bg-blue-600 hover:bg-blue-700">Register</Button>
                </Link>
              </>
            )}

            {/* Mobile Menu */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle className="flex items-center space-x-2">
                    <Heart className="h-5 w-5 text-blue-600" />
                    <span>Revive</span>
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col space-y-4 mt-6">
                  <NavLinks mobile onLinkClick={() => setIsOpen(false)} />
                  
                  {user ? (
                    <>
                      <hr className="my-4" />
                      <Link 
                        to={getDashboardLink(user.role)} 
                        className="text-gray-700 hover:text-blue-600 py-2"
                        onClick={() => setIsOpen(false)}
                      >
                        Dashboard
                      </Link>
                      <Button 
                        variant="ghost" 
                        onClick={handleLogout} 
                        className="justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                      </Button>
                    </>
                  ) : (
                    <>
                      <hr className="my-4" />
                      <Link to="/login" onClick={() => setIsOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start">Login</Button>
                      </Link>
                      <Link to="/register" onClick={() => setIsOpen(false)}>
                        <Button className="w-full">Register</Button>
                      </Link>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
