import { RequestHandler } from "express";
import { readDonationsFromCSV, readRequestsFromCSV, DonationCSV, RequestCSV } from "../utils/csvUtils";

// Get public donations (GET /api/public/donations) - No authentication required
export const getPublicDonations: RequestHandler = (req: any, res) => {
  try {
    const allDonations = readDonationsFromCSV();
    
    // Only return approved donations
    const publicDonations = allDonations
      .filter(donation => donation.status === 'approved')
      .map(donation => ({
        id: donation.id,
        donorName: donation.donorName,
        itemName: donation.itemName,
        category: donation.category,
        description: donation.description,
        quantity: donation.quantity,
        photoUrl: donation.photoUrl || undefined,
        createdAt: donation.createdAt,
        updatedAt: donation.updatedAt
      }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({
      success: true,
      donations: publicDonations
    });
  } catch (error) {
    console.error("Get public donations error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error.",
      donations: []
    });
  }
};

// Search donations and requests (GET /api/public/search) - No authentication required
export const searchPublicData: RequestHandler = (req: any, res) => {
  try {
    const {
      itemName = '',
      category = 'all',
      minQuantity = '1',
      maxQuantity = '100',
      urgency = 'all',
      type = 'both'
    } = req.query;

    let donations: any[] = [];
    let requests: any[] = [];

    // Read donations if requested
    if (type === 'donations' || type === 'both') {
      const allDonations = readDonationsFromCSV();
      donations = allDonations
        .filter(donation => donation.status === 'approved')
        .filter(donation => {
          // Filter by category
          if (category !== 'all' && donation.category !== category) return false;
          
          // Filter by item name
          if (itemName && !donation.itemName.toLowerCase().includes(itemName.toLowerCase())) return false;
          
          // Filter by quantity range
          const min = parseInt(minQuantity as string) || 1;
          const max = parseInt(maxQuantity as string) || 100;
          if (donation.quantity < min || donation.quantity > max) return false;
          
          return true;
        })
        .map(donation => ({
          id: donation.id,
          donorName: donation.donorName,
          itemName: donation.itemName,
          category: donation.category,
          description: donation.description,
          quantity: donation.quantity,
          photoUrl: donation.photoUrl || undefined,
          createdAt: donation.createdAt,
          updatedAt: donation.updatedAt
        }));
    }

    // Read requests if requested
    if (type === 'requests' || type === 'both') {
      const allRequests = readRequestsFromCSV();
      requests = allRequests
        .filter(request => request.status === 'approved')
        .filter(request => {
          // Filter by category
          if (category !== 'all' && request.category !== category) return false;
          
          // Filter by item name
          if (itemName && !request.itemNeeded.toLowerCase().includes(itemName.toLowerCase())) return false;
          
          // Filter by quantity range
          const min = parseInt(minQuantity as string) || 1;
          const max = parseInt(maxQuantity as string) || 100;
          if (request.quantity < min || request.quantity > max) return false;
          
          // Filter by urgency
          if (urgency !== 'all' && request.urgency !== urgency) return false;
          
          return true;
        })
        .map(request => ({
          id: request.id,
          receiverName: request.receiverName,
          itemNeeded: request.itemNeeded,
          category: request.category,
          description: request.description,
          quantity: request.quantity,
          urgency: request.urgency,
          createdAt: request.createdAt,
          updatedAt: request.updatedAt
        }));
    }

    // Sort by relevance (can be enhanced with more sophisticated scoring)
    const sortByRelevance = (items: any[], searchTerm: string) => {
      return items.sort((a, b) => {
        const aName = 'itemName' in a ? a.itemName : a.itemNeeded;
        const bName = 'itemName' in b ? b.itemName : b.itemNeeded;
        
        // Exact match gets highest score
        const aExact = aName.toLowerCase() === searchTerm.toLowerCase() ? 100 : 0;
        const bExact = bName.toLowerCase() === searchTerm.toLowerCase() ? 100 : 0;
        
        // Partial match gets medium score
        const aPartial = aName.toLowerCase().includes(searchTerm.toLowerCase()) ? 50 : 0;
        const bPartial = bName.toLowerCase().includes(searchTerm.toLowerCase()) ? 50 : 0;
        
        // Urgency bonus for requests
        const aUrgency = ('urgency' in a && a.urgency === 'urgent') ? 30 : 0;
        const bUrgency = ('urgency' in b && b.urgency === 'urgent') ? 30 : 0;
        
        // Recent items bonus
        const aDays = (Date.now() - new Date(a.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        const bDays = (Date.now() - new Date(b.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        const aRecent = Math.max(0, 20 - aDays);
        const bRecent = Math.max(0, 20 - bDays);
        
        const aScore = aExact + aPartial + aUrgency + aRecent;
        const bScore = bExact + bPartial + bUrgency + bRecent;
        
        return bScore - aScore;
      });
    };

    if (itemName) {
      donations = sortByRelevance(donations, itemName as string);
      requests = sortByRelevance(requests, itemName as string);
    } else {
      // Default sort by creation date (newest first)
      donations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      requests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    res.json({
      success: true,
      donations,
      requests
    });
  } catch (error) {
    console.error("Search public data error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error.",
      donations: [],
      requests: []
    });
  }
};
