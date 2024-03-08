import { Router } from "express";
import Category from "./category.model.js";
import { body, param, query } from "express-validator";
import { validateJwt } from "../middleware/validate-jwt.js";
import { isAdminLogged } from "../middleware/is-logged.js";
import { validateRequestParams } from "../middleware/validate-request-params.js";
import Product from "../products/product.model.js";

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
      const [total, categories] = await Promise.allSettled([
        Category.countDocuments(query)
          .limit(limit)
          .skip(limit * page),
        Category.find(query)
          .select("-tp_status -__v")
          .limit(limit)
          .skip(limit * page),
      ]);

      res
        .status(200)
        .json({ total: total.value, categories: categories.value });
    },
  )
  .post(
    [
      validateJwt,
      isAdminLogged,
      body(
        "name",
        "Name must be defined and must have at least 4 characters",
      ).isLength({ min: 4 }),
      body("description", "Description must be a String").optional().isString(),
      body("name", "Name already in use").custom(async (name) => {
        const category = await Category.findOne({ name, tp_status: true });

        if (!category) return true;

        return Promise.reject("Name already in use");
      }),
      validateRequestParams,
    ],
    async (req, res) => {
      const { name, description = "" } = req.body;
      const category = new Category({ name, description });
      await category.save();
      res.status(201).json({ name, _id: category._id, description });
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
      const category = await Category.findOne({
        _id: id,
        tp_status: true,
      }).select("-tp_status -__v");

      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }

      res.status(200).json(category);
    },
  )
  .put(
    [
      validateJwt,
      isAdminLogged,
      param("id", "Id must be a valid ObjectId").isMongoId(),
      body("name", "If defined, name must have at least 4 characters")
        .optional()
        .isLength({ min: 4 }),
      body("description", "If defined, description must be a String")
        .optional()
        .isString(),
      validateRequestParams,
    ],
    async (req, res) => {
      const { id } = req.params;
      const { name, description } = req.body;

      const updatedCategory = { name, description };

      Object.keys(updatedCategory).forEach((key) => {
        if (updatedCategory[key] === undefined) {
          delete updatedCategory[key];
        }
      });

      const category = await Category.findOneAndUpdate(
        {
          _id: id,
          tp_status: true,
        },
        updatedCategory,
      ).select("-tp_status -__v");

      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }

      res.status(200).json({ ...category._doc, ...updatedCategory });
    },
  )
  .delete(
    [
      validateJwt,
      isAdminLogged,
      param("id", "Id must be a valid ObjectId").isMongoId(),
      param("id", "Category not found").custom(async (id) => {
        const category = await Category.findOne({ _id: id, tp_status: true });
        if (!category) return Promise.reject("Category not found");
      }),
      validateRequestParams,
    ],
    async (req, res) => {
      const { id } = req.params;

      const DEFAULT_CATEGORY = await Category.findOne({
        name: "Default",
        tp_status: true,
      });

      if (!DEFAULT_CATEGORY) {
        return res.status(500).json({
          message:
            "Default category not found, unable to transfer products of this category",
        });
      }

      await Product.findOneAndUpdate(
        {
          category: id,
          tp_status: true,
        },
        { category: DEFAULT_CATEGORY._id },
      );

      const category = await Category.findOneAndUpdate(
        {
          _id: id,
          tp_status: true,
        },
        { tp_status: false },
      ).select("-tp_status -__v");

      res.status(200).json(category);
    },
  );

export default router;
