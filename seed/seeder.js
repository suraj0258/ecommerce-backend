import mongoose from 'mongoose';
import dotenv from 'dotenv';
import users from '../data/users.js';
import products from '../data/products.js';
import categories from '../data/categories.js';
import User from '../models/userModel.js';
import Product from '../models/productModel.js';
import Category from '../models/categoryModel.js';
import Order from '../models/orderModel.js';

dotenv.config();

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected for seeding'))
  .catch((err) => {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  });

const importData = async () => {
  try {
    // Clear existing data
    await Order.deleteMany();
    await Product.deleteMany();
    await User.deleteMany();
    await Category.deleteMany();

    // Insert new data
    const createdUsers = await User.insertMany(users);
    const adminUser = createdUsers[0]._id;

    const createdCategories = await Category.insertMany(categories);

    const sampleProducts = products.map((product, index) => {
      return {
        ...product,
        user: adminUser,
        category: createdCategories[index % createdCategories.length]._id,
      };
    });

    await Product.insertMany(sampleProducts);

    console.log('Data imported!');
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await Order.deleteMany();
    await Product.deleteMany();
    await User.deleteMany();
    await Category.deleteMany();

    console.log('Data destroyed!');
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
}