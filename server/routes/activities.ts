import { RequestHandler } from "express";
import { donations } from "./donations";
import { requests } from "./requests";
import { findUserById } from "./auth";

interface PublicActivity {
  id: string;
  type: 'donation' | 'request';
  userName: string;
  itemName: string;
  quantity: string;
  location: string;
  timestamp: string;
}

// Get public activities (GET /api/public/activities) - No authentication required
export const getPublicActivities: RequestHandler = (req: any, res) => {
  try {
    const activities: PublicActivity[] = [];

    // Add recent donations (only approved ones)
    const recentDonations = donations
      .filter(donation => donation.status === 'approved' || donation.status === 'matched')
      .slice(-20) // Last 20 donations
      .map(donation => {
        const donor = findUserById(donation.donorId);
        return {
          id: `donation-${donation.id}`,
          type: 'donation' as const,
          userName: donor?.name || 'Anonymous Donor',
          itemName: donation.itemName,
          quantity: `${donation.quantity}`,
          location: getRandomLocation(), // In real app, this would come from user profile
          timestamp: donation.createdAt
        };
      });

    // Add recent requests (only approved ones)
    const recentRequests = requests
      .filter(request => request.status === 'approved' || request.status === 'matched')
      .slice(-20) // Last 20 requests
      .map(request => {
        const receiver = findUserById(request.receiverId);
        return {
          id: `request-${request.id}`,
          type: 'request' as const,
          userName: receiver?.name || 'Community Member',
          itemName: request.itemNeeded,
          quantity: `${request.quantity}`,
          location: getRandomLocation(), // In real app, this would come from user profile
          timestamp: request.createdAt
        };
      });

    // Combine and sort by timestamp (most recent first)
    activities.push(...recentDonations, ...recentRequests);
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Return only the most recent 15 activities
    const recentActivities = activities.slice(0, 15);

    res.json({
      success: true,
      activities: recentActivities
    });
  } catch (error) {
    console.error("Get public activities error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// Helper function to generate random locations for demo
function getRandomLocation(): string {
  const locations = [
    'Mumbai Shelter',
    'Delhi NGO',
    'Pune Community Center',
    'Bangalore Orphanage',
    'Chennai School',
    'Hyderabad Hospital',
    'Kolkata Relief Center',
    'Ahmedabad Foundation',
    'Jaipur Welfare Society',
    'Lucknow Support Group',
    'Surat Care Home',
    'Indore Children\'s Home',
    'Bhopal Aid Center',
    'Vadodara Charity',
    'Patna Relief Fund'
  ];
  
  return locations[Math.floor(Math.random() * locations.length)];
}

// Generate some sample activities for demo purposes
export const generateSampleActivities = () => {
  const sampleActivities: PublicActivity[] = [
    {
      id: 'sample-1',
      type: 'donation',
      userName: 'Amit Sharma',
      itemName: 'Rice',
      quantity: '5kg',
      location: 'Pune Shelter',
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString() // 5 minutes ago
    },
    {
      id: 'sample-2',
      type: 'request',
      userName: 'Sneha Patel',
      itemName: 'Winter Clothes',
      quantity: '10 sets',
      location: 'Mumbai Children\'s Home',
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString() // 15 minutes ago
    },
    {
      id: 'sample-3',
      type: 'donation',
      userName: 'Rajesh Kumar',
      itemName: 'Books',
      quantity: '25 notebooks',
      location: 'Delhi School',
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString() // 30 minutes ago
    },
    {
      id: 'sample-4',
      type: 'donation',
      userName: 'Priya Agarwal',
      itemName: 'Medical Supplies',
      quantity: '1 box',
      location: 'Bangalore Hospital',
      timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString() // 45 minutes ago
    },
    {
      id: 'sample-5',
      type: 'request',
      userName: 'Ramesh Gupta',
      itemName: 'Furniture',
      quantity: '2 chairs',
      location: 'Chennai NGO',
      timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString() // 1 hour ago
    },
    {
      id: 'sample-6',
      type: 'donation',
      userName: 'Lakshmi Nair',
      itemName: 'Food Items',
      quantity: '3kg dal',
      location: 'Kochi Relief Center',
      timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString() // 1.5 hours ago
    },
    {
      id: 'sample-7',
      type: 'request',
      userName: 'Suresh Reddy',
      itemName: 'Electronics',
      quantity: '1 laptop',
      location: 'Hyderabad School',
      timestamp: new Date(Date.now() - 120 * 60 * 1000).toISOString() // 2 hours ago
    },
    {
      id: 'sample-8',
      type: 'donation',
      userName: 'Anita Joshi',
      itemName: 'Clothes',
      quantity: '15 shirts',
      location: 'Jaipur Orphanage',
      timestamp: new Date(Date.now() - 180 * 60 * 1000).toISOString() // 3 hours ago
    }
  ];

  return sampleActivities;
};

// Get public activities with sample data for demo
export const getPublicActivitiesWithSample: RequestHandler = (req: any, res) => {
  try {
    const realActivities: PublicActivity[] = [];

    // Add recent donations (only approved ones)
    const recentDonations = donations
      .filter(donation => donation.status === 'approved' || donation.status === 'matched')
      .slice(-10)
      .map(donation => {
        const donor = findUserById(donation.donorId);
        return {
          id: `donation-${donation.id}`,
          type: 'donation' as const,
          userName: donor?.name || 'Anonymous Donor',
          itemName: donation.itemName,
          quantity: `${donation.quantity}`,
          location: getRandomLocation(),
          timestamp: donation.createdAt
        };
      });

    // Add recent requests (only approved ones)
    const recentRequests = requests
      .filter(request => request.status === 'approved' || request.status === 'matched')
      .slice(-10)
      .map(request => {
        const receiver = findUserById(request.receiverId);
        return {
          id: `request-${request.id}`,
          type: 'request' as const,
          userName: receiver?.name || 'Community Member',
          itemName: request.itemNeeded,
          quantity: `${request.quantity}`,
          location: getRandomLocation(),
          timestamp: request.createdAt
        };
      });

    // Combine real activities with sample data
    realActivities.push(...recentDonations, ...recentRequests);

    // If we don't have enough real activities, add sample ones
    const sampleActivities = generateSampleActivities();
    const allActivities = [...realActivities, ...sampleActivities];

    // Sort by timestamp (most recent first) and limit to 15
    allActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const finalActivities = allActivities.slice(0, 15);

    res.json({
      success: true,
      activities: finalActivities
    });
  } catch (error) {
    console.error("Get public activities with sample error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};
