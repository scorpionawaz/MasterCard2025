import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Heart, Shield, Package, FileText, Link, Check, X, Loader2, AlertTriangle, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Donation, Request, CreateMatchRequest, CreateMatchResponse, ItemCategory } from "@shared/api";
import Navigation from "@/components/Navigation";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface DonationWithDonor extends Donation {
  donorName: string;
  donorEmail: string;
}

interface RequestWithReceiver extends Request {
  receiverName: string;
  receiverEmail: string;
}

const categories: { value: ItemCategory; label: string }[] = [
  { value: 'clothes', label: 'Clothes' },
  { value: 'books', label: 'Books' },
  { value: 'food', label: 'Food' },
  { value: 'furniture', label: 'Furniture' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'toys', label: 'Toys' },
  { value: 'medical', label: 'Medical Supplies' },
  { value: 'other', label: 'Other' }
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [donations, setDonations] = useState<DonationWithDonor[]>([]);
  const [requests, setRequests] = useState<RequestWithReceiver[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedDonation, setSelectedDonation] = useState<DonationWithDonor | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<RequestWithReceiver | null>(null);
  const [isMatchDialogOpen, setIsMatchDialogOpen] = useState(false);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    
    if (!token || !userData) {
      navigate("/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.role !== "admin") {
        navigate(`/${parsedUser.role}/dashboard`);
        return;
      }
      setUser(parsedUser);
      fetchData();
    } catch {
      navigate("/login");
    }
  }, [navigate]);

  const fetchData = async () => {
    await Promise.all([fetchDonations(), fetchRequests()]);
  };

  const fetchDonations = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/admin/donations", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDonations(data.donations || []);
      }
    } catch (error) {
      console.error("Error fetching donations:", error);
    }
  };

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/admin/requests", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests || []);
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
    }
  };

  const handleApproveDonation = async (donationId: string, action: 'approve' | 'reject') => {
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/admin/donations/${donationId}/approve`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`Donation ${action}d successfully!`);
        fetchDonations(); // Refresh the list
      } else {
        setError(data.message || `Failed to ${action} donation.`);
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveRequest = async (requestId: string, action: 'approve' | 'reject') => {
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/admin/requests/${requestId}/approve`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`Request ${action}d successfully!`);
        fetchRequests(); // Refresh the list
      } else {
        setError(data.message || `Failed to ${action} request.`);
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMatch = async () => {
    if (!selectedDonation || !selectedRequest) {
      setError("Please select both a donation and a request to match.");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token");
      const matchData: CreateMatchRequest = {
        donationId: selectedDonation.id,
        requestId: selectedRequest.id
      };

      const response = await fetch("/api/admin/match", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(matchData),
      });

      const data: CreateMatchResponse = await response.json();

      if (data.success) {
        setSuccess("Donation and request matched successfully!");
        setSelectedDonation(null);
        setSelectedRequest(null);
        setIsMatchDialogOpen(false);
        fetchData(); // Refresh both lists
      } else {
        setError(data.message || "Failed to create match.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Loader2 className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="default"><Check className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'matched':
        return <Badge variant="default" className="bg-green-600"><Heart className="h-3 w-3 mr-1" />Matched</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><X className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'urgent':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Urgent</Badge>;
      case 'normal':
        return <Badge variant="outline">Normal</Badge>;
      default:
        return <Badge variant="outline">{urgency}</Badge>;
    }
  };

  const getApprovedDonations = () => donations.filter(d => d.status === 'approved');
  const getApprovedRequests = () => requests.filter(r => r.status === 'approved');

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>;
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Navigation />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4 pt-8">
        {(error || success) && (
          <Alert variant={error ? "destructive" : "default"} className="mb-6">
            <AlertDescription>{error || success}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <Package className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold">{donations.length}</div>
              <div className="text-sm text-muted-foreground">Total Donations</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <FileText className="h-8 w-8 text-accent mx-auto mb-2" />
              <div className="text-2xl font-bold">{requests.length}</div>
              <div className="text-sm text-muted-foreground">Total Requests</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Check className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">{getApprovedDonations().length}</div>
              <div className="text-sm text-muted-foreground">Approved Donations</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Heart className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">
                {donations.filter(d => d.status === 'matched').length}
              </div>
              <div className="text-sm text-muted-foreground">Successful Matches</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="donations" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="donations" className="flex items-center space-x-2">
              <Package className="h-4 w-4" />
              <span>Donations</span>
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Requests</span>
            </TabsTrigger>
            <TabsTrigger value="matching" className="flex items-center space-x-2">
              <Link className="h-4 w-4" />
              <span>Match Items</span>
            </TabsTrigger>
          </TabsList>

          {/* Donations Tab */}
          <TabsContent value="donations">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Package className="h-5 w-5" />
                  <span>Manage Donations</span>
                </CardTitle>
                <CardDescription>
                  Review and approve donations from donors.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {donations.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No donations yet</h3>
                    <p className="text-muted-foreground">
                      Donations will appear here as donors add items.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item Name</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Donor</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="w-[150px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {donations.map((donation) => (
                          <TableRow key={donation.id}>
                            <TableCell className="font-medium">
                              <div>
                                <div>{donation.itemName}</div>
                                <div className="text-xs text-muted-foreground">
                                  {donation.description.substring(0, 50)}...
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {categories.find(c => c.value === donation.category)?.label || donation.category}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div className="font-medium">{donation.donorName}</div>
                                <div className="text-muted-foreground">{donation.donorEmail}</div>
                              </div>
                            </TableCell>
                            <TableCell>{donation.quantity}</TableCell>
                            <TableCell>{getStatusBadge(donation.status)}</TableCell>
                            <TableCell>
                              {new Date(donation.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              {donation.status === 'pending' && (
                                <div className="flex space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleApproveDonation(donation.id, 'approve')}
                                    disabled={isLoading}
                                  >
                                    <Check className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleApproveDonation(donation.id, 'reject')}
                                    disabled={isLoading}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Requests Tab */}
          <TabsContent value="requests">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Manage Requests</span>
                </CardTitle>
                <CardDescription>
                  Review and approve requests from receivers.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {requests.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No requests yet</h3>
                    <p className="text-muted-foreground">
                      Requests will appear here as receivers post their needs.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item Needed</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Receiver</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Urgency</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="w-[150px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {requests.map((request) => (
                          <TableRow key={request.id}>
                            <TableCell className="font-medium">
                              <div>
                                <div>{request.itemNeeded}</div>
                                <div className="text-xs text-muted-foreground">
                                  {request.description.substring(0, 50)}...
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {categories.find(c => c.value === request.category)?.label || request.category}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div className="font-medium">{request.receiverName}</div>
                                <div className="text-muted-foreground">{request.receiverEmail}</div>
                              </div>
                            </TableCell>
                            <TableCell>{request.quantity}</TableCell>
                            <TableCell>{getUrgencyBadge(request.urgency)}</TableCell>
                            <TableCell>{getStatusBadge(request.status)}</TableCell>
                            <TableCell>
                              {new Date(request.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              {request.status === 'pending' && (
                                <div className="flex space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleApproveRequest(request.id, 'approve')}
                                    disabled={isLoading}
                                  >
                                    <Check className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleApproveRequest(request.id, 'reject')}
                                    disabled={isLoading}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Matching Tab */}
          <TabsContent value="matching">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Approved Donations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Package className="h-5 w-5" />
                    <span>Approved Donations</span>
                  </CardTitle>
                  <CardDescription>
                    Select a donation to match with a request.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {getApprovedDonations().map((donation) => (
                      <div
                        key={donation.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedDonation?.id === donation.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => setSelectedDonation(donation)}
                      >
                        <div className="font-medium">{donation.itemName}</div>
                        <div className="text-sm text-muted-foreground">
                          {donation.donorName} • Qty: {donation.quantity}
                        </div>
                        <Badge variant="outline" className="mt-1">
                          {categories.find(c => c.value === donation.category)?.label}
                        </Badge>
                      </div>
                    ))}
                    {getApprovedDonations().length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        No approved donations available for matching.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Approved Requests */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>Approved Requests</span>
                  </CardTitle>
                  <CardDescription>
                    Select a request to match with a donation.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {getApprovedRequests().map((request) => (
                      <div
                        key={request.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedRequest?.id === request.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => setSelectedRequest(request)}
                      >
                        <div className="font-medium">{request.itemNeeded}</div>
                        <div className="text-sm text-muted-foreground">
                          {request.receiverName} • Qty: {request.quantity}
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline">
                            {categories.find(c => c.value === request.category)?.label}
                          </Badge>
                          {getUrgencyBadge(request.urgency)}
                        </div>
                      </div>
                    ))}
                    {getApprovedRequests().length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        No approved requests available for matching.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Match Button */}
            <div className="mt-6 text-center">
              <Button
                size="lg"
                onClick={handleMatch}
                disabled={!selectedDonation || !selectedRequest || isLoading}
                className="px-8"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Match...
                  </>
                ) : (
                  <>
                    <Link className="mr-2 h-4 w-4" />
                    Create Match
                  </>
                )}
              </Button>
              {selectedDonation && selectedRequest && (
                <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">Match Preview:</h4>
                  <div className="text-sm">
                    <div><strong>Donation:</strong> {selectedDonation.itemName} from {selectedDonation.donorName}</div>
                    <div><strong>Request:</strong> {selectedRequest.itemNeeded} for {selectedRequest.receiverName}</div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
