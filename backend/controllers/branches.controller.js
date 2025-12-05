export const getBranches = async (_req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
         id,
         sname,
         address,
         branchemail,
         opening_time,
         closing_time
       FROM branches
       ORDER BY id DESC`
    );

    // Return times as plain strings
    const normalized = rows.map(r => ({
      id: r.id,
      sname: r.sname,
      address: r.address,
      branchemail: r.branchemail,
      opening_time: r.opening_time,   // plain DATETIME string
      closing_time: r.closing_time,   // plain DATETIME string
    }));

    res.status(200).json(normalized);
  } catch (error) {
    console.error("Error fetching branches:", error);
    res.status(500).json({ error: "Failed to fetch branches." });
  }
};

export const getBranchesFiltered = async (req, res) => {
  try {
    const bodyBranchId = req.body?.branch_id;
    const tokenBranchId = req.branch_id;

    const branchIdToUse = bodyBranchId ?? tokenBranchId ?? null;

    let query = `SELECT
                   id,
                   sname,
                   address,
                   branchemail,
                   opening_time,
                   closing_time
                 FROM branches`;
    const params = [];

    if (branchIdToUse) {
      query += " WHERE id = ?";
      params.push(branchIdToUse);
    }

    query += " ORDER BY id DESC";

    const [rows] = await db.query(query, params);

    const normalized = rows.map(r => ({
      id: r.id,
      sname: r.sname,
      address: r.address,
      branchemail: r.branchemail,
      opening_time: r.opening_time,  // plain DATETIME string
      closing_time: r.closing_time,  // plain DATETIME string
    }));

    res.status(200).json(normalized);
  } catch (error) {
    console.error("Error fetching filtered branches:", error);
    res.status(500).json({ error: "Failed to fetch branches." });
  }
};
