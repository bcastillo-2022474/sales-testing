import Router from "express";
import Product from "./product.model.js";
import Category from "../category/category.model.js";

const router = Router();

router
  .router("/")
  .get(async (req, res) => {
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
  })
  .post(async (req, res) => {
    const { name, description, category: categoryName } = req.body;

    // find category
    const category = await Category.findOne({
      name: categoryName,
      tp_status: true,
    });

    if (!category) {
      return res.status(400).json({ message: "Category not found" });
    }

    const product = new Product({ name, description, category: category.name });
    await product.save();

    res.status(201).json(product);
  });

export default router;
