import User from '../models/userModel.js';
import asyncHandler from 'express-async-handler';
import generateToken from '../utils/generateToken.js';

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  const user = await User.create({
    name,
    email,
    password,
    phone,
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');

  if (user) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.phone = req.body.phone || user.phone;
    
    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      phone: updatedUser.phone,
      token: generateToken(updatedUser._id),
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Add address to user profile
// @route   POST /api/users/address
// @access  Private
const addUserAddress = asyncHandler(async (req, res) => {
  const { street, city, state, zipCode, country, isDefault } = req.body;
  
  const user = await User.findById(req.user._id);
  
  if (user) {
    const address = {
      street,
      city,
      state,
      zipCode,
      country,
      isDefault: isDefault || false,
    };
    
    // If this is the default address, unset any existing default
    if (address.isDefault) {
      user.addresses.forEach(addr => {
        addr.isDefault = false;
      });
    }
    
    // If this is the first address, make it default
    if (user.addresses.length === 0) {
      address.isDefault = true;
    }
    
    user.addresses.push(address);
    
    const updatedUser = await user.save();
    
    res.status(201).json({
      addresses: updatedUser.addresses,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update user address
// @route   PUT /api/users/address/:addressId
// @access  Private
const updateUserAddress = asyncHandler(async (req, res) => {
  const { street, city, state, zipCode, country, isDefault } = req.body;
  const addressId = req.params.addressId;
  
  const user = await User.findById(req.user._id);
  
  if (user) {
    const addressIndex = user.addresses.findIndex(
      addr => addr._id.toString() === addressId
    );
    
    if (addressIndex === -1) {
      res.status(404);
      throw new Error('Address not found');
    }
    
    // If setting this as default, unset any existing default
    if (isDefault) {
      user.addresses.forEach(addr => {
        addr.isDefault = false;
      });
    }
    
    user.addresses[addressIndex] = {
      _id: user.addresses[addressIndex]._id,
      street: street || user.addresses[addressIndex].street,
      city: city || user.addresses[addressIndex].city,
      state: state || user.addresses[addressIndex].state,
      zipCode: zipCode || user.addresses[addressIndex].zipCode,
      country: country || user.addresses[addressIndex].country,
      isDefault: isDefault !== undefined ? isDefault : user.addresses[addressIndex].isDefault,
    };
    
    const updatedUser = await user.save();
    
    res.json({
      addresses: updatedUser.addresses,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Delete user address
// @route   DELETE /api/users/address/:addressId
// @access  Private
const deleteUserAddress = asyncHandler(async (req, res) => {
  const addressId = req.params.addressId;
  
  const user = await User.findById(req.user._id);
  
  if (user) {
    const addressIndex = user.addresses.findIndex(
      addr => addr._id.toString() === addressId
    );
    
    if (addressIndex === -1) {
      res.status(404);
      throw new Error('Address not found');
    }
    
    const wasDefault = user.addresses[addressIndex].isDefault;
    
    // Remove the address
    user.addresses.splice(addressIndex, 1);
    
    // If the removed address was the default and there are other addresses,
    // make the first one the default
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }
    
    const updatedUser = await user.save();
    
    res.json({
      addresses: updatedUser.addresses,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Add product to wishlist
// @route   POST /api/users/wishlist
// @access  Private
const addToWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  
  const user = await User.findById(req.user._id);
  
  if (user) {
    // Check if product is already in wishlist
    if (user.wishlist.includes(productId)) {
      res.status(400);
      throw new Error('Product already in wishlist');
    }
    
    user.wishlist.push(productId);
    
    const updatedUser = await user.save();
    
    res.status(201).json({
      wishlist: updatedUser.wishlist,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Remove product from wishlist
// @route   DELETE /api/users/wishlist/:productId
// @access  Private
const removeFromWishlist = asyncHandler(async (req, res) => {
  const productId = req.params.productId;
  
  const user = await User.findById(req.user._id);
  
  if (user) {
    const productIndex = user.wishlist.indexOf(productId);
    
    if (productIndex === -1) {
      res.status(404);
      throw new Error('Product not found in wishlist');
    }
    
    user.wishlist.splice(productIndex, 1);
    
    const updatedUser = await user.save();
    
    res.json({
      wishlist: updatedUser.wishlist,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Get user wishlist
// @route   GET /api/users/wishlist
// @access  Private
const getWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('wishlist');
  
  if (user) {
    res.json(user.wishlist);
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
  const pageSize = Number(req.query.pageSize) || 10;
  const page = Number(req.query.page) || 1;
  
  const count = await User.countDocuments({});
  const users = await User.find({})
    .select('-password')
    .limit(pageSize)
    .skip(pageSize * (page - 1));
  
  res.json({
    users,
    page,
    pages: Math.ceil(count / pageSize),
    totalUsers: count,
  });
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    await user.deleteOne();
    res.json({ message: 'User removed' });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');

  if (user) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.role = req.body.role || user.role;

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

export {
  authUser,
  registerUser,
  getUserProfile,
  updateUserProfile,
  addUserAddress,
  updateUserAddress,
  deleteUserAddress,
  addToWishlist,
  removeFromWishlist,
  getWishlist,
  getUsers,
  deleteUser,
  getUserById,
  updateUser,
};