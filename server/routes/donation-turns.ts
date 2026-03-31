import { RequestHandler } from "express";
import { AuthRequest } from "../middleware/auth";

export const getDonationTurns: RequestHandler = async (
  req: AuthRequest,
  res
) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { Institution } = await import("../models/institution");
    const { DonationTurn } = await import("../models/donation-turn");

    const institution = await Institution.findOne({ userId }).populate("donators", "name email");
    if (!institution) {
      return res.status(404).json({ message: "Institution not found" });
    }

    // Get all donation turns for this institution
    const turns = await DonationTurn.find({
      institutionId: institution._id,
    })
      .populate("donatorId", "name email")
      .sort({ week: -1 });

    return res.json(
      turns.map((turn) => ({
        _id: turn._id,
        donatorId: (turn.donatorId as any)?._id,
        donatorName: (turn.donatorId as any)?.name,
        donatorEmail: (turn.donatorId as any)?.email,
        week: turn.week,
        status: turn.status,
        weeklyNeeds: turn.weeklyNeeds,
        createdAt: turn.createdAt,
      }))
    );
  } catch (error) {
    console.error("Get donation turns error:", error);
    return res.status(500).json({ message: "Failed to fetch donation turns" });
  }
};

export const getCurrentWeek: RequestHandler = async (
  req: AuthRequest,
  res
) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { Institution } = await import("../models/institution");
    const { DonationTurn } = await import("../models/donation-turn");

    const institution = await Institution.findOne({ userId });
    if (!institution) {
      return res.status(404).json({ message: "Institution not found" });
    }

    // Get current week (highest week number with pending status)
    const currentTurn = await DonationTurn.findOne({
      institutionId: institution._id,
      status: "pending",
    })
      .populate("donatorId", "name email")
      .sort({ week: -1 });

    if (!currentTurn) {
      // Create first turn if none exists
      if (institution.donators.length === 0) {
        return res.json({
          _id: null,
          donatorName: "No active donators",
          status: "no-donators",
          week: 0,
        });
      }

      const newTurn = new DonationTurn({
        institutionId: institution._id,
        donatorId: institution.donators[0],
        week: 1,
        status: "pending",
        weeklyNeeds: "",
      });

      await newTurn.save();
      const populated = await newTurn.populate("donatorId", "name email");

      return res.json({
        _id: populated._id,
        donatorId: (populated.donatorId as any)?._id,
        donatorName: (populated.donatorId as any)?.name,
        donatorEmail: (populated.donatorId as any)?.email,
        week: populated.week,
        status: populated.status,
        weeklyNeeds: populated.weeklyNeeds,
      });
    }

    return res.json({
      _id: currentTurn._id,
      donatorId: (currentTurn.donatorId as any)?._id,
      donatorName: (currentTurn.donatorId as any)?.name,
      donatorEmail: (currentTurn.donatorId as any)?.email,
      week: currentTurn.week,
      status: currentTurn.status,
      weeklyNeeds: currentTurn.weeklyNeeds,
    });
  } catch (error) {
    console.error("Get current week error:", error);
    return res.status(500).json({ message: "Failed to fetch current week" });
  }
};

export const acceptDonationTurn: RequestHandler = async (
  req: AuthRequest,
  res
) => {
  try {
    const { turnId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { DonationTurn } = await import("../models/donation-turn");

    const turn = await DonationTurn.findById(turnId);
    if (!turn) {
      return res.status(404).json({ message: "Donation turn not found" });
    }

    // Verify the donator is accepting their own turn
    if (turn.donatorId.toString() !== userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    turn.status = "accepted";
    await turn.save();

    return res.json({
      message: "Donation turn accepted",
      status: turn.status,
    });
  } catch (error) {
    console.error("Accept donation turn error:", error);
    return res.status(500).json({ message: "Failed to accept donation turn" });
  }
};

export const declineDonationTurn: RequestHandler = async (
  req: AuthRequest,
  res
) => {
  try {
    const { turnId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { Institution } = await import("../models/institution");
    const { DonationTurn } = await import("../models/donation-turn");

    const turn = await DonationTurn.findById(turnId);
    if (!turn) {
      return res.status(404).json({ message: "Donation turn not found" });
    }

    // Verify the donator is declining their own turn
    if (turn.donatorId.toString() !== userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // Mark as declined
    turn.status = "declined";
    await turn.save();

    // Get institution and move to next donator
    const institution = await Institution.findById(turn.institutionId).populate(
      "donators",
      "_id"
    );
    if (!institution || institution.donators.length === 0) {
      return res.json({ message: "Turn declined, no other donators available" });
    }

    // Find current donator index
    const currentIndex = institution.donators.findIndex(
      (d: any) => d._id.toString() === turn.donatorId.toString()
    );

    // Get next donator (circular)
    const nextIndex = (currentIndex + 1) % institution.donators.length;
    const nextDonator = (institution.donators[nextIndex] as any)._id;

    // Create new turn for next donator
    const nextTurn = new DonationTurn({
      institutionId: turn.institutionId,
      donatorId: nextDonator,
      week: turn.week,
      status: "pending",
      weeklyNeeds: "",
    });

    await nextTurn.save();

    return res.json({
      message: "Turn declined, moved to next donator",
      nextDonatorId: nextDonator,
    });
  } catch (error) {
    console.error("Decline donation turn error:", error);
    return res.status(500).json({ message: "Failed to decline donation turn" });
  }
};

export const assignDonationTurn: RequestHandler = async (
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
    const { DonationTurn } = await import("../models/donation-turn");

    // Verify institution ownership
    const institution = await Institution.findOne({ userId });
    if (!institution) {
      return res.status(404).json({ message: "Institution not found" });
    }

    // Verify donator is part of this institution
    if (!institution.donators.includes(donatorId as any)) {
      return res
        .status(400)
        .json({ message: "Donator is not part of this institution" });
    }

    // Decline current pending turn if exists
    const currentTurn = await DonationTurn.findOne({
      institutionId: institution._id,
      status: "pending",
    });

    if (currentTurn) {
      currentTurn.status = "declined";
      await currentTurn.save();
    }

    // Get max week number
    const maxWeekTurn = await DonationTurn.findOne({
      institutionId: institution._id,
    }).sort({ week: -1 });

    const nextWeek = maxWeekTurn ? maxWeekTurn.week + 1 : 1;

    // Create new turn for selected donator
    const newTurn = new DonationTurn({
      institutionId: institution._id,
      donatorId,
      week: nextWeek,
      status: "pending",
      weeklyNeeds: "",
    });

    await newTurn.save();
    const populated = await newTurn.populate("donatorId", "name email");

    return res.status(201).json({
      message: "Donation turn assigned",
      _id: populated._id,
      donatorId: (populated.donatorId as any)?._id,
      donatorName: (populated.donatorId as any)?.name,
      week: populated.week,
      status: populated.status,
    });
  } catch (error) {
    console.error("Assign donation turn error:", error);
    return res.status(500).json({ message: "Failed to assign donation turn" });
  }
};

export const getMyDonationTurn: RequestHandler = async (
  req: AuthRequest,
  res
) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { DonationTurn } = await import("../models/donation-turn");

    // Get current pending turn for this donator
    const turn = await DonationTurn.findOne({
      donatorId: userId,
      status: "pending",
    })
      .populate("institutionId", "name location")
      .sort({ createdAt: -1 });

    if (!turn) {
      return res.json({
        _id: null,
        message: "No pending donation turn",
      });
    }

    return res.json({
      _id: turn._id,
      institutionName: (turn.institutionId as any)?.name,
      institutionLocation: (turn.institutionId as any)?.location,
      week: turn.week,
      weeklyNeeds: turn.weeklyNeeds,
      status: turn.status,
    });
  } catch (error) {
    console.error("Get my donation turn error:", error);
    return res.status(500).json({ message: "Failed to fetch donation turn" });
  }
};
