import { db } from "../connect.js";
import * as XLSX from "xlsx";

export const downloadPlayersByDateRange = async (req, res) => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({ error: "Please provide both from and to dates" });
    }

    const role = req.role?.toLowerCase();
    const branch_id = req.branch_id;

    let query = `
      SELECT 
        m.fname AS FirstName,
        m.mname AS MiddleName,
        m.lname AS LastName,
        m.Card_No AS CardNo,
        b.sname AS Branch,
        DATE_FORMAT(m.created_date, '%m/%d/%Y') AS Date,
        DATE_FORMAT(m.created_time, '%h:%i %p') AS Time,
        m.risk_assessment AS \`Risk Assessment\`,
        CASE WHEN m.banned = 1 THEN 'Ban' ELSE 'Not Ban' END AS Status
      FROM members m
      JOIN branches b ON m.branch_id = b.id
      WHERE m.created_date BETWEEN ? AND ?
    `;

    const params = [from, to];

    // If cashier → restrict to own branch
    if (role === "cashier") {
      if (!branch_id) {
        return res.status(400).json({ error: "Missing branch ID for cashier" });
      }
      query += " AND m.branch_id = ?";
      params.push(branch_id);
    }

    query += " ORDER BY m.created_date DESC, m.created_time DESC";

    const [rows] = await db.query(query, params);

    if (!rows || rows.length === 0) {
      return res.status(404).json({
        message: "No New Players found in the selected range"
      });
    }

    // Convert to worksheet
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "New Players");

    // Create buffer
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    // Set headers for download
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=new_players_${from}_to_${to}.xlsx`
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.send(buffer);
  } catch (err) {
    console.error("Error exporting new players by range:", err);
    res.status(500).json({ error: "Failed to export new players by date range" });
  }
};
