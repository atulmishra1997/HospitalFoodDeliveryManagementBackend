import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://amsrnth2014:Amsrnth202@cluster0.qb7kr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

const defaultUsers = [
  {
    email: 'hospital_manager@xyz.com',
    password: 'Password@2025',
    name: 'Hospital Manager',
    role: 'manager',
    contactNumber: '+1234567890'
  },
  {
    email: 'hospital_pantry@xyz.com',
    password: 'Password@2025',
    name: 'Pantry Staff',
    role: 'pantry',
    contactNumber: '+1234567891'
  },
  {
    email: 'hospital_delivery@xyz.com',
    password: 'Password@2025',
    name: 'Delivery Staff',
    role: 'delivery',
    contactNumber: '+1234567892'
  }
];

async function seedUsers() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing users
    await User.deleteMany({});
    console.log('Cleared existing users');

    // Create new users
    const createdUsers = await User.create(defaultUsers);
    console.log('Created default users:', createdUsers.map(user => user.email));

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error seeding users:', error);
    process.exit(1);
  }
}

seedUsers();
