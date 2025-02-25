import express from 'express';
import Patient from '../models/Patient.js';
import { auth, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get all patients (accessible by all authenticated users)
router.get('/', auth, async (req, res) => {
  try {
    const patients = await Patient.find({ isActive: true });
    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single patient
router.get('/:id', auth, async (req, res) => {
  try {
    const patient = await Patient.findOne({ _id: req.params.id, isActive: true });
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    res.json(patient);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create patient (manager only)
router.post('/', auth, authorize('manager'), async (req, res) => {
  try {
    const requiredFields = ['name', 'age', 'gender', 'roomNumber', 'bedNumber', 'floorNumber', 
      'diseases', 'contactNumber', 'emergencyContact'];
    
    const missingFields = requiredFields.filter(field => {
      if (field === 'emergencyContact') {
        return !req.body[field] || !req.body[field].name || 
               !req.body[field].relationship || !req.body[field].phone;
      }
      return !req.body[field];
    });

    if (missingFields.length > 0) {
      return res.status(400).json({ 
        message: 'Missing required fields', 
        fields: missingFields 
      });
    }

    if (req.body.age && (req.body.age < 0 || req.body.age > 150)) {
      return res.status(400).json({ message: 'Invalid age value' });
    }

    if (req.body.floorNumber && (req.body.floorNumber < 0 || req.body.floorNumber > 20)) {
      return res.status(400).json({ message: 'Invalid floor number' });
    }

    const patient = new Patient({
      ...req.body,
      createdBy: req.user._id
    });

    await patient.save();
    res.status(201).json(patient);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Update patient (manager only)
router.patch('/:id', auth, authorize('manager'), async (req, res) => {
  try {
    if (req.body.age && (req.body.age < 0 || req.body.age > 150)) {
      return res.status(400).json({ message: 'Invalid age value' });
    }

    if (req.body.floorNumber && (req.body.floorNumber < 0 || req.body.floorNumber > 20)) {
      return res.status(400).json({ message: 'Invalid floor number' });
    }

    const patient = await Patient.findOneAndUpdate(
      { _id: req.params.id, isActive: true },
      req.body,
      { new: true, runValidators: true }
    );

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    res.json(patient);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    res.status(400).json({ message: error.message });
  }
});

// Delete patient (manager only)
router.delete('/:id', auth, authorize('manager'), async (req, res) => {
  try {
    const patient = await Patient.findOneAndUpdate(
      { _id: req.params.id, isActive: true },
      { isActive: false },
      { new: true }
    );
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    res.json({ message: 'Patient deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
