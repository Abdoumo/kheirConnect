import { RequestHandler } from "express";
import { AuthRequest } from "../middleware/auth";
import { geocodeLocation } from "../utils/geocoding";

export const getInstitutions: RequestHandler = async (req: AuthRequest, res) => {
  try {
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
  } catch (error) {
    console.error("Get institutions error:", error);
    return res.status(500).json({ message: "Failed to fetch institutions" });
  }
};

export const approveInstitution: RequestHandler = async (req: AuthRequest, res) => {
  try {
    const { institutionId } = req.params;
    const { Institution } = await import("../models/institution");
    const institution = await Institution.findById(institutionId);

    if (!institution) {
      return res.status(404).json({ message: "Institution not found" });
    }

    // If location exists but coordinates are missing, geocode it
    if (institution.location && (!institution.latitude || !institution.longitude)) {
      const coords = await geocodeLocation(institution.location);
      if (coords) {
        institution.latitude = coords.latitude;
        institution.longitude = coords.longitude;
      }
    }

    institution.approved = true;
    await institution.save();

    return res.json({
      message: "Institution approved successfully",
      institution,
    });
  } catch (error) {
    console.error("Approve institution error:", error);
    return res.status(500).json({ message: "Failed to approve institution" });
  }
};

export const rejectInstitution: RequestHandler = async (req: AuthRequest, res) => {
  try {
    const { institutionId } = req.params;
    const { Institution } = await import("../models/institution");
    const { User } = await import("../models/user");

    const institution = await Institution.findByIdAndDelete(institutionId);

    if (!institution) {
      return res.status(404).json({ message: "Institution not found" });
    }

    await User.findByIdAndDelete(institution.userId);

    return res.json({ message: "Institution rejected and deleted" });
  } catch (error) {
    console.error("Reject institution error:", error);
    return res.status(500).json({ message: "Failed to reject institution" });
  }
};

export const getAllUsers: RequestHandler = async (req: AuthRequest, res) => {
  try {
    const { User } = await import("../models/user");
    const users = await User.find().select("-password");
    return res.json(users);
  } catch (error) {
    console.error("Get users error:", error);
    return res.status(500).json({ message: "Failed to fetch users" });
  }
};

export const geocodeExistingInstitutions: RequestHandler = async (req: AuthRequest, res) => {
  try {
    const { Institution } = await import("../models/institution");

    // Find all approved institutions without coordinates
    const institutionsToGeocode = await Institution.find({
      approved: true,
      $or: [
        { latitude: null },
        { latitude: undefined },
        { longitude: null },
        { longitude: undefined }
      ]
    });

    if (institutionsToGeocode.length === 0) {
      return res.json({ message: "All institutions already have coordinates", count: 0 });
    }

    let successCount = 0;
    const results = [];

    for (const institution of institutionsToGeocode) {
      if (institution.location) {
        const coords = await geocodeLocation(institution.location);
        if (coords) {
          institution.latitude = coords.latitude;
          institution.longitude = coords.longitude;
          await institution.save();
          successCount++;
          results.push({
            name: institution.name,
            location: institution.location,
            latitude: coords.latitude,
            longitude: coords.longitude,
            status: "success"
          });
        } else {
          results.push({
            name: institution.name,
            location: institution.location,
            status: "failed - no geocoding result"
          });
        }
      }
    }

    return res.json({
      message: `Geocoded ${successCount} institutions`,
      count: successCount,
      total: institutionsToGeocode.length,
      results
    });
  } catch (error) {
    console.error("Geocode institutions error:", error);
    return res.status(500).json({ message: "Failed to geocode institutions" });
  }
};
