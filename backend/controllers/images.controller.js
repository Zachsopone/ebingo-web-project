import fs from "fs";

const uploadImages = (req, res) => {
  try {
    const profile = req.files["profile"]?.[0];
    const valid = req.files["valid"]?.[0];

    if (!profile || !valid) {
      return res.status(400).json({ error: "Both profile and valid ID images are required." });
    }

    if (!fs.existsSync(profile.path) || !fs.existsSync(valid.path)) {
      return res.status(500).json({ error: "Uploaded files not found on server." });
    }

    // Return relative paths for accessibility
    res.status(200).json({
      message: "Files uploaded successfully",
      profile: {
        filename: profile.filename,
        path: `/upload/${profile.filename}`,
      },
      valid: {
        filename: valid.filename,
        path: `/valid/${valid.filename}`,
      },
    });
  } catch (error) {
    console.error("Upload error:", error.message);
    res.status(500).json({ error: "Upload failed" });
  }
};

export default uploadImages;