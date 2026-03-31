import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleRegister, handleLogin } from "./routes/auth";
import {
  getInstitutions,
  approveInstitution,
  rejectInstitution,
  getAllUsers
} from "./routes/admin";
import {
  getApprovedInstitutions,
  getInstitutionById,
  applyToJoinInstitution,
  getMyInstitution,
  approveDonator,
  rejectDonator,
  getDonatorApprovedInstitutions,
} from "./routes/institutions";
import {
  createWeeklyNeed,
  getMyWeeklyNeeds,
  updateWeeklyNeed,
  deleteWeeklyNeed,
  getInstitutionWeeklyNeeds,
} from "./routes/weekly-needs";
import {
  getDonationTurns,
  getCurrentWeek,
  acceptDonationTurn,
  declineDonationTurn,
  assignDonationTurn,
  getMyDonationTurn,
} from "./routes/donation-turns";
import { authMiddleware, adminOnly } from "./middleware/auth";
import { connectDB } from "./db";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Initialize database connection
  connectDB().catch((error) => {
    console.error("Database connection failed:", error);
  });

  // Public API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Authentication routes
  app.post("/api/auth/register", handleRegister);
  app.post("/api/auth/login", handleLogin);

  // Admin routes
  app.get("/api/admin/institutions", authMiddleware, adminOnly, getInstitutions);
  app.post(
    "/api/admin/institutions/:institutionId/approve",
    authMiddleware,
    adminOnly,
    approveInstitution
  );
  app.post(
    "/api/admin/institutions/:institutionId/reject",
    authMiddleware,
    adminOnly,
    rejectInstitution
  );
  app.get("/api/admin/users", authMiddleware, adminOnly, getAllUsers);

  // Public institution routes (for donators to browse)
  app.get("/api/institutions", authMiddleware, getApprovedInstitutions);
  app.get("/api/institutions/:institutionId", authMiddleware, getInstitutionById);
  app.post("/api/institutions/:institutionId/apply", authMiddleware, applyToJoinInstitution);
  app.get("/api/donator/approved-institutions", authMiddleware, getDonatorApprovedInstitutions);

  // Institution dashboard routes
  app.get("/api/institution/my-institution", authMiddleware, getMyInstitution);
  app.post("/api/institution/donators/:donatorId/approve", authMiddleware, approveDonator);
  app.post("/api/institution/donators/:donatorId/reject", authMiddleware, rejectDonator);

  // Weekly needs routes
  app.post("/api/institution/weekly-needs", authMiddleware, createWeeklyNeed);
  app.get("/api/institution/weekly-needs", authMiddleware, getMyWeeklyNeeds);
  app.put("/api/institution/weekly-needs/:needId", authMiddleware, updateWeeklyNeed);
  app.delete("/api/institution/weekly-needs/:needId", authMiddleware, deleteWeeklyNeed);
  app.get("/api/institutions/:institutionId/weekly-needs", authMiddleware, getInstitutionWeeklyNeeds);

  // Donation turns routes
  app.get("/api/institution/donation-turns", authMiddleware, getDonationTurns);
  app.get("/api/institution/donation-turns/current", authMiddleware, getCurrentWeek);
  app.post("/api/institution/donation-turns/:donatorId/assign", authMiddleware, assignDonationTurn);
  app.post("/api/donation-turns/:turnId/accept", authMiddleware, acceptDonationTurn);
  app.post("/api/donation-turns/:turnId/decline", authMiddleware, declineDonationTurn);
  app.get("/api/donator/donation-turn", authMiddleware, getMyDonationTurn);

  return app;
}
