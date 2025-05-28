import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Product from '../models/productModel.js';
import User from '../models/userModel.js';
import productRoutes from '../routes/productRoutes.js';
import { errorHandler, notFound } from '../middleware/errorMiddleware.js';
import jest from 'jest'; // Import jest to fix the undeclared variable error

let mongoServer;
const app = express();

// Mock middleware
jest.mock('../middleware/authMiddleware.js', () => ({
  protect: (req, res, next) => {
    req.user = {
      _id: '60f1a5c5c5c5c5c5c5c5c5c5',
      name: 'Test User',
      email: 'test@example.com',
      role: 'admin',
    };
    next();
  },
  admin: (req, res, next) => {
    next();
  },
}));

// Setup
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  app.use(express.json());
  app.use('/api/products', productRoutes);
  app.use(notFound);
  app.use(errorHandler);
});

// Cleanup
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

// Clear data between tests
beforeEach(async () => {
  await Product.deleteMany({});
  await User.deleteMany({});
});

describe('Product Controller', () => {
  describe('GET /api/products', () => {
    it('should fetch all products', async () => {
      // Create test products
      await Product.create([
        {
          name: 'Test Product 1',
          description: 'Test Description 1',
          price: 99.99,
          image: '/test-image-1.jpg',
          category: mongoose.Types.ObjectId(),
          brand: 'Test Brand',
          stock: 10,
          user: mongoose.Types.ObjectId(),
        },
        {
          name: 'Test Product 2',
          description: 'Test Description 2',
          price: 199.99,
          image: '/test-image-2.jpg',
          category: mongoose.Types.ObjectId(),
          brand: 'Test Brand',
          stock: 20,
          user: mongoose.Types.ObjectId(),
        },
      ]);

      const res = await request(app).get('/api/products');
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.products.length).toEqual(2);
      expect(res.body.products[0]).toHaveProperty('name', 'Test Product 1');
      expect(res.body.products[1]).toHaveProperty('name', 'Test Product 2');
    });
  });

  describe('GET /api/products/:id', () => {
    it('should fetch a single product by id', async () => {
      const product = await Product.create({
        name: 'Test Product',
        description: 'Test Description',
        price: 99.99,
        image: '/test-image.jpg',
        category: mongoose.Types.ObjectId(),
        brand: 'Test Brand',
        stock: 10,
        user: mongoose.Types.ObjectId(),
      });

      const res = await request(app).get(`/api/products/${product._id}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('name', 'Test Product');
      expect(res.body).toHaveProperty('price', 99.99);
    });

    it('should return 404 if product not found', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const res = await request(app).get(`/api/products/${nonExistentId}`);
      
      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty('message', 'Product not found');
    });
  });

  describe('POST /api/products', () => {
    it('should create a new product', async () => {
      const productData = {
        name: 'New Product',
        description: 'New Description',
        price: 149.99,
        image: '/new-image.jpg',
        category: mongoose.Types.ObjectId().toString(),
        brand: 'New Brand',
        stock: 15,
      };

      const res = await request(app)
        .post('/api/products')
        .send(productData);
      
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('name', 'New Product');
      expect(res.body).toHaveProperty('price', 149.99);
      
      // Verify product was saved to database
      const savedProduct = await Product.findById(res.body._id);
      expect(savedProduct).not.toBeNull();
      expect(savedProduct.name).toBe('New Product');
    });
  });
});