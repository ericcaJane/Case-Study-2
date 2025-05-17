const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
require('dotenv').config();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Parser } = require('json2csv');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/residentsDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// MongoDB Schemas and Models
const userSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  password: String,
  role: String,
});

const residentSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  age: { type: Number, required: true, min: 0 },
  gender: { type: String, enum: ['Male', 'Female'], required: true },
  employmentStatus: { type: String, enum: ['Employed', 'Unemployed', 'Retired'], required: true },
  civilStatus: { type: String, enum: ['Single', 'Married', 'Divorced', 'Widowed'], required: true },
  address: { type: String, required: true },
  contact: { type: String, match: /^[0-9]{11}$/, required: true },
  householdNumber: { type: String, required: true },
  source: { type: String },
}, { timestamps: true });

// Add a unique index for name + address + contact
residentSchema.index({ name: 1, address: 1, contact: 1 }, { unique: true });

const User = mongoose.model('User', userSchema);
const Resident = mongoose.model('Resident', residentSchema);

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) {
    return res.status(403).json({ message: 'No token provided' });
  }

  jwt.verify(token.split(' ')[1], process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error('Token verification failed:', err);
      return res.status(500).json({ message: 'Failed to authenticate token' });
    }
    console.log('Decoded token:', decoded); // 👈 Add this
    req.user = decoded;
    next();
  });
  
};

// Middleware to check for admin role
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied: Admins only' });
  }
  next();
};

// Function to generate a short obfuscated ID from UUID
function generateShortId() {
  const uuid = uuidv4(); // Generate a full UUID
  const hash = crypto.createHash('sha256').update(uuid).digest('hex'); // Hash the UUID
  return hash.slice(0, 6); // Return the first 6 characters of the hash
}

// Signup Endpoint
app.post("/signup", async (req, res) => {
  try {
    const { email, password, role, confirmationCode } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ success: false, message: "Missing required fields!" });
    }

    if (role === "admin" && confirmationCode !== "AdminPass") {
      return res.status(400).json({ success: false, message: "Invalid confirmation code for admin role" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "User already exists!" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ email, password: hashedPassword, role });
    await newUser.save();

    res.json({ success: true, message: "Signup successful!" });
  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Login Endpoint
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ success: false, message: "Invalid password" });
    }

    const token = jwt.sign({ email, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.json({ success: true, token, user: { email, role: user.role } });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Fetch All Residents
app.get('/residents/view', async (req, res) => {
  try {
    const residents = await Resident.find();
    res.json(residents);
  } catch (error) {
    console.error('Error fetching residents:', error);
    res.status(500).json({ message: 'Failed to fetch residents' });
  }
});

// Add Resident
app.post("/residents", verifyToken, isAdmin, async (req, res) => {
  const { name, age, gender, employmentStatus, civilStatus, address, contact, householdNumber } = req.body;

  if (!name || !age || !gender || !employmentStatus || !civilStatus || !address || !contact || !householdNumber) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // Check for duplicate resident
    const existingResident = await Resident.findOne({ name, address, contact });
    if (existingResident) {
      return res.status(400).json({ message: "Resident with the same name, address, and contact already exists" });
    }

    // Add the resident
    const newResident = new Resident({
      id: generateShortId(),
      name,
      age,
      gender,
      employmentStatus,
      civilStatus,
      address,
      contact,
      householdNumber,
    });

    await newResident.save();
    res.status(201).json({ message: "Resident saved successfully", resident: newResident });
  } catch (error) {
    if (error.code === 11000) { // MongoDB duplicate key error
      res.status(400).json({ message: "Duplicate resident detected" });
    } else {
      console.error("Error saving resident:", error);
      res.status(500).json({ message: "Failed to save resident" });
    }
  }
});

// Fetch Resident by ID
app.get('/residents', verifyToken, async (req, res) => {
  try {
    const residents = await Resident.find();
    res.json(residents);
  } catch (error) {
    console.error('Error fetching residents:', error);
    res.status(500).json({ message: 'Failed to fetch residents' });
  }
});

app.get('/residents/qr/:id', async (req, res) => {
  try {
    const resident = await Resident.findOne({ id: req.params.id });
    if (!resident) {
      return res.status(404).json({ message: 'Resident not found' });
    }
    res.json(resident);
  } catch (error) {
    console.error('Error fetching resident by QR ID:', error);
    res.status(500).json({ message: 'Failed to fetch resident' });
  }
});


// Update Resident
app.put('/residents/:id', verifyToken, isAdmin, async (req, res) => { 
  try {
    const updates = req.body;
    const updatedResident = await Resident.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!updatedResident) {
      return res.status(404).json({ message: 'Resident not found' });
    }
    res.json({ message: 'Resident updated successfully', resident: updatedResident });
  } catch (error) {
    console.error('Error updating resident:', error);
    res.status(500).json({ message: 'Failed to update resident' });
  }
});

// Delete Resident
app.delete('/residents/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const deletedResident = await Resident.findByIdAndDelete(req.params.id);
    if (!deletedResident) {
      return res.status(404).json({ message: 'Resident not found' });
    }
    res.json({ message: 'Resident deleted successfully' });
  } catch (error) {
    console.error('Error deleting resident:', error);
    res.status(500).json({ message: 'Failed to delete resident' });
  }
});

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// CSV Upload Endpoint
app.post('/residents/upload', verifyToken, isAdmin, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const results = [];

  fs.createReadStream(req.file.path)
    .pipe(csv({
      mapHeaders: ({ header }) => header.trim().toLowerCase()
    }))
    .on('data', (data) => {
      const cleaned = {
        id: generateShortId(),
        name: data.name?.trim(),
        age: Number(data.age),
        gender: capitalizeFirstLetter(data.gender),
        employmentStatus: capitalizeFirstLetter(data.employmentstatus),
        civilStatus: capitalizeFirstLetter(data.civilstatus),
        address: data.address?.trim(),
        contact: data.contact?.trim(),
        householdNumber: data.householdnumber?.trim(),
        source: 'csv-upload'
      };

      if (isValidResident(cleaned)) {
        results.push(cleaned);
      }
    })
    .on('end', async () => {
      try {
        const insertedResidents = [];
        const skippedResidents = [];

        for (const resident of results) {
          // Check for duplicate resident
          const existingResident = await Resident.findOne({
            name: resident.name,
            address: resident.address,
            contact: resident.contact
          });

          if (!existingResident) {
            insertedResidents.push(resident);
          } else {
            skippedResidents.push(resident);
          }
        }

        // Insert only non-duplicate residents
        if (insertedResidents.length > 0) {
          await Resident.insertMany(insertedResidents, { ordered: false });
        }

        fs.unlinkSync(req.file.path); // Clean up the uploaded file

        // Return appropriate response
        if (insertedResidents.length === 0) {
          return res.status(400).json({
            message: 'No new residents were added. All rows in the CSV file are duplicates.',
            inserted: 0,
            skipped: skippedResidents.length
          });
        }

        res.status(201).json({
          message: 'CSV data imported successfully',
          inserted: insertedResidents.length,
          skipped: skippedResidents.length
        });
      } catch (error) {
        console.error('Error importing CSV data:', error);
        res.status(500).json({ message: 'Failed to import CSV data', error: error.message });
      }
    });
});

// Helper: Capitalize first letter
function capitalizeFirstLetter(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// Helper: Validate resident data before inserting to DB
function isValidResident(resident) {
  return (
    resident.name &&
    resident.age >= 0 &&
    ['Male', 'Female'].includes(resident.gender) &&
    ['Employed', 'Unemployed', 'Retired'].includes(resident.employmentStatus) &&
    ['Single', 'Married', 'Divorced', 'Widowed'].includes(resident.civilStatus) &&
    resident.address &&
    /^[0-9]{11}$/.test(resident.contact) &&
    resident.householdNumber
  );
}

app.get('/residents/backup', verifyToken, isAdmin, async (req, res) => {
  try {
    const residents = await Resident.find().lean();

    if (residents.length === 0) {
      return res.status(404).json({ message: 'No resident data to backup' });
    }

    const fields = [
      'name',
      'age',
      'gender',
      'employmentStatus',
      'civilStatus',
      'address',
      'contact',
      'householdNumber',
      'source'
    ];

    const opts = { fields };
    const parser = new Parser(opts);
    const csv = parser.parse(residents);

    const fileName = `resident-backup-${Date.now()}.csv`;
    const filePath = path.join(__dirname, 'backups', fileName);

    // Ensure backups folder exists
    fs.mkdirSync(path.join(__dirname, 'backups'), { recursive: true });
    fs.writeFileSync(filePath, csv);

    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error('Error sending backup file:', err);
        res.status(500).json({ message: 'Failed to download backup' });
      }
      // Optionally delete file after download to clean up
      // fs.unlinkSync(filePath);
    });

  } catch (error) {
    console.error('Error creating backup:', error);
    res.status(500).json({ message: 'Failed to create backup' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});