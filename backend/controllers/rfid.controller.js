import { db } from "../connect.js";

const rfid = async (req, res) => {
  const { rfid, guardBranchId } = req.body;

  if (!rfid) {
    return res.status(400).json({ message: "ID number or name is required." });
  }

  try {
    const input = rfid.trim();
    let memberRows = [];

    const isNumeric = /^[0-9\-]+$/.test(input);

    if (isNumeric) {
      const [rows] = await db.execute(
        `SELECT m.idnum, m.fname, m.mname, m.lname, m.banned,
                m.filename, m.branch_id, m.created_date, m.created_time, m.risk_assessment
         FROM members m
         WHERE m.idnum = ?
         ORDER BY m.created_date ASC, m.created_time ASC
         LIMIT 1`,
        [input]
      );
      memberRows = rows;
    } else {
      const nameParts = input.split(/\s+/).map(p => p.toLowerCase());
      let query = "";
      let params = [];

      if (nameParts.length === 3) {
        query = `
          SELECT m.idnum, m.fname, m.mname, m.lname, m.banned,
                 m.filename, m.branch_id, m.created_date, m.created_time, m.risk_assessment
          FROM members m
          WHERE (
            LOWER(m.fname) = ? AND LOWER(m.mname) = ? AND LOWER(m.lname) = ?
          ) OR (
            LOWER(m.lname) = ? AND LOWER(m.fname) = ? AND LOWER(m.mname) = ?
          )
          ORDER BY m.created_date ASC, m.created_time ASC
          LIMIT 1
        `;
        params = [...nameParts, ...nameParts];
      } else if (nameParts.length === 2) {
        query = `
          SELECT m.idnum, m.fname, m.mname, m.lname, m.banned,
                 m.filename, m.branch_id, m.created_date, m.created_time, m.risk_assessment
          FROM members m
          WHERE (
            LOWER(m.fname) = ? AND LOWER(m.lname) = ?
          ) OR (
            LOWER(m.lname) = ? AND LOWER(m.fname) = ?
          )
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
      // Member does not exist in DB at all
      return res.status(404).json({ message: "Member not found in system" });
    }

    const member = memberRows[0];
    const profileIdUrl = member.filename ? `/upload/${member.filename}` : null;

    // Fetch branch records
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

    const sameBranch = branchRows.some(
      (b) => Number(b.branch_id) === Number(guardBranchId)
    );

    // Log visit with Card_No always 00000000
    const now = new Date();
    const date = now.toISOString().split("T")[0];
    const time = now.toTimeString().split(" ")[0];

    await db.execute(
      `INSERT INTO visit (fname, mname, lname, idnum, Card_No, branch_id, Date, time_in, risk_assessment, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        member.fname,
        member.mname || "",
        member.lname,
        member.idnum,
        "00000000",
        guardBranchId,
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
