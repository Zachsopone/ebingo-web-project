import { db } from "../connect.js";

export const getMasterList = async (req, res) => {
  try {
    const { branch_id } = req.query;

    let sql = `
      SELECT
        m.id AS ID,
        COALESCE(b.sname, '') AS Branch,
        m.fname AS 'First Name',
        m.mname AS 'Middle Name',
        m.lname AS 'Last Name',
        m.age AS Age,
        m.permaddress AS 'Permanent Address',
        m.cstatus AS 'Civil Status',
        m.cnumber AS 'Contact Number',
        m.Card_No AS 'Card Number',
        m.email AS 'Email Address',
        m.now AS 'Nature of Work',
        CASE WHEN m.banned = 1 THEN 'Banned' ELSE 'Not Banned' END AS Status,
        m.risk_assessment AS 'Risk Assessment'
      FROM members m
      LEFT JOIN branches b ON m.branch_id = b.id
    `;

    const params = [];
    if (branch_id) {
      sql += " WHERE m.branch_id = ?";
      params.push(branch_id);
    }
    sql += " ORDER BY m.id ASC";

    const [rows] = await db.query(sql, params);

    return res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching master list:", error);
    return res.status(500).json({ error: "Failed to fetch master list" });
  }
};
