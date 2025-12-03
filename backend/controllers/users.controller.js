import { db } from "../connect.js";
import bcrypt from "bcrypt";



export const getUsers = async (_, res) => {
  try {
    const [rows] = await db.query(`
      SELECT u.ID, u.Firstname, u.Middlename, u.Lastname, 
             u.Age, u.Contactnumber, u.Emailaddress, u.Address, 
             u.Gender, u.Username, u.Role, u.Date_created,
             b.sname AS Branch
      FROM users u
      LEFT JOIN branches b ON u.Branch_ID = b.id
      ORDER BY u.ID DESC
    `);

    const formattedDate = date.toISOString().slice(0, 19).replace("T"," ");
    
    res.status(200).json(formattedRows);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users." });
  }
};

export const updateUserPassword = async (req, res) => {
  const { userId } = req.params;
  const { newPassword, confirmPassword } = req.body;

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ error: "Passwords do not match" });
  }

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 6);
    await db.query(`UPDATE users SET Password = ? WHERE ID = ?`, [hashedPassword, userId]);

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).json({ error: "Failed to update password" });
  }
};

export const updateUser = async (req, res) => {
  const { ID } = req.params;
  let { Firstname, Middlename, Lastname, Age, Contactnumber, Emailaddress, Address, Gender, Username, Role } = req.body;


  try {
    const isValidEmail = (email) => typeof email === "string" && /\S+@\S+\.\S+/.test(email);

    if (Emailaddress && !isValidEmail(Emailaddress)) {
      return res.status(400).json({ error: "Invalid Email address format." });
    }
    if (Username && !isValidEmail(Username)) {
      return res.status(400).json({ error: "Invalid Username format (must be an email)." });
    }

    if (Emailaddress !== Username) {
      return res.status(400).json({ error: "Email Address and Username must be the same." });
    }

    // Force role to lowercase
    Role = Role ? Role.toLowerCase() : Role;

    const [result] = await db.execute(
      `UPDATE users 
       SET Firstname = ?, Middlename = ?, Lastname = ?, Age = ?, 
           Contactnumber = ?, Emailaddress = ?, Address = ?, Gender = ?, Username = ?, Role = ?
       WHERE ID = ?`,
      [Firstname, Middlename, Lastname, Age, Contactnumber, Emailaddress, Address, Gender, Username, Role, ID]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const [updatedUser] = await db.query(
      `SELECT u.ID, u.Firstname, u.Middlename, u.Lastname, 
              u.Age, u.Contactnumber, u.Emailaddress, u.Address, 
              u.Gender, u.Username, u.Role, u.Date_created,
              b.sname AS Branch
       FROM users u
       LEFT JOIN branches b ON u.Branch_ID = b.id
       WHERE u.ID = ?`,
      [ID]
    );

    return res.json({ success: true, message: "User updated successfully", newUser: updatedUser[0] });
  } catch (err) {
    console.error("Update user error:", err);
    return res.status(500).json({ error: "Database update failed" });
  }
};

const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);

export const addUser = async (req, res) => {
  try {
    let { 
      Firstname, Middlename, Lastname, Age, Contactnumber, 
      Emailaddress, Address, Gender, Branch_ID, Username, 
      Password, Role 
    } = req.body;

    const requiredFields = { Firstname, Middlename, Lastname, Age, Contactnumber, Emailaddress, Address, Gender, Branch_ID, Username, Password, Role };
    const missingFields = Object.keys(requiredFields).filter((key) => !requiredFields[key]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    if (!isValidEmail(Emailaddress) || !isValidEmail(Username)) {
      return res.status(400).json({ error: "Email Address and Username must be valid email addresses." });
    }

    if (Emailaddress !== Username) {
      return res.status(400).json({ error: "Email Address and Username must be the same." });
    }

    Role = Role.toLowerCase();


    const hashedPassword = await bcrypt.hash(Password, 6);

    const [result] = await db.execute(
      `INSERT INTO users (Firstname, Middlename, Lastname, Age, Contactnumber, Emailaddress, Address, Gender, Branch_ID, Username, Password, Role)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [Firstname, Middlename, Lastname, Age, Contactnumber, Emailaddress, Address, Gender, Branch_ID, Username, hashedPassword, Role]
    );

    const [newUser] = await db.query(
      `SELECT u.ID, u.Firstname, u.Middlename, u.Lastname, 
              u.Age, u.Contactnumber, u.Emailaddress, u.Address, 
              u.Gender, u.Username, u.Role, u.Date_created,
              b.sname AS Branch
       FROM users u
       LEFT JOIN branches b ON u.Branch_ID = b.id
       WHERE u.ID = ?`,
      [result.insertId]
    );

    return res.status(201).json({ message: "User added successfully.", newUser: newUser[0] });
  } catch (error) {
    console.error("Error adding user:", error.message);
    return res.status(500).json({ error: "An unexpected error occurred." });
  }
};

export const deleteUser = async (req, res) => {
  const { ID } = req.params;

  try {
    const [existing] = await db.execute("SELECT ID FROM users WHERE ID = ?", [ID]);
    if (existing.length === 0) {
      return res.status(404).json({ error: "User not found." });
    }

    await db.execute("DELETE FROM users WHERE ID = ?", [ID]);
    return res.status(200).json({ message: "User deleted successfully." });
  } catch (error) {
    console.error("Error deleting user:", error.message);
    return res.status(500).json({ error: "An unexpected error occurred." });
  }
};