import { RequestHandler } from "express";
import { AuthRequest } from "../middleware/auth";
import { mockDB } from "../mockdb";
import { useMongoDb } from "../db";

export const getApprovedInstitutions: RequestHandler = async (
  req: AuthRequest,
  res
) => {
  try {
    if (useMongoDb) {
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
      }));

      return res.json(formattedInstitutions);
    } else {
      const institutions = await mockDB.getAllInstitutions();
      const approvedInstitutions = institutions.filter((inst) => inst.approved);

      const formattedInstitutions = approvedInstitutions.map((inst) => ({
        _id: inst._id,
        name: inst.name,
        description: inst.description,
        location: inst.location,
        approved: inst.approved,
        createdAt: inst.createdAt,
        donatorCount: inst.donators.length,
      }));

      return res.json(formattedInstitutions);
    }
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

    if (useMongoDb) {
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
    } else {
      const institution = await mockDB.findInstitutionById(institutionId);

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
    }
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

    if (useMongoDb) {
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
    } else {
      const institution = await mockDB.findInstitutionById(institutionId);

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

      return res.json({ message: "Application submitted successfully" });
    }
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

    if (useMongoDb) {
      const { Institution } = await import("../models/institution");
      const { User } = await import("../models/user");

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
    } else {
      const institutions = await mockDB.findInstitutionsByUserId(userId as string);

      if (institutions.length === 0) {
        return res.status(404).json({ message: "Institution not found" });
      }

      const institution = institutions[0];
      const pendingUsers = institution.pendingDonators.map(id => {
        const user = Array.from((mockDB as any).users?.values?.() || []).find((u: any) => u._id === id);
        return user ? { name: user.name, email: user.email, _id: user._id } : null;
      }).filter(Boolean);

      const activeUsers = institution.donators.map(id => {
        const user = Array.from((mockDB as any).users?.values?.() || []).find((u: any) => u._id === id);
        return user ? { name: user.name, email: user.email, _id: user._id } : null;
      }).filter(Boolean);

      return res.json({
        _id: institution._id,
        name: institution.name,
        description: institution.description,
        location: institution.location,
        approved: institution.approved,
        activeDonators: institution.donators.length,
        pendingApplications: institution.pendingDonators.length,
        pendingDonators: pendingUsers,
        donators: activeUsers,
        rotationIndex: institution.rotationIndex,
        createdAt: institution.createdAt,
      });
    }
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

    if (useMongoDb) {
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
    } else {
      const institutions = await mockDB.findInstitutionsByUserId(userId as string);

      if (institutions.length === 0) {
        return res.status(404).json({ message: "Institution not found" });
      }

      const institution = institutions[0];
      institution.pendingDonators = institution.pendingDonators.filter(id => id !== donatorId);

      if (!institution.donators.includes(donatorId as any)) {
        institution.donators.push(donatorId as any);
      }

      await mockDB.updateInstitution(institution._id, institution);

      return res.json({ message: "Donator approved successfully" });
    }
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

    if (useMongoDb) {
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
    } else {
      const institutions = await mockDB.findInstitutionsByUserId(userId as string);

      if (institutions.length === 0) {
        return res.status(404).json({ message: "Institution not found" });
      }

      const institution = institutions[0];
      institution.pendingDonators = institution.pendingDonators.filter(id => id !== donatorId);

      await mockDB.updateInstitution(institution._id, institution);

      return res.json({ message: "Donator rejected successfully" });
    }
  } catch (error) {
    console.error("Reject donator error:", error);
    return res.status(500).json({ message: "Failed to reject donator" });
  }
};
