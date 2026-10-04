const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const connectDB = require("./config/db");
const opportunityRoutes = require("./routes/opportunityRoutes");

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/opportunities", opportunityRoutes);

// Connect MongoDB
connectDB();

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "ApplyPilot backend is running",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});