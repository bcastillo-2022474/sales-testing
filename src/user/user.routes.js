import { Router } from "express";
import User, { ADMIN_ROLE, CLIENT_ROLE } from "./user.model.js";
import { validateJwt } from "../middleware/validate-jwt.js";
import { isAdminLogged } from "../middleware/is-logged.js";
import { body, param, query } from "express-validator";
import { validateRequestParams } from "../middleware/validate-request-params.js";
import { isEmailAndUsernameUnique } from "../middleware/is-email-and-username-unique.js";
import bcryptjs from "bcryptjs";

const router = Router();

router
  .route("/")
  .get(
    [
      validateJwt,
      isAdminLogged,
      query("limit", "Limit must be an integer").optional().isNumeric(),
      query("page", "Page must be an integer").optional().isNumeric(),
      validateRequestParams,
    ],
    async (req, res) => {
      const { limit = 5, page = 0 } = req.query;

      const query = { tp_status: true };
      const [total, users] = await Promise.allSettled([
        User.countDocuments(query)
          .limit(parseInt(limit))
          .skip(parseInt(page) * parseInt(limit)),
        User.find(query)
          .select("username email role")
          .limit(parseInt(limit))
          .skip(parseInt(page) * parseInt(limit)),
      ]);

      res.status(200).json({
        total: total.value,
        page,
        users: users.value,
      });
    },
  )
  .post(
    [
      body("email", "Must be a valid Email").isEmail(),
      body("username", "Must have more than 3 characters").isLength({ min: 4 }),
      body(
        "password",
        "Must have at least 6 characters, 1 upper case, and 1 number",
      ).isStrongPassword({
        minLength: 6,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 0,
      }),
      body(
        "role",
        `Role must be defined, must be either ${CLIENT_ROLE} or ${ADMIN_ROLE}`,
      ).isIn([ADMIN_ROLE, CLIENT_ROLE]),
      body("").custom(isEmailAndUsernameUnique),
      validateRequestParams,
    ],
    async (req, res) => {
      const { username, email, password, role } = req.body;
      const salt = bcryptjs.genSaltSync();
      const encryptedPassword = bcryptjs.hashSync(password, salt);
      const user = new User({
        username,
        email,
        password: encryptedPassword,
        role,
      });
      await user.save();

      res.status(201).json({ user });
    },
  );

router
  .route("/:id")
  .get(
    [
      validateJwt,
      isAdminLogged,
      param("id", "Id must be a valid ObjectId").isMongoId(),
      validateRequestParams,
    ],
    async (req, res) => {
      const { id } = req.params;
      const user = await User.findOne({ _id: id, tp_status: true }).select(
        "username email role",
      );

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.status(200).json({ user });
    },
  )
  .put(
    [
      validateJwt,
      isAdminLogged,
      body("email", "If defined, email must be a valid email")
        .optional()
        .isEmail(),
      body("username", "If defined, username must have at least 4 characters")
        .optional()
        .isLength({ min: 4 }),
      body(
        "password",
        "If defined, must have at least 6 characters, 1 upper case, and 1 number",
      )
        .optional()
        .isStrongPassword({
          minLength: 6,
          minUppercase: 1,
          minNumbers: 1,
          minSymbols: 0,
        }),
      body(
        "role",
        `If defined, role must be defined, must be either ${CLIENT_ROLE} or ${ADMIN_ROLE}`,
      )
        .optional()
        .isIn([ADMIN_ROLE, CLIENT_ROLE]),
      validateRequestParams,
    ],
    async (req, res) => {
      const { id } = req.params;
      const { username, email, password, role } = req.body;
      const userUpdated = { username, email, password, role };

      Object.keys(userUpdated).forEach((key) => {
        if (userUpdated[key] === undefined) {
          delete userUpdated[key];
        }
      });

      const user = await User.findOneAndUpdate(
        { _id: id, tp_status: true },
        userUpdated,
      ).select("username email role password");

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.status(200).json({
        user: { ...user._doc, ...userUpdated },
      });
    },
  )
  .delete(
    [
      validateJwt,
      isAdminLogged,
      param("id", "Id must be a valid ObjectId").isMongoId(),
      validateRequestParams,
    ],
    async (req, res) => {
      const { id } = req.params;
      const user = await User.findOneAndUpdate(
        { _id: id, tp_status: true },
        { tp_status: false },
      ).select("username email role");

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.status(200).json({ user });
    },
  );

export default router;
