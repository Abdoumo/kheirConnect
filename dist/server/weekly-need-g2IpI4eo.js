import mongoose from "mongoose";
//#region server/models/weekly-need.ts
var weeklyNeedSchema = new mongoose.Schema({
	institutionId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Institution",
		required: true
	},
	title: {
		type: String,
		required: true
	},
	description: {
		type: String,
		required: true
	},
	urgency: {
		type: String,
		enum: ["urgent", "quotidien"],
		default: "quotidien"
	},
	isActive: {
		type: Boolean,
		default: true
	}
}, { timestamps: true });
var WeeklyNeed = mongoose.model("WeeklyNeed", weeklyNeedSchema);
//#endregion
export { WeeklyNeed };

//# sourceMappingURL=weekly-need-g2IpI4eo.js.map