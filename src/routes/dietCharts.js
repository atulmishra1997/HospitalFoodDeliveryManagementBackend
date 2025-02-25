import express from 'express';
import DietChart from '../models/DietChart.js';
import { auth, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get all diet charts (accessible by all authenticated users)
router.get('/', auth, async (req, res) => {
  try {
    const dietCharts = await DietChart.find({ isActive: true })
      .populate('patient', 'name roomNumber bedNumber')
      .populate('createdBy', 'name')
      .populate('meals.assignedPantry', 'name')
      .populate('meals.assignedDelivery', 'name');
    res.json(dietCharts);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single diet chart
router.get('/:id', auth, async (req, res) => {
  try {
    const dietChart = await DietChart.findOne({ _id: req.params.id, isActive: true })
      .populate('patient', 'name roomNumber bedNumber')
      .populate('createdBy', 'name')
      .populate('meals.assignedPantry', 'name')
      .populate('meals.assignedDelivery', 'name');
    if (!dietChart) {
      return res.status(404).json({ message: 'Diet chart not found' });
    }
    res.json(dietChart);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create diet chart (manager only)
router.post('/', auth, authorize('manager'), async (req, res) => {
  try {
    const dietChart = new DietChart({
      ...req.body,
      createdBy: req.user._id
    });
    await dietChart.save();
    res.status(201).json(dietChart);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update diet chart (manager only)
router.patch('/:id', auth, authorize('manager'), async (req, res) => {
  try {
    const dietChart = await DietChart.findOneAndUpdate(
      { _id: req.params.id, isActive: true },
      req.body,
      { new: true, runValidators: true }
    );
    if (!dietChart) {
      return res.status(404).json({ message: 'Diet chart not found' });
    }
    res.json(dietChart);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update meal status (pantry and delivery staff)
router.patch('/:id/meals/:mealId', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const dietChart = await DietChart.findOne({ _id: req.params.id, isActive: true });
    
    if (!dietChart) {
      return res.status(404).json({ message: 'Diet chart not found' });
    }

    const meal = dietChart.meals.id(req.params.mealId);
    if (!meal) {
      return res.status(404).json({ message: 'Meal not found' });
    }

    // Validate status updates based on role
    if (req.user.role === 'pantry' && ['preparing', 'ready'].includes(status)) {
      meal.preparationStatus = status;
      meal.assignedPantry = req.user._id;
    } else if (req.user.role === 'delivery' && status === 'delivered') {
      meal.preparationStatus = status;
      meal.assignedDelivery = req.user._id;
      meal.deliveryTime = new Date();
    } else {
      return res.status(403).json({ message: 'Unauthorized status update' });
    }

    await dietChart.save();
    res.json(dietChart);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete diet chart (manager only)
router.delete('/:id', auth, authorize('manager'), async (req, res) => {
  try {
    const dietChart = await DietChart.findOneAndUpdate(
      { _id: req.params.id, isActive: true },
      { isActive: false },
      { new: true }
    );
    if (!dietChart) {
      return res.status(404).json({ message: 'Diet chart not found' });
    }
    res.json({ message: 'Diet chart deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;