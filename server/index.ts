import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleRegister, handleLogin, authenticateToken, requireRole } from "./routes/auth";
import { addDonation, getMyDonations, updateDonation, deleteDonation, getAllDonations, approveDonation } from "./routes/donations";
import { addRequest, getMyRequests, updateRequest, deleteRequest, getAllRequests, approveRequest, getPublicRequests } from "./routes/requests";
import { createMatch, getAllMatches, completeMatch, cancelMatch } from "./routes/matching";
import { getPublicActivitiesWithSample } from "./routes/activities";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Public routes (no authentication required)
  app.get("/api/public/requests", getPublicRequests);
  app.get("/api/public/activities", getPublicActivitiesWithSample);

  // Authentication routes
  app.post("/api/register", handleRegister);
  app.post("/api/login", handleLogin);

  // Donation routes
  app.post("/api/donations/add", authenticateToken, requireRole(['donor']), addDonation);
  app.get("/api/donations/my", authenticateToken, requireRole(['donor']), getMyDonations);
  app.put("/api/donations/:id", authenticateToken, requireRole(['donor']), updateDonation);
  app.delete("/api/donations/:id", authenticateToken, requireRole(['donor']), deleteDonation);

  // Request routes
  app.post("/api/requests/add", authenticateToken, requireRole(['receiver']), addRequest);
  app.get("/api/requests/my", authenticateToken, requireRole(['receiver']), getMyRequests);
  app.put("/api/requests/:id", authenticateToken, requireRole(['receiver']), updateRequest);
  app.delete("/api/requests/:id", authenticateToken, requireRole(['receiver']), deleteRequest);

  // Admin donation routes
  app.get("/api/admin/donations", authenticateToken, requireRole(['admin']), getAllDonations);
  app.put("/api/admin/donations/:id/approve", authenticateToken, requireRole(['admin']), approveDonation);

  // Admin request routes
  app.get("/api/admin/requests", authenticateToken, requireRole(['admin']), getAllRequests);
  app.put("/api/admin/requests/:id/approve", authenticateToken, requireRole(['admin']), approveRequest);

  // Admin matching routes
  app.post("/api/admin/match", authenticateToken, requireRole(['admin']), createMatch);
  app.get("/api/admin/matches", authenticateToken, requireRole(['admin']), getAllMatches);
  app.put("/api/admin/matches/:id/complete", authenticateToken, requireRole(['admin']), completeMatch);
  app.put("/api/admin/matches/:id/cancel", authenticateToken, requireRole(['admin']), cancelMatch);

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  return app;
}
