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
      Card_No,
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
      Card_No,
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

    // ✅ Check if a member with same idnum exists
    const [existingMembers] = await db.execute(
      `SELECT fname, mname, lname FROM members WHERE idnum = ?`,
      [idnum]
    );

    if (existingMembers.length > 0) {
      const nameMismatch = existingMembers.some(
        (m) =>
          m.fname !== fname || m.mname !== mname || m.lname !== lname
      );
      if (nameMismatch) {
        return res.status(400).json({
          error:
            "Cannot add member: idnum already exists with different name."
        });
      }
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
        cstatus, cnumber, Card_No,
        gender, email, now, sof, mi,
        nationality, typeofid, filename, filename2,
        idnum, path, path2, risk_assessment,
        created_date, created_time
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      Card_No,
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

    const newMember = {
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
      Card_No,
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
    };

    res.status(201).json({ message: "Member added successfully", newMember });

  } catch (error) {
    console.error("Error inserting member:", error.message);
    res.status(500).json({ error: "An unexpected error occurred" });
  }
};
