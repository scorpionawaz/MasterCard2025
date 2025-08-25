import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, Plus, Edit, Trash2, FileText, Loader2, CheckCircle, Clock, X, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CreateRequestRequest, CreateRequestResponse, Request, ItemCategory } from "@shared/api";
import Navigation from "@/components/Navigation";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
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

export default function ReceiverDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [requests, setRequests] = useState<Request[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    itemNeeded: "",
    category: "" as ItemCategory,
    description: "",
    quantity: 1,
    urgency: "normal" as "normal" | "urgent"
  });

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
      if (parsedUser.role !== "receiver") {
        navigate(`/${parsedUser.role}/dashboard`);
        return;
      }
      setUser(parsedUser);
      fetchRequests();
    } catch {
      navigate("/login");
    }
  }, [navigate]);

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/requests/my", {
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' ? parseInt(value) || 1 : value
    }));
    setError("");
  };

  const handleCategoryChange = (value: ItemCategory) => {
    setFormData(prev => ({ ...prev, category: value }));
    setError("");
  };

  const handleUrgencyChange = (value: "normal" | "urgent") => {
    setFormData(prev => ({ ...prev, urgency: value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    if (!formData.itemNeeded || !formData.category || !formData.description) {
      setError("Please fill in all required fields.");
      setIsLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const requestData: CreateRequestRequest = {
        itemNeeded: formData.itemNeeded,
        category: formData.category,
        description: formData.description,
        quantity: formData.quantity,
        urgency: formData.urgency
      };

      const response = await fetch("/api/requests/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(requestData),
      });

      const data: CreateRequestResponse = await response.json();

      if (data.success) {
        setSuccess("Request posted successfully! It's pending admin approval.");
        setFormData({
          itemNeeded: "",
          category: "" as ItemCategory,
          description: "",
          quantity: 1,
          urgency: "normal"
        });
        fetchRequests(); // Refresh the list
      } else {
        setError(data.message || "Failed to post request. Please try again.");
      }
    } catch (err) {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (requestId: string) => {
    if (!confirm("Are you sure you want to delete this request?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/requests/${requestId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.ok) {
        setSuccess("Request deleted successfully.");
        fetchRequests();
      } else {
        setError("Failed to delete request.");
      }
    } catch (error) {
      setError("Error deleting request.");
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
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
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

        <Tabs defaultValue="post-requirement" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="post-requirement" className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Post Requirement</span>
            </TabsTrigger>
            <TabsTrigger value="my-requests" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>My Requests</span>
            </TabsTrigger>
          </TabsList>

          {/* Post Requirement Tab */}
          <TabsContent value="post-requirement">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Plus className="h-5 w-5" />
                  <span>Post New Requirement</span>
                </CardTitle>
                <CardDescription>
                  Let the community know what you need. All requests require admin approval before being listed for donations.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="itemNeeded">Item Needed *</Label>
                      <Input
                        id="itemNeeded"
                        name="itemNeeded"
                        placeholder="e.g., Winter Clothes, Study Books"
                        value={formData.itemNeeded}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Category *</Label>
                      <Select value={formData.category} onValueChange={handleCategoryChange} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.value} value={category.value}>
                              {category.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="Describe your requirements, preferred sizes, quantities, and any specific needs..."
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={4}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantity</Label>
                      <Input
                        id="quantity"
                        name="quantity"
                        type="number"
                        min="1"
                        value={formData.quantity}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="urgency">Urgency Level *</Label>
                      <Select value={formData.urgency} onValueChange={handleUrgencyChange} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select urgency level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">Normal - Can wait for right match</SelectItem>
                          <SelectItem value="urgent">Urgent - Needed as soon as possible</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Posting Request...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Post Request
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* My Requests Tab */}
          <TabsContent value="my-requests">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>My Requests</span>
                </CardTitle>
                <CardDescription>
                  Track the status of your requests and manage them before approval.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {requests.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No requests yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Post your first requirement to get help from the community!
                    </p>
                    <Button onClick={() => setIsLoading(false)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Post Your First Request
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item Needed</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Urgency</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {requests.map((request) => (
                          <TableRow key={request.id}>
                            <TableCell className="font-medium">{request.itemNeeded}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {categories.find(c => c.value === request.category)?.label || request.category}
                              </Badge>
                            </TableCell>
                            <TableCell>{request.quantity}</TableCell>
                            <TableCell>{getUrgencyBadge(request.urgency)}</TableCell>
                            <TableCell>{getStatusBadge(request.status)}</TableCell>
                            <TableCell>
                              {new Date(request.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                {request.status === 'pending' && (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {/* Handle edit - to be implemented */}}
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleDelete(request.id)}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </>
                                )}
                              </div>
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
        </Tabs>
      </div>
    </div>
  );
}
