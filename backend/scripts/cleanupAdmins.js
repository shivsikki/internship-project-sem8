const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

const cleanupAdmins = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hospital');
    console.log('Connected to MongoDB');

    const admins = await User.find({ role: 'admin' }).sort({ createdAt: 1 });
    
    if (admins.length === 0) {
      console.log('No admins found in the database. When someone registers as admin they will become Root.');
      process.exit(0);
    }

    const firstAdmin = admins[0];
    console.log(`Setting oldest admin (${firstAdmin.email}) as Root Admin.`);
    
    firstAdmin.isRootAdmin = true;
    firstAdmin.isApproved = true;
    await firstAdmin.save();

    const adminsToDelete = admins.slice(1).map(a => a._id);
    if (adminsToDelete.length > 0) {
      console.log(`Deleting ${adminsToDelete.length} other admins.`);
      await User.deleteMany({ _id: { $in: adminsToDelete } });
    } else {
      console.log('No other admins to delete.');
    }

    console.log('Cleanup complete.');
    process.exit(0);
  } catch (error) {
    console.error('Error cleaning up admins:', error);
    process.exit(1);
  }
};

cleanupAdmins();
