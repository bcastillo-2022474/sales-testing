import { Router } from "express";
import Product from "./product.model.js";
import { body, param, query } from "express-validator";
import { validateRequestParams } from "../middleware/validate-request-params.js";
import { validateJwt } from "../middleware/validate-jwt.js";
import { isAdminLogged } from "../middleware/is-logged.js";
import {
  createProduct,
  deleteProduct,
  getAllProducts,
  getProduct,
  updateProduct,
} from "./product.controllers.js";

const router = Router();

router.get(
  "/stats",
  [
    validateJwt,
    isAdminLogged,
    query("limit", "Limit must be an integer").optional().isNumeric(),
    validateRequestParams,
  ],
  async (req, res) => {
    const { limit } = req.query;
    res.status(200).json({ stats: "Stats" });
  },
);

// agotados
router.get(
  "/out-of-stock",
  [
    validateJwt,
    isAdminLogged,
    query("limit", "Limit must be an integer").optional().isNumeric(),
    query("offset", "Offset must be an integer").optional().isNumeric(),
    validateRequestParams,
  ],
  async (req, res) => {
    const { limit, offset } = req.query;

    const [total, products] = await Promise.allSettled([
      Product.countDocuments({ stock: 0, tp_status: true }),
      Product.find({ stock: 0, tp_status: true })
        .limit(parseInt(limit))
        .skip(parseInt(offset)),
    ]);

    res.status(200).json({ total: total.value, products: products.value });
  },
);

router
  .route("/")
  .get(
    [
      validateJwt,
      isAdminLogged,
      query("limit", "Limit must be an integer").optional().isNumeric(),
      query("offset", "Offset must be an integer").optional().isNumeric(),
      validateRequestParams,
    ],
    getAllProducts,
  )
  .post(
    [
      validateJwt,
      isAdminLogged,
      body("name", "Name must be defined and must have at least 4 characters")
        .isString()
        .notEmpty()
        .isLength({ min: 4 }),

      body("name", "Name already in use").custom(async (name) => {
        const product = await Product.findOne({ name, tp_status: true });

        if (!product) return true;

        throw new Error("Name already in use");
      }),

      body(
        "description",
        "Description must be defined and must have at least 10 characters and less than 200",
      )
        .isString()
        .notEmpty()
        .isLength({ max: 200, min: 10 }),
      body("category").isString().notEmpty(),
      body("stock", "Stock must be defined and be an integer").isInt(),
      body("price", "Price must be defined and be a number").isNumeric(),
      validateRequestParams,
    ],
    createProduct,
  );

router
  .route("/:id")
  .get(
    [
      validateJwt,
      isAdminLogged,
      param("id", "Id Must be a MongoID").isMongoId(),
      validateRequestParams,
    ],
    getProduct,
  )
  .put(
    [
      validateJwt,
      isAdminLogged,
      param("id", "Id Must be a MongoID").isMongoId(),
      body("name", "If defined, name must have at least 4 characters")
        .optional()
        .isLength({ min: 4 }),

      body("name", "Name already in use").custom(async (name, { req }) => {
        const product = await Product.findOne({
          name,
          tp_status: true,
          $nor: [{ _id: req.params.id }],
        });

        if (!product) return true;

        throw new Error("Name already in use");
      }),

      body(
        "description",
        "If defined, description must have at least 10 characters and less than 200",
      )
        .optional()
        .isLength({ max: 200, min: 10 }),
      body("stock", "If defined, Stock must be an integer").optional().isInt(),
      body("price", "If defined, Price must be a number")
        .optional()
        .isNumeric(),
      validateRequestParams,
    ],
    updateProduct,
  )
  .delete(
    [
      validateJwt,
      isAdminLogged,
      param("id", "Id Must be a MongoID").isMongoId(),
      validateRequestParams,
    ],
    deleteProduct,
  );

export default router;
