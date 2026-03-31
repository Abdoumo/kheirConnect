import { RequestHandler } from "express";
import { generateToken } from "../utils/jwt";
import { AuthResponse } from "@shared/api";
import { mockDB } from "../mockdb";
import { useMongoDb } from "../db";

export const handleRegister: RequestHandler = async (req, res) => {
  try {
    const { name, email, password, role, description, location } = req.body;

    // Validate input
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (useMongoDb) {
      // Use MongoDB
      const { User } = await import("../models/user");
      const { Institution } = await import("../models/institution");

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(409).json({ message: "Email already registered" });
      }

      const user = new User({
        name,
        email,
        password,
        role,
      });

      await user.save();

      if (role === "institution") {
        const institution = new Institution({
          userId: user._id,
          name,
          description: description || "",
          location: location || "",
          approved: false,
        });
        await institution.save();
      }

      const token = generateToken({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      });

      const response: AuthResponse = {
        token,
        userId: user._id.toString(),
        role: user.role,
        name: user.name,
      };

      return res.status(201).json(response);
    } else {
      // Use mock database
      const user = await mockDB.createUser({
        name,
        email,
        password,
        role,
      });

      if (role === "institution") {
        await mockDB.createInstitution({
          userId: user._id,
          name,
          description: description || "",
          location: location || "",
        });
      }

      const token = generateToken({
        userId: user._id,
        email: user.email,
        role: user.role,
      });

      const response: AuthResponse = {
        token,
        userId: user._id,
        role: user.role,
        name: user.name,
      };

      return res.status(201).json(response);
    }
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({
      message: error instanceof Error ? error.message : "Registration failed",
    });
  }
};

export const handleLogin: RequestHandler = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    if (useMongoDb) {
      // Use MongoDB
      const { User } = await import("../models/user");
      const { Institution } = await import("../models/institution");

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      if (user.role === "institution") {
        const institution = await Institution.findOne({ userId: user._id });
        if (institution && !institution.approved) {
          return res.status(403).json({
            message: "Institution not approved yet. Please wait for admin approval.",
          });
        }
      }

      const token = generateToken({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      });

      const response: AuthResponse = {
        token,
        userId: user._id.toString(),
        role: user.role,
        name: user.name,
      };

      return res.json(response);
    } else {
      // Use mock database
      const user = await mockDB.findUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const isPasswordValid = await mockDB.comparePassword(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      if (user.role === "institution") {
        const institutions = await mockDB.findInstitutionsByUserId(user._id);
        const institution = institutions[0];
        if (institution && !institution.approved) {
          return res.status(403).json({
            message: "Institution not approved yet. Please wait for admin approval.",
          });
        }
      }

      const token = generateToken({
        userId: user._id,
        email: user.email,
        role: user.role,
      });

      const response: AuthResponse = {
        token,
        userId: user._id,
        role: user.role,
        name: user.name,
      };

      return res.json(response);
    }
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      message: error instanceof Error ? error.message : "Login failed",
    });
  }
};
