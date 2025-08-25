import { RequestHandler } from "express";
import { CreateRequestRequest, CreateRequestResponse, Request, AdminRequestsResponse, ApprovalResponse, ItemCategory } from "@shared/api";
import { findUserById } from "./auth";
import crypto from "crypto";

// Simple in-memory storage for demo purposes
interface StoredRequest extends Request {
  receiverName?: string;
  receiverEmail?: string;
}

const requests: StoredRequest[] = [];

// Helper function to find request by id
const findRequestById = (id: string): StoredRequest | undefined => {
  return requests.find(request => request.id === id);
};

// Add new request (POST /api/requests/add) - Receiver only
export const addRequest: RequestHandler = (req: any, res) => {
  try {
    const { itemNeeded, category, description, quantity, urgency }: CreateRequestRequest = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required." });
    }

    // Validation
    if (!itemNeeded || !category || !description) {
      const response: CreateRequestResponse = {
        success: false,
        message: "Item needed, category, and description are required."
      };
      return res.status(400).json(response);
    }

    if (!['clothes', 'books', 'food', 'furniture', 'electronics', 'toys', 'medical', 'other'].includes(category)) {
      const response: CreateRequestResponse = {
        success: false,
        message: "Invalid category specified."
      };
      return res.status(400).json(response);
    }

    if (!['normal', 'urgent'].includes(urgency)) {
      const response: CreateRequestResponse = {
        success: false,
        message: "Urgency must be either 'normal' or 'urgent'."
      };
      return res.status(400).json(response);
    }

    if (quantity < 1) {
      const response: CreateRequestResponse = {
        success: false,
        message: "Quantity must be at least 1."
      };
      return res.status(400).json(response);
    }

    // Get receiver info
    const receiver = findUserById(userId);
    if (!receiver) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    // Create new request
    const requestId = crypto.randomUUID();
    const now = new Date().toISOString();

    const newRequest: StoredRequest = {
      id: requestId,
      receiverId: userId,
      itemNeeded,
      category,
      description,
      quantity: quantity || 1,
      urgency,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
      receiverName: receiver.name,
      receiverEmail: receiver.email
    };

    requests.push(newRequest);

    const response: CreateRequestResponse = {
      success: true,
      message: "Request posted successfully! It's pending admin approval.",
      request: newRequest
    };

    res.status(201).json(response);
  } catch (error) {
    console.error("Add request error:", error);
    const response: CreateRequestResponse = {
      success: false,
      message: "Internal server error."
    };
    res.status(500).json(response);
  }
};

// Get user's requests (GET /api/requests/my) - Receiver only
export const getMyRequests: RequestHandler = (req: any, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required." });
    }

    const userRequests = requests.filter(request => request.receiverId === userId);

    res.json({
      success: true,
      requests: userRequests
    });
  } catch (error) {
    console.error("Get my requests error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// Update request (PUT /api/requests/:id) - Receiver only, before approval
export const updateRequest: RequestHandler = (req: any, res) => {
  try {
    const { id } = req.params;
    const { itemNeeded, category, description, quantity, urgency }: CreateRequestRequest = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required." });
    }

    const request = findRequestById(id);
    if (!request) {
      return res.status(404).json({ success: false, message: "Request not found." });
    }

    // Check if user owns this request
    if (request.receiverId !== userId) {
      return res.status(403).json({ success: false, message: "You can only edit your own requests." });
    }

    // Check if request can be edited (only pending requests)
    if (request.status !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        message: "You can only edit requests that are still pending approval." 
      });
    }

    // Validation
    if (!itemNeeded || !category || !description) {
      return res.status(400).json({
        success: false,
        message: "Item needed, category, and description are required."
      });
    }

    if (!['normal', 'urgent'].includes(urgency)) {
      return res.status(400).json({
        success: false,
        message: "Urgency must be either 'normal' or 'urgent'."
      });
    }

    // Update request
    request.itemNeeded = itemNeeded;
    request.category = category;
    request.description = description;
    request.quantity = quantity || 1;
    request.urgency = urgency;
    request.updatedAt = new Date().toISOString();

    res.json({
      success: true,
      message: "Request updated successfully.",
      request
    });
  } catch (error) {
    console.error("Update request error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// Delete request (DELETE /api/requests/:id) - Receiver only, before approval
export const deleteRequest: RequestHandler = (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required." });
    }

    const requestIndex = requests.findIndex(request => request.id === id);
    if (requestIndex === -1) {
      return res.status(404).json({ success: false, message: "Request not found." });
    }

    const request = requests[requestIndex];

    // Check if user owns this request
    if (request.receiverId !== userId) {
      return res.status(403).json({ success: false, message: "You can only delete your own requests." });
    }

    // Check if request can be deleted (only pending requests)
    if (request.status !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        message: "You can only delete requests that are still pending approval." 
      });
    }

    // Remove request
    requests.splice(requestIndex, 1);

    res.json({
      success: true,
      message: "Request deleted successfully."
    });
  } catch (error) {
    console.error("Delete request error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// Get all requests (GET /api/admin/requests) - Admin only
export const getAllRequests: RequestHandler = (req: any, res) => {
  try {
    // Add receiver info to each request
    const requestsWithReceiverInfo = requests.map(request => {
      const receiver = findUserById(request.receiverId);
      return {
        ...request,
        receiverName: receiver?.name || 'Unknown',
        receiverEmail: receiver?.email || 'Unknown'
      };
    });

    const response: AdminRequestsResponse = {
      success: true,
      requests: requestsWithReceiverInfo
    };

    res.json(response);
  } catch (error) {
    console.error("Get all requests error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// Approve/Reject request (PUT /api/admin/requests/:id/approve) - Admin only
export const approveRequest: RequestHandler = (req: any, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'approve' or 'reject'

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Action must be either 'approve' or 'reject'."
      });
    }

    const request = findRequestById(id);
    if (!request) {
      return res.status(404).json({ success: false, message: "Request not found." });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: "Only pending requests can be approved or rejected."
      });
    }

    // Update status
    request.status = action === 'approve' ? 'approved' : 'rejected';
    request.updatedAt = new Date().toISOString();

    const response: ApprovalResponse = {
      success: true,
      message: `Request ${action}d successfully.`
    };

    res.json(response);
  } catch (error) {
    console.error("Approve request error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// Get public requests (GET /api/public/requests) - No authentication required
export const getPublicRequests: RequestHandler = (req: any, res) => {
  try {
    // Only return approved requests with receiver info
    const publicRequests = requests
      .filter(request => request.status === 'approved')
      .map(request => {
        const receiver = findUserById(request.receiverId);
        return {
          ...request,
          receiverName: receiver?.name || 'Anonymous',
          receiverEmail: receiver?.email || 'Hidden'
        };
      })
      .sort((a, b) => {
        // Sort by urgency first (urgent first), then by creation date (newest first)
        if (a.urgency === 'urgent' && b.urgency !== 'urgent') return -1;
        if (b.urgency === 'urgent' && a.urgency !== 'urgent') return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

    res.json({
      success: true,
      requests: publicRequests
    });
  } catch (error) {
    console.error("Get public requests error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// Export requests array for use in matching
export { requests };
