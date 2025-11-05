import { db } from "../connect.js";

const ban = async (req, res) => {
  const userId = req.params.id;
  const { branch_id, reason } = req.body;

  if (!branch_id) {
    return res.status(400).send("Branch ID is required");
  }
  if (!reason || reason.trim() === "") {
    return res.status(400).send("State a reason of banning this member");
  }

  try {
    const [result] = await db.query(
      `UPDATE members SET banned = 1, reason = ? WHERE id = ? AND branch_id = ? AND banned = 0`,
      [reason, userId, branch_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Member not found or already banned" });
    }

    res.status(200).json({ message: "User banned successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error banning user", error });
  }
};

const unban = async (req, res) => {
  const userId = req.params.id;
  const {branch_id} = req.body;
  
  if(!branch_id) {
    return res.status(400).send("Branch ID is required");
  }

  try {
    await db.query(`UPDATE members SET banned = 0 WHERE id = ? AND branch_id = ?`, [userId, branch_id]);
    res.status(200).json({ message: "User unbanned successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error unbanning user", error });
  }
};

const banned = async (req, res) => {
  const {branch_id} = req.body;
  if(!branch_id) {
    return res.status(400).send("Branch ID is required");
  }

  try {
    const [rows] = await db.execute(
      `SELECT * FROM members WHERE banned = 1 AND branch_id = ?`,
      [branch_id]
    );

    res.status(200).send({
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).send({ message: error.message });
  }
};

export { ban, unban, banned };