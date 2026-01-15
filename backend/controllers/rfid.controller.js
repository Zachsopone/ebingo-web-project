import { db } from "../connect.js";

const rfid = async (req, res) => {
  const { rfid: input, guardBranchId } = req.body;

  if (!input) {
    return res.status(400).json({ message: "ID number or name is required." });
  }

  try {
    let memberRows = [];

    const trimmedInput = input.trim();
    const isNumeric = /^[0-9]+$/.test(trimmedInput); // Only digits for idnum

    if (isNumeric) {
      // Convert to integer to match INT column
      const idnum = parseInt(trimmedInput, 10);
      if (isNaN(idnum)) {
        return res.status(400).json({ message: "Invalid ID number." });
      }

      const [rows] = await db.execute(
        `SELECT m.idnum, m.fname, m.mname, m.lname, m.banned,
                m.filename, m.branch_id, m.created_date, m.created_time, m.risk_assessment
         FROM members m
         WHERE m.idnum = ?
         ORDER BY m.created_date ASC, m.created_time ASC
         LIMIT 1`,
        [idnum]
      );
      memberRows = rows;

    } else {
      // Name search (2 or 3 parts)
      const nameParts = trimmedInput.split(/\s+/).map(p => p.toLowerCase());
      let query = "";
      let params = [];

      if (nameParts.length === 3) {
        query = `
          SELECT m.idnum, m.fname, m.mname, m.lname, m.banned,
                 m.filename, m.branch_id, m.created_date, m.created_time, m.risk_assessment
          FROM members m
          WHERE (LOWER(m.fname) = ? AND LOWER(m.mname) = ? AND LOWER(m.lname) = ?)
             OR (LOWER(m.lname) = ? AND LOWER(m.fname) = ? AND LOWER(m.mname) = ?)
          ORDER BY m.created_date ASC, m.created_time ASC
          LIMIT 1
        `;
        params = [...nameParts, ...nameParts];

      } else if (nameParts.length === 2) {
        query = `
          SELECT m.idnum, m.fname, m.mname, m.lname, m.banned,
                 m.filename, m.branch_id, m.created_date, m.created_time, m.risk_assessment
          FROM members m
          WHERE (LOWER(m.fname) = ? AND LOWER(m.lname) = ?)
             OR (LOWER(m.lname) = ? AND LOWER(m.fname) = ?)
          ORDER BY m.created_date ASC, m.created_time ASC
          LIMIT 1
        `;
        params = [...nameParts, ...nameParts];

      } else {
        return res.status(400).json({ message: "Invalid name format." });
      }

      const [rows] = await db.execute(query, params);
      memberRows = rows;
    }

    if (memberRows.length === 0) {
      return res.status(404).json({ message: "Member not found" });
    }

    const member = memberRows[0];
    const profileIdUrl = member.filename ? `/upload/${member.filename}` : null;

    // Fetch all branches this member is registered in
    const [branchRows] = await db.execute(
      `SELECT b.id AS branch_id, b.sname, m.created_date, m.created_time
       FROM members m
       JOIN branches b ON m.branch_id = b.id
       WHERE m.idnum = ?
       ORDER BY m.created_date ASC, m.created_time ASC`,
      [member.idnum]
    );

    const branches = branchRows.map(r => ({
      id: r.branch_id,
      sname: r.sname,
      created_date: r.created_date,
      created_time: r.created_time,
    }));

    // ✅ Check if any branch matches guard's branch
    const sameBranch = branchRows.some(
      (b) => Number(b.branch_id) === Number(guardBranchId)
    );

    // Log visit (Card_No is always 00000000)
    const now = new Date();
    const date = now.toISOString().split("T")[0];
    const time = now.toTimeString().split(" ")[0];

    await db.execute(
      `INSERT INTO visit (fname, mname, lname, Card_No, branch_id, Date, time_in, risk_assessment, status)
       VALUES (?, ?, ?, '00000000', ?, ?, ?, ?, ?)`,
      [
        member.fname,
        member.mname || "",
        member.lname,
        member.branch_id,
        date,
        time,
        member.risk_assessment || "",
        member.banned ? 1 : 0,
      ]
    );

    return res.status(200).json({
      message: "Member found and visit recorded",
      data: {
        idnum: member.idnum,
        fname: member.fname,
        mname: member.mname,
        lname: member.lname,
        branch_id: member.branch_id,
        banned: member.banned,
        risk_assessment: member.risk_assessment,
        sameBranch,
      },
      branches,
      profileIdUrl,
    });

  } catch (error) {
    console.error("Database error:", error.message);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export default rfid;
