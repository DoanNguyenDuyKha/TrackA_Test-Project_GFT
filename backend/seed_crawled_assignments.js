require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Assignment = require('./models/Assignment');

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://doannguyenduykha08_db_user:Kha.0804@englishadaptivelms.6dtqe9l.mongodb.net/lms_adaptive?appName=EnglishAdaptiveLMS';

const crawledTask2Prompts = [
  {
    title: 'Đề thi thật ngày 26/10/2025 - Quy hoạch đô thị',
    prompt: 'Some people think that it is best to live in a horizontal city while others think of a vertical city. Discuss both views and give your opinion.',
    topic: 'Social Issues',
    targetGroup: 'average',
    scaffoldingTemplate: 'Dàn ý 4 phần: Mở bài (Paraphrase và nêu quan điểm); Thân bài 1 (Lợi ích lớp nhà ngang horizontal city: Không gian thoáng đãng, chi phí xây dựng thấp); Thân bài 2 (Lợi ích nhà cao tầng vertical city: Tối ưu diện tích quỹ đất đô thị, hạ tầng tập trung); Kết bài (Khẳng định xu hướng mô hình kết hợp).',
    suggestedVocabulary: [
      { word: 'vertical urbanization', meaning: 'Đô thị hóa theo chiều dọc', collocation: 'promote vertical urbanization in metropolises' },
      { word: 'land footprint', meaning: 'Dấu chân diện tích đất', collocation: 'minimize the urban land footprint' }
    ]
  },
  {
    title: 'Đề thi thật ngày 19/10/2025 - Quy mô sĩ số lớp học ngoại ngữ',
    prompt: 'Some people think that language should be taught in small classes, while other people think the number of students in a language class does not matter. Discuss both views and give your opinion.',
    topic: 'Education',
    targetGroup: 'average',
    scaffoldingTemplate: 'Dàn ý thảo luận 2 luồng ý kiến: Thân bài 1 thảo luận về lợi thế nhận được sự chú ý cá nhân (individual attention) và cơ hội thực hành của lớp học nhỏ; Thân bài 2 lập luận rằng chất lượng giảng dạy (quality of instruction) và công nghệ giáo dục hiện đại (educational technology) mới là yếu tố quyết định bất kể sĩ số.',
    suggestedVocabulary: [
      { word: 'individual attention', meaning: 'Sự chú ý cá nhân', collocation: 'receive individual attention from instructors' },
      { word: 'quality of instruction', meaning: 'Chất lượng giảng dạy', collocation: 'uphold the quality of instruction' }
    ]
  },
  {
    title: 'Đề thi thật ngày 18/10/2025 - Bảo mật dữ liệu cá nhân',
    prompt: 'The personal information of many individuals is held by large internet companies and organizations. Do you think the advantages of this outweigh the disadvantages?',
    topic: 'Technology',
    targetGroup: 'excellent',
    scaffoldingTemplate: 'Dàn ý đánh giá 2 mặt: Mở bài (Đặt vấn đề lưu trữ dữ liệu cá nhân trên quy mô lớn); Thân bài 1 (Ưu điểm: Cá nhân hóa trải nghiệm người dùng, đề xuất dịch vụ thông minh); Thân bài 2 (Nhược điểm lớn: Nguy cơ rò rỉ thông tin cá nhân và xâm phạm quyền riêng tư); Kết bài (Khẳng định nhược điểm áp đảo nếu thiếu pháp lý nghiêm ngặt).',
    suggestedVocabulary: [
      { word: 'data privacy breach', meaning: 'Xâm phạm quyền riêng tư dữ liệu', collocation: 'mitigate the risk of data privacy breach' },
      { word: 'user profiling', meaning: 'Lập hồ sơ hành vi người dùng', collocation: 'enable targeted user profiling' }
    ]
  },
  {
    title: 'Đề thi thật ngày 17/10/2025 - Dịch vụ y tế tư nhân',
    prompt: 'Some people think that good health is very important to every person, so medical services should not be run by profit-making companies. Do the advantages of private health care outweigh the disadvantages?',
    topic: 'Health',
    targetGroup: 'support',
    scaffoldingTemplate: 'Dàn ý 4 phần gợi ý: Mở bài (Paraphrase đề và đưa luận điểm); Thân bài 1 (Phân tích lo ngại đạo đức y tế vì lợi nhuận dễ dẫn đến y tế hóa quá mức); Thân bài 2 (Phân tích ưu điểm cơ sở vật chất hiện đại, dịch vụ chăm sóc nhanh và chất lượng); Kết bài (Khẳng định y tế tư nhân là sự bổ sung quý giá).',
    suggestedVocabulary: [
      { word: 'profit-driven interests', meaning: 'Lợi ích vì lợi nhuận', collocation: 'safeguard from profit-driven interests' },
      { word: 'overmedicalization', meaning: 'Y tế hóa quá mức', collocation: 'give rise to overmedicalization' }
    ]
  },
  {
    title: 'Đề thi thật ngày 14/10/2025 - Ý nghĩa của thành công sự nghiệp',
    prompt: 'Some people think that work is the most important thing in people’s life. Without the success of a career, life becomes meaningless. To what extent do you agree or disagree?',
    topic: 'Social Issues',
    targetGroup: 'average',
    scaffoldingTemplate: 'Dàn ý phản biện quan điểm: Mở bài (Nêu quan điểm không đồng ý hoàn toàn); Thân bài 1 (Thừa nhận sự nghiệp đóng góp tài chính và sự công nhận); Thân bài 2 (Chỉ ra các giá trị quan trọng khác như gia đình, sức khỏe tinh thần và sở thích cá nhân); Kết bài (Khẳng định sự cân bằng cuộc sống mới đem lại ý nghĩa trọn vẹn).',
    suggestedVocabulary: [
      { word: 'career orientation', meaning: 'Định hướng sự nghiệp', collocation: 'over-emphasize career orientation' },
      { word: 'holistic well-being', meaning: 'Sự phát triển toàn diện', collocation: 'foster holistic well-being' }
    ]
  },
  {
    title: 'Đề thi thật ngày 11/10/2025 - Kiểm soát thời gian sử dụng thiết bị ở trẻ',
    prompt: 'Some people say that parents should place restrictions on the hours their children spend watching TV and playing computer games, and encourage them to spend this time reading books instead. Do you agree or disagree?',
    topic: 'Education',
    targetGroup: 'support',
    scaffoldingTemplate: 'Dàn ý đồng ý: Mở bài (Khẳng định đồng ý với việc giới hạn screen time và khuyến khích đọc sách); Thân bài 1 (Tác hại của việc quá tải xem TV/game: Giảm tập trung, tăng béo phì); Thân bài 2 (Lợi ích của thói quen đọc sách: Phát triển từ vựng và tư duy phản biện); Kết bài (Tóm tắt luận điểm).',
    suggestedVocabulary: [
      { word: 'excessive screen time', meaning: 'Thời gian nhìn màn hình quá mức', collocation: 'curb excessive screen time' },
      { word: 'cognitive development', meaning: 'Phát triển nhận thức', collocation: 'enhance cognitive development' }
    ]
  },
  {
    title: 'Đề thi thật ngày 06/10/2025 - Năng khiếu sáng tạo nghệ thuật',
    prompt: 'Some people say that every human being can create art (e.g. painting), others think only the people born with the ability can create art. Discuss both views and give your opinion.',
    topic: 'Art',
    targetGroup: 'excellent',
    scaffoldingTemplate: 'Dàn ý thảo luận 2 mặt: Mở bài (Thảo luận giữa năng khiếu bẩm sinh và quá trình rèn luyện nghệ thuật); Thân bài 1 (Góc nhìn năng khiếu: Yếu tố bẩm sinh tạo nên kiệt tác vượt thời gian); Thân bài 2 (Góc nhìn nỗ lực: Giáo dục nghệ thuật giúp mọi người bày tỏ cảm xúc); Kết bài (Khẳng định nghệ thuật thuộc về tất cả mọi người nhưng đỉnh cao cần tài năng).',
    suggestedVocabulary: [
      { word: 'innate artistic talent', meaning: 'Tài năng nghệ thuật bẩm sinh', collocation: 'possess innate artistic talent' },
      { word: 'artistic expression', meaning: 'Sự bộc lộ nghệ thuật', collocation: 'encourage authentic artistic expression' }
    ]
  },
  {
    title: 'Đề thi thật ngày 04/10/2025 - Tài trợ 100% học phí đại học',
    prompt: 'Some people believe that governments should pay full course fees for students who want to study at universities. Do you agree or disagree with this statement?',
    topic: 'Education',
    targetGroup: 'average',
    scaffoldingTemplate: 'Dàn ý cân bằng: Mở bài (Nêu quan điểm đồng ý một phần); Thân bài 1 (Lợi ích học phí miễn phí: Công bằng giáo dục, thu hút nhân tài yếu thế); Thân bài 2 (Gánh nặng ngân sách công và nguy cơ sinh viên thiếu cam kết); Kết bài (Đề xuất giải pháp học bổng và tín dụng ưu đãi).',
    suggestedVocabulary: [
      { word: 'tertiary education tuition', meaning: 'Học phí giáo dục đại học', collocation: 'subsidize tertiary education tuition' },
      { word: 'fiscal strain', meaning: 'Gánh nặng tài chính công', collocation: 'impose fiscal strain on national budget' }
    ]
  },
  {
    title: 'Đề thi thật ngày 30/09/2025 - Lối sống nông thôn và thành thị',
    prompt: 'Many people believe that it is easier to have a healthy lifestyle in the countryside. Others believe that there are health benefits of living in cities. Discuss both views and give your opinion.',
    topic: 'Health',
    targetGroup: 'average',
    scaffoldingTemplate: 'Dàn ý 4 phần: Mở bài (Nêu tranh luận lối sống nông thôn vs thành thị); Thân bài 1 (Nông thôn: Không khí trong lành, thực phẩm tự nhiên, ít căng thẳng); Thân bài 2 (Thành thị: Dịch vụ y tế cao cấp, cơ sở thể thao hiện đại); Kết bài (Khẳng định lựa chọn phụ thuộc vào nhu cầu cá nhân).',
    suggestedVocabulary: [
      { word: 'rural tranquil environment', meaning: 'Môi trường nông thôn yên bình', collocation: 'enjoy rural tranquil environment' },
      { word: 'advanced medical infrastructure', meaning: 'Hạ tầng y tế tiên tiến', collocation: 'access advanced medical infrastructure' }
    ]
  },
  {
    title: 'Đề thi thật ngày 06/09/2025 - Tài trợ ngân sách cho nghệ sĩ sáng tạo',
    prompt: 'Some people think that the government should give financial support to creative artists such as painters and musicians. Others believe that creative artists should be funded by alternative sources. Discuss both these views and give your own opinion.',
    topic: 'Art',
    targetGroup: 'excellent',
    scaffoldingTemplate: 'Dàn ý chuyên sâu: Mở bài (Tranh luận nguồn quỹ cho nghệ sĩ sáng tạo); Thân bài 1 (Tài trợ chính phủ giúp bảo tồn di sản văn hóa không mang tính thương mại); Thân bài 2 (Nguồn vốn tư nhân giúp định hướng thị trường và tăng tính sáng tạo thực tế); Kết bài (Đề xuất mô hình hợp tác công tư).',
    suggestedVocabulary: [
      { word: 'public expenditure on arts', meaning: 'Chi tiêu công cho nghệ thuật', collocation: 'allocate public expenditure on arts' },
      { word: 'commercial viability', meaning: 'Khả năng thương mại hóa', collocation: 'ensure commercial viability' }
    ]
  },
  {
    title: 'Đề thi thật ngày 30/08/2025 - Mục tiêu chính của giáo dục phổ thông',
    prompt: 'Some people say that the main purpose of school is to turn children into good citizens and workers, rather than to benefit them as individuals. To what extent do you agree or disagree?',
    topic: 'Education',
    targetGroup: 'support',
    scaffoldingTemplate: 'Dàn ý: Mở bài (Không đồng ý rằng hai mục tiêu này loại trừ lẫn nhau); Thân bài 1 (Trường học chuẩn bị kỹ năng làm việc và trách nhiệm công dân); Thân bài 2 (Trường học phát triển cá tính và tiềm năng riêng của trẻ); Kết bài (Tóm tắt sự song hành của cả hai yếu tố).',
    suggestedVocabulary: [
      { word: 'qualified workforce', meaning: 'Lực lượng lao động có chất lượng', collocation: 'nurture a qualified workforce' },
      { word: 'personal enrichment', meaning: 'Sự phát triển cá nhân', collocation: 'foster personal enrichment' }
    ]
  },
  {
    title: 'Đề thi thật ngày 19/08/2025 - Xử lý tội phạm vị thành niên',
    prompt: 'Some people believe that young people who commit serious crimes should be punished in the same way as adults. To what extent do you agree or disagree?',
    topic: 'Social Issues',
    targetGroup: 'excellent',
    scaffoldingTemplate: 'Dàn ý phân tích pháp lý: Mở bài (Nêu quan điểm không đồng ý áp dụng hình phạt người lớn hoàn toàn); Thân bài 1 (Trẻ vị thành niên chưa hoàn thiện nhận thức, dễ bị thao túng); Thân bài 2 (Tầm quan trọng của giáo dục cải tạo thay vì trừng phạt nặng nề); Kết bài (Khẳng định tính nhân văn của luật pháp).',
    suggestedVocabulary: [
      { word: 'juvenile delinquents', meaning: 'Tội phạm vị thành niên', collocation: 'rehabilitate juvenile delinquents' },
      { word: 'punitive measure', meaning: 'Biện pháp trừng phạt', collocation: 'apply harsh punitive measures' }
    ]
  }
];

async function seedCrawledAssignments() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGO_URI);

    let admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      admin = await User.create({
        name: 'System Admin',
        email: 'admin@gft.edu.vn',
        password: '$2b$10$SampleHashedPassword123',
        role: 'admin'
      });
    }

    console.log(`Clearing & Insert ${crawledTask2Prompts.length} crawled real IELTS Task 2 assignments (From August 2025 onwards)...`);
    
    for (const item of crawledTask2Prompts) {
      await Assignment.create({
        ...item,
        createdBy: admin._id
      });
    }

    console.log('--- SUCCESS: Crawled IELTS Task 2 assignments imported successfully! ---');
  } catch (err) {
    console.error('Import Error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB connection closed.');
  }
}

seedCrawledAssignments();
