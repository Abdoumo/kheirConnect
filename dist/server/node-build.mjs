import path from "node:path";
import { fileURLToPath } from "node:url";
import "dotenv/config";
import * as express$1 from "express";
import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcryptjs from "bcryptjs";
import mongoose from "mongoose";
//#region \0rolldown/runtime.js
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
//#endregion
//#region server/routes/demo.ts
var handleDemo = (req, res) => {
	res.status(200).json({ message: "Hello from Express server" });
};
//#endregion
//#region server/utils/jwt.ts
var JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this-in-production";
function generateToken(payload) {
	return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}
function verifyToken(token) {
	try {
		return jwt.verify(token, JWT_SECRET);
	} catch (error) {
		console.error("Token verification failed:", error);
		return null;
	}
}
//#endregion
//#region server/mockdb.ts
var MockDB = class {
	users = /* @__PURE__ */ new Map();
	institutions = /* @__PURE__ */ new Map();
	idCounter = 0;
	constructor() {
		this.initializeAdminUser();
	}
	generateId() {
		return String(++this.idCounter);
	}
	initializeAdminUser() {
		const adminId = this.generateId();
		const hashedPassword = bcryptjs.hashSync("Admin@123", 10);
		this.users.set(adminId, {
			_id: adminId,
			name: "Admin",
			email: "admin@khairconnect.com",
			password: hashedPassword,
			role: "admin",
			createdAt: /* @__PURE__ */ new Date()
		});
	}
	async findUserByEmail(email) {
		for (const user of this.users.values()) if (user.email === email) return user;
		return null;
	}
	async createUser(data) {
		if (await this.findUserByEmail(data.email)) throw new Error("Email already registered");
		const id = this.generateId();
		const hashedPassword = bcryptjs.hashSync(data.password, 10);
		const user = {
			_id: id,
			name: data.name,
			email: data.email,
			password: hashedPassword,
			role: data.role,
			createdAt: /* @__PURE__ */ new Date()
		};
		this.users.set(id, user);
		return user;
	}
	async comparePassword(plainPassword, hashedPassword) {
		return bcryptjs.compare(plainPassword, hashedPassword);
	}
	async findInstitutionsByUserId(userId) {
		const institutions = [];
		for (const inst of this.institutions.values()) if (inst.userId === userId) institutions.push(inst);
		return institutions;
	}
	async getAllInstitutions() {
		return Array.from(this.institutions.values());
	}
	async createInstitution(data) {
		const id = this.generateId();
		const institution = {
			_id: id,
			userId: data.userId,
			name: data.name,
			description: data.description,
			location: data.location,
			approved: false,
			donators: [],
			pendingDonators: [],
			rotationIndex: 0,
			createdAt: /* @__PURE__ */ new Date()
		};
		this.institutions.set(id, institution);
		return institution;
	}
	async findInstitutionById(id) {
		return this.institutions.get(id) || null;
	}
	async updateInstitution(id, data) {
		const institution = this.institutions.get(id);
		if (!institution) return null;
		const updated = {
			...institution,
			...data
		};
		this.institutions.set(id, updated);
		return updated;
	}
	async deleteInstitution(id) {
		const institution = this.institutions.get(id);
		if (!institution) return false;
		for (const [userId, user] of this.users.entries()) if (user._id === institution.userId) {
			this.users.delete(userId);
			break;
		}
		this.institutions.delete(id);
		return true;
	}
	async getAllUsers() {
		return Array.from(this.users.values()).map((user) => ({
			...user,
			password: "***"
		}));
	}
};
var mockDB = new MockDB();
//#endregion
//#region server/models/user.ts
var user_exports = /* @__PURE__ */ __exportAll({ User: () => User });
var userSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true
	},
	email: {
		type: String,
		required: true,
		unique: true,
		lowercase: true
	},
	password: {
		type: String,
		required: true
	},
	role: {
		type: String,
		enum: [
			"admin",
			"institution",
			"donator"
		],
		required: true
	}
}, { timestamps: true });
userSchema.pre("save", async function() {
	if (!this.isModified("password")) return;
	try {
		const salt = await bcryptjs.genSalt(10);
		this.password = await bcryptjs.hash(this.password, salt);
	} catch (error) {
		throw error;
	}
});
userSchema.methods.comparePassword = async function(password) {
	return await bcryptjs.compare(password, this.password);
};
var User = mongoose.model("User", userSchema);
//#endregion
//#region server/models/institution.ts
var institution_exports = /* @__PURE__ */ __exportAll({ Institution: () => Institution });
var institutionSchema = new mongoose.Schema({
	userId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
		required: true
	},
	name: {
		type: String,
		required: true
	},
	description: {
		type: String,
		default: ""
	},
	location: {
		type: String,
		default: ""
	},
	latitude: {
		type: Number,
		default: null
	},
	longitude: {
		type: Number,
		default: null
	},
	approved: {
		type: Boolean,
		default: false
	},
	donators: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: "User"
	}],
	pendingDonators: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: "User"
	}],
	rotationIndex: {
		type: Number,
		default: 0
	}
}, { timestamps: true });
var Institution = mongoose.model("Institution", institutionSchema);
//#endregion
//#region server/db.ts
var isConnected = false;
var useMongoDb = false;
async function connectDB() {
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
		await seedAdminAccount();
	} catch (error) {
		console.error("Failed to connect to MongoDB:", error);
		console.error("MONGODB_URI:", process.env.MONGODB_URI);
		throw new Error(`Database connection failed. Please ensure MongoDB is running at ${process.env.MONGODB_URI || "mongodb://localhost:27017/khairconnect"}`);
	}
}
async function seedAdminAccount() {
	try {
		const adminEmail = process.env.ADMIN_EMAIL || "admin@khairconnect.com";
		const adminPassword = process.env.ADMIN_PASSWORD || "Admin@123";
		if (await User.findOne({ email: adminEmail })) return;
		await new User({
			name: "Admin",
			email: adminEmail,
			password: adminPassword,
			role: "admin"
		}).save();
		console.log(`Admin account created with email: ${adminEmail}`);
	} catch (error) {
		console.error("Failed to seed admin account:", error);
	}
}
//#endregion
//#region server/utils/geocoding.ts
/**
* Geocode a location string to latitude and longitude using OpenStreetMap Nominatim API
*/
async function geocodeLocation(locationString) {
	if (!locationString || locationString.trim().length === 0) return null;
	try {
		const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationString)}&format=json&limit=1`, { headers: { "User-Agent": "InstitutionDonationApp/1.0" } });
		if (!response.ok) {
			console.error(`Geocoding API error: ${response.status}`);
			return null;
		}
		const data = await response.json();
		if (data && data.length > 0) {
			const result = data[0];
			return {
				latitude: parseFloat(result.lat),
				longitude: parseFloat(result.lon)
			};
		}
		console.warn(`No geocoding results found for: ${locationString}`);
		return null;
	} catch (error) {
		console.error(`Geocoding error for "${locationString}":`, error);
		return null;
	}
}
//#endregion
//#region server/routes/auth.ts
var handleRegister = async (req, res) => {
	try {
		const { name, email, password, role, description, location } = req.body;
		if (!name || !email || !password || !role) return res.status(400).json({ message: "Missing required fields" });
		if (useMongoDb) {
			const { User } = await Promise.resolve().then(() => user_exports);
			const { Institution } = await Promise.resolve().then(() => institution_exports);
			if (await User.findOne({ email })) return res.status(409).json({ message: "Email already registered" });
			const user = new User({
				name,
				email,
				password,
				role
			});
			await user.save();
			if (role === "institution") {
				let latitude = null;
				let longitude = null;
				if (location) {
					const coords = await geocodeLocation(location);
					if (coords) {
						latitude = coords.latitude;
						longitude = coords.longitude;
					}
				}
				await new Institution({
					userId: user._id,
					name,
					description: description || "",
					location: location || "",
					latitude,
					longitude,
					approved: false
				}).save();
			}
			const response = {
				token: generateToken({
					userId: user._id.toString(),
					email: user.email,
					role: user.role
				}),
				userId: user._id.toString(),
				role: user.role,
				name: user.name
			};
			return res.status(201).json(response);
		} else {
			const user = await mockDB.createUser({
				name,
				email,
				password,
				role
			});
			if (role === "institution") await mockDB.createInstitution({
				userId: user._id,
				name,
				description: description || "",
				location: location || ""
			});
			const response = {
				token: generateToken({
					userId: user._id,
					email: user.email,
					role: user.role
				}),
				userId: user._id,
				role: user.role,
				name: user.name
			};
			return res.status(201).json(response);
		}
	} catch (error) {
		console.error("Registration error:", error);
		return res.status(500).json({ message: error instanceof Error ? error.message : "Registration failed" });
	}
};
var handleLogin = async (req, res) => {
	try {
		const { email, password } = req.body;
		if (!email || !password) return res.status(400).json({ message: "Email and password are required" });
		if (useMongoDb) {
			const { User } = await Promise.resolve().then(() => user_exports);
			const { Institution } = await Promise.resolve().then(() => institution_exports);
			const user = await User.findOne({ email });
			if (!user) return res.status(401).json({ message: "Invalid email or password" });
			if (!await user.comparePassword(password)) return res.status(401).json({ message: "Invalid email or password" });
			if (user.role === "institution") {
				const institution = await Institution.findOne({ userId: user._id });
				if (institution && !institution.approved) return res.status(403).json({ message: "Institution not approved yet. Please wait for admin approval." });
			}
			const response = {
				token: generateToken({
					userId: user._id.toString(),
					email: user.email,
					role: user.role
				}),
				userId: user._id.toString(),
				role: user.role,
				name: user.name
			};
			return res.json(response);
		} else {
			const user = await mockDB.findUserByEmail(email);
			if (!user) return res.status(401).json({ message: "Invalid email or password" });
			if (!await mockDB.comparePassword(password, user.password)) return res.status(401).json({ message: "Invalid email or password" });
			if (user.role === "institution") {
				const institution = (await mockDB.findInstitutionsByUserId(user._id))[0];
				if (institution && !institution.approved) return res.status(403).json({ message: "Institution not approved yet. Please wait for admin approval." });
			}
			const response = {
				token: generateToken({
					userId: user._id,
					email: user.email,
					role: user.role
				}),
				userId: user._id,
				role: user.role,
				name: user.name
			};
			return res.json(response);
		}
	} catch (error) {
		console.error("Login error:", error);
		return res.status(500).json({ message: error instanceof Error ? error.message : "Login failed" });
	}
};
//#endregion
//#region server/routes/admin.ts
var getInstitutions = async (req, res) => {
	try {
		const { Institution } = await Promise.resolve().then(() => institution_exports);
		const formattedInstitutions = (await Institution.find().populate("userId", "name email")).map((inst) => ({
			_id: inst._id,
			name: inst.name,
			description: inst.description,
			location: inst.location,
			approved: inst.approved,
			createdAt: inst.createdAt
		}));
		return res.json(formattedInstitutions);
	} catch (error) {
		console.error("Get institutions error:", error);
		return res.status(500).json({ message: "Failed to fetch institutions" });
	}
};
var approveInstitution = async (req, res) => {
	try {
		const { institutionId } = req.params;
		const { Institution } = await Promise.resolve().then(() => institution_exports);
		const institution = await Institution.findById(institutionId);
		if (!institution) return res.status(404).json({ message: "Institution not found" });
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
			institution
		});
	} catch (error) {
		console.error("Approve institution error:", error);
		return res.status(500).json({ message: "Failed to approve institution" });
	}
};
var rejectInstitution = async (req, res) => {
	try {
		const { institutionId } = req.params;
		const { Institution } = await Promise.resolve().then(() => institution_exports);
		const { User } = await Promise.resolve().then(() => user_exports);
		const institution = await Institution.findByIdAndDelete(institutionId);
		if (!institution) return res.status(404).json({ message: "Institution not found" });
		await User.findByIdAndDelete(institution.userId);
		return res.json({ message: "Institution rejected and deleted" });
	} catch (error) {
		console.error("Reject institution error:", error);
		return res.status(500).json({ message: "Failed to reject institution" });
	}
};
var getAllUsers = async (req, res) => {
	try {
		const { User } = await Promise.resolve().then(() => user_exports);
		const users = await User.find().select("-password");
		return res.json(users);
	} catch (error) {
		console.error("Get users error:", error);
		return res.status(500).json({ message: "Failed to fetch users" });
	}
};
var geocodeExistingInstitutions = async (req, res) => {
	try {
		const { Institution } = await Promise.resolve().then(() => institution_exports);
		const institutionsToGeocode = await Institution.find({
			approved: true,
			$or: [
				{ latitude: null },
				{ latitude: void 0 },
				{ longitude: null },
				{ longitude: void 0 }
			]
		});
		if (institutionsToGeocode.length === 0) return res.json({
			message: "All institutions already have coordinates",
			count: 0
		});
		let successCount = 0;
		const results = [];
		for (const institution of institutionsToGeocode) if (institution.location) {
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
			} else results.push({
				name: institution.name,
				location: institution.location,
				status: "failed - no geocoding result"
			});
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
//#endregion
//#region server/routes/institutions.ts
var getApprovedInstitutions = async (req, res) => {
	try {
		const userId = req.user?.userId;
		const { Institution } = await Promise.resolve().then(() => institution_exports);
		const formattedInstitutions = (await Institution.find({ approved: true }).populate("userId", "name email")).map((inst) => ({
			_id: inst._id,
			name: inst.name,
			description: inst.description,
			location: inst.location,
			approved: inst.approved,
			createdAt: inst.createdAt,
			donatorCount: inst.donators.length,
			hasApplied: inst.pendingDonators.includes(userId),
			isApproved: inst.donators.includes(userId)
		}));
		return res.json(formattedInstitutions);
	} catch (error) {
		console.error("Get approved institutions error:", error);
		return res.status(500).json({ message: "Failed to fetch institutions" });
	}
};
var getInstitutionById = async (req, res) => {
	try {
		const { institutionId } = req.params;
		const { Institution } = await Promise.resolve().then(() => institution_exports);
		const institution = await Institution.findById(institutionId).populate("userId", "name email");
		if (!institution) return res.status(404).json({ message: "Institution not found" });
		return res.json({
			_id: institution._id,
			name: institution.name,
			description: institution.description,
			location: institution.location,
			approved: institution.approved,
			donatorCount: institution.donators.length,
			createdAt: institution.createdAt
		});
	} catch (error) {
		console.error("Get institution error:", error);
		return res.status(500).json({ message: "Failed to fetch institution" });
	}
};
var applyToJoinInstitution = async (req, res) => {
	try {
		const { institutionId } = req.params;
		const userId = req.user?.userId;
		if (!userId) return res.status(401).json({ message: "Unauthorized" });
		const { Institution } = await Promise.resolve().then(() => institution_exports);
		const institution = await Institution.findById(institutionId);
		if (!institution) return res.status(404).json({ message: "Institution not found" });
		if (institution.donators.includes(userId)) return res.status(400).json({ message: "Already a member of this institution" });
		if (institution.pendingDonators.includes(userId)) return res.status(400).json({ message: "Already applied to this institution" });
		institution.pendingDonators.push(userId);
		await institution.save();
		return res.json({ message: "Application submitted successfully" });
	} catch (error) {
		console.error("Apply to institution error:", error);
		return res.status(500).json({ message: "Failed to apply to institution" });
	}
};
var getMyInstitution = async (req, res) => {
	try {
		const userId = req.user?.userId;
		if (!userId) return res.status(401).json({ message: "Unauthorized" });
		const { Institution } = await Promise.resolve().then(() => institution_exports);
		const institution = await Institution.findOne({ userId }).populate("pendingDonators", "name email").populate("donators", "name email");
		if (!institution) return res.status(404).json({ message: "Institution not found" });
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
			createdAt: institution.createdAt
		});
	} catch (error) {
		console.error("Get my institution error:", error);
		return res.status(500).json({ message: "Failed to fetch institution" });
	}
};
var approveDonator = async (req, res) => {
	try {
		const { donatorId } = req.params;
		const userId = req.user?.userId;
		if (!userId) return res.status(401).json({ message: "Unauthorized" });
		const { Institution } = await Promise.resolve().then(() => institution_exports);
		const institution = await Institution.findOne({ userId });
		if (!institution) return res.status(404).json({ message: "Institution not found" });
		institution.pendingDonators = institution.pendingDonators.filter((id) => id.toString() !== donatorId);
		if (!institution.donators.includes(donatorId)) institution.donators.push(donatorId);
		await institution.save();
		return res.json({ message: "Donator approved successfully" });
	} catch (error) {
		console.error("Approve donator error:", error);
		return res.status(500).json({ message: "Failed to approve donator" });
	}
};
var rejectDonator = async (req, res) => {
	try {
		const { donatorId } = req.params;
		const userId = req.user?.userId;
		if (!userId) return res.status(401).json({ message: "Unauthorized" });
		const { Institution } = await Promise.resolve().then(() => institution_exports);
		const institution = await Institution.findOne({ userId });
		if (!institution) return res.status(404).json({ message: "Institution not found" });
		institution.pendingDonators = institution.pendingDonators.filter((id) => id.toString() !== donatorId);
		await institution.save();
		return res.json({ message: "Donator rejected successfully" });
	} catch (error) {
		console.error("Reject donator error:", error);
		return res.status(500).json({ message: "Failed to reject donator" });
	}
};
var getDonatorApprovedInstitutions = async (req, res) => {
	try {
		const userId = req.user?.userId;
		if (!userId) return res.status(401).json({ message: "Unauthorized" });
		const { Institution } = await Promise.resolve().then(() => institution_exports);
		const { WeeklyNeed } = await import("./weekly-need-g2IpI4eo.js");
		const institutions = await Institution.find({ donators: userId }).populate("userId", "name email");
		const institutionsWithNeeds = await Promise.all(institutions.map(async (inst) => {
			const weeklyNeeds = await WeeklyNeed.find({
				institutionId: inst._id,
				isActive: true
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
					urgency: need.urgency
				})),
				createdAt: inst.createdAt
			};
		}));
		return res.json(institutionsWithNeeds);
	} catch (error) {
		console.error("Get donator approved institutions error:", error);
		return res.status(500).json({ message: "Failed to fetch institutions" });
	}
};
var updateInstitutionLocation = async (req, res) => {
	try {
		const userId = req.user?.userId;
		const { latitude, longitude } = req.body;
		if (!userId) return res.status(401).json({ message: "Unauthorized" });
		if (typeof latitude !== "number" || typeof longitude !== "number") return res.status(400).json({ message: "Invalid latitude or longitude" });
		const { Institution } = await Promise.resolve().then(() => institution_exports);
		const institution = await Institution.findOne({ userId });
		if (!institution) return res.status(404).json({ message: "Institution not found" });
		institution.latitude = latitude;
		institution.longitude = longitude;
		await institution.save();
		return res.json({
			message: "Location updated successfully",
			latitude: institution.latitude,
			longitude: institution.longitude
		});
	} catch (error) {
		console.error("Update institution location error:", error);
		return res.status(500).json({ message: "Failed to update location" });
	}
};
//#endregion
//#region server/routes/weekly-needs.ts
var createWeeklyNeed = async (req, res) => {
	try {
		const userId = req.user?.userId;
		const { title, description, urgency } = req.body;
		if (!userId || !title || !description) return res.status(400).json({ message: "Missing required fields" });
		const { Institution } = await Promise.resolve().then(() => institution_exports);
		const { WeeklyNeed } = await import("./weekly-need-g2IpI4eo.js");
		const institution = await Institution.findOne({ userId });
		if (!institution) return res.status(404).json({ message: "Institution not found" });
		const weeklyNeed = new WeeklyNeed({
			institutionId: institution._id,
			title,
			description,
			urgency: urgency || "quotidien",
			isActive: true
		});
		await weeklyNeed.save();
		return res.status(201).json({
			_id: weeklyNeed._id,
			title: weeklyNeed.title,
			description: weeklyNeed.description,
			urgency: weeklyNeed.urgency,
			isActive: weeklyNeed.isActive,
			createdAt: weeklyNeed.createdAt
		});
	} catch (error) {
		console.error("Create weekly need error:", error);
		return res.status(500).json({ message: "Failed to create weekly need" });
	}
};
var getMyWeeklyNeeds = async (req, res) => {
	try {
		const userId = req.user?.userId;
		if (!userId) return res.status(401).json({ message: "Unauthorized" });
		const { Institution } = await Promise.resolve().then(() => institution_exports);
		const { WeeklyNeed } = await import("./weekly-need-g2IpI4eo.js");
		const institution = await Institution.findOne({ userId });
		if (!institution) return res.status(404).json({ message: "Institution not found" });
		const weeklyNeeds = await WeeklyNeed.find({ institutionId: institution._id }).sort({ createdAt: -1 });
		return res.json(weeklyNeeds.map((need) => ({
			_id: need._id,
			title: need.title,
			description: need.description,
			urgency: need.urgency,
			isActive: need.isActive,
			createdAt: need.createdAt,
			updatedAt: need.updatedAt
		})));
	} catch (error) {
		console.error("Get weekly needs error:", error);
		return res.status(500).json({ message: "Failed to fetch weekly needs" });
	}
};
var updateWeeklyNeed = async (req, res) => {
	try {
		const { needId } = req.params;
		const userId = req.user?.userId;
		const { title, description, urgency, isActive } = req.body;
		if (!userId) return res.status(401).json({ message: "Unauthorized" });
		const { Institution } = await Promise.resolve().then(() => institution_exports);
		const { WeeklyNeed } = await import("./weekly-need-g2IpI4eo.js");
		const institution = await Institution.findOne({ userId });
		if (!institution) return res.status(404).json({ message: "Institution not found" });
		const weeklyNeed = await WeeklyNeed.findById(needId);
		if (!weeklyNeed) return res.status(404).json({ message: "Weekly need not found" });
		if (weeklyNeed.institutionId.toString() !== institution._id.toString()) return res.status(403).json({ message: "Forbidden" });
		if (title) weeklyNeed.title = title;
		if (description) weeklyNeed.description = description;
		if (urgency) weeklyNeed.urgency = urgency;
		if (isActive !== void 0) weeklyNeed.isActive = isActive;
		await weeklyNeed.save();
		return res.json({
			_id: weeklyNeed._id,
			title: weeklyNeed.title,
			description: weeklyNeed.description,
			urgency: weeklyNeed.urgency,
			isActive: weeklyNeed.isActive,
			createdAt: weeklyNeed.createdAt,
			updatedAt: weeklyNeed.updatedAt
		});
	} catch (error) {
		console.error("Update weekly need error:", error);
		return res.status(500).json({ message: "Failed to update weekly need" });
	}
};
var deleteWeeklyNeed = async (req, res) => {
	try {
		const { needId } = req.params;
		const userId = req.user?.userId;
		if (!userId) return res.status(401).json({ message: "Unauthorized" });
		const { Institution } = await Promise.resolve().then(() => institution_exports);
		const { WeeklyNeed } = await import("./weekly-need-g2IpI4eo.js");
		const institution = await Institution.findOne({ userId });
		if (!institution) return res.status(404).json({ message: "Institution not found" });
		const weeklyNeed = await WeeklyNeed.findById(needId);
		if (!weeklyNeed) return res.status(404).json({ message: "Weekly need not found" });
		if (weeklyNeed.institutionId.toString() !== institution._id.toString()) return res.status(403).json({ message: "Forbidden" });
		await WeeklyNeed.deleteOne({ _id: needId });
		return res.json({ message: "Weekly need deleted successfully" });
	} catch (error) {
		console.error("Delete weekly need error:", error);
		return res.status(500).json({ message: "Failed to delete weekly need" });
	}
};
var getInstitutionWeeklyNeeds = async (req, res) => {
	try {
		const { institutionId } = req.params;
		const { WeeklyNeed } = await import("./weekly-need-g2IpI4eo.js");
		const { Institution } = await Promise.resolve().then(() => institution_exports);
		if (!await Institution.findById(institutionId)) return res.status(404).json({ message: "Institution not found" });
		const weeklyNeeds = await WeeklyNeed.find({
			institutionId,
			isActive: true
		}).sort({ createdAt: -1 });
		return res.json(weeklyNeeds.map((need) => ({
			_id: need._id,
			title: need.title,
			description: need.description,
			urgency: need.urgency,
			createdAt: need.createdAt
		})));
	} catch (error) {
		console.error("Get institution weekly needs error:", error);
		return res.status(500).json({ message: "Failed to fetch weekly needs" });
	}
};
//#endregion
//#region server/routes/donation-turns.ts
var getDonationTurns = async (req, res) => {
	try {
		const userId = req.user?.userId;
		if (!userId) return res.status(401).json({ message: "Unauthorized" });
		const { Institution } = await Promise.resolve().then(() => institution_exports);
		const { DonationTurn } = await import("./donation-turn-ChVE_Doo.js");
		const institution = await Institution.findOne({ userId }).populate("donators", "name email");
		if (!institution) return res.status(404).json({ message: "Institution not found" });
		const turns = await DonationTurn.find({ institutionId: institution._id }).populate("donatorId", "name email").sort({ week: -1 });
		return res.json(turns.map((turn) => ({
			_id: turn._id,
			donatorId: turn.donatorId?._id,
			donatorName: turn.donatorId?.name,
			donatorEmail: turn.donatorId?.email,
			week: turn.week,
			status: turn.status,
			weeklyNeeds: turn.weeklyNeeds,
			createdAt: turn.createdAt
		})));
	} catch (error) {
		console.error("Get donation turns error:", error);
		return res.status(500).json({ message: "Failed to fetch donation turns" });
	}
};
var getCurrentWeek = async (req, res) => {
	try {
		const userId = req.user?.userId;
		if (!userId) return res.status(401).json({ message: "Unauthorized" });
		const { Institution } = await Promise.resolve().then(() => institution_exports);
		const { DonationTurn } = await import("./donation-turn-ChVE_Doo.js");
		const institution = await Institution.findOne({ userId });
		if (!institution) return res.status(404).json({ message: "Institution not found" });
		const currentTurn = await DonationTurn.findOne({
			institutionId: institution._id,
			status: "pending"
		}).populate("donatorId", "name email").sort({ week: -1 });
		if (!currentTurn) {
			if (institution.donators.length === 0) return res.json({
				_id: null,
				donatorName: "No active donators",
				status: "no-donators",
				week: 0
			});
			const newTurn = new DonationTurn({
				institutionId: institution._id,
				donatorId: institution.donators[0],
				week: 1,
				status: "pending",
				weeklyNeeds: ""
			});
			await newTurn.save();
			const populated = await newTurn.populate("donatorId", "name email");
			return res.json({
				_id: populated._id,
				donatorId: populated.donatorId?._id,
				donatorName: populated.donatorId?.name,
				donatorEmail: populated.donatorId?.email,
				week: populated.week,
				status: populated.status,
				weeklyNeeds: populated.weeklyNeeds
			});
		}
		return res.json({
			_id: currentTurn._id,
			donatorId: currentTurn.donatorId?._id,
			donatorName: currentTurn.donatorId?.name,
			donatorEmail: currentTurn.donatorId?.email,
			week: currentTurn.week,
			status: currentTurn.status,
			weeklyNeeds: currentTurn.weeklyNeeds
		});
	} catch (error) {
		console.error("Get current week error:", error);
		return res.status(500).json({ message: "Failed to fetch current week" });
	}
};
var acceptDonationTurn = async (req, res) => {
	try {
		const { turnId } = req.params;
		const userId = req.user?.userId;
		if (!userId) return res.status(401).json({ message: "Unauthorized" });
		const { DonationTurn } = await import("./donation-turn-ChVE_Doo.js");
		const turn = await DonationTurn.findById(turnId);
		if (!turn) return res.status(404).json({ message: "Donation turn not found" });
		if (turn.donatorId.toString() !== userId) return res.status(403).json({ message: "Forbidden" });
		turn.status = "accepted";
		await turn.save();
		return res.json({
			message: "Donation turn accepted",
			status: turn.status
		});
	} catch (error) {
		console.error("Accept donation turn error:", error);
		return res.status(500).json({ message: "Failed to accept donation turn" });
	}
};
var declineDonationTurn = async (req, res) => {
	try {
		const { turnId } = req.params;
		const userId = req.user?.userId;
		if (!userId) return res.status(401).json({ message: "Unauthorized" });
		const { Institution } = await Promise.resolve().then(() => institution_exports);
		const { DonationTurn } = await import("./donation-turn-ChVE_Doo.js");
		const turn = await DonationTurn.findById(turnId);
		if (!turn) return res.status(404).json({ message: "Donation turn not found" });
		if (turn.donatorId.toString() !== userId) return res.status(403).json({ message: "Forbidden" });
		turn.status = "declined";
		await turn.save();
		const institution = await Institution.findById(turn.institutionId).populate("donators", "_id");
		if (!institution || institution.donators.length === 0) return res.json({ message: "Turn declined, no other donators available" });
		const nextIndex = (institution.donators.findIndex((d) => d._id.toString() === turn.donatorId.toString()) + 1) % institution.donators.length;
		const nextDonator = institution.donators[nextIndex]._id;
		await new DonationTurn({
			institutionId: turn.institutionId,
			donatorId: nextDonator,
			week: turn.week,
			status: "pending",
			weeklyNeeds: ""
		}).save();
		return res.json({
			message: "Turn declined, moved to next donator",
			nextDonatorId: nextDonator
		});
	} catch (error) {
		console.error("Decline donation turn error:", error);
		return res.status(500).json({ message: "Failed to decline donation turn" });
	}
};
var assignDonationTurn = async (req, res) => {
	try {
		const { donatorId } = req.params;
		const userId = req.user?.userId;
		if (!userId) return res.status(401).json({ message: "Unauthorized" });
		const { Institution } = await Promise.resolve().then(() => institution_exports);
		const { DonationTurn } = await import("./donation-turn-ChVE_Doo.js");
		const institution = await Institution.findOne({ userId });
		if (!institution) return res.status(404).json({ message: "Institution not found" });
		if (!institution.donators.includes(donatorId)) return res.status(400).json({ message: "Donator is not part of this institution" });
		const currentTurn = await DonationTurn.findOne({
			institutionId: institution._id,
			status: "pending"
		});
		if (currentTurn) {
			currentTurn.status = "declined";
			await currentTurn.save();
		}
		const maxWeekTurn = await DonationTurn.findOne({ institutionId: institution._id }).sort({ week: -1 });
		const nextWeek = maxWeekTurn ? maxWeekTurn.week + 1 : 1;
		const newTurn = new DonationTurn({
			institutionId: institution._id,
			donatorId,
			week: nextWeek,
			status: "pending",
			weeklyNeeds: ""
		});
		await newTurn.save();
		const populated = await newTurn.populate("donatorId", "name email");
		return res.status(201).json({
			message: "Donation turn assigned",
			_id: populated._id,
			donatorId: populated.donatorId?._id,
			donatorName: populated.donatorId?.name,
			week: populated.week,
			status: populated.status
		});
	} catch (error) {
		console.error("Assign donation turn error:", error);
		return res.status(500).json({ message: "Failed to assign donation turn" });
	}
};
var getMyDonationTurn = async (req, res) => {
	try {
		const userId = req.user?.userId;
		if (!userId) return res.status(401).json({ message: "Unauthorized" });
		const { DonationTurn } = await import("./donation-turn-ChVE_Doo.js");
		const turn = await DonationTurn.findOne({
			donatorId: userId,
			status: "pending"
		}).populate("institutionId", "name location").sort({ createdAt: -1 });
		if (!turn) return res.json({
			_id: null,
			message: "No pending donation turn"
		});
		return res.json({
			_id: turn._id,
			institutionName: turn.institutionId?.name,
			institutionLocation: turn.institutionId?.location,
			week: turn.week,
			weeklyNeeds: turn.weeklyNeeds,
			status: turn.status
		});
	} catch (error) {
		console.error("Get my donation turn error:", error);
		return res.status(500).json({ message: "Failed to fetch donation turn" });
	}
};
var getDonationHistory = async (req, res) => {
	try {
		const userId = req.user?.userId;
		if (!userId) return res.status(401).json({ message: "Unauthorized" });
		const { DonationTurn } = await import("./donation-turn-ChVE_Doo.js");
		const turns = await DonationTurn.find({
			donatorId: userId,
			status: { $in: ["completed", "accepted"] }
		}).populate("institutionId", "name location").sort({
			week: -1,
			createdAt: -1
		});
		return res.json(turns.map((turn) => ({
			_id: turn._id,
			institutionId: turn.institutionId?._id,
			institutionName: turn.institutionId?.name,
			institutionLocation: turn.institutionId?.location,
			week: turn.week,
			weeklyNeeds: turn.weeklyNeeds,
			status: turn.status,
			completedAt: turn.updatedAt,
			createdAt: turn.createdAt
		})));
	} catch (error) {
		console.error("Get donation history error:", error);
		return res.status(500).json({ message: "Failed to fetch donation history" });
	}
};
//#endregion
//#region server/routes/donation-confirmations.ts
var saveDonationConfirmation = async (req, res) => {
	try {
		const userId = req.user?.userId;
		const { institutionId, weeklyNeedId, needTitle, status, donationDetails } = req.body;
		if (!userId) return res.status(401).json({ message: "Unauthorized" });
		if (!institutionId || !weeklyNeedId || !needTitle || !status) return res.status(400).json({ message: "Missing required fields" });
		const { DonationConfirmation } = await import("./donation-confirmation-B3Agvnaj.js");
		const existing = await DonationConfirmation.findOne({
			donatorId: userId,
			institutionId,
			weeklyNeedId
		});
		if (existing) {
			existing.status = status;
			existing.donationDetails = donationDetails || "";
			await existing.save();
			return res.json({
				message: "Confirmation updated",
				data: existing
			});
		}
		const confirmation = new DonationConfirmation({
			donatorId: userId,
			institutionId,
			weeklyNeedId,
			needTitle,
			status,
			donationDetails: donationDetails || ""
		});
		await confirmation.save();
		return res.status(201).json({
			message: "Confirmation saved",
			data: confirmation
		});
	} catch (error) {
		console.error("Save donation confirmation error:", error);
		return res.status(500).json({ message: "Failed to save confirmation" });
	}
};
var getDonationConfirmations = async (req, res) => {
	try {
		const userId = req.user?.userId;
		if (!userId) return res.status(401).json({ message: "Unauthorized" });
		const { DonationConfirmation } = await import("./donation-confirmation-B3Agvnaj.js");
		const confirmations = await DonationConfirmation.find({ donatorId: userId }).populate("institutionId", "name location").populate("weeklyNeedId").sort({ createdAt: -1 });
		return res.json(confirmations);
	} catch (error) {
		console.error("Get donation confirmations error:", error);
		return res.status(500).json({ message: "Failed to fetch confirmations" });
	}
};
var deleteDonationConfirmation = async (req, res) => {
	try {
		const userId = req.user?.userId;
		const { confirmationId } = req.params;
		if (!userId) return res.status(401).json({ message: "Unauthorized" });
		const { DonationConfirmation } = await import("./donation-confirmation-B3Agvnaj.js");
		const confirmation = await DonationConfirmation.findById(confirmationId);
		if (!confirmation) return res.status(404).json({ message: "Confirmation not found" });
		if (confirmation.donatorId.toString() !== userId) return res.status(403).json({ message: "Forbidden" });
		await DonationConfirmation.findByIdAndDelete(confirmationId);
		return res.json({ message: "Confirmation deleted" });
	} catch (error) {
		console.error("Delete donation confirmation error:", error);
		return res.status(500).json({ message: "Failed to delete confirmation" });
	}
};
//#endregion
//#region server/middleware/auth.ts
function authMiddleware(req, res, next) {
	try {
		const authHeader = req.headers.authorization;
		if (!authHeader || !authHeader.startsWith("Bearer ")) return res.status(401).json({ message: "Missing or invalid authorization header" });
		const payload = verifyToken(authHeader.substring(7));
		if (!payload) return res.status(401).json({ message: "Invalid token" });
		req.user = payload;
		next();
	} catch (error) {
		return res.status(401).json({ message: "Authentication failed" });
	}
}
function adminOnly(req, res, next) {
	if (req.user?.role !== "admin") return res.status(403).json({ message: "Admin access required" });
	next();
}
//#endregion
//#region server/index.ts
function createServer() {
	const app = express();
	app.use(cors());
	app.use(express.json());
	app.use(express.urlencoded({ extended: true }));
	connectDB().catch((error) => {
		console.error("Database connection failed:", error);
	});
	console.log("[ROUTE] Registering /api/ping");
	app.get("/api/ping", (_req, res) => {
		const ping = process.env.PING_MESSAGE ?? "ping";
		res.json({ message: ping });
	});
	app.get("/api/demo", handleDemo);
	app.get("/api/institutions/map/locations", async (_req, res) => {
		try {
			const { Institution } = await Promise.resolve().then(() => institution_exports);
			const { WeeklyNeed } = await import("./weekly-need-g2IpI4eo.js");
			const { DonationConfirmation } = await import("./donation-confirmation-B3Agvnaj.js");
			const { DonationTurn } = await import("./donation-turn-ChVE_Doo.js");
			const institutions = await Institution.find({ approved: true }).select("name location description latitude longitude");
			const formattedInstitutions = await Promise.all(institutions.filter((inst) => inst.latitude && inst.longitude).map(async (inst) => {
				const urgentNeeds = await WeeklyNeed.findOne({
					institutionId: inst._id,
					urgency: "urgent",
					isActive: true
				});
				const nonUrgentNeeds = await WeeklyNeed.findOne({
					institutionId: inst._id,
					urgency: "quotidien",
					isActive: true
				});
				const confirmedDonation = await DonationConfirmation.findOne({
					institutionId: inst._id,
					status: "confirmed"
				});
				const activeTurn = await DonationTurn.findOne({
					institutionId: inst._id,
					status: { $in: ["pending", "accepted"] }
				});
				let markerStatus = "blue";
				if (confirmedDonation) markerStatus = "green";
				else if (urgentNeeds) markerStatus = "red";
				else if (nonUrgentNeeds) markerStatus = "orange";
				else if (activeTurn) markerStatus = "blue";
				return {
					_id: inst._id,
					name: inst.name,
					location: inst.location,
					description: inst.description,
					latitude: inst.latitude,
					longitude: inst.longitude,
					markerStatus
				};
			}));
			return res.json(formattedInstitutions);
		} catch (error) {
			console.error("Get institutions map error:", error);
			return res.status(500).json({ message: "Failed to fetch institutions" });
		}
	});
	console.log("[ROUTE] Registering auth routes");
	app.post("/api/auth/register", handleRegister);
	app.post("/api/auth/login", handleLogin);
	console.log("[ROUTE] Registering admin routes");
	console.log("[ROUTE] Registering GET /api/admin/institutions");
	app.get("/api/admin/institutions", authMiddleware, adminOnly, getInstitutions);
	console.log("[ROUTE] Registering POST /api/admin/institutions/:institutionId/approve");
	app.post("/api/admin/institutions/:institutionId/approve", authMiddleware, adminOnly, approveInstitution);
	console.log("[ROUTE] Registering POST /api/admin/institutions/:institutionId/reject");
	app.post("/api/admin/institutions/:institutionId/reject", authMiddleware, adminOnly, rejectInstitution);
	console.log("[ROUTE] Registering GET /api/admin/users");
	app.get("/api/admin/users", authMiddleware, adminOnly, getAllUsers);
	console.log("[ROUTE] Registering POST /api/admin/geocode-institutions");
	app.post("/api/admin/geocode-institutions", authMiddleware, adminOnly, geocodeExistingInstitutions);
	console.log("[ROUTE] Registering public institution routes");
	console.log("[ROUTE] Registering GET /api/institutions");
	app.get("/api/institutions", authMiddleware, getApprovedInstitutions);
	console.log("[ROUTE] Registering GET /api/institutions/:institutionId");
	app.get("/api/institutions/:institutionId", authMiddleware, getInstitutionById);
	console.log("[ROUTE] Registering POST /api/institutions/:institutionId/apply");
	app.post("/api/institutions/:institutionId/apply", authMiddleware, applyToJoinInstitution);
	console.log("[ROUTE] Registering GET /api/donator/approved-institutions");
	app.get("/api/donator/approved-institutions", authMiddleware, getDonatorApprovedInstitutions);
	console.log("[ROUTE] Registering institution dashboard routes");
	console.log("[ROUTE] Registering GET /api/institution/my-institution");
	app.get("/api/institution/my-institution", authMiddleware, getMyInstitution);
	console.log("[ROUTE] Registering POST /api/institution/donators/:donatorId/approve");
	app.post("/api/institution/donators/:donatorId/approve", authMiddleware, approveDonator);
	console.log("[ROUTE] Registering POST /api/institution/donators/:donatorId/reject");
	app.post("/api/institution/donators/:donatorId/reject", authMiddleware, rejectDonator);
	console.log("[ROUTE] Registering PUT /api/institution/location");
	app.put("/api/institution/location", authMiddleware, updateInstitutionLocation);
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
	app.post("/api/donation-confirmations", authMiddleware, saveDonationConfirmation);
	app.get("/api/donation-confirmations", authMiddleware, getDonationConfirmations);
	app.delete("/api/donation-confirmations/:confirmationId", authMiddleware, deleteDonationConfirmation);
	return app;
}
//#endregion
//#region server/node-build.ts
var app = createServer();
var PORT = process.env.PORT || 9999;
var HOST = process.env.HOST || "0.0.0.0";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var distPath = path.join(__dirname, "../spa");
app.use(express$1.static(distPath));
app.use((req, res) => {
	if (req.path.startsWith("/api/") || req.path.startsWith("/health")) return res.status(404).json({ error: "API endpoint not found" });
	res.sendFile(path.join(distPath, "index.html"));
});
app.listen(PORT, HOST, () => {
	console.log(`🚀 Fusion Starter server running on http://${HOST}:${PORT}`);
	console.log(`📱 Frontend: http://${HOST}:${PORT}`);
	console.log(`🔧 API: http://${HOST}:${PORT}/api`);
});
process.on("SIGTERM", () => {
	console.log("🛑 Received SIGTERM, shutting down gracefully");
	process.exit(0);
});
process.on("SIGINT", () => {
	console.log("🛑 Received SIGINT, shutting down gracefully");
	process.exit(0);
});
//#endregion
export {};

//# sourceMappingURL=node-build.mjs.map