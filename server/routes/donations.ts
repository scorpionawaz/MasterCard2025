import { RequestHandler } from "express";
import { CreateDonationRequest, CreateDonationResponse, Donation, AdminDonationsResponse, ApprovalResponse, ItemCategory } from "@shared/api";
import { findUserById } from "./auth";
import { 
  saveDonationToCSV, 
  readDonationsFromCSV, 
  updateDonationInCSV, 
  deleteDonationFromCSV,
  generateId,
  DonationCSV 
} from "../utils/csvUtils";

// Helper function to convert DonationCSV to Donation
const csvToApiDonation = (csvDonation: DonationCSV): Donation => ({
  id: csvDonation.id,
  donorId: csvDonation.donorId,
  itemName: csvDonation.itemName,
  category: csvDonation.category as ItemCategory,
  description: csvDonation.description,
  quantity: csvDonation.quantity,
  photoUrl: csvDonation.photoUrl || undefined,
  status: csvDonation.status as 'pending' | 'approved' | 'matched' | 'rejected',
  createdAt: csvDonation.createdAt,
  updatedAt: csvDonation.updatedAt
});

// Add new donation (POST /api/donations/add) - Donor only
export const addDonation: RequestHandler = (req: any, res) => {
  try {
    const { itemName, category, description, quantity, photoUrl }: CreateDonationRequest = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required." });
    }

    // Validation
    if (!itemName || !category || !description) {
      const response: CreateDonationResponse = {
        success: false,
        message: "Item name, category, and description are required."
      };
      return res.status(400).json(response);
    }

    if (!['clothes', 'books', 'food', 'furniture', 'electronics', 'toys', 'medical', 'other'].includes(category)) {
      const response: CreateDonationResponse = {
        success: false,
        message: "Invalid category specified."
      };
      return res.status(400).json(response);
    }

    if (quantity < 1) {
      const response: CreateDonationResponse = {
        success: false,
        message: "Quantity must be at least 1."
      };
      return res.status(400).json(response);
    }

    // Get donor info
    const donor = findUserById(userId);
    if (!donor) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    // Create new donation
    const donationId = generateId();
    const now = new Date().toISOString();

    const csvDonation: DonationCSV = {
      id: donationId,
      donorId: userId,
      donorName: donor.name,
      donorEmail: donor.email,
      itemName,
      category,
      description,
      quantity: quantity || 1,
      photoUrl: photoUrl || '',
      status: 'pending',
      createdAt: now,
      updatedAt: now
    };

    // Save to CSV
    saveDonationToCSV(csvDonation);

    const apiDonation = csvToApiDonation(csvDonation);

    const response: CreateDonationResponse = {
      success: true,
      message: "Donation added successfully! It's pending admin approval.",
      donation: apiDonation
    };

    res.status(201).json(response);
  } catch (error) {
    console.error("Add donation error:", error);
    const response: CreateDonationResponse = {
      success: false,
      message: "Internal server error."
    };
    res.status(500).json(response);
  }
};

// Get user's donations (GET /api/donations/my) - Donor only
export const getMyDonations: RequestHandler = (req: any, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required." });
    }

    const allDonations = readDonationsFromCSV();
    const userDonations = allDonations
      .filter(donation => donation.donorId === userId)
      .map(csvToApiDonation);

    res.json({
      success: true,
      donations: userDonations
    });
  } catch (error) {
    console.error("Get my donations error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// Update donation (PUT /api/donations/:id) - Donor only, before approval
export const updateDonation: RequestHandler = (req: any, res) => {
  try {
    const { id } = req.params;
    const { itemName, category, description, quantity, photoUrl }: CreateDonationRequest = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required." });
    }

    const allDonations = readDonationsFromCSV();
    const donation = allDonations.find(d => d.id === id);
    
    if (!donation) {
      return res.status(404).json({ success: false, message: "Donation not found." });
    }

    // Check if user owns this donation
    if (donation.donorId !== userId) {
      return res.status(403).json({ success: false, message: "You can only edit your own donations." });
    }

    // Check if donation can be edited (only pending donations)
    if (donation.status !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        message: "You can only edit donations that are still pending approval." 
      });
    }

    // Validation
    if (!itemName || !category || !description) {
      return res.status(400).json({
        success: false,
        message: "Item name, category, and description are required."
      });
    }

    // Update donation in CSV
    const updates: Partial<DonationCSV> = {
      itemName,
      category,
      description,
      quantity: quantity || 1,
      photoUrl: photoUrl || '',
      updatedAt: new Date().toISOString()
    };

    const success = updateDonationInCSV(id, updates);
    if (!success) {
      return res.status(404).json({ success: false, message: "Failed to update donation." });
    }

    // Read updated donation
    const updatedDonations = readDonationsFromCSV();
    const updatedDonation = updatedDonations.find(d => d.id === id);

    res.json({
      success: true,
      message: "Donation updated successfully.",
      donation: updatedDonation ? csvToApiDonation(updatedDonation) : null
    });
  } catch (error) {
    console.error("Update donation error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// Delete donation (DELETE /api/donations/:id) - Donor only, before approval
export const deleteDonation: RequestHandler = (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required." });
    }

    const allDonations = readDonationsFromCSV();
    const donation = allDonations.find(d => d.id === id);
    
    if (!donation) {
      return res.status(404).json({ success: false, message: "Donation not found." });
    }

    // Check if user owns this donation
    if (donation.donorId !== userId) {
      return res.status(403).json({ success: false, message: "You can only delete your own donations." });
    }

    // Check if donation can be deleted (only pending donations)
    if (donation.status !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        message: "You can only delete donations that are still pending approval." 
      });
    }

    // Delete from CSV
    const success = deleteDonationFromCSV(id);
    if (!success) {
      return res.status(404).json({ success: false, message: "Failed to delete donation." });
    }

    res.json({
      success: true,
      message: "Donation deleted successfully."
    });
  } catch (error) {
    console.error("Delete donation error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// Get all donations (GET /api/admin/donations) - Admin only
export const getAllDonations: RequestHandler = (req: any, res) => {
  try {
    const allDonations = readDonationsFromCSV();
    
    const donationsWithDonorInfo = allDonations.map(donation => ({
      ...csvToApiDonation(donation),
      donorName: donation.donorName,
      donorEmail: donation.donorEmail
    }));

    const response: AdminDonationsResponse = {
      success: true,
      donations: donationsWithDonorInfo
    };

    res.json(response);
  } catch (error) {
    console.error("Get all donations error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// Approve/Reject donation (PUT /api/admin/donations/:id/approve) - Admin only
export const approveDonation: RequestHandler = (req: any, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'approve' or 'reject'

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Action must be either 'approve' or 'reject'."
      });
    }

    const allDonations = readDonationsFromCSV();
    const donation = allDonations.find(d => d.id === id);
    
    if (!donation) {
      return res.status(404).json({ success: false, message: "Donation not found." });
    }

    if (donation.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: "Only pending donations can be approved or rejected."
      });
    }

    // Update status in CSV
    const updates: Partial<DonationCSV> = {
      status: action === 'approve' ? 'approved' : 'rejected',
      updatedAt: new Date().toISOString()
    };

    const success = updateDonationInCSV(id, updates);
    if (!success) {
      return res.status(404).json({ success: false, message: "Failed to update donation status." });
    }

    const response: ApprovalResponse = {
      success: true,
      message: `Donation ${action}d successfully.`
    };

    res.json(response);
  } catch (error) {
    console.error("Approve donation error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// Get approved donations for public use
export const getApprovedDonations = (): DonationCSV[] => {
  try {
    const allDonations = readDonationsFromCSV();
    return allDonations.filter(donation => donation.status === 'approved');
  } catch (error) {
    console.error("Error reading approved donations:", error);
    return [];
  }
};
