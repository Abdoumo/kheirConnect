import mongoose from "mongoose";
//#region server/models/donation-turn.ts
var donationTurnSchema = new mongoose.Schema({
	institutionId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Institution",
		required: true
	},
	donatorId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
		required: true
	},
	week: {
		type: Number,
		required: true
	},
	status: {
		type: String,
		enum: [
			"pending",
			"accepted",
			"completed"
		],
		default: "pending"
	},
	weeklyNeeds: {
		type: String,
		default: ""
	}
}, { timestamps: true });
var DonationTurn = mongoose.model("DonationTurn", donationTurnSchema);
//#endregion
export { DonationTurn };

//# sourceMappingURL=donation-turn-ChVE_Doo.js.map