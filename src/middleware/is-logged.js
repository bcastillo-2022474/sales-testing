import { ADMIN_ROLE } from "../user/user.model.js";

export const isAdminLogged = (req, res, next) => {
  const { loggedUser } = req;

  if (loggedUser.role !== ADMIN_ROLE) {
    return res.status(403).json({ message: "You must be an admin" });
  }

  next();
};
