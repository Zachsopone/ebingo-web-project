import { db } from "../connect.js";

const rfid = async (req, res) => {
  const { rfid, guardBranchId } = req.body;

  if (!rfid) {
    return res.status(400).json({ message: "ID number is required." });
  }

  try {
    const input = rfid.trim();

    // Find member by idnum
    const [memberRows] = await db.execute(
      `SELECT m.idnum, m.Card_No, m.fname, m.mname, m.lname, m.banned,
              m.filename, m.branch_id, m.created_date, m.created_time, m.risk_assessment
       FROM members m
       WHERE m.idnum = ?
       ORDER BY m.created_date ASC, m.created_time ASC
       LIMIT 1`,
      [input]
    );

    if (memberRows.length === 0) {
      return res.status(404).json({ message: "Not Found" });
    }

    const member = memberRows[0];
    const profileIdUrl = member.filename ? `/upload/${member.filename}` : null;

    // Fetch all branches for this member
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

    // Check if guard's branch exists in any of member's branches
    const sameBranch = branchRows.some(r => Number(r.branch_id) === Number(guardBranchId));

    // Insert visit log with the member's actual Card_No
    const now = new Date();
    const date = now.toISOString().split("T")[0];
    const time = now.toTimeString().split(" ")[0];

    await db.execute(
      `INSERT INTO visit (fname, mname, lname, Card_No, branch_id, Date, time_in, risk_assessment, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        member.fname,
        member.mname || "",
        member.lname,
        member.Card_No,
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
        Card_No: member.Card_No,
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
