import { RequestHandler } from "express";
import { readDonationsFromCSV, readRequestsFromCSV } from "../utils/csvUtils";

interface DonationActivity {
  id: string;
  type: 'donation' | 'request';
  userName: string;
  itemName: string;
  quantity: string;
  location: string;
  timestamp: string;
}

// Get public activities with sample data (GET /api/public/activities) - No authentication required
export const getPublicActivitiesWithSample: RequestHandler = (req: any, res) => {
  try {
    const activities: DonationActivity[] = [];
    
    // Read donations from CSV
    const donations = readDonationsFromCSV();
    const approvedDonations = donations.filter(d => d.status === 'approved');
    
    // Read requests from CSV
    const requests = readRequestsFromCSV();
    const approvedRequests = requests.filter(r => r.status === 'approved');
    
    // Convert donations to activities
    approvedDonations.forEach(donation => {
      activities.push({
        id: donation.id,
        type: 'donation',
        userName: donation.donorName,
        itemName: donation.itemName,
        quantity: donation.quantity.toString(),
        location: 'Local Community', // Could be enhanced with actual location data
        timestamp: donation.createdAt
      });
    });
    
    // Convert requests to activities
    approvedRequests.forEach(request => {
      activities.push({
        id: request.id,
        type: 'request',
        userName: request.receiverName,
        itemName: request.itemNeeded,
        quantity: request.quantity.toString(),
        location: 'Local Community', // Could be enhanced with actual location data
        timestamp: request.createdAt
      });
    });
    
    // Sort by timestamp (newest first) and limit to recent activities
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const recentActivities = activities.slice(0, 20); // Show last 20 activities
    
    res.json({
      success: true,
      activities: recentActivities
    });
  } catch (error) {
    console.error("Get public activities error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error.",
      activities: []
    });
  }
};
