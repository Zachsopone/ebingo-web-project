import { db } from "../connect.js"; 
import * as XLSX from "xlsx";

export const downloadVisitsExcel = async (req, res) => {
  try {
    const { id, IDNum } = req.params;

    const [rows] = await db.query(
      `SELECT m.fname AS FirstName, 
              m.mname AS MiddleName, 
              m.lname AS LastName, 
              m.idnum AS IDNumber,
              b.sname AS Branch, 
              DATE_FORMAT(v.date, '%m/%d/%Y') AS Date,
              DATE_FORMAT(v.time_in, '%h:%i %p') AS Time,
              v.risk_assessment AS \`Risk Assessment\`,
              CASE WHEN v.status = 1 THEN 'Ban' ELSE 'Not Ban' END AS Status
       FROM visit v
       JOIN members m ON v.idnum = m.idnum
       JOIN branches b ON v.branch_id = b.id
       WHERE v.idnum = ? AND m.id = ?
       ORDER BY v.date DESC, v.time_in DESC`,
      [IDNum, id]
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
      `attachment; filename=visit_${IDNum}.xlsx`
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

