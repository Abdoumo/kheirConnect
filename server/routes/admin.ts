import { RequestHandler } from "express";
import { AuthRequest } from "../middleware/auth";
import { mockDB } from "../mockdb";
import { useMongoDb } from "../db";

export const getInstitutions: RequestHandler = async (req: AuthRequest, res) => {
  try {
    if (useMongoDb) {
      const { Institution } = await import("../models/institution");
      const institutions = await Institution.find().populate("userId", "name email");

      const formattedInstitutions = institutions.map((inst) => ({
        _id: inst._id,
        name: inst.name,
        description: inst.description,
        location: inst.location,
        approved: inst.approved,
        createdAt: inst.createdAt,
      }));

      return res.json(formattedInstitutions);
    } else {
      const institutions = await mockDB.getAllInstitutions();
      const formattedInstitutions = institutions.map((inst) => ({
        _id: inst._id,
        name: inst.name,
        description: inst.description,
        location: inst.location,
        approved: inst.approved,
        createdAt: inst.createdAt,
      }));

      return res.json(formattedInstitutions);
    }
  } catch (error) {
    console.error("Get institutions error:", error);
    return res.status(500).json({ message: "Failed to fetch institutions" });
  }
};

export const approveInstitution: RequestHandler = async (req: AuthRequest, res) => {
  try {
    const { institutionId } = req.params;

    if (useMongoDb) {
      const { Institution } = await import("../models/institution");
      const institution = await Institution.findByIdAndUpdate(
        institutionId,
        { approved: true },
        { new: true }
      );

      if (!institution) {
        return res.status(404).json({ message: "Institution not found" });
      }

      return res.json({
        message: "Institution approved successfully",
        institution,
      });
    } else {
      const institution = await mockDB.updateInstitution(institutionId, {
        approved: true,
      });

      if (!institution) {
        return res.status(404).json({ message: "Institution not found" });
      }

      return res.json({
        message: "Institution approved successfully",
        institution,
      });
    }
  } catch (error) {
    console.error("Approve institution error:", error);
    return res.status(500).json({ message: "Failed to approve institution" });
  }
};

export const rejectInstitution: RequestHandler = async (req: AuthRequest, res) => {
  try {
    const { institutionId } = req.params;

    if (useMongoDb) {
      const { Institution } = await import("../models/institution");
      const { User } = await import("../models/user");

      const institution = await Institution.findByIdAndDelete(institutionId);

      if (!institution) {
        return res.status(404).json({ message: "Institution not found" });
      }

      await User.findByIdAndDelete(institution.userId);

      return res.json({ message: "Institution rejected and deleted" });
    } else {
      const deleted = await mockDB.deleteInstitution(institutionId);

      if (!deleted) {
        return res.status(404).json({ message: "Institution not found" });
      }

      return res.json({ message: "Institution rejected and deleted" });
    }
  } catch (error) {
    console.error("Reject institution error:", error);
    return res.status(500).json({ message: "Failed to reject institution" });
  }
};

export const getAllUsers: RequestHandler = async (req: AuthRequest, res) => {
  try {
    if (useMongoDb) {
      const { User } = await import("../models/user");
      const users = await User.find().select("-password");
      return res.json(users);
    } else {
      const users = await mockDB.getAllUsers();
      return res.json(users);
    }
  } catch (error) {
    console.error("Get users error:", error);
    return res.status(500).json({ message: "Failed to fetch users" });
  }
};
