import "dotenv/config";
import { connectDB } from "../db";
import { Institution } from "../models/institution";
import { geocodeLocation } from "../utils/geocoding";

async function main() {
  try {
    console.log("Connecting to database...");
    await connectDB();

    console.log("Finding institutions without coordinates...");
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
      console.log("✅ All institutions already have coordinates!");
      process.exit(0);
    }

    console.log(`Found ${institutionsToGeocode.length} institutions to geocode...\n`);

    let successCount = 0;

    for (const institution of institutionsToGeocode) {
      if (institution.location) {
        console.log(`⏳ Geocoding: ${institution.name} (${institution.location})...`);
        const coords = await geocodeLocation(institution.location);
        
        if (coords) {
          institution.latitude = coords.latitude;
          institution.longitude = coords.longitude;
          await institution.save();
          successCount++;
          console.log(`✅ Success: ${coords.latitude}, ${coords.longitude}\n`);
        } else {
          console.log(`❌ Failed: No geocoding result found\n`);
        }
      }
    }

    console.log(`\n✅ Geocoded ${successCount}/${institutionsToGeocode.length} institutions successfully!`);
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();
