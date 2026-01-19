const uploadImages = (req, res) => {
  try {
    const profile = req.files?.profile?.[0];
    const valid   = req.files?.valid?.[0];

    if (!profile || !valid) {
      return res.status(400).json({ error: "Both profile and valid ID images are required" });
    }

    // Return the **relative URLs** that match your static middleware mounts
    res.status(200).json({
      message: "Images uploaded successfully to persistent storage",
      profile: {
        filename: profile.filename,
        path: `/upload/${profile.filename}`,
      },
      valid: {
        filename: valid.filename,
        path: `/valid/${valid.filename}`,
      },
    });
  } catch (err) {
    console.error("Upload controller error:", err);
    res.status(500).json({ error: "Upload processing failed" });
  }
};

export default uploadImages;