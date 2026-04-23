import { RequestHandler } from "express";
import { AuthRequest } from "../middleware/auth";
import { geocodeLocation } from "../utils/geocoding";

export const getApprovedInstitutions: RequestHandler = async (
  req: AuthRequest,
  res
) => {
  try {
    const userId = req.user?.userId;
    const { Institution } = await import("../models/institution");
    const institutions = await Institution.find({ approved: true }).populate(
      "userId",
      "name email"
    );

    const formattedInstitutions = institutions.map((inst) => ({
      _id: inst._id,
      name: inst.name,
      description: inst.description,
      location: inst.location,
      approved: inst.approved,
      createdAt: inst.createdAt,
      donatorCount: inst.donators.length,
      hasApplied: inst.pendingDonators.includes(userId as any),
      isApproved: inst.donators.includes(userId as any),
    }));

    return res.json(formattedInstitutions);
  } catch (error) {
    console.error("Get approved institutions error:", error);
    return res.status(500).json({ message: "Failed to fetch institutions" });
  }
};

export const getInstitutionById: RequestHandler = async (
  req: AuthRequest,
  res
) => {
  try {
    const { institutionId } = req.params;
    const { Institution } = await import("../models/institution");
    const institution = await Institution.findById(institutionId).populate(
      "userId",
      "name email"
    );

    if (!institution) {
      return res.status(404).json({ message: "Institution not found" });
    }

    return res.json({
      _id: institution._id,
      name: institution.name,
      description: institution.description,
      location: institution.location,
      approved: institution.approved,
      donatorCount: institution.donators.length,
      createdAt: institution.createdAt,
    });
  } catch (error) {
    console.error("Get institution error:", error);
    return res.status(500).json({ message: "Failed to fetch institution" });
  }
};

export const applyToJoinInstitution: RequestHandler = async (
  req: AuthRequest,
  res
) => {
  try {
    const { institutionId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { Institution } = await import("../models/institution");
    const institution = await Institution.findById(institutionId);

    if (!institution) {
      return res.status(404).json({ message: "Institution not found" });
    }

    // Check if already a donator or pending
    if (institution.donators.includes(userId as any)) {
      return res.status(400).json({ message: "Already a member of this institution" });
    }

    if (institution.pendingDonators.includes(userId as any)) {
      return res.status(400).json({ message: "Already applied to this institution" });
    }

    // Add to pending donators
    institution.pendingDonators.push(userId as any);
    await institution.save();

    return res.json({ message: "Application submitted successfully" });
  } catch (error) {
    console.error("Apply to institution error:", error);
    return res.status(500).json({ message: "Failed to apply to institution" });
  }
};

export const getMyInstitution: RequestHandler = async (
  req: AuthRequest,
  res
) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { Institution } = await import("../models/institution");
    const institution = await Institution.findOne({ userId }).populate(
      "pendingDonators",
      "name email"
    ).populate(
      "donators",
      "name email"
    );

    if (!institution) {
      return res.status(404).json({ message: "Institution not found" });
    }

    return res.json({
      _id: institution._id,
      name: institution.name,
      description: institution.description,
      location: institution.location,
      approved: institution.approved,
      activeDonators: institution.donators.length,
      pendingApplications: institution.pendingDonators.length,
      pendingDonators: institution.pendingDonators,
      donators: institution.donators,
      rotationIndex: institution.rotationIndex,
      createdAt: institution.createdAt,
    });
  } catch (error) {
    console.error("Get my institution error:", error);
    return res.status(500).json({ message: "Failed to fetch institution" });
  }
};

export const approveDonator: RequestHandler = async (
  req: AuthRequest,
  res
) => {
  try {
    const { donatorId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { Institution } = await import("../models/institution");
    const institution = await Institution.findOne({ userId });

    if (!institution) {
      return res.status(404).json({ message: "Institution not found" });
    }

    // Remove from pending and add to active donators
    institution.pendingDonators = institution.pendingDonators.filter(
      (id: any) => id.toString() !== donatorId
    );

    if (!institution.donators.includes(donatorId as any)) {
      institution.donators.push(donatorId as any);
    }

    await institution.save();

    return res.json({ message: "Donator approved successfully" });
  } catch (error) {
    console.error("Approve donator error:", error);
    return res.status(500).json({ message: "Failed to approve donator" });
  }
};

export const rejectDonator: RequestHandler = async (
  req: AuthRequest,
  res
) => {
  try {
    const { donatorId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { Institution } = await import("../models/institution");
    const institution = await Institution.findOne({ userId });

    if (!institution) {
      return res.status(404).json({ message: "Institution not found" });
    }

    // Remove from pending donators
    institution.pendingDonators = institution.pendingDonators.filter(
      (id: any) => id.toString() !== donatorId
    );

    await institution.save();

    return res.json({ message: "Donator rejected successfully" });
  } catch (error) {
    console.error("Reject donator error:", error);
    return res.status(500).json({ message: "Failed to reject donator" });
  }
};

export const getDonatorApprovedInstitutions: RequestHandler = async (
  req: AuthRequest,
  res
) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { Institution } = await import("../models/institution");
    const { WeeklyNeed } = await import("../models/weekly-need");

    // Find institutions where user is an approved donator
    const institutions = await Institution.find({
      donators: userId,
    }).populate("userId", "name email");

    // Get weekly needs for each institution
    const institutionsWithNeeds = await Promise.all(
      institutions.map(async (inst) => {
        const weeklyNeeds = await WeeklyNeed.find({
          institutionId: inst._id,
          isActive: true,
        }).sort({ createdAt: -1 });

        return {
          _id: inst._id,
          name: inst.name,
          description: inst.description,
          location: inst.location,
          donatorCount: inst.donators.length,
          weeklyNeeds: weeklyNeeds.map((need) => ({
            _id: need._id,
            title: need.title,
            description: need.description,
            urgency: need.urgency,
          })),
          createdAt: inst.createdAt,
        };
      })
    );

    return res.json(institutionsWithNeeds);
  } catch (error) {
    console.error("Get donator approved institutions error:", error);
    return res.status(500).json({ message: "Failed to fetch institutions" });
  }
};

export const updateInstitutionLocation: RequestHandler = async (
  req: AuthRequest,
  res
) => {
  try {
    const userId = req.user?.userId;
    const { latitude, longitude } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return res.status(400).json({ message: "Invalid latitude or longitude" });
    }

    const { Institution } = await import("../models/institution");
    const institution = await Institution.findOne({ userId });

    if (!institution) {
      return res.status(404).json({ message: "Institution not found" });
    }

    institution.latitude = latitude;
    institution.longitude = longitude;
    await institution.save();

    return res.json({
      message: "Location updated successfully",
      latitude: institution.latitude,
      longitude: institution.longitude,
    });
  } catch (error) {
    console.error("Update institution location error:", error);
    return res.status(500).json({ message: "Failed to update location" });
  }
};
