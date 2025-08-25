import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Heart, Gift, Search as SearchIcon, MapPin, Clock, User, Filter, SortAsc } from "lucide-react";
import { Donation, Request, ItemCategory } from "@shared/api";

interface SearchFilters {
  category: ItemCategory | 'all';
  itemName: string;
  quantity: number[];
  urgency: 'all' | 'normal' | 'urgent';
  sortBy: 'relevance' | 'newest' | 'quantity' | 'urgency';
}

interface DonationWithUser extends Donation {
  donorName: string;
}

interface RequestWithUser extends Request {
  receiverName: string;
}

const categories: { value: ItemCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All Categories' },
  { value: 'food', label: 'Food' },
  { value: 'clothes', label: 'Clothes' },
  { value: 'books', label: 'Books & Stationery' },
  { value: 'furniture', label: 'Furniture' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'medical', label: 'Medical' },
  { value: 'toys', label: 'Toys' },
  { value: 'other', label: 'Other' },
];

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [donations, setDonations] = useState<DonationWithUser[]>([]);
  const [requests, setRequests] = useState<RequestWithUser[]>([]);
  const [filteredDonations, setFilteredDonations] = useState<DonationWithUser[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<RequestWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<SearchFilters>({
    category: 'all',
    itemName: '',
    quantity: [1, 100],
    urgency: 'all',
    sortBy: 'relevance',
  });

  const searchType = searchParams.get('type') || 'both'; // 'donations', 'requests', or 'both'

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, donations, requests]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch public requests
      const requestsResponse = await fetch('/api/public/requests');
      if (requestsResponse.ok) {
        const requestsData = await requestsResponse.json();
        setRequests(requestsData.requests || []);
      }

      // For donations, we'll need to add a public endpoint or use the admin endpoint with auth
      // For now, let's create mock data
      const mockDonations: DonationWithUser[] = [
        {
          id: '1',
          donorId: 'donor1',
          donorName: 'John Doe',
          itemName: 'Winter Clothes',
          category: 'clothes',
          description: 'Warm winter jackets, sweaters, and pants for children',
          quantity: 20,
          status: 'approved',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          donorId: 'donor2',
          donorName: 'Jane Smith',
          itemName: 'Rice and Lentils',
          category: 'food',
          description: '50kg of rice and 20kg of lentils for families in need',
          quantity: 70,
          status: 'approved',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: '3',
          donorId: 'donor3',
          donorName: 'Medical Center',
          itemName: 'Medical Supplies',
          category: 'medical',
          description: 'First aid kits, bandages, and basic medicines',
          quantity: 15,
          status: 'approved',
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          updatedAt: new Date(Date.now() - 172800000).toISOString(),
        },
      ];
      
      setDonations(mockDonations);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    // Filter donations
    let filteredDons = donations.filter(donation => {
      if (filters.category !== 'all' && donation.category !== filters.category) return false;
      if (filters.itemName && !donation.itemName.toLowerCase().includes(filters.itemName.toLowerCase())) return false;
      if (donation.quantity < filters.quantity[0] || donation.quantity > filters.quantity[1]) return false;
      return true;
    });

    // Filter requests
    let filteredReqs = requests.filter(request => {
      if (filters.category !== 'all' && request.category !== filters.category) return false;
      if (filters.itemName && !request.itemNeeded.toLowerCase().includes(filters.itemName.toLowerCase())) return false;
      if (request.quantity < filters.quantity[0] || request.quantity > filters.quantity[1]) return false;
      if (filters.urgency !== 'all' && request.urgency !== filters.urgency) return false;
      return true;
    });

    // Sort results
    const sortFunction = (a: any, b: any) => {
      switch (filters.sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'quantity':
          return b.quantity - a.quantity;
        case 'urgency':
          if ('urgency' in a && 'urgency' in b) {
            if (a.urgency === 'urgent' && b.urgency !== 'urgent') return -1;
            if (a.urgency !== 'urgent' && b.urgency === 'urgent') return 1;
          }
          return 0;
        case 'relevance':
        default:
          // Simple relevance: exact matches first, then partial matches
          const aRelevance = getRelevanceScore(a);
          const bRelevance = getRelevanceScore(b);
          return bRelevance - aRelevance;
      }
    };

    filteredDons.sort(sortFunction);
    filteredReqs.sort(sortFunction);

    setFilteredDonations(filteredDons);
    setFilteredRequests(filteredReqs);
  };

  const getRelevanceScore = (item: DonationWithUser | RequestWithUser) => {
    let score = 0;
    const itemName = 'itemName' in item ? item.itemName : item.itemNeeded;
    
    // Exact match bonus
    if (filters.itemName && itemName.toLowerCase() === filters.itemName.toLowerCase()) {
      score += 100;
    }
    
    // Partial match bonus
    if (filters.itemName && itemName.toLowerCase().includes(filters.itemName.toLowerCase())) {
      score += 50;
    }
    
    // Urgency bonus for requests
    if ('urgency' in item && item.urgency === 'urgent') {
      score += 30;
    }
    
    // Recent items bonus
    const daysSinceCreated = (Date.now() - new Date(item.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    score += Math.max(0, 20 - daysSinceCreated);
    
    return score;
  };

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      category: 'all',
      itemName: '',
      quantity: [1, 100],
      urgency: 'all',
      sortBy: 'relevance',
    });
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const itemTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - itemTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const shouldShowDonations = searchType === 'donations' || searchType === 'both';
  const shouldShowRequests = searchType === 'requests' || searchType === 'both';

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {searchType === 'donations' ? 'Browse Donations' : 
             searchType === 'requests' ? 'Browse Requests' : 
             'Search Donations & Requests'}
          </h1>
          <p className="text-gray-600">
            Find and connect with items available for donation or requests for help
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-80">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Search by item name */}
                <div>
                  <Label htmlFor="itemName">Search Item</Label>
                  <div className="relative">
                    <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="itemName"
                      placeholder="e.g., rice, clothes, books..."
                      value={filters.itemName}
                      onChange={(e) => updateFilter('itemName', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Category filter */}
                <div>
                  <Label>Category</Label>
                  <Select value={filters.category} onValueChange={(value) => updateFilter('category', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Quantity range */}
                <div>
                  <Label>Quantity Range: {filters.quantity[0]} - {filters.quantity[1]}</Label>
                  <Slider
                    value={filters.quantity}
                    onValueChange={(value) => updateFilter('quantity', value)}
                    max={100}
                    min={1}
                    step={1}
                    className="mt-2"
                  />
                </div>

                {/* Urgency filter (for requests) */}
                {shouldShowRequests && (
                  <div>
                    <Label>Urgency Level</Label>
                    <Select value={filters.urgency} onValueChange={(value) => updateFilter('urgency', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Levels</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Sort by */}
                <div>
                  <Label>Sort By</Label>
                  <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relevance">Most Relevant</SelectItem>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="quantity">Highest Quantity</SelectItem>
                      <SelectItem value="urgency">Most Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button variant="outline" onClick={clearFilters} className="w-full">
                  Clear All Filters
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          <div className="flex-1">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading results...</p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Donations Section */}
                {shouldShowDonations && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Gift className="h-5 w-5 text-green-600" />
                      <h2 className="text-xl font-semibold text-gray-900">
                        Available Donations ({filteredDonations.length})
                      </h2>
                    </div>
                    
                    {filteredDonations.length === 0 ? (
                      <Card>
                        <CardContent className="text-center py-8">
                          <Gift className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600">No donations match your current filters.</p>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="grid gap-4">
                        {filteredDonations.map((donation) => (
                          <Card key={donation.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                              <div className="flex justify-between items-start mb-4">
                                <div>
                                  <h3 className="text-lg font-semibold text-gray-900">{donation.itemName}</h3>
                                  <p className="text-gray-600">{donation.description}</p>
                                </div>
                                <Badge variant="secondary" className="bg-green-100 text-green-800">
                                  {donation.quantity} available
                                </Badge>
                              </div>
                              
                              <div className="flex items-center justify-between text-sm text-gray-500">
                                <div className="flex items-center gap-4">
                                  <span className="flex items-center gap-1">
                                    <User className="h-4 w-4" />
                                    {donation.donorName}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    {getTimeAgo(donation.createdAt)}
                                  </span>
                                  <Badge variant="outline">{donation.category}</Badge>
                                </div>
                                <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                  Contact Donor
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Requests Section */}
                {shouldShowRequests && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Heart className="h-5 w-5 text-blue-600" />
                      <h2 className="text-xl font-semibold text-gray-900">
                        Help Requests ({filteredRequests.length})
                      </h2>
                    </div>
                    
                    {filteredRequests.length === 0 ? (
                      <Card>
                        <CardContent className="text-center py-8">
                          <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600">No requests match your current filters.</p>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="grid gap-4">
                        {filteredRequests.map((request) => (
                          <Card key={request.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                              <div className="flex justify-between items-start mb-4">
                                <div>
                                  <h3 className="text-lg font-semibold text-gray-900">{request.itemNeeded}</h3>
                                  <p className="text-gray-600">{request.description}</p>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                    {request.quantity} needed
                                  </Badge>
                                  {request.urgency === 'urgent' && (
                                    <Badge variant="destructive">Urgent</Badge>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-between text-sm text-gray-500">
                                <div className="flex items-center gap-4">
                                  <span className="flex items-center gap-1">
                                    <User className="h-4 w-4" />
                                    {request.receiverName}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    {getTimeAgo(request.createdAt)}
                                  </span>
                                  <Badge variant="outline">{request.category}</Badge>
                                </div>
                                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                                  Help Now
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
