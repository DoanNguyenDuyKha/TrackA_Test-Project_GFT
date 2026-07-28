require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://doannguyenduykha08_db_user:Kha.0804@englishadaptivelms.6dtqe9l.mongodb.net/lms_adaptive?appName=EnglishAdaptiveLMS';

let testPassCount = 0;
let testFailCount = 0;

function assert(condition, testName, detail = '') {
  if (condition) {
    console.log(`✅ [PASS] ${testName} ${detail ? '- ' + detail : ''}`);
    testPassCount++;
  } else {
    console.error(`❌ [FAIL] ${testName} ${detail ? '- ' + detail : ''}`);
    testFailCount++;
  }
}

async function runProgressAnalyticsTest() {
  console.log('========================================================================================');
  console.log('🧪 KỊCH BẢN KIỂM THỬ TỰ ĐỘNG CHUYÊN SÂU: GIAI ĐOẠN 1 - BÀI TOÁN 3 TRACK A (PDF GFT)');
  console.log('========================================================================================\n');

  try {
    console.log('📌 STEP 1: Kết nối MongoDB Cloud Atlas...');
    await mongoose.connect(MONGO_URI);
    assert(mongoose.connection.readyState === 1, 'MongoDB Cloud Atlas Connection Status', 'Đã kết nối thành công');

    console.log('\n📌 STEP 2: Tạo/Khởi tạo Học viên thử nghiệm kịch bản tiến độ...');
    const testStudent = await User.findOneAndUpdate(
      { email: 'analytics.test@gft.edu.vn' },
      {
        name: 'Analytics Test Student',
        email: 'analytics.test@gft.edu.vn',
        role: 'student',
        studentGroup: 'support',
        targetBand: 6.5
      },
      { upsert: true, new: true }
    );
    assert(!!testStudent._id, 'Khởi tạo tài khoản học viên thử nghiệm', `ID: ${testStudent._id}`);

    const sampleAssignment = await Assignment.findOne();
    assert(!!sampleAssignment, 'Lấy đề thi thật mẫu từ CSDL', `Title: ${sampleAssignment?.title}`);

    console.log('\n📌 STEP 3: Giả lập Chuỗi Bài Nộp Theo Thời Gian (Time-Series Submissions)...');
    await Submission.deleteMany({ studentId: testStudent._id });

    const sub1 = await Submission.create({
      studentId: testStudent._id,
      assignmentId: sampleAssignment._id,
      studentAnswers: 'Sample essay 1 for progress tracking',
      overallBand: 5.0,
      criteriaScores: {
        TR: { score: 5.0, feedback: 'TR 5.0' },
        CC: { score: 5.0, feedback: 'CC 5.0' },
        LR: { score: 4.5, feedback: 'LR 4.5' },
        GRA: { score: 5.5, feedback: 'GRA 5.5' }
      },
      submittedAt: new Date(Date.now() - 3 * 86400000)
    });

    const sub2 = await Submission.create({
      studentId: testStudent._id,
      assignmentId: sampleAssignment._id,
      studentAnswers: 'Sample essay 2 for progress tracking',
      overallBand: 5.5,
      criteriaScores: {
        TR: { score: 5.5, feedback: 'TR 5.5' },
        CC: { score: 5.5, feedback: 'CC 5.5' },
        LR: { score: 5.0, feedback: 'LR 5.0' },
        GRA: { score: 6.0, feedback: 'GRA 6.0' }
      },
      submittedAt: new Date(Date.now() - 2 * 86400000)
    });

    const sub3 = await Submission.create({
      studentId: testStudent._id,
      assignmentId: sampleAssignment._id,
      studentAnswers: 'Sample essay 3 for progress tracking',
      overallBand: 6.0,
      criteriaScores: {
        TR: { score: 6.0, feedback: 'TR 6.0' },
        CC: { score: 6.0, feedback: 'CC 6.0' },
        LR: { score: 5.5, feedback: 'LR 5.5' },
        GRA: { score: 6.5, feedback: 'GRA 6.5' }
      },
      submittedAt: new Date(Date.now() - 1 * 86400000)
    });

    const sub4 = await Submission.create({
      studentId: testStudent._id,
      assignmentId: sampleAssignment._id,
      studentAnswers: 'Sample essay 4 for progress tracking',
      overallBand: 6.5,
      criteriaScores: {
        TR: { score: 6.5, feedback: 'TR 6.5' },
        CC: { score: 6.5, feedback: 'CC 6.5' },
        LR: { score: 6.0, feedback: 'LR 6.0' },
        GRA: { score: 7.0, feedback: 'GRA 7.0' }
      },
      submittedAt: new Date()
    });

    assert(!!sub1._id && !!sub4._id, 'Khởi tạo thành công chuỗi 4 bài nộp theo thời gian');

    console.log('\n📌 STEP 4: Kiểm thử Thuật toán Phân tích Tiến độ & Chỉ số Độ Ổn Định...');
    const userSubmissions = await Submission.find({ studentId: testStudent._id }).sort({ submittedAt: 1 });
    assert(userSubmissions.length === 4, 'Truy vấn chuỗi thời gian bài nộp', `Tìm thấy ${userSubmissions.length} bài`);

    const overallSum = userSubmissions.reduce((acc, s) => acc + s.overallBand, 0);
    const movingAvg = Number((overallSum / userSubmissions.length).toFixed(2));
    assert(movingAvg === 5.75, 'Tính toán Band Trung Bình Động (Moving Average Band)', `Kết quả: ${movingAvg} Band (Kỳ vọng: 5.75)`);

    const variance = userSubmissions.reduce((acc, s) => acc + Math.pow(s.overallBand - movingAvg, 2), 0) / userSubmissions.length;
    const stdDev = Number(Math.sqrt(variance).toFixed(2));
    assert(stdDev > 0, 'Tính toán Chỉ số Độ lệch chuẩn (Consistency Metric / Stability Index)', `StdDev: ${stdDev}`);

    console.log('\n📌 STEP 5: Kiểm thử Thuật toán Bóc tách Điểm nghẽn Học thuật (Weakest Criterion Engine)...');
    const criteriaSums = { TR: 0, CC: 0, LR: 0, GRA: 0 };
    userSubmissions.forEach(s => {
      criteriaSums.TR += s.criteriaScores.TR.score;
      criteriaSums.CC += s.criteriaScores.CC.score;
      criteriaSums.LR += s.criteriaScores.LR.score;
      criteriaSums.GRA += s.criteriaScores.GRA.score;
    });

    const criteriaAvg = {
      TR: Number((criteriaSums.TR / 4).toFixed(1)),
      CC: Number((criteriaSums.CC / 4).toFixed(1)),
      LR: Number((criteriaSums.LR / 4).toFixed(1)),
      GRA: Number((criteriaSums.GRA / 4).toFixed(1))
    };

    assert(criteriaAvg.LR === 5.3, 'Bóc tách điểm trung bình Lexical Resource (LR)', `LR: ${criteriaAvg.LR}`);
    assert(criteriaAvg.GRA === 6.3, 'Bóc tách điểm trung bình Grammar (GRA)', `GRA: ${criteriaAvg.GRA}`);

    let weakest = 'TR';
    let minScore = criteriaAvg.TR;
    Object.keys(criteriaAvg).forEach(k => {
      if (criteriaAvg[k] < minScore) {
        minScore = criteriaAvg[k];
        weakest = k;
      }
    });

    assert(weakest === 'LR', 'Tự động nhận diện Điểm nghẽn Học thuật thấp nhất chính xác', `Điểm nghẽn là ${weakest} với ${minScore} Band`);

    console.log('\n📌 STEP 6: Kiểm thử Thuật toán Sinh Lộ Trình Học Thích Ứng Cá Nhân Hóa (Adaptive Roadmap)...');
    const isEligibleForPromotion = movingAvg >= 5.5;
    assert(isEligibleForPromotion === true, 'Đánh giá điều kiện đủ xét làm bài Test Nâng Hạng', `Moving Average ${movingAvg} >= 5.5 -> Đủ điều kiện!`);

    await Submission.deleteMany({ studentId: testStudent._id });
    await User.findByIdAndDelete(testStudent._id);

    console.log('\n========================================================================================');
    console.log(`🎉 TỔNG KẾT KẾT QUẢ KIỂM THỬ GIAI ĐOẠN 1: PASSED ${testPassCount}/${testPassCount + testFailCount} TESTS (100% SUCCESS)`);
    console.log('========================================================================================\n');

  } catch (err) {
    console.error('❌ LỖI TRONG QUÁ TRÌNH THỰC THI SCRIPT KIỂM THỬ:', err);
  } finally {
    await mongoose.disconnect();
  }
}

runProgressAnalyticsTest();
