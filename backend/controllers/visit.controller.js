import { db } from "../connect.js"; 
import * as XLSX from "xlsx";

export const downloadVisitsExcel = async (req, res) => {
  try {
    const { id, cardNo } = req.params;

    const [rows] = await db.query(
      `SELECT m.fname AS FirstName, 
              m.mname AS MiddleName, 
              m.lname AS LastName, 
              m.Card_No AS CardNo, 
              b.sname AS Branch, 
              DATE_FORMAT(CONVERT_TZ(v.date, '+00:00', '+08:00'), '%m/%d/%Y') AS Date,
              DATE_FORMAT(CONVERT_TZ(v.time_in, '+00:00', '+08:00'), '%H:%i:%s') AS Time,
              v.risk_assessment AS \`Risk Assessment\`,
              CASE WHEN v.status = 1 THEN 'Ban' ELSE 'Not Ban' END AS Status
      FROM visit v
      JOIN members m ON v.Card_No = m.Card_No
      JOIN branches b ON v.branch_id = b.id
      WHERE v.Card_No = ? AND m.id = ?
      ORDER BY v.date DESC, v.time_in DESC`,
      [cardNo, id]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: "No visit records found" });
    }

    // Convert to worksheet
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Visits");

    // Create buffer
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    // Set headers
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=visit_${cardNo}.xlsx`
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.send(buffer);
  } catch (err) {
    console.error("Error exporting visit Excel:", err);
    res.status(500).json({ error: "Failed to export visit Excel" });
  }
};

