import mongoose from "mongoose";
import { User } from "./models/user";
import { Institution } from "./models/institution";

let isConnected = false;
export let useMongoDb = false;

export async function connectDB() {
  if (isConnected) {
    console.log("Using existing database connection");
    return;
  }

  try {
    const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/khairconnect";

    await mongoose.connect(mongoUri);
    isConnected = true;
    useMongoDb = true;
    console.log("Connected to MongoDB");

    // Seed admin account and institutions if they don't exist
    await seedAdminAccount();
    // await seedInstitutions();
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    console.error("MONGODB_URI:", process.env.MONGODB_URI);
    throw new Error(`Database connection failed. Please ensure MongoDB is running at ${process.env.MONGODB_URI || "mongodb://localhost:27017/khairconnect"}`);
  }
}

export async function disconnectDB() {
  if (!isConnected) {
    return;
  }

  try {
    await mongoose.disconnect();
    isConnected = false;
    console.log("Disconnected from MongoDB");
  } catch (error) {
    console.error("Failed to disconnect from MongoDB:", error);
    throw error;
  }
}

async function seedAdminAccount() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || "admin@khairconnect.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "Admin@123";

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      return;
    }

    // Create admin account
    const admin = new User({
      name: "Admin",
      email: adminEmail,
      password: adminPassword,
      role: "admin",
    });

    await admin.save();
    console.log(`Admin account created with email: ${adminEmail}`);
  } catch (error) {
    console.error("Failed to seed admin account:", error);
  }
}

async function seedInstitutions() {
  try {
    // Check if institutions already exist
    const existingInstitutions = await Institution.countDocuments();
    if (existingInstitutions > 0) {
      return;
    }

    // Create institutional users first
    const institution1User = await User.findOne({ email: "contact@hopefoundation.org" });
    const institution2User = await User.findOne({ email: "info@communitycare.org" });
    const institution3User = await User.findOne({ email: "support@educationforall.org" });

    // Create institution users if they don't exist
    let user1 = institution1User;
    if (!user1) {
      user1 = await User.create({
        name: "Hope Foundation",
        email: "contact@hopefoundation.org",
        password: "HopePass123",
        role: "institution",
      });
    }

    let user2 = institution2User;
    if (!user2) {
      user2 = await User.create({
        name: "Community Care Center",
        email: "info@communitycare.org",
        password: "CarePass123",
        role: "institution",
      });
    }

    let user3 = institution3User;
    if (!user3) {
      user3 = await User.create({
        name: "Education for All",
        email: "support@educationforall.org",
        password: "EducatePass123",
        role: "institution",
      });
    }

    // Create institutions
    const institutions = [
      {
        userId: user1._id,
        name: "Hope Foundation",
        description:
          "Providing support and relief to underprivileged communities. We focus on healthcare, education, and emergency relief.",
        location: "Cairo, Egypt",
        approved: true,
        donators: [],
        pendingDonators: [],
        rotationIndex: 0,
      },
      {
        userId: user2._id,
        name: "Community Care Center",
        description:
          "A grassroots organization dedicated to community development and social welfare. We organize food drives, health camps, and educational programs.",
        location: "Alexandria, Egypt",
        approved: true,
        donators: [],
        pendingDonators: [],
        rotationIndex: 0,
      },
      {
        userId: user3._id,
        name: "Education for All",
        description:
          "Committed to providing quality education to underprivileged children. We provide scholarships, learning materials, and mentorship programs.",
        location: "Giza, Egypt",
        approved: true,
        donators: [],
        pendingDonators: [],
        rotationIndex: 0,
      },
    ];

    await Institution.insertMany(institutions);
    console.log("Sample institutions seeded successfully");
  } catch (error) {
    console.error("Failed to seed institutions:", error);
  }
}
