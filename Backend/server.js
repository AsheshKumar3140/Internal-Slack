import express from "express";
import dotenv from "dotenv";
import { connectToDatabase } from "./config/supabase.js";
import authRoutes from "./routes/authRoutes.js";

dotenv.config({ path: "../.env" });

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

app.get("/", (req, res) => {
  res.send("Hello World");
});

// Initialize server and database connection
const startServer = async () => {
  try {
    // Connect to database
    await connectToDatabase();
    
    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server is running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();