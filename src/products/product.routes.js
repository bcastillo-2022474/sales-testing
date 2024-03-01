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

router
  .route("/")
  .get(
    [
      validateJwt,
      isAdminLogged,
      query("limit", "Limit must be a number").optional().isNumeric(),
      query("offset", "Offset must be a number").optional().isNumeric(),
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
