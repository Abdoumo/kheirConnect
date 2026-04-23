import { RequestHandler } from "express";
import { AuthRequest } from "../middleware/auth";

export const saveDonationConfirmation: RequestHandler = async (
  req: AuthRequest,
  res
) => {
  try {
    const userId = req.user?.userId;
    const { institutionId, weeklyNeedId, needTitle, status, donationDetails } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!institutionId || !weeklyNeedId || !needTitle || !status) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const { DonationConfirmation } = await import("../models/donation-confirmation");

    // Check if confirmation already exists for this need
    const existing = await DonationConfirmation.findOne({
      donatorId: userId,
      institutionId,
      weeklyNeedId,
    });

    if (existing) {
      // Update existing confirmation
      existing.status = status;
      existing.donationDetails = donationDetails || "";
      await existing.save();
      return res.json({ message: "Confirmation updated", data: existing });
    }

    // Create new confirmation
    const confirmation = new DonationConfirmation({
      donatorId: userId,
      institutionId,
      weeklyNeedId,
      needTitle,
      status,
      donationDetails: donationDetails || "",
    });

    await confirmation.save();
    return res.status(201).json({ message: "Confirmation saved", data: confirmation });
  } catch (error) {
    console.error("Save donation confirmation error:", error);
    return res.status(500).json({ message: "Failed to save confirmation" });
  }
};

export const getDonationConfirmations: RequestHandler = async (
  req: AuthRequest,
  res
) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { DonationConfirmation } = await import("../models/donation-confirmation");

    const confirmations = await DonationConfirmation.find({
      donatorId: userId,
    })
      .populate("institutionId", "name location")
      .populate("weeklyNeedId")
      .sort({ createdAt: -1 });

    return res.json(confirmations);
  } catch (error) {
    console.error("Get donation confirmations error:", error);
    return res.status(500).json({ message: "Failed to fetch confirmations" });
  }
};

export const deleteDonationConfirmation: RequestHandler = async (
  req: AuthRequest,
  res
) => {
  try {
    const userId = req.user?.userId;
    const { confirmationId } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { DonationConfirmation } = await import("../models/donation-confirmation");

    const confirmation = await DonationConfirmation.findById(confirmationId);

    if (!confirmation) {
      return res.status(404).json({ message: "Confirmation not found" });
    }

    // Verify ownership
    if (confirmation.donatorId.toString() !== userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    await DonationConfirmation.findByIdAndDelete(confirmationId);
    return res.json({ message: "Confirmation deleted" });
  } catch (error) {
    console.error("Delete donation confirmation error:", error);
    return res.status(500).json({ message: "Failed to delete confirmation" });
  }
};
