import jwt from "jsonwebtoken";

export const validateJwt = async (req, res, next) => {
  const token = req.header("x-token");

  if (!token) {
    return res.status(401).json({ message: "Token is required" });
  }

  try {
    const user = jwt.verify(token, process.env.SECRET_PRIVATE_KEY);
    req.loggedUser = user;
    next();
  } catch (error) {
    console.log(error);
    res.status(401).json({ message: "Invalid token or token expired" });
  }
};
