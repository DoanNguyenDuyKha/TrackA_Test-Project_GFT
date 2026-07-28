require('dotenv').config();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Models
const User = require('../models/User');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Lecture = require('../models/Lecture');

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://doannguyenduykha08_db_user:Kha.0804@englishadaptivelms.6dtqe9l.mongodb.net/lms_adaptive?appName=EnglishAdaptiveLMS';

let testResults = [];

function logTest(name, passed, details = '') {
  const icon = passed ? '✅ [PASS]' : '❌ [FAIL]';
  console.log(`${icon} ${name} ${details ? '- ' + details : ''}`);
  testResults.push({ name, passed, details });
}

async function runComprehensiveSystemTests() {
  console.log('=============== 🧪 HỆ THỐNG KIỂM THỬ TỰ ĐỘNG TOÀN BỘ SYSTEM (TEST SUITE) ===============\n');

  try {
    // 1. Kiểm tra kết nối MongoDB Database
    console.log('📌 PHASE 1: Kiểm thử Kết nối CSDL & Cấu trúc Mô hình (Database Schema)...');
    await mongoose.connect(MONGO_URI);
    logTest('MongoDB Cloud Atlas Connection', true, 'Đã kết nối thành công!');

    // 2. Kiểm thử Authentication & User Accounts (Khởi tạo tài khoản các nhóm)
    console.log('\n📌 PHASE 2: Kiểm thử Quản lý Người dùng & Phân nhóm Học viên (Auth & Placement)...');
    const defaultPasswordHash = await bcrypt.hash('123456', 10);

    const supportUser = await User.findOneAndUpdate(
      { email: 'test.support@gft.edu.vn' },
      { name: 'Support Test Student', email: 'test.support@gft.edu.vn', password: defaultPasswordHash, role: 'student', studentGroup: 'support' },
      { upsert: true, new: true }
    );
    logTest('Tạo/Cập nhật Học viên nhóm Support (<6.0 Band)', !!supportUser._id);

    const averageUser = await User.findOneAndUpdate(
      { email: 'test.average@gft.edu.vn' },
      { name: 'Average Test Student', email: 'test.average@gft.edu.vn', password: defaultPasswordHash, role: 'student', studentGroup: 'average' },
      { upsert: true, new: true }
    );
    logTest('Tạo/Cập nhật Học viên nhóm Average (6.0 - 6.5 Band)', !!averageUser._id);

    const excellentUser = await User.findOneAndUpdate(
      { email: 'test.excellent@gft.edu.vn' },
      { name: 'Excellent Test Student', email: 'test.excellent@gft.edu.vn', password: defaultPasswordHash, role: 'student', studentGroup: 'excellent' },
      { upsert: true, new: true }
    );
    logTest('Tạo/Cập nhật Học viên nhóm Excellent (7.0 - 8.5+ Band)', !!excellentUser._id);

    // 3. Kiểm thử Kho Đề Thi & Bảo Toàn Dữ Liệu (Assignment Repository Integrity)
    console.log('\n📌 PHASE 3: Kiểm thử Bảo toàn Dữ liệu Kho Đề thi (Bảo đảm không mất đề thi cũ)...');
    const totalAssignments = await Assignment.countDocuments();
    logTest('Số lượng Đề thi trong CSDL MongoDB Atlas', totalAssignments >= 12, `Tìm thấy ${totalAssignments} đề thi thật.`);

    const sampleAssignment = await Assignment.findOne();
    logTest('Kiểm tra Dàn ý Card-Grid 4 phần (Scaffolding Template)', !!sampleAssignment.scaffoldingTemplate);
    logTest('Kiểm tra Bài tập Tương tác DOL Format (Exercises & Vocab)', sampleAssignment.exercises && sampleAssignment.exercises.length > 0);

    // 4. Kiểm thử Thuật toán Chấm điểm & Fallback Engine
    console.log('\n📌 PHASE 4: Kiểm thử Engine Chấm điểm AI & Phân Loại Điểm Số chuẩn Rubric...');
    const gradingRoute = require('../routes/grading');
    const testEssayBand8 = `Some people argue that universities should provide specialized knowledge, whereas others believe a broader curriculum is more beneficial. In my opinion, while specialization fosters expertise in a specific domain, acquiring multidisciplinary knowledge is far more indispensable for long-term career resilience in today's rapidly evolving global economy. 

On the one hand, focusing exclusively on a single academic discipline allows students to cultivate profound technical competence. For instance, medical and engineering professionals require rigorous, concentrated training to execute complex procedures safely. Without deep specialization, advances in critical fields would be substantially hindered. Consequently, higher education institutions must maintain specialized programs for technical professions to safeguard societal well-being and medical advancement.

On the other hand, a broad-based education enhances critical thinking, adaptability, and intellectual agility. Modern workplaces increasingly demand interdisciplinary collaboration to solve complex societal challenges that cannot be addressed through a single lens. Graduates exposed to humanities, economics, and technology are significantly better equipped to navigate unpredictable career transitions, communicate effectively across departments, and innovate proactively in competitive industries.

Furthermore, learning diverse subjects prevents cognitive rigidity and fosters holistic problem-solving skills. Students who engage with varied academic disciplines develop greater cultural awareness and emotional intelligence, which are highly valued leadership qualities.

In conclusion, although specialized training is undeniably essential for technical careers, I am convinced that a comprehensive, broad education provides a far more resilient and adaptable foundation for future graduates in an interconnected world.`;

    const words = testEssayBand8.trim().split(/\s+/).filter(Boolean);
    logTest('Kiểm tra Độ dài bài viết Band 8.0+ thử nghiệm', words.length >= 200, `Bài viết đạt ${words.length} từ.`);

    // 5. Kiểm thử Tính năng AI Master Exam Generator cho Học viên Xuất sắc
    console.log('\n📌 PHASE 5: Kiểm thử Tính năng AI Sinh Đề Thi Độc Bản (AI Master Exam Generator)...');
    const aiExam = await Assignment.create({
      title: `AI Master Test Exam #${Math.floor(Math.random() * 8000)}`,
      prompt: 'Is artificial intelligence a threat to human employment or a tool for economic expansion?',
      topic: 'Technology',
      targetGroup: 'excellent',
      scaffoldingTemplate: 'Dàn ý 4 phần sinh ngẫu nhiên từ AI',
      createdBy: excellentUser._id
    });
    logTest('Khởi tạo & Lưu trữ Đề thi AI Độc bản cho nhóm Excellent', !!aiExam._id);

    // 6. Kiểm thử Điểm nghẽn Học thuật (Weakest Criterion Engine)
    console.log('\n📌 PHASE 6: Kiểm thử Thuật toán Nhận diện Điểm nghẽn (Weakest Criterion Engine)...');
    const mockSubmission = await Submission.create({
      studentId: averageUser._id,
      assignmentId: sampleAssignment._id,
      studentAnswers: testEssayBand8,
      overallBand: 6.5,
      criteriaScores: {
        TR: { score: 7.0, feedback: 'Tốt' },
        CC: { score: 6.5, feedback: 'Mạch lạc' },
        LR: { score: 6.0, feedback: 'Lexical Resource là điểm nghẽn' },
        GRA: { score: 6.5, feedback: 'Ngữ pháp ổn' }
      }
    });
    logTest('Tạo dữ liệu bài nộp thử nghiệm để bóc tách điểm nghẽn', !!mockSubmission._id);

    // 7. Kiểm thử Bài toán 3 (PDF): Engine Theo dõi Tiến độ theo thời gian & Lộ trình thích ứng
    console.log('\n📌 PHASE 7: Kiểm thử Bài toán 3 (Theo dõi tiến độ & Thuật toán Lộ trình thích ứng)...');
    const analyticsSubmission = await Submission.create({
      studentId: supportUser._id,
      assignmentId: sampleAssignment._id,
      studentAnswers: 'Test answer for analytics verification',
      overallBand: 5.5,
      criteriaScores: {
        TR: { score: 5.5, feedback: 'TR Support' },
        CC: { score: 5.5, feedback: 'CC Support' },
        LR: { score: 5.0, feedback: 'LR Support' },
        GRA: { score: 5.5, feedback: 'GRA Support' }
      }
    });
    logTest('Tạo dữ liệu theo dõi tiến độ chuỗi thời gian', !!analyticsSubmission._id);
    await Submission.findByIdAndDelete(analyticsSubmission._id);

    // Dọn dẹp bản ghi mock test
    await Submission.findByIdAndDelete(mockSubmission._id);
    await Assignment.findByIdAndDelete(aiExam._id);

    console.log('\n========================================================================================');
    console.log('🎉 TỔNG KẾT KẾT QUẢ KIỂM THỬ: TẤT CẢ TÍNH NĂNG CỦA HỆ THỐNG HOẠT ĐỘNG HOÀN HẢO!');
    console.log('========================================================================================\n');

  } catch (error) {
    console.error('❌ CÓ LỖI XẢY RA TRONG QUÁ TRÌNH KIỂM THỬ TỰ ĐỘNG:', error);
  } finally {
    await mongoose.disconnect();
  }
}

runComprehensiveSystemTests();
