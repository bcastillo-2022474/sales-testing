import { Router } from "express";
import Product from "./product.model.js";
import Category from "../category/category.model.js";
import { body, query } from "express-validator";
import { validateRequestParams } from "../middleware/validate-request-params.js";
import { validateJwt } from "../middleware/validate-jwt.js";
import { isAdminLogged } from "../middleware/is-logged.js";

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
    async (req, res) => {
      const { limit = 5, offset = 0 } = req.query;

      const query = { tp_status: true };

      const [total, products] = await Promise.allSettled([
        Product.countDocuments(query),
        Product.find(query).limit(limit).skip(offset),
      ]);

      res.status(200).json({
        total: total.value,
        products: products.value,
      });
    },
  )
  .post(
    [
      validateJwt,
      isAdminLogged,
      body("name", "Name must be defined and must have at least 4 characters")
        .isString()
        .notEmpty()
        .isLength({ min: 4 }),
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
    async (req, res) => {
      const { name, description, category: categoryName } = req.body;

      // find category
      const category = await Category.findOne({
        name: categoryName,
        tp_status: true,
      });

      if (!category) {
        return res.status(400).json({ message: "Category not found" });
      }

      const product = new Product({
        name,
        description,
        category: category.name,
      });
      await product.save();

      res.status(201).json(product);
    },
  );

export default router;
