import { Router } from "express";
import Product from "./product.model.js";
import Category from "../category/category.model.js";
import { body, param, query } from "express-validator";
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
        Product.find(query)
          .select("-tp_status -__v")
          .populate("category", "name")
          .limit(limit)
          .skip(offset),
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

      body("name", "Name already in use").custom(async (name) => {
        const product = await Product.findOne({ name });

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

      const product = await new Product({
        name,
        description,
        category: category._id,
      });
      console.log(product);

      await product.save();

      res.status(201).json({
        name,
        description,
        category: {
          name: category.name,
        },
      });
    },
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
    async (req, res) => {
      const { id } = req.params;

      const product = await Product.findOne({ _id: id, tp_status: true })
        .select("name description category")
        .populate("category", "name");

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.status(200).json(product);
    },
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
    async (req, res) => {
      const { id } = req.params;
      const { name, description, category: categoryName } = req.body;

      const category = await Category.findOne({
        name: categoryName,
        tp_status: true,
      });

      if (!category) {
        return res.status(400).json({ message: "Category not found" });
      }

      const updatedProduct = { name, description, category: category._id };

      Object.keys(updatedProduct).forEach((key) => {
        if (!updatedProduct[key]) {
          delete updatedProduct[key];
        }
      });

      console.log({ updatedProduct, id });

      const product = await Product.findOneAndUpdate(
        {
          _id: id,
          tp_status: true,
        },
        updatedProduct,
      );

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.status(200).json({
        name,
        description,
        category: {
          name: category.name,
        },
      });
    },
  )
  .delete([], async (req, res) => {
    const { id } = req.params;

    const product = await Product.findOneAndUpdate(
      {
        _id: id,
        tp_status: true,
      },
      {
        tp_status: false,
      },
    )
      .select("-__v -tp_status")
      .populate("category", "name");

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json(product);
  });

export default router;
