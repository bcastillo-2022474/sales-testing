import Product from "./product.model.js";
import Category from "../category/category.model.js";

export const getAllProducts = async (req, res) => {
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
};

export const createProduct = async (req, res) => {
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
};

export const getProduct = async (req, res) => {
  const { id } = req.params;

  const product = await Product.findOne({ _id: id, tp_status: true })
    .select("name description category")
    .populate("category", "name");

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  res.status(200).json(product);
};

export const updateProduct = async (req, res) => {
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
};

export const deleteProduct = async (req, res) => {
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
};
