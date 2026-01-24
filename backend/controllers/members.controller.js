import { db } from "../connect.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";


const addMember = async (req, res) => {
  try {
    const {
      branch_id,
      fname,
      mname,
      lname,
      age,
      presaddress,
      permaddress,
      birthdate,
      cstatus,
      cnumber,
      gender,
      email,
      now,
      sof,
      mi,
      nationality,
      typeofid,
      filename,
      filename2,
      idnum,
      profilePath,
      validPath,
      risk_assessment,
    } = req.body;

    // Validate required fields
    const requiredFields = {
      branch_id,
      fname,
      mname,
      lname,
      age,
      presaddress,
      permaddress,
      birthdate,
      cstatus,
      cnumber,
      gender,
      email,
      now,
      sof,
      mi,
      nationality,
      typeofid,
      filename,
      filename2,
      idnum,
      profilePath,
      validPath,
      risk_assessment,
    };
    const missingFields = Object.keys(requiredFields).filter(
      (key) => !requiredFields[key]
    );
    if (missingFields.length > 0) {
      return res
        .status(400)
        .json({ error: `Missing required fields: ${missingFields.join(", ")}` });
    }

    // Check if this exact ID number already exists anywhere
    const [existingById] = await db.execute(
      "SELECT id, branch_id, fname, mname, lname FROM members WHERE idnum = ?",
      [idnum]
    );

    if (existingById.length > 0) {
      const match = existingById[0];

      const sameFullName =
        match.fname === fname &&
        match.mname === mname &&
        match.lname === lname;

      if (sameFullName) {
        if (match.branch_id === branch_id) {
          return res.status(400).json({
            error: "This member already exists in this branch.",
          });
        } else {
          // Same person (name + ID) in a different branch → ALLOW
          // Proceed to insert
        }
      } else {
        // ID is used by a completely different person → REJECT
        return res.status(400).json({
          error: "This ID number is already used by another person.",
        });
      }
    } else {
      // ID is new → now check if full name already exists anywhere
      const [existingByName] = await db.execute(
        `SELECT id, branch_id, idnum 
         FROM members 
         WHERE fname = ? AND mname = ? AND lname = ?`,
        [fname, mname, lname]
      );

      if (existingByName.length > 0) {
        return res.status(400).json({
          error: "Member with this full name is already registered.",
        });
      }

      // No conflict
    }

    // extra safety check (same person in same branch)
    const [samePersonInBranch] = await db.execute(
      `SELECT id FROM members 
       WHERE branch_id = ? 
       AND fname = ? AND mname = ? AND lname = ? 
       AND idnum = ?`,
      [branch_id, fname, mname, lname, idnum]
    );

    if (samePersonInBranch.length > 0) {
      return res.status(400).json({
        error: "This member already exists in this branch.",
      });
    }

    // Generate created_date and created_time
    const created_date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const created_time = new Date().toLocaleTimeString("en-PH", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }); // HH:MM:SS

    const sql = `
      INSERT INTO members (
        branch_id, fname, mname, lname, age,
        presaddress, permaddress, birthdate,
        cstatus, cnumber,
        gender, email, now, sof, mi,
        nationality, typeofid, filename, filename2,
        idnum, path, path2, risk_assessment,
        created_date, created_time
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.execute(sql, [
      branch_id,
      fname,
      mname,
      lname,
      age,
      presaddress,
      permaddress,
      birthdate,
      cstatus,
      cnumber,
      gender,
      email,
      now,
      sof,
      mi,
      nationality,
      typeofid,
      filename,
      filename2,
      idnum,
      profilePath,
      validPath,
      risk_assessment,
      created_date,
      created_time,
    ]);

    res.status(201).json({ message: "Member added successfully", memberId: result.insertId });

  } catch (error) {
    console.error("Error inserting member:", error.message);
    res.status(500).json({ error: "An unexpected error occurred" });
  }
};

// Update only fields provided
const editMember = async (req, res) => {
  const memberId = req.params.id;
  const {
    fname,
    mname,
    lname,
    age,
    permaddress,
    cstatus,
    cnumber,
    email,
    now,
    risk_assessment
  } = req.body;

  try {
    const query = `
      UPDATE members SET
        fname = ?, mname = ?, lname = ?,
        age = ?, permaddress = ?, cstatus = ?,
        cnumber = ?, email = ?, now = ?,
        risk_assessment = ?
      WHERE id = ?
    `;

    const [result] = await db.execute(query, [
      fname,
      mname,
      lname,
      age,
      permaddress,
      cstatus,
      cnumber,
      email,
      now,
      risk_assessment,
      memberId,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Member not found" });
    }

    res.json({
      message: "Member updated successfully",
      affectedRows: result.affectedRows,
    });
  } catch (error) {
    console.error("Error updating member:", error.message);
    res.status(500).json({ error: "Database error occurred" });
  }
};

// Filtered by branch_id
const readMember = async (req, res) => {
  const { branch_id } = req.body;

  if (!branch_id) {
    return res.status(400).json({ error: "Branch ID is required" });
  }

  try {
    const [rows] = await db.query("SELECT * FROM members WHERE branch_id = ? ORDER BY id DESC", [branch_id]);

    res.status(200).json({
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    console.error("Failed to fetch members:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// DELETE member by ID
const deleteMember = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.execute("SELECT filename, filename2 FROM members WHERE id = ?", [id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Member not found" });
    }

    const { filename, filename2 } = rows[0];

    const [result] = await db.execute("DELETE FROM members WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Member not found" });
    }

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    const uploadPath = path.join(__dirname, "../../Ebingo/public/upload", filename);
    const validPath = path.join(__dirname, "../../Ebingo/public/valid", filename2);

    [uploadPath, validPath].forEach((filePath) => {
      if (filePath && fs.existsSync(filePath)) {
        fs.unlink(filePath, (err) => {
          if (err) {
            console.error("Error deleting file:", err);
          }
        });
      }
    });

    res.status(200).json({ message: "Member deleted successfully" });

  } catch (error) {
    console.error("Error deleting member:", error);
    res.status(500).json({ message: "Server error while deleting member" });
  }
};

// Get single member by ID with branch name
const getMemberById = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.query(
      `SELECT m.*, b.sname 
       FROM members m
       LEFT JOIN branches b ON m.branch_id = b.id
       WHERE m.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Member not found" });
    }

    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error fetching member by ID:", error);
    res.status(500).json({ message: "Server error while fetching member" });
  }
};


export { addMember, editMember, readMember, deleteMember, getMemberById };