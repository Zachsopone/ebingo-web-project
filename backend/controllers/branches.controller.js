import { db } from "../connect.js";


export const getBranches = async (_req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
         id,
         sname,
         address,
         branchemail,
         opening_time AS open_time,
         closing_time AS close_time
       FROM branches
       ORDER BY id DESC`
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching branches:", error);
    res.status(500).json({ error: "Failed to fetch branches." });
  }
};


export const getBranchesFiltered = async (req, res) => {
  try {
    // Accept branch_id either from request body (frontend) OR from authenticated token (req.branch_id)
    const bodyBranchId = req.body?.branch_id;
    const tokenBranchId = req.branch_id; // set by auth.middleware if verifyUser was used

    // Determine which branch id to use:
    // Priority: explicit body.branch_id (frontend) → tokenBranchId (middleware) → undefined (no filter)
    const branchIdToUse = bodyBranchId ?? tokenBranchId ?? null;

    let query = `SELECT
                   id,
                   sname,
                   address,
                   branchemail,
                   opening_time AS open_time,
                   closing_time AS close_time
                 FROM branches`;
    const params = [];

    if (branchIdToUse) {
      query += " WHERE id = ?";
      params.push(branchIdToUse);
    }

    query += " ORDER BY id DESC";

    const [rows] = await db.query(query, params);

    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching filtered branches:", error);
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

export const getBranchStatus = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.execute(
      "SELECT opening_time, closing_time FROM branches WHERE id = ?",
      [id]
    );

    if (!rows.length) return res.status(404).json({ error: "Branch not found" });

    const { opening_time, closing_time } = rows[0];

    // --- CONVERT USER'S CURRENT TIME TO MANILA TIME (UTC+8) ---
    const nowUTC = new Date();
    const now = new Date(nowUTC.getTime() + 8 * 60 * 60 * 1000); // Manila is UTC+8

    console.log("User Manila login time:", now.toString());
    console.log("User Manila ISO login time:", now.toISOString());

    // Extract hours and minutes from MySQL DATETIME (already Manila time)
    const openHour = opening_time.getHours();
    const openMinute = opening_time.getMinutes();
    const closeHour = closing_time.getHours();
    const closeMinute = closing_time.getMinutes();

    const openToday = new Date(now);
    openToday.setHours(openHour, openMinute, 0, 0);

    let closeToday = new Date(now);
    closeToday.setHours(closeHour, closeMinute, 0, 0);

    let isOpen = false;
    let nextOpeningTime = openToday;

    if (closeToday <= openToday) {
      closeToday.setDate(closeToday.getDate() + 1); // Overnight shift
    }

    if (now >= openToday && now <= closeToday) {
      isOpen = true;
    } else if (now < openToday) {
      nextOpeningTime = openToday;
    } else {
      nextOpeningTime = new Date(openToday);
      nextOpeningTime.setDate(nextOpeningTime.getDate() + 1);
    }

    const toLocalISOString = (date) => {
      const pad = (n) => String(n).padStart(2, "0");
      return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    };

    res.json({ isOpen, nextOpeningTime: toLocalISOString(nextOpeningTime) });
  } catch (err) {
    console.error("Branch status error:", err);
    res.status(500).json({ error: "Failed to get branch status" });
  }
};




export { addBranch, deleteBranch };