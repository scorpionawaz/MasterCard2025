import { RequestHandler } from "express";
import { CreateMatchRequest, CreateMatchResponse, Match } from "@shared/api";
import { readDonationsFromCSV, readRequestsFromCSV, updateDonationInCSV, updateRequestInCSV } from "../utils/csvUtils";
import crypto from "crypto";

// Simple in-memory storage for matches (could also be moved to CSV if needed)
const matches: Match[] = [];

// Create match (POST /api/admin/match) - Admin only
export const createMatch: RequestHandler = (req: any, res) => {
  try {
    const { donationId, requestId }: CreateMatchRequest = req.body;

    // Validation
    if (!donationId || !requestId) {
      const response: CreateMatchResponse = {
        success: false,
        message: "Both donation ID and request ID are required."
      };
      return res.status(400).json(response);
    }

    // Read current data from CSV files
    const donations = readDonationsFromCSV();
    const requests = readRequestsFromCSV();

    // Find donation
    const donation = donations.find(d => d.id === donationId);
    if (!donation) {
      const response: CreateMatchResponse = {
        success: false,
        message: "Donation not found."
      };
      return res.status(404).json(response);
    }

    // Find request
    const request = requests.find(r => r.id === requestId);
    if (!request) {
      const response: CreateMatchResponse = {
        success: false,
        message: "Request not found."
      };
      return res.status(404).json(response);
    }

    // Check if donation is approved
    if (donation.status !== 'approved') {
      const response: CreateMatchResponse = {
        success: false,
        message: "Only approved donations can be matched."
      };
      return res.status(400).json(response);
    }

    // Check if request is approved
    if (request.status !== 'approved') {
      const response: CreateMatchResponse = {
        success: false,
        message: "Only approved requests can be matched."
      };
      return res.status(400).json(response);
    }

    // Check if donation is already matched
    if (donation.status === 'matched') {
      const response: CreateMatchResponse = {
        success: false,
        message: "This donation has already been matched."
      };
      return res.status(400).json(response);
    }

    // Check if request is already matched
    if (request.status === 'matched') {
      const response: CreateMatchResponse = {
        success: false,
        message: "This request has already been matched."
      };
      return res.status(400).json(response);
    }

    // Optional: Check if categories match (warning, not error)
    if (donation.category !== request.category) {
      console.warn(`Category mismatch: Donation (${donation.category}) and Request (${request.category})`);
    }

    // Create match
    const matchId = crypto.randomUUID();
    const now = new Date().toISOString();

    const newMatch: Match = {
      id: matchId,
      donationId,
      requestId,
      status: 'active',
      createdAt: now,
      updatedAt: now
    };

    matches.push(newMatch);

    // Update donation and request status to 'matched' in CSV files
    updateDonationInCSV(donationId, { status: 'matched', updatedAt: now });
    updateRequestInCSV(requestId, { status: 'matched', updatedAt: now });

    const response: CreateMatchResponse = {
      success: true,
      message: "Donation and request matched successfully!",
      match: newMatch
    };

    res.status(201).json(response);
  } catch (error) {
    console.error("Create match error:", error);
    const response: CreateMatchResponse = {
      success: false,
      message: "Internal server error."
    };
    res.status(500).json(response);
  }
};

// Get all matches (GET /api/admin/matches) - Admin only
export const getAllMatches: RequestHandler = (req: any, res) => {
  try {
    // Read current data from CSV files
    const donations = readDonationsFromCSV();
    const requests = readRequestsFromCSV();

    // Enhanced matches with donation and request details
    const enhancedMatches = matches.map(match => {
      const donation = donations.find(d => d.id === match.donationId);
      const request = requests.find(r => r.id === match.requestId);
      
      return {
        ...match,
        donation: donation ? {
          itemName: donation.itemName,
          category: donation.category,
          donorName: donation.donorName
        } : null,
        request: request ? {
          itemNeeded: request.itemNeeded,
          category: request.category,
          receiverName: request.receiverName
        } : null
      };
    });

    res.json({
      success: true,
      matches: enhancedMatches
    });
  } catch (error) {
    console.error("Get all matches error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// Complete match (PUT /api/admin/matches/:id/complete) - Admin only
export const completeMatch: RequestHandler = (req: any, res) => {
  try {
    const { id } = req.params;

    const match = matches.find(m => m.id === id);
    if (!match) {
      return res.status(404).json({ success: false, message: "Match not found." });
    }

    if (match.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: "Only active matches can be completed."
      });
    }

    // Update match status
    match.status = 'completed';
    match.updatedAt = new Date().toISOString();

    res.json({
      success: true,
      message: "Match completed successfully.",
      match
    });
  } catch (error) {
    console.error("Complete match error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// Cancel match (PUT /api/admin/matches/:id/cancel) - Admin only
export const cancelMatch: RequestHandler = (req: any, res) => {
  try {
    const { id } = req.params;

    const match = matches.find(m => m.id === id);
    if (!match) {
      return res.status(404).json({ success: false, message: "Match not found." });
    }

    if (match.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: "Only active matches can be cancelled."
      });
    }

    const now = new Date().toISOString();

    // Reset donation and request status to 'approved' in CSV files
    updateDonationInCSV(match.donationId, { status: 'approved', updatedAt: now });
    updateRequestInCSV(match.requestId, { status: 'approved', updatedAt: now });

    // Update match status
    match.status = 'cancelled';
    match.updatedAt = now;

    res.json({
      success: true,
      message: "Match cancelled successfully. Donation and request are now available for new matches.",
      match
    });
  } catch (error) {
    console.error("Cancel match error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// Export matches for potential future use
export { matches };
