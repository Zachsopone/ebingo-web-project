import { db } from "../connect.js";
import * as XLSX from "xlsx";

export const downloadVisitsByDateRange = async (req, res) => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({ error: "Please provide both from and to dates" });
    }

    const role = req.role?.toLowerCase();
    const branch_id = req.branch_id;

    let query = `
      SELECT 
        v.fname AS FirstName,
        v.mname AS MiddleName,
        v.lname AS LastName,
        v.Card_No AS CardNo,
        b.sname AS Branch,
        DATE_FORMAT(v.Date, '%m/%d/%Y') AS Date,
        DATE_FORMAT(v.time_in, '%h:%i %p') AS Time,
        v.risk_assessment AS \`Risk Assessment\`,
        CASE WHEN v.status = 1 THEN 'Ban' ELSE 'Not Ban' END AS Status
      FROM visit v
      JOIN branches b ON v.branch_id = b.id
      WHERE v.Date BETWEEN ? AND ?
    `;

    const params = [from, to];

    // If cashier → restrict to own branch
    if (role === "cashier") {
      if (!branch_id) {
        return res.status(400).json({ error: "Missing branch ID for cashier" });
      }
      query += " AND v.branch_id = ?";
      params.push(branch_id);
    }

    query += " ORDER BY v.Date DESC, v.time_in DESC";

    const [rows] = await db.query(query, params);

    if (!rows.length) {
      return res.status(404).json({ error: "No visits found in the selected range" });
    }

    // Convert to worksheet
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Visits");

    // Create buffer
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    // Set headers for download
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=visits_${from}_to_${to}.xlsx`
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.send(buffer);
  } catch (err) {
    console.error("Error exporting visits by range:", err);
    res.status(500).json({ error: "Failed to export visits by date range" });
  }
};
