import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.js";
import membersRoutes from "./routes/members.route.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import rfidRoute from "./routes/rfid.route.js";
// import logRoute from "./routes/log.route.js";
import banRoute from "./routes/ban.route.js";
import verifyUser from "./middlewares/auth.middleware.js";
import imgRoute from "./routes/images.route.js";
import branchesRoute from "./routes/branches.route.js";
import usersRoute from "./routes/users.route.js";
import masterRoute from "./routes/master.route.js";
import visitsRoute from "./routes/visit.route.js";
import rangeRoute from "./routes/range.route.js";
import playersRoute from "./routes/players.route.js";
import docsRoute from "./routes/docs.route.js";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.json({ limit: "10mb" })); 
app.use(
  cors({
    origin: ["http://localhost:5173"],
    methods: ["POST", "GET", "DELETE", "PUT"],
    credentials: true,
  })
);
app.use(cookieParser());

//ROUTES
app.use("/auth", authRoutes);
app.use("/branches", branchesRoute);
app.use("/users", usersRoute);
app.use("/members/master", masterRoute);
app.use("/members", membersRoutes);
app.use("/docx", docsRoute); 
app.use("/images", imgRoute);
app.use("/rfid", rfidRoute);
app.use("/status", banRoute);
// app.use("/saveMemberData", logRoute);

app.use("/visits", visitsRoute);
app.use("/range", rangeRoute);
app.use("/players", playersRoute);

// Serve static files
app.use("/upload", express.static(path.join(__dirname, "../Ebingo/public/upload")));
app.use("/valid", express.static(path.join(__dirname, "../Ebingo/public/valid")));

// API endpoint to get all uploaded images
app.get("/images", (req, res) => {
  const uploadDir = path.join(__dirname, "../Ebingo/public/upload");
  fs.readdir(uploadDir, (err, files) => {
    if (err) {
      return res.status(500).json({ error: "Unable to scan directory: " + err });
    }
    const images = files.filter((file) => /\.(jpeg|jpg|png|gif)$/.test(file));
    const imagePaths = images.map((file) => ({
      name: file,
      path: `/upload/${file}`,
    }));
    res.json(imagePaths);
  });
});

// Route for deleting files
app.delete("/delete/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, "../Ebingo/public/upload", filename);

  fs.unlink(filePath, (err) => {
    if (err) {
      return res.status(500).json({ error: "File not found or could not be deleted" });
    }
    res.status(200).json({ message: "File deleted successfully" });
  });
});

// Authentication routes
app.get("/kaizen", verifyUser(["kaizen"]), (req, res) => {
  return res.json({ Status: "Success", name: req.user });
});
app.get("/superadmin", verifyUser(["superadmin", "kaizen"]), (req, res) => {
  return res.json({ Status: "Superadmin Access", name: req.user });
});
app.get("/cashier", verifyUser(["cashier", "superadmin", "kaizen"]), (req, res) => {
  return res.json({ Status: "Cashier Access", name: req.user });
});
app.get("/guard", verifyUser(["guard", "cashier", "superadmin", "kaizen"]), (req, res) => {
  return res.json({ Status: "Guard Access", name: req.user });
});

const PORT = parseInt(process.env.PORT, 10);

app.listen(PORT, () => {
  console.log(`Server is running live on port ${PORT}`);
});