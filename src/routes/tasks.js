import express from 'express';
import { auth, authorize } from '../middleware/auth.js';
import DietChart from '../models/DietChart.js';

const router = express.Router();

// Get tasks for pantry staff
router.get('/pantry', auth, authorize('pantry'), async (req, res) => {
  try {
    const tasks = await DietChart.find({
      isActive: true,
      'meals.assignedPantry': req.user._id,
      'meals.preparationStatus': { $in: ['pending', 'preparing'] }
    })
    .populate('patient', 'name roomNumber bedNumber')
    .populate('createdBy', 'name');
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get tasks for delivery staff
router.get('/delivery', auth, authorize('delivery'), async (req, res) => {
  try {
    const tasks = await DietChart.find({
      isActive: true,
      'meals.preparationStatus': 'ready',
      'meals.assignedDelivery': { $exists: false }
    })
    .populate('patient', 'name roomNumber bedNumber floorNumber')
    .populate('meals.assignedPantry', 'name');
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get completed preparations for pantry staff
router.get('/pantry/completed', auth, authorize('pantry'), async (req, res) => {
  try {
    const { date } = req.query;
    const queryDate = date ? new Date(date) : new Date();
    queryDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(queryDate);
    nextDay.setDate(queryDate.getDate() + 1);

    const completedTasks = await DietChart.aggregate([
      {
        $match: {
          isActive: true,
          date: { $gte: queryDate, $lt: nextDay }
        }
      },
      {
        $unwind: '$meals'
      },
      {
        $match: {
          'meals.assignedPantry': req.user._id,
          'meals.preparationStatus': { $in: ['ready', 'delivered'] }
        }
      },
      {
        $group: {
          _id: '$_id',
          patient: { $first: '$patient' },
          date: { $first: '$date' },
          meals: { $push: '$meals' },
          createdAt: { $first: '$createdAt' }
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ]);

    await DietChart.populate(completedTasks, [
      {
        path: 'patient',
        select: 'name roomNumber bedNumber'
      }
    ]);

    res.json(completedTasks.filter(task => task.meals.length > 0));
  } catch (error) {
    console.error('Error in /pantry/completed:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get completed deliveries for delivery staff
router.get('/delivery/completed', auth, authorize('delivery'), async (req, res) => {
  try {
    const completedTasks = await DietChart.find({
      isActive: true,
      'meals.assignedDelivery': req.user._id,
      'meals.preparationStatus': 'delivered'
    })
    .populate('patient', 'name roomNumber bedNumber')
    .sort({ 'meals.deliveryTime': -1 });
    res.json(completedTasks);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get statistics for manager
router.get('/stats', auth, authorize('manager'), async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = await DietChart.aggregate([
      { $match: { 
        isActive: true,
        date: { $gte: today }
      }},
      { $unwind: '$meals' },
      { $group: {
        _id: '$meals.preparationStatus',
        count: { $sum: 1 }
      }}
    ]);

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;