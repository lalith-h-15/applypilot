const dotenv = require("dotenv");

const connectDB = require("../config/db");
const Opportunity = require("../models/Opportunity");
const opportunities = require("./opportunities");

dotenv.config();

const seedDatabase = async () => {
  try {
    await connectDB();

    console.log(`Preparing to insert ${opportunities.length} opportunities...`);

    await Opportunity.deleteMany();

    await Opportunity.insertMany(opportunities);

    console.log(`${opportunities.length} opportunities inserted successfully.`);

    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error.message);
    process.exit(1);
  }
};

seedDatabase();