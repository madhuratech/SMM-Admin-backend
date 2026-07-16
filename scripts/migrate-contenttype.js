require("dotenv").config();
const mongoose = require("mongoose");
const Service = require("../model/service");

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const result = await Service.updateMany(
      { contentType: { $exists: false } },
      { $set: { contentType: "post" } }
    );

    console.log(`Migration complete: ${result.modifiedCount} services updated`);
  } catch (error) {
    console.error("Migration failed:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

migrate();
