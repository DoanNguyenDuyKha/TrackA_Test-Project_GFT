require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://doannguyenduykha08_db_user:Kha.0804@englishadaptivelms.6dtqe9l.mongodb.net/lms_adaptive?appName=EnglishAdaptiveLMS';

async function createExcellentAccount() {
  try {
    console.log('Connecting to MongoDB Cloud Atlas...');
    await mongoose.connect(MONGO_URI);

    const passwordHash = await bcrypt.hash('123456', 10);

    const excellentStudent = await User.findOneAndUpdate(
      { email: 'excellent.student@gft.edu.vn' },
      {
        name: 'Học Viên Xuất Sắc (Band 8.0+)',
        email: 'excellent.student@gft.edu.vn',
        password: passwordHash,
        role: 'student',
        studentGroup: 'excellent',
        targetBand: 8.5
      },
      { upsert: true, new: true }
    );

    console.log('Excellent student account created successfully:', excellentStudent.email);
  } catch (err) {
    console.error('Error creating excellent student account:', err);
  } finally {
    await mongoose.disconnect();
  }
}

createExcellentAccount();
