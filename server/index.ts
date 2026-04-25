import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleRegister, handleLogin } from "./routes/auth";
import {
  getInstitutions,
  approveInstitution,
  rejectInstitution,
  getAllUsers,
  geocodeExistingInstitutions
} from "./routes/admin";
import {
  getApprovedInstitutions,
  getInstitutionById,
  applyToJoinInstitution,
  getMyInstitution,
  approveDonator,
  rejectDonator,
  getDonatorApprovedInstitutions,
  updateInstitutionLocation,
} from "./routes/institutions";
import {
  createWeeklyNeed,
  getMyWeeklyNeeds,
  updateWeeklyNeed,
  deleteWeeklyNeed,
  getInstitutionWeeklyNeeds,
  markNeedAsFullyDonated,
} from "./routes/weekly-needs";
import {
  getDonationTurns,
  getCurrentWeek,
  acceptDonationTurn,
  declineDonationTurn,
  assignDonationTurn,
  getMyDonationTurn,
  getDonationHistory,
} from "./routes/donation-turns";
import {
  saveDonationConfirmation,
  getDonationConfirmations,
  deleteDonationConfirmation,
} from "./routes/donation-confirmations";
import { authMiddleware, adminOnly } from "./middleware/auth";
import { connectDB } from "./db";
import { startCleanupJob } from "./utils/cleanup";

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

  // Start automatic cleanup job for old donated needs
  startCleanupJob();

  // Public API routes
  console.log("[ROUTE] Registering /api/ping");
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Public institutions map endpoint (no auth required)
  app.get("/api/institutions/map/locations", async (_req, res) => {
    try {
      const { Institution } = await import("./models/institution");
      const { WeeklyNeed } = await import("./models/weekly-need");
      const { DonationConfirmation } = await import("./models/donation-confirmation");
      const { DonationTurn } = await import("./models/donation-turn");

      const institutions = await Institution.find({ approved: true }).select(
        "name location description latitude longitude"
      );

      const formattedInstitutions = await Promise.all(
        institutions
          .filter((inst) => inst.latitude && inst.longitude) // Only include institutions with valid coordinates
          .map(async (inst) => {
            // Check for active urgent weekly needs
            const urgentNeeds = await WeeklyNeed.findOne({
              institutionId: inst._id,
              urgency: "urgent",
              isActive: true,
            });

            // Check for active non-urgent weekly needs
            const nonUrgentNeeds = await WeeklyNeed.findOne({
              institutionId: inst._id,
              urgency: "quotidien",
              isActive: true,
            });

            // Check for confirmed donations (only within the last 24 hours)
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const confirmedDonation = await DonationConfirmation.findOne({
              institutionId: inst._id,
              status: "confirmed",
              createdAt: { $gte: oneDayAgo }, // Only show green if confirmed in last 24 hours
            });

            // Check for active donation turns
            const activeTurn = await DonationTurn.findOne({
              institutionId: inst._id,
              status: { $in: ["pending", "accepted"] },
            });

            // Determine marker status
            let markerStatus = "blue"; // default: no order
            if (confirmedDonation) {
              markerStatus = "green"; // donation served (within last 24 hours)
            } else if (urgentNeeds) {
              markerStatus = "red"; // urgent donation needed
            } else if (nonUrgentNeeds) {
              markerStatus = "orange"; // needs donation but not urgent
            } else if (activeTurn) {
              // If there's an active turn but no confirmed donation and no needs, still check urgency
              markerStatus = "blue";
            }

            return {
              _id: inst._id,
              name: inst.name,
              location: inst.location,
              description: inst.description,
              latitude: inst.latitude,
              longitude: inst.longitude,
              markerStatus,
            };
          })
      );

      return res.json(formattedInstitutions);
    } catch (error) {
      console.error("Get institutions map error:", error);
      return res.status(500).json({ message: "Failed to fetch institutions" });
    }
  });

  // Authentication routes
  console.log("[ROUTE] Registering auth routes");
  app.post("/api/auth/register", handleRegister);
  app.post("/api/auth/login", handleLogin);

  // Admin routes
  console.log("[ROUTE] Registering admin routes");
  console.log("[ROUTE] Registering GET /api/admin/institutions");
  app.get("/api/admin/institutions", authMiddleware, adminOnly, getInstitutions);
  console.log("[ROUTE] Registering POST /api/admin/institutions/:institutionId/approve");
  app.post(
    "/api/admin/institutions/:institutionId/approve",
    authMiddleware,
    adminOnly,
    approveInstitution
  );
  console.log("[ROUTE] Registering POST /api/admin/institutions/:institutionId/reject");
  app.post(
    "/api/admin/institutions/:institutionId/reject",
    authMiddleware,
    adminOnly,
    rejectInstitution
  );
  console.log("[ROUTE] Registering GET /api/admin/users");
  app.get("/api/admin/users", authMiddleware, adminOnly, getAllUsers);
  console.log("[ROUTE] Registering POST /api/admin/geocode-institutions");
  app.post("/api/admin/geocode-institutions", authMiddleware, adminOnly, geocodeExistingInstitutions);

  // Public institution routes (for donators to browse)
  console.log("[ROUTE] Registering public institution routes");
  console.log("[ROUTE] Registering GET /api/institutions");
  app.get("/api/institutions", authMiddleware, getApprovedInstitutions);
  console.log("[ROUTE] Registering GET /api/institutions/:institutionId");
  app.get("/api/institutions/:institutionId", authMiddleware, getInstitutionById);
  console.log("[ROUTE] Registering POST /api/institutions/:institutionId/apply");
  app.post("/api/institutions/:institutionId/apply", authMiddleware, applyToJoinInstitution);
  console.log("[ROUTE] Registering GET /api/donator/approved-institutions");
  app.get("/api/donator/approved-institutions", authMiddleware, getDonatorApprovedInstitutions);

  // Institution dashboard routes
  console.log("[ROUTE] Registering institution dashboard routes");
  console.log("[ROUTE] Registering GET /api/institution/my-institution");
  app.get("/api/institution/my-institution", authMiddleware, getMyInstitution);
  console.log("[ROUTE] Registering POST /api/institution/donators/:donatorId/approve");
  app.post("/api/institution/donators/:donatorId/approve", authMiddleware, approveDonator);
  console.log("[ROUTE] Registering POST /api/institution/donators/:donatorId/reject");
  app.post("/api/institution/donators/:donatorId/reject", authMiddleware, rejectDonator);
  console.log("[ROUTE] Registering PUT /api/institution/location");
  app.put("/api/institution/location", authMiddleware, updateInstitutionLocation);

  // Weekly needs routes
  console.log("[ROUTE] Registering POST /api/institution/weekly-needs");
  app.post("/api/institution/weekly-needs", authMiddleware, createWeeklyNeed);
  console.log("[ROUTE] Registering GET /api/institution/weekly-needs");
  app.get("/api/institution/weekly-needs", authMiddleware, getMyWeeklyNeeds);
  console.log("[ROUTE] Registering PUT /api/institution/weekly-needs/:needId");
  app.put("/api/institution/weekly-needs/:needId", authMiddleware, updateWeeklyNeed);
  console.log("[ROUTE] Registering DELETE /api/institution/weekly-needs/:needId");
  app.delete("/api/institution/weekly-needs/:needId", authMiddleware, deleteWeeklyNeed);
  console.log("[ROUTE] Registering GET /api/institutions/:institutionId/weekly-needs");
  app.get("/api/institutions/:institutionId/weekly-needs", authMiddleware, getInstitutionWeeklyNeeds);
  console.log("[ROUTE] Registering POST /api/institution/weekly-needs/:needId/mark-fully-donated");
  app.post("/api/institution/weekly-needs/:needId/mark-fully-donated", authMiddleware, markNeedAsFullyDonated);

  // Donation turns routes
  console.log("[ROUTE] Registering GET /api/institution/donation-turns");
  app.get("/api/institution/donation-turns", authMiddleware, getDonationTurns);
  console.log("[ROUTE] Registering GET /api/institution/donation-turns/current");
  app.get("/api/institution/donation-turns/current", authMiddleware, getCurrentWeek);
  console.log("[ROUTE] Registering POST /api/institution/donation-turns/:donatorId/assign");
  app.post("/api/institution/donation-turns/:donatorId/assign", authMiddleware, assignDonationTurn);
  console.log("[ROUTE] Registering POST /api/donation-turns/:turnId/accept");
  app.post("/api/donation-turns/:turnId/accept", authMiddleware, acceptDonationTurn);
  console.log("[ROUTE] Registering POST /api/donation-turns/:turnId/decline");
  app.post("/api/donation-turns/:turnId/decline", authMiddleware, declineDonationTurn);
  console.log("[ROUTE] Registering GET /api/donator/donation-turn");
  app.get("/api/donator/donation-turn", authMiddleware, getMyDonationTurn);
  console.log("[ROUTE] Registering GET /api/donator/donation-history");
  app.get("/api/donator/donation-history", authMiddleware, getDonationHistory);

  // Donation confirmations routes
  app.post("/api/donation-confirmations", authMiddleware, saveDonationConfirmation);
  app.get("/api/donation-confirmations", authMiddleware, getDonationConfirmations);
  app.delete("/api/donation-confirmations/:confirmationId", authMiddleware, deleteDonationConfirmation);

  return app;
}
