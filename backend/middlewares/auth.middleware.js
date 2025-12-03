import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.JWT_SECRET;

const verifyUser = (requiredRoles) => {
  return (req, res, next) => {
    const token =
      req.cookies?.accessToken ||
      (req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.split(" ")[1]
        : null);
    
    if (!token) {
      return res.status(401).json({ error: "Token not found" });
    }

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
      if (err) {
        console.log("Error verifying token:", err);
        return res.status(401).json({ error: "Invalid token" });
      }

      req.userId = decoded.id;
      req.role = decoded.role;
      req.branch_id = decoded.branch_id;

      console.log(
        "User Authenticated:",
        "ID:", req.userId,
        "Role:", req.role,
        "Branch:", req.branch_id
      );

      // Role-based access check
      if (requiredRoles && requiredRoles.length && !requiredRoles.includes(req.role)) {
        return res.status(403).json({ error: "Access Denied: Insufficient permissions" });
      }

      next();
    });
  };
};

export default verifyUser;
