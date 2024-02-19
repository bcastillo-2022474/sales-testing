import Router from "express";
import { body } from "express-validator";

const router = Router();

router.get(
  "/login",
  [
    body("email").optional().isEmail(),
    body("username").optional().isLength({ min: 3 }),
    body("password").optional().isLength({ min: 6 }),
    // check that either email or username is provided
    body("email").custom((value, { req }) => {
      if (!value && !req.body.username) {
        throw new Error("Please provide either email or username");
      }
      return true;
    }),
    body("username").custom((value, { req }) => {
      if (!value && !req.body.email) {
        throw new Error("Please provide either email or username");
      }
      return true;
    }),
  ],
  async (req, res) => {
    const { username, email, password } = req.body;

    const user = await User.find({ username, email, password });
    res.status(200).json(user);
  },
);

router.post("/signup", (req, res) => {});

export default router;
