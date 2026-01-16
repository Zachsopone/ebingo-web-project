import fs from "fs";
import path from "path";

const LOCAL_PUBLIC = path.join(process.cwd(), "public");
const LOCAL_UPLOAD = path.join(LOCAL_PUBLIC, "upload");
const LOCAL_VALID  = path.join(LOCAL_PUBLIC, "valid");

[LOCAL_UPLOAD, LOCAL_VALID].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const copyFile = (src, dest) => {
  fs.copyFileSync(src, dest);
};

const uploadImages = (req, res) => {
  try {
    const profile = req.files?.profile?.[0];
    const valid   = req.files?.valid?.[0];

    if (!profile || !valid) {
      return res.status(400).json({ error: "Both images are required" });
    }

    // COPY → local public folders
    copyFile(profile.path, path.join(LOCAL_UPLOAD, profile.filename));
    copyFile(valid.path, path.join(LOCAL_VALID, valid.filename));

    if (!fs.existsSync(profile.path) || !fs.existsSync(valid.path)) {
      return res.status(500).json({ error: "Uploaded files not found on server." });
    }

    res.status(200).json({
      message: "Files uploaded successfully",
      profile: {
        filename: profile.filename,
        path: `/upload/${profile.filename}`
      },
      valid: {
        filename: valid.filename,
        path: `/valid/${valid.filename}`
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Upload failed" });
  }
};

export default uploadImages;