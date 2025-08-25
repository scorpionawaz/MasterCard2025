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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Heart, Plus, Upload, Edit, Trash2, Package, Loader2, CheckCircle, Clock, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CreateDonationRequest, CreateDonationResponse, Donation, ItemCategory } from "@shared/api";

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

export default function DonorDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingDonation, setEditingDonation] = useState<Donation | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    itemName: "",
    category: "" as ItemCategory,
    description: "",
    quantity: 1,
    photoUrl: ""
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
      if (parsedUser.role !== "donor") {
        navigate(`/${parsedUser.role}/dashboard`);
        return;
      }
      setUser(parsedUser);
      fetchDonations();
    } catch {
      navigate("/login");
    }
  }, [navigate]);

  const fetchDonations = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/donations/my", {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    if (!formData.itemName || !formData.category || !formData.description) {
      setError("Please fill in all required fields.");
      setIsLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const donationData: CreateDonationRequest = {
        itemName: formData.itemName,
        category: formData.category,
        description: formData.description,
        quantity: formData.quantity,
        photoUrl: formData.photoUrl || undefined
      };

      const response = await fetch("/api/donations/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(donationData),
      });

      const data: CreateDonationResponse = await response.json();

      if (data.success) {
        setSuccess("Donation added successfully! It's pending admin approval.");
        setFormData({
          itemName: "",
          category: "" as ItemCategory,
          description: "",
          quantity: 1,
          photoUrl: ""
        });
        fetchDonations(); // Refresh the list
      } else {
        setError(data.message || "Failed to add donation. Please try again.");
      }
    } catch (err) {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (donationId: string) => {
    if (!confirm("Are you sure you want to delete this donation?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/donations/${donationId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.ok) {
        setSuccess("Donation deleted successfully.");
        fetchDonations();
      } else {
        setError("Failed to delete donation.");
      }
    } catch (error) {
      setError("Error deleting donation.");
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

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>;
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-sm border-b sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2F6fd2ab6a19b640de95da58a05ad12a50%2Fab0fe33fd60348a89b1dfbcda37d96e2?format=webp&width=800"
                alt="Seva Sahayog Foundation"
                className="h-10 w-auto"
              />
              <span className="text-sm text-[#2C5F7F] font-medium ml-2">Donor Dashboard</span>
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
      <div className="max-w-7xl mx-auto p-4 pt-8">
        {(error || success) && (
          <Alert variant={error ? "destructive" : "default"} className="mb-6">
            <AlertDescription>{error || success}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="add-donation" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="add-donation" className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Add Donation</span>
            </TabsTrigger>
            <TabsTrigger value="my-donations" className="flex items-center space-x-2">
              <Package className="h-4 w-4" />
              <span>My Donations</span>
            </TabsTrigger>
          </TabsList>

          {/* Add Donation Tab */}
          <TabsContent value="add-donation">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Plus className="h-5 w-5" />
                  <span>Add New Donation</span>
                </CardTitle>
                <CardDescription>
                  Share your items with those in need. All donations require admin approval before being listed.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="itemName">Item Name *</Label>
                      <Input
                        id="itemName"
                        name="itemName"
                        placeholder="e.g., Winter Jacket, Math Textbook"
                        value={formData.itemName}
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
                      placeholder="Describe the condition, size, and any other relevant details..."
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
                      <Label htmlFor="photoUrl">Photo URL (Optional)</Label>
                      <div className="flex space-x-2">
                        <Input
                          id="photoUrl"
                          name="photoUrl"
                          placeholder="https://example.com/photo.jpg"
                          value={formData.photoUrl}
                          onChange={handleInputChange}
                        />
                        <Button type="button" variant="outline" size="icon">
                          <Upload className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Paste an image URL or click upload to add a photo of your item
                      </p>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding Donation...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Donation
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* My Donations Tab */}
          <TabsContent value="my-donations">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Package className="h-5 w-5" />
                  <span>My Donations</span>
                </CardTitle>
                <CardDescription>
                  Track the status of your donations and manage them before approval.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {donations.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No donations yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Start sharing your items with those in need!
                    </p>
                    <Button onClick={() => setIsLoading(false)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Your First Donation
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item Name</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {donations.map((donation) => (
                          <TableRow key={donation.id}>
                            <TableCell className="font-medium">
                              <div>
                                <div>{donation.itemName}</div>
                                {donation.photoUrl && (
                                  <img 
                                    src={donation.photoUrl} 
                                    alt={donation.itemName}
                                    className="w-10 h-10 object-cover rounded mt-1"
                                  />
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {categories.find(c => c.value === donation.category)?.label || donation.category}
                              </Badge>
                            </TableCell>
                            <TableCell>{donation.quantity}</TableCell>
                            <TableCell>{getStatusBadge(donation.status)}</TableCell>
                            <TableCell>
                              {new Date(donation.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                {donation.status === 'pending' && (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setEditingDonation(donation)}
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleDelete(donation.id)}
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
