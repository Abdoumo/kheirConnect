import { RequestHandler } from "express";
import { AuthRequest } from "../middleware/auth";

export const createWeeklyNeed: RequestHandler = async (
  req: AuthRequest,
  res
) => {
  try {
    const userId = req.user?.userId;
    const { title, description, urgency } = req.body;

    if (!userId || !title || !description) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const { Institution } = await import("../models/institution");
    const { WeeklyNeed } = await import("../models/weekly-need");

    // Find institution by user
    const institution = await Institution.findOne({ userId });
    if (!institution) {
      return res.status(404).json({ message: "Institution not found" });
    }

    const weeklyNeed = new WeeklyNeed({
      institutionId: institution._id,
      title,
      description,
      urgency: urgency || "quotidien",
      isActive: true,
    });

    await weeklyNeed.save();

    return res.status(201).json({
      _id: weeklyNeed._id,
      title: weeklyNeed.title,
      description: weeklyNeed.description,
      urgency: weeklyNeed.urgency,
      isActive: weeklyNeed.isActive,
      createdAt: weeklyNeed.createdAt,
    });
  } catch (error) {
    console.error("Create weekly need error:", error);
    return res.status(500).json({ message: "Failed to create weekly need" });
  }
};

export const getMyWeeklyNeeds: RequestHandler = async (
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

    const institution = await Institution.findOne({ userId });
    if (!institution) {
      return res.status(404).json({ message: "Institution not found" });
    }

    const weeklyNeeds = await WeeklyNeed.find({
      institutionId: institution._id,
    }).sort({ createdAt: -1 });

    return res.json(
      weeklyNeeds.map((need) => ({
        _id: need._id,
        title: need.title,
        description: need.description,
        urgency: need.urgency,
        isActive: need.isActive,
        createdAt: need.createdAt,
        updatedAt: need.updatedAt,
      }))
    );
  } catch (error) {
    console.error("Get weekly needs error:", error);
    return res.status(500).json({ message: "Failed to fetch weekly needs" });
  }
};

export const updateWeeklyNeed: RequestHandler = async (
  req: AuthRequest,
  res
) => {
  try {
    const { needId } = req.params;
    const userId = req.user?.userId;
    const { title, description, urgency, isActive } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { Institution } = await import("../models/institution");
    const { WeeklyNeed } = await import("../models/weekly-need");

    const institution = await Institution.findOne({ userId });
    if (!institution) {
      return res.status(404).json({ message: "Institution not found" });
    }

    const weeklyNeed = await WeeklyNeed.findById(needId);
    if (!weeklyNeed) {
      return res.status(404).json({ message: "Weekly need not found" });
    }

    // Verify ownership
    if (weeklyNeed.institutionId.toString() !== institution._id.toString()) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (title) weeklyNeed.title = title;
    if (description) weeklyNeed.description = description;
    if (urgency) weeklyNeed.urgency = urgency;
    if (isActive !== undefined) weeklyNeed.isActive = isActive;

    await weeklyNeed.save();

    return res.json({
      _id: weeklyNeed._id,
      title: weeklyNeed.title,
      description: weeklyNeed.description,
      urgency: weeklyNeed.urgency,
      isActive: weeklyNeed.isActive,
      createdAt: weeklyNeed.createdAt,
      updatedAt: weeklyNeed.updatedAt,
    });
  } catch (error) {
    console.error("Update weekly need error:", error);
    return res.status(500).json({ message: "Failed to update weekly need" });
  }
};

export const deleteWeeklyNeed: RequestHandler = async (
  req: AuthRequest,
  res
) => {
  try {
    const { needId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { Institution } = await import("../models/institution");
    const { WeeklyNeed } = await import("../models/weekly-need");

    const institution = await Institution.findOne({ userId });
    if (!institution) {
      return res.status(404).json({ message: "Institution not found" });
    }

    const weeklyNeed = await WeeklyNeed.findById(needId);
    if (!weeklyNeed) {
      return res.status(404).json({ message: "Weekly need not found" });
    }

    // Verify ownership
    if (weeklyNeed.institutionId.toString() !== institution._id.toString()) {
      return res.status(403).json({ message: "Forbidden" });
    }

    await WeeklyNeed.deleteOne({ _id: needId });

    return res.json({ message: "Weekly need deleted successfully" });
  } catch (error) {
    console.error("Delete weekly need error:", error);
    return res.status(500).json({ message: "Failed to delete weekly need" });
  }
};

export const getInstitutionWeeklyNeeds: RequestHandler = async (
  req: AuthRequest,
  res
) => {
  try {
    const { institutionId } = req.params;
    const { WeeklyNeed } = await import("../models/weekly-need");
    const { Institution } = await import("../models/institution");

    const institution = await Institution.findById(institutionId);
    if (!institution) {
      return res.status(404).json({ message: "Institution not found" });
    }

    const weeklyNeeds = await WeeklyNeed.find({
      institutionId,
      isActive: true,
    }).sort({ createdAt: -1 });

    return res.json(
      weeklyNeeds.map((need) => ({
        _id: need._id,
        title: need.title,
        description: need.description,
        urgency: need.urgency,
        fullyDonated: need.fullyDonated,
        createdAt: need.createdAt,
      }))
    );
  } catch (error) {
    console.error("Get institution weekly needs error:", error);
    return res.status(500).json({ message: "Failed to fetch weekly needs" });
  }
};

export const markNeedAsFullyDonated: RequestHandler = async (
  req: AuthRequest,
  res
) => {
  try {
    const { needId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { Institution } = await import("../models/institution");
    const { WeeklyNeed } = await import("../models/weekly-need");

    const institution = await Institution.findOne({ userId });
    if (!institution) {
      return res.status(404).json({ message: "Institution not found" });
    }

    const weeklyNeed = await WeeklyNeed.findById(needId);
    if (!weeklyNeed) {
      return res.status(404).json({ message: "Weekly need not found" });
    }

    // Verify ownership
    if (weeklyNeed.institutionId.toString() !== institution._id.toString()) {
      return res.status(403).json({ message: "Forbidden" });
    }

    weeklyNeed.fullyDonated = true;
    weeklyNeed.completedAt = new Date();
    // Schedule deletion for 1 day later
    weeklyNeed.scheduledForDeletion = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await weeklyNeed.save();

    return res.json({
      message: "Need marked as fully donated",
      _id: weeklyNeed._id,
      fullyDonated: weeklyNeed.fullyDonated,
      completedAt: weeklyNeed.completedAt,
    });
  } catch (error) {
    console.error("Mark need as fully donated error:", error);
    return res.status(500).json({ message: "Failed to mark need as fully donated" });
  }
};
