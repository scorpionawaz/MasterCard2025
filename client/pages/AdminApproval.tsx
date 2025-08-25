import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, X, Clock, Package, Heart } from "lucide-react";

interface PendingDonation {
  id: string;
  donorName: string;
  itemName: string;
  category: string;
  description: string;
  quantity: number;
  status: string;
  createdAt: string;
}

interface PendingRequest {
  id: string;
  receiverName: string;
  itemNeeded: string;
  category: string;
  description: string;
  quantity: number;
  urgency: string;
  status: string;
  createdAt: string;
}

export default function AdminApproval() {
  const [pendingDonations, setPendingDonations] = useState<PendingDonation[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchPendingItems();
  }, []);

  const fetchPendingItems = async () => {
    try {
      setIsLoading(true);
      
      // Fetch pending donations
      const donationsResponse = await fetch('/api/admin/donations', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (donationsResponse.ok) {
        const donationsData = await donationsResponse.json();
        const pending = donationsData.donations.filter((d: any) => d.status === 'pending');
        setPendingDonations(pending);
      }
      
      // Fetch pending requests
      const requestsResponse = await fetch('/api/admin/requests', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (requestsResponse.ok) {
        const requestsData = await requestsResponse.json();
        const pending = requestsData.requests.filter((r: any) => r.status === 'pending');
        setPendingRequests(pending);
      }
    } catch (error) {
      console.error('Error fetching pending items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproval = async (id: string, action: 'approve' | 'reject', type: 'donation' | 'request') => {
    try {
      const endpoint = type === 'donation' 
        ? `/api/admin/donations/${id}/approve`
        : `/api/admin/requests/${id}/approve`;
        
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ action })
      });

      if (response.ok) {
        // Refresh the list
        fetchPendingItems();
        alert(`${type} ${action}d successfully!`);
      } else {
        alert(`Failed to ${action} ${type}`);
      }
    } catch (error) {
      alert(`Error ${action}ing ${type}`);
    }
  };

  const ApprovalCard = ({ 
    item, 
    type, 
    itemName, 
    userName 
  }: { 
    item: any, 
    type: 'donation' | 'request',
    itemName: string,
    userName: string
  }) => (
    <Card className="mb-4">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{itemName}</h3>
            <p className="text-sm text-gray-600">by {userName}</p>
            <p className="text-gray-700 mt-2">{item.description}</p>
          </div>
          <div className="flex flex-col gap-1 items-end">
            <Badge variant="secondary">{item.quantity} {item.quantity === 1 ? 'item' : 'items'}</Badge>
            <Badge variant="outline">{item.category}</Badge>
            {item.urgency && (
              <Badge variant={item.urgency === 'urgent' ? 'destructive' : 'secondary'}>
                {item.urgency}
              </Badge>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            <Clock className="h-4 w-4 inline mr-1" />
            {new Date(item.createdAt).toLocaleDateString()}
          </div>
          
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline"
              className="text-red-600 hover:bg-red-50"
              onClick={() => handleApproval(item.id, 'reject', type)}
            >
              <X className="h-4 w-4 mr-1" />
              Reject
            </Button>
            <Button 
              size="sm"
              className="bg-green-600 hover:bg-green-700"
              onClick={() => handleApproval(item.id, 'approve', type)}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Approve
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Admin Approval Center
          </h1>
          <p className="text-gray-600">
            Review and approve pending donations and requests
          </p>
        </div>

        <Tabs defaultValue="requests" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="requests" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Pending Requests ({pendingRequests.length})
            </TabsTrigger>
            <TabsTrigger value="donations" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Pending Donations ({pendingDonations.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="requests">
            {isLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : pendingRequests.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No pending requests to review.</p>
                </CardContent>
              </Card>
            ) : (
              <div>
                {pendingRequests.map((request) => (
                  <ApprovalCard
                    key={request.id}
                    item={request}
                    type="request"
                    itemName={request.itemNeeded}
                    userName={request.receiverName}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="donations">
            {isLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : pendingDonations.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No pending donations to review.</p>
                </CardContent>
              </Card>
            ) : (
              <div>
                {pendingDonations.map((donation) => (
                  <ApprovalCard
                    key={donation.id}
                    item={donation}
                    type="donation"
                    itemName={donation.itemName}
                    userName={donation.donorName}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
