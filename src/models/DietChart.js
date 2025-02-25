import mongoose from 'mongoose';

const mealSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['breakfast', 'lunch', 'dinner'],
    required: true
  },
  ingredients: [{
    type: String,
    required: true
  }],
  specialInstructions: {
    type: String,
    default: ''
  },
  preparationStatus: {
    type: String,
    enum: ['pending', 'preparing', 'ready', 'delivered'],
    default: 'pending'
  },
  assignedPantry: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedDelivery: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  deliveryTime: Date,
  deliveryNotes: String
});

const dietChartSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  meals: [mealSchema],
  dietaryRestrictions: [{
    type: String
  }],
  calories: {
    type: Number
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const DietChart = mongoose.model('DietChart', dietChartSchema);

export default DietChart;
