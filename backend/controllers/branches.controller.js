import { db } from "../connect.js";


export const getBranches = async (req, res) => {
  try {
    let query = `SELECT
                   id,
                   sname,
                   address,
                   branchemail,
                   opening_time AS open_time,
                   closing_time AS close_time
                 FROM branches`;

    const params = [];

    // If user is superadmin, restrict to their branch only
    if (req.role === "superadmin") {
      query += " WHERE id = ?";
      params.push(req.branch_id);
    }

    query += " ORDER BY id DESC";

    const [rows] = await db.execute(query, params);
    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching branches:", error);
    res.status(500).json({ error: "Failed to fetch branches." });
  }
};

export const updateBranch = async (req, res) => {
  const { id } = req.params;
  const { sname, address, branchemail } = req.body;

  try {
    const isValidEmail = (email) => typeof email === "string" && /\S+@\S+\.\S+/.test(email);

    if (branchemail && !isValidEmail(branchemail)) {
      return res.status(400).json({ error: "Invalid Branch email address format." });
    }

    const [result] = await db.execute(
      "UPDATE branches SET sname = ?, address = ?, branchemail = ? WHERE id = ?",
      [sname, address, branchemail, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Branch not found" });
    }

    res.json({ success: true, message: "Branch updated successfully" });
  } catch (err) {
    console.error("Update branch error:", err);
    res.status(500).json({ error: "Database update failed" });
  }
};

export const updateBranchTime = async (req, res) => {
  const { id } = req.params;
  const { open_time, close_time } = req.body;

  if (!open_time || !close_time) {
    return res.status(400).json({ error: "Both open_time and close_time are required" });
  }

  try {
    await db.execute(
      `UPDATE branches SET 
        opening_time = ?, 
        closing_time = ?
      WHERE id = ?`,
      [open_time, close_time, id]
    );

    res.json({ success: true, message: "Branch times updated successfully." });
  } catch (err) {
    console.error("Update time error:", err);
    res.status(500).json({ error: "Database update failed" });
  }
};

const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);

const addBranch = async (req, res) => {
  try {
    const { sname, address, branchemail } = req.body;

    // Validate required fields
    const requiredFields = { sname, address, branchemail };
    const missingFields = Object.keys(requiredFields).filter((key) => !requiredFields[key]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    if (!isValidEmail(branchemail)) {
      return res.status(400).json({ error: "Branch email must be a valid email address." });
    }

    // Check for duplicates
    const [existingSname] = await db.execute("SELECT id FROM branches WHERE sname = ?", [sname]);
    const [existingAddress] = await db.execute("SELECT id FROM branches WHERE address = ?", [address]);
    const [existingContact] = await db.execute("SELECT id FROM branches WHERE branchemail = ?", [branchemail]);

    if (existingSname.length > 0) {
      return res.status(400).json({ error: "Branch name already exists." });
    }
    if (existingAddress.length > 0) {
      return res.status(400).json({ error: "Branch address already exists." });
    }
    if (existingContact.length > 0) {
      return res.status(400).json({ error: "Branch email already exists." });
    }

    //Insert the branch
    const [result] = await db.execute(
      `INSERT INTO branches (sname, address, branchemail)
       VALUES (?, ?, ?)`,
      [sname, address, branchemail]
    );

    const newBranch = {
      id: result.insertId,
      sname,
      address,
      branchemail,
    };

    //Return the newly added branch with ID
    return res.status(201).json({ message: "Branch added successfully.", newBranch });

  } catch (error) {
    console.error("Error adding branch:", error.message);
    return res.status(500).json({ error: "An unexpected error occurred." });
  }
};

const deleteBranch = async (req, res) => {
  const { id } = req.params;

  try {
    const [existing] = await db.execute("SELECT id FROM branches WHERE id = ?", [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: "Branch not found." });
    }

    await db.execute("DELETE FROM branches WHERE id = ?", [id]);
    return res.status(200).json({ message: "Branch deleted successfully." });
  } catch (error) {
    console.error("Error deleting branch:", error.message);
    return res.status(500).json({ error: "An unexpected error occurred." });
  }
};

export const getBranchById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.execute(
      "SELECT id, sname, opening_time, closing_time FROM branches WHERE id = ?",
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: "Branch not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error("Get branch error:", err);
    res.status(500).json({ error: "Failed to get branch" });
  }
};

export { addBranch, deleteBranch };