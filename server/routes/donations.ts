import { RequestHandler } from "express";
import { CreateDonationRequest, CreateDonationResponse, Donation, AdminDonationsResponse, ApprovalResponse, ItemCategory } from "@shared/api";
import { findUserById } from "./auth";
import crypto from "crypto";

// Simple in-memory storage for demo purposes
interface StoredDonation extends Donation {
  donorName?: string;
  donorEmail?: string;
}

const donations: StoredDonation[] = [];

// Helper function to find donation by id
const findDonationById = (id: string): StoredDonation | undefined => {
  return donations.find(donation => donation.id === id);
};

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
    const donationId = crypto.randomUUID();
    const now = new Date().toISOString();

    const newDonation: StoredDonation = {
      id: donationId,
      donorId: userId,
      itemName,
      category,
      description,
      quantity: quantity || 1,
      photoUrl,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
      donorName: donor.name,
      donorEmail: donor.email
    };

    donations.push(newDonation);

    const response: CreateDonationResponse = {
      success: true,
      message: "Donation added successfully! It's pending admin approval.",
      donation: newDonation
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

    const userDonations = donations.filter(donation => donation.donorId === userId);

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

    const donation = findDonationById(id);
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

    // Update donation
    donation.itemName = itemName;
    donation.category = category;
    donation.description = description;
    donation.quantity = quantity || 1;
    donation.photoUrl = photoUrl;
    donation.updatedAt = new Date().toISOString();

    res.json({
      success: true,
      message: "Donation updated successfully.",
      donation
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

    const donationIndex = donations.findIndex(donation => donation.id === id);
    if (donationIndex === -1) {
      return res.status(404).json({ success: false, message: "Donation not found." });
    }

    const donation = donations[donationIndex];

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

    // Remove donation
    donations.splice(donationIndex, 1);

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
    // Add donor info to each donation
    const donationsWithDonorInfo = donations.map(donation => {
      const donor = findUserById(donation.donorId);
      return {
        ...donation,
        donorName: donor?.name || 'Unknown',
        donorEmail: donor?.email || 'Unknown'
      };
    });

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

    const donation = findDonationById(id);
    if (!donation) {
      return res.status(404).json({ success: false, message: "Donation not found." });
    }

    if (donation.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: "Only pending donations can be approved or rejected."
      });
    }

    // Update status
    donation.status = action === 'approve' ? 'approved' : 'rejected';
    donation.updatedAt = new Date().toISOString();

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

// Export donations array for use in matching
export { donations };
