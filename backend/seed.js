require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Models
const User = require('./models/User');
const Assignment = require('./models/Assignment');
const Submission = require('./models/Submission');

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://doannguyenduykha08_db_user:Kha.0804@englishadaptivelms.6dtqe9l.mongodb.net/lms_adaptive?appName=EnglishAdaptiveLMS';

async function seedFullRealExamsDataset() {
  try {
    console.log('Connecting to MongoDB Cloud Atlas...');
    await mongoose.connect(MONGO_URI);

    // Giữ nguyên lịch sử người dùng và kho đề thi đã có (Chỉ làm mới nếu chưa tồn tại)
    const defaultPasswordHash = await bcrypt.hash('123456', 10);

    let studentUser = await User.findOne({ email: 'student@gft.edu.vn' });
    if (!studentUser) {
      studentUser = await User.create({
        name: 'GFT Student',
        email: 'student@gft.edu.vn',
        password: defaultPasswordHash,
        role: 'student',
        studentGroup: 'support',
        targetBand: 6.5
      });
    }

    let adminUser = await User.findOne({ email: 'admin@gft.edu.vn' });
    if (!adminUser) {
      adminUser = await User.create({
        name: 'GFT Admin',
        email: 'admin@gft.edu.vn',
        password: defaultPasswordHash,
        role: 'admin'
      });
    }

    const fullRealExams = [
      // 📌 THÁNG 06/2025
      {
        title: 'Real IELTS Writing 2 - June 2025 (Set 1: History vs Modern Tech)',
        prompt: 'Some people think that history has little or nothing to offer us, while others believe that studying history from the past helps us understand the present. Discuss both views and give your opinion.',
        topic: 'Social Issues',
        targetGroup: 'support',
        scaffoldingTemplate: `### 🚀 Đề bài:
Some people think that history has little or nothing to offer us, while others believe that studying history from the past helps us understand the present. Discuss both views and give your opinion.

### 😵 Dàn ý chi tiết 4 phần (Outline):
1. **Introduction**: Paraphrase đề bài về giá trị của môn lịch sử. Khẳng định lịch sử rút ra bài học đắt giá cho hiện tại.
2. **Body 1**: Một số ý kiến cho rằng công nghệ hiện đại thay đổi quá nhanh làm lịch sử lỗi thời.
3. **Body 2**: Lịch sử cung cấp bối cảnh văn hóa, bài học chính trị và phòng tránh các sai lầm trong quá khứ.
4. **Conclusion**: Lịch sử là nền tảng không thể thiếu cho sự phát triển xã hội.`,
        sampleAnswer: `The debate over the relevance of historical studies in the modern era continues to spark diverse opinions. While some individuals argue that history offers minimal practical value in today's fast-paced technological world, I strongly believe that analyzing past historical events is vital for understanding contemporary societal challenges and shaping a better future.

On the one hand, critics of history education argue that rapid technological advancements render past experiences obsolete. In an era dominated by artificial intelligence, automation, and global digitalization, solutions to modern problems often require innovative technical skills rather than historical knowledge. Furthermore, economic paradigms and social structures have evolved so dramatically that traditional governance methods may no longer apply directly to complex modern financial systems.

On the one hand, studying history provides indispensable insights into human behavior, cultural identity, and political development. Historical analysis enables policymakers to comprehend the root causes of international conflicts and economic crises, thereby preventing the repetition of catastrophic past mistakes such as global wars or hyperinflation. Moreover, history fosters cultural awareness and national identity, helping citizens appreciate how modern democratic institutions and social values were forged.

In conclusion, although technological progress rapidly alters daily life, historical knowledge remains an essential beacon that guides contemporary decision-making and protects societal stability.`,
        suggestedVocabulary: [
          { word: 'historical insights', meaning: 'Sự hiểu biết sâu sắc về lịch sử', collocation: 'indispensable historical insights' },
          { word: 'contemporary challenges', meaning: 'Các thách thức đương đại', collocation: 'understanding contemporary societal challenges' },
          { word: 'catastrophic mistakes', meaning: 'Sai lầm thảm khốc', collocation: 'preventing catastrophic past mistakes' },
          { word: 'technological advancements', meaning: 'Tiến bộ công nghệ', collocation: 'rapid technological advancements' },
          { word: 'obsolete experiences', meaning: 'Kinh nghiệm lỗi thời', collocation: 'render past experiences obsolete' },
          { word: 'cultural identity', meaning: 'Bản sắc văn hóa', collocation: 'fosters cultural awareness and identity' },
          { word: 'decision-making beacon', meaning: 'Ngọn hải đăng định hướng quyết định', collocation: 'an essential beacon that guides decision-making' },
          { word: 'societal stability', meaning: 'Sự ổn định xã hội', collocation: 'protects societal stability' },
          { word: 'governance methods', meaning: 'Phương pháp quản trị', collocation: 'traditional governance methods' },
          { word: 'holistic understanding', meaning: 'Sự hiểu biết toàn diện', collocation: 'achieve a holistic understanding' }
        ],
        exercises: [
          { prompt: 'Câu 1: Điền từ trích từ Thân bài 2:', blankSpaceText: 'History helps prevent the repetition of _______ in international relations.', correctAnswer: 'catastrophic past mistakes', explanation: 'Trích từ bài mẫu.' },
          { prompt: 'Câu 2: Điền từ chỉ các thách thức thời hiện đại:', blankSpaceText: 'Historical analysis helps policymakers address _______.', correctAnswer: 'contemporary challenges', explanation: 'Trích từ bài mẫu.' },
          { prompt: 'Câu 3: Điền từ chỉ hiểu biết sâu sắc về lịch sử:', blankSpaceText: 'Studying past events provides _______ into human behavior.', correctAnswer: 'historical insights', explanation: 'Trích từ bài mẫu.' },
          { prompt: 'Câu 4: Điền từ chỉ tiến bộ công nghệ:', blankSpaceText: 'The modern world is shaped by rapid _______.', correctAnswer: 'technological advancements', explanation: 'Trích từ bài mẫu.' },
          { prompt: 'Câu 5: Điền từ chỉ việc làm cái gì trở nên lỗi thời:', blankSpaceText: 'Some argue that rapid change renders old methods _______.', correctAnswer: 'obsolete experiences', explanation: 'Trích từ bài mẫu.' },
          { prompt: 'Câu 6: Điền từ chỉ bản sắc văn hóa:', blankSpaceText: 'History education strengthens national and _______.', correctAnswer: 'cultural identity', explanation: 'Trích từ bài mẫu.' },
          { prompt: 'Câu 7: Điền từ chỉ ngọn hải đăng định hướng:', blankSpaceText: 'Historical knowledge serves as an essential _______ for society.', correctAnswer: 'decision-making beacon', explanation: 'Trích từ bài mẫu.' },
          { prompt: 'Câu 8: Điền từ chỉ sự ổn định của xã hội:', blankSpaceText: 'Understanding past crises helps protect _______.', correctAnswer: 'societal stability', explanation: 'Trích từ bài mẫu.' },
          { prompt: 'Câu 9: Điền từ chỉ phương pháp quản lý nhà nước:', blankSpaceText: 'Modern financial systems require innovative _______.', correctAnswer: 'governance methods', explanation: 'Trích từ bài mẫu.' },
          { prompt: 'Câu 10: Điền từ chỉ sự hiểu biết toàn diện:', blankSpaceText: 'Analyzing past and present events provides a _______.', correctAnswer: 'holistic understanding', explanation: 'Trích từ bài mẫu.' }
        ],
        createdBy: adminUser._id
      },
      {
        title: 'Real IELTS Writing 2 - June 2025 (Set 2: Artificial Intelligence in Healthcare)',
        prompt: 'Artificial intelligence is being increasingly used in medical diagnosis and treatment. Do the advantages of AI in healthcare outweigh the potential disadvantages?',
        topic: 'Technology',
        targetGroup: 'average',
        scaffoldingTemplate: `### 🚀 Đề bài:
Artificial intelligence is being increasingly used in medical diagnosis and treatment. Do the advantages of AI in healthcare outweigh the potential disadvantages?

### 😵 Dàn ý chi tiết 4 phần (Outline):
1. **Introduction**: Giới thiệu ứng dụng AI trong y tế. Khẳng định lợi ích về độ chính xác và tốc độ vượt trội hơn rủi ro.
2. **Body 1**: AI giúp chẩn đoán hình ảnh chính xác, phân tích gen nhanh và hỗ trợ phẫu thuật.
3. **Body 2**: Rủi ro về bảo mật dữ liệu y tế và thiếu sự đồng cảm của bác sĩ con người.
4. **Conclusion**: Tối ưu hóa AI dưới sự giám sát của y bác sĩ là giải pháp hoàn hảo.`,
        sampleAnswer: `The integration of artificial intelligence into healthcare systems marks a revolutionary breakthrough in modern medicine. Although concerns regarding data privacy and the loss of human empathy exist, I firmly believe that AI's benefits in diagnostic precision and therapeutic efficiency far outweigh its potential risks.

On the one hand, relying on automated algorithms introduces valid ethical and technical challenges. Automated diagnostic systems require vast medical databases, raising concerns about patient data security and potential cyber breaches. Additionally, algorithms lack genuine human empathy and moral intuition, which are vital components of holistic patient care, particularly when breaking difficult medical diagnoses to patients and grieving families.

On the other hand, AI technology enhances medical outcomes by achieving unparalleled accuracy and speed. Advanced machine learning algorithms can analyze complex medical imaging and genomic data in seconds, detecting early-stage tumors and rare genetic disorders that human eyes might overlook. Furthermore, robotic surgical assistants enable surgeons to perform delicate procedures with extreme precision, reducing recovery times and surgical complications for patients worldwide.

In conclusion, while safeguarding patient data privacy is imperative, the revolutionary capabilities of AI in saving lives and advancing medical science clearly outweigh its drawbacks.`,
        suggestedVocabulary: [
          { word: 'diagnostic precision', meaning: 'Độ chính xác trong chẩn đoán', collocation: 'benefits in diagnostic precision' },
          { word: 'unparalleled accuracy', meaning: 'Độ chính xác vô song', collocation: 'achieving unparalleled accuracy' },
          { word: 'patient data security', meaning: 'Bảo mật dữ liệu bệnh nhân', collocation: 'raising concerns about patient data security' },
          { word: 'revolutionary breakthrough', meaning: 'Bước đột phá mang tính cách mạng', collocation: 'marks a revolutionary breakthrough' },
          { word: 'therapeutic efficiency', meaning: 'Hiệu quả điều trị', collocation: 'enhance therapeutic efficiency' },
          { word: 'automated algorithms', meaning: 'Thuật toán tự động', collocation: 'relying on automated algorithms' },
          { word: 'genomic data', meaning: 'Dữ liệu bộ gen', collocation: 'analyze complex genomic data' },
          { word: 'delicate procedures', meaning: 'Các ca phẫu thuật tinh vi', collocation: 'perform delicate procedures' },
          { word: 'surgical complications', meaning: 'Biến chứng phẫu thuật', collocation: 'reducing surgical complications' },
          { word: 'human empathy', meaning: 'Sự đồng cảm của con người', collocation: 'lack genuine human empathy' }
        ],
        exercises: [
          { prompt: 'Câu 1: Điền cụm từ trích từ Thân bài 2:', blankSpaceText: 'AI technology enhances medical outcomes by achieving _______.', correctAnswer: 'unparalleled accuracy', explanation: 'Trích từ bài mẫu.' },
          { prompt: 'Câu 2: Điền từ chỉ độ chính xác chẩn đoán:', blankSpaceText: 'Machine learning improves _______ in medical imaging.', correctAnswer: 'diagnostic precision', explanation: 'Trích từ bài mẫu.' },
          { prompt: 'Câu 3: Điền từ chỉ bảo mật thông tin bệnh nhân:', blankSpaceText: 'Healthcare systems must prioritize _______.', correctAnswer: 'patient data security', explanation: 'Trích từ bài mẫu.' },
          { prompt: 'Câu 4: Điền từ chỉ bước đột phá cách mạng:', blankSpaceText: 'AI in medicine is considered a _______.', correctAnswer: 'revolutionary breakthrough', explanation: 'Trích từ bài mẫu.' },
          { prompt: 'Câu 5: Điền từ chỉ hiệu quả điều trị:', blankSpaceText: 'Advanced tools boost surgical speed and _______.', correctAnswer: 'therapeutic efficiency', explanation: 'Trích từ bài mẫu.' },
          { prompt: 'Câu 6: Điền từ chỉ thuật toán tự động:', blankSpaceText: 'Diagnoses are increasingly processed by _______.', correctAnswer: 'automated algorithms', explanation: 'Trích từ bài mẫu.' },
          { prompt: 'Câu 7: Điền từ chỉ dữ liệu gen:', blankSpaceText: 'Supercomputers analyze vast amounts of _______.', correctAnswer: 'genomic data', explanation: 'Trích từ bài mẫu.' },
          { prompt: 'Câu 8: Điền từ chỉ phẫu thuật tinh vi:', blankSpaceText: 'Robots assist doctors in executing _______.', correctAnswer: 'delicate procedures', explanation: 'Trích từ bài mẫu.' },
          { prompt: 'Câu 9: Điền từ chỉ biến chứng phẫu thuật:', blankSpaceText: 'Precision technology minimizes the risk of _______.', correctAnswer: 'surgical complications', explanation: 'Trích từ bài mẫu.' },
          { prompt: 'Câu 10: Điền từ chỉ sự đồng cảm giữa người với người:', blankSpaceText: 'Machines cannot replace doctor-patient _______.', correctAnswer: 'human empathy', explanation: 'Trích từ bài mẫu.' }
        ],
        createdBy: adminUser._id
      },

      // 📌 THÁNG 07/2025
      {
        title: 'Real IELTS Writing 2 - July 2025 (Set 1: Climate Action & Individual Responsibility)',
        prompt: 'Some people believe that international environmental agreements are ineffective and that individuals must take personal responsibility for protecting the planet. To what extent do you agree or disagree?',
        topic: 'Environment',
        targetGroup: 'support',
        scaffoldingTemplate: `### 🚀 Đề bài:
Some people believe that international environmental agreements are ineffective and that individuals must take personal responsibility for protecting the planet. To what extent do you agree or disagree?

### 😵 Dàn ý chi tiết 4 phần (Outline):
1. **Introduction**: Giới thiệu biến đổi khí hậu. Thỏa thuận quốc tế đóng vai trò pháp lý quyết định.
2. **Body 1**: Cá nhân thay đổi thói quen tiêu dùng, giảm rác thải nhựa.
3. **Body 2**: Chính phủ ban hành luật thuế cacbon và phát triển hạ tầng năng lượng sạch.
4. **Conclusion**: Kết hợp vĩ mô và vi mô.`,
        sampleAnswer: `Climate change and global environmental degradation represent some of the most pressing challenges of the modern era. While individual actions are undoubtedly valuable in reducing carbon footprints, I disagree with the view that international environmental agreements are ineffective and that personal responsibility alone can solve ecological crises.

On the one hand, individual choices play a crucial supporting role in environmental preservation. When citizens adopt sustainable lifestyle habits, such as reducing single-use plastic consumption, recycling household waste, and utilizing public transportation, they collectively lower energy demand and minimize municipal waste. Furthermore, widespread consumer awareness forces multinational corporations to adopt eco-friendly manufacturing practices to satisfy green consumer preferences.

On the other hand, global environmental treaties possess legislative authority and financial capital that far surpass individual capabilities. Complex global issues such as industrial carbon emissions, deforestation, and ocean pollution require binding international frameworks like the Paris Climate Accord. Only sovereign governments have the power to impose carbon taxes on major polluting industries, regulate transboundary pollution, and fund massive infrastructure projects for renewable energy like wind and solar power.

In conclusion, although personal environmental responsibility fosters sustainable habits, I maintain that international environmental agreements are indispensable for enacting systemic change and mitigating global climate change.`,
        suggestedVocabulary: [
          { word: 'carbon footprints', meaning: 'Lượng dấu chân cacbon', collocation: 'reducing carbon footprints' },
          { word: 'legislative authority', meaning: 'Thẩm quyền pháp lý', collocation: 'treaties possess legislative authority' }
        ],
        exercises: [
          { prompt: 'Bài tập 1: Điền cụm từ trích từ Thân bài 2:', blankSpaceText: 'International environmental agreements possess _______ to enforce carbon taxes.', correctAnswer: 'legislative authority', explanation: 'Trích từ bài mẫu.' }
        ],
        createdBy: adminUser._id
      },
      {
        title: 'Real IELTS Writing 2 - July 2025 (Set 2: Free Public Transport in Cities)',
        prompt: 'To reduce traffic congestion and air pollution, some people suggest that public transportation should be completely free for all citizens funded by taxation. Do you agree or disagree?',
        topic: 'Social Issues',
        targetGroup: 'support',
        scaffoldingTemplate: `### 🚀 Đề bài:
To reduce traffic congestion and air pollution, some people suggest that public transportation should be completely free for all citizens funded by taxation. Do you agree or disagree?

### 😵 Dàn ý chi tiết 4 phần (Outline):
1. **Introduction**: Miễn phí xe buýt và tàu điện ngầm để giảm kẹt xe. Đồng ý vì lợi ích môi trường và xã hội.
2. **Body 1**: Miễn phí vé giúp khuyến khích người dân từ bỏ xe cá nhân, giảm bớt ùn tắc giao thông.
3. **Body 2**: Áp lực ngân sách thuế có thể được đền bù bằng chi phí khắc phục ô nhiễm môi trường.
4. **Conclusion**: Đây là chiến lược lâu dài hiệu quả.`,
        sampleAnswer: `Urban traffic congestion and deteriorating air quality have reached alarming levels in many major cities worldwide. To combat these issues, some experts advocate for fully tax-funded, fare-free public transportation. I completely agree with this proposal, as it provides strong financial incentives for citizens to abandon private vehicles and significantly lowers urban carbon emissions.

On the one hand, eliminating transit fares removes the main financial barrier preventing commuters from utilizing buses and subway networks daily. When public transit becomes entirely free, low and middle-income residents are far more likely to leave their personal cars at home. This substantial shift from private automobiles to high-capacity public transport immediately reduces the volume of road traffic, alleviating severe gridlock during peak rush hours and decreasing fossil fuel consumption.

On the other hand, critics express concern over the financial burden imposed on taxpayers to subsidize free transit systems. However, these expenditures are offset by long-term economic savings in healthcare and infrastructure repair. Reduced vehicular pollution leads to lower respiratory disease rates among urban dwellers, decreasing public health spending. Moreover, fewer private cars on the road minimize pavement wear and reduce the expensive maintenance costs of city highways.

In conclusion, offering free public transportation represents a progressive fiscal policy that effectively combats traffic congestion, improves air quality, and enhances overall urban livability.`,
        suggestedVocabulary: [
          { word: 'traffic congestion', meaning: 'Ùn tắc giao thông', collocation: 'alleviating severe traffic congestion' },
          { word: 'fare-free transit', meaning: 'Giao thông công cộng miễn phí vé', collocation: 'advocate for fare-free public transportation' }
        ],
        exercises: [
          { prompt: 'Bài tập 1: Điền cụm từ trích từ Mở bài:', blankSpaceText: 'Experts advocate for fully tax-funded _______ public transit.', correctAnswer: 'fare-free', explanation: 'Trích từ bài mẫu.' }
        ],
        createdBy: adminUser._id
      },

      // 📌 THÁNG 08/2025
      {
        title: 'Real IELTS Writing 2 - August 2025 (Set 1: Admiring Media & Sports Stars)',
        prompt: 'In some countries, media and sports stars are admired more than famous people in other fields (e.g. politicians, scientists). Do you think this is a positive or negative development?',
        topic: 'Social Issues',
        targetGroup: 'support',
        scaffoldingTemplate: `### 🚀 Đề bài:
In some countries, media and sports stars are admired more than famous people in other fields (e.g. politicians, scientists). Do you think this is a positive or negative development?

### 😵 Dàn ý chi tiết 4 phần (Outline):
1. **Introduction**: Ngôi sao giải trí được tôn vinh hơn nhà khoa học. Xu hướng tiêu cực đối với sự phát triển lâu dài.
2. **Body 1**: Truyền cảm hứng thể thao và lối sống tích cực.
3. **Body 2**: Làm lệch lạc hệ giá trị của giới trẻ, hạ thấp tầm quan trọng của tri thức.
4. **Conclusion**: Cần cân bằng sự tôn vinh xã hội.`,
        sampleAnswer: `In recent times, celebrities in the entertainment and sports industries often receive far more public admiration than prominent figures in science or politics. While this phenomenon offers certain cultural and recreational benefits, I firmly believe that its overall impact on society is predominantly negative.

On the one hand, the immense popularity of media and sports icons can yield positive social outcomes. Celebrities often serve as powerful role models who inspire millions to pursue healthy lifestyles, dedication, and personal ambition. For example, world-class athletes demonstrate the virtues of rigorous discipline and resilience, motivating young fans to engage in sports and overcome personal adversity.

On the other hand, the disproportionate idolization of entertainers over intellectuals poses serious risks to societal development. When young people observe that actors and athletes earn astronomical incomes and enjoy unmatched social prestige, they may come to undervalue academic pursuits and scientific research. Consequently, vital professions such as teaching, medical research, and engineering may struggle to attract top talent.

In conclusion, although admiring sports and media stars promotes healthy living, I consider the neglect of scientific figures to be a negative development that threatens sustained societal advancement.`,
        suggestedVocabulary: [
          { word: 'disproportionate idolization', meaning: 'Sự thần tượng hóa không cân đối', collocation: 'disproportionate idolization of entertainers' },
          { word: 'unmatched social prestige', meaning: 'Uy tín xã hội vượt trội', collocation: 'enjoy unmatched social prestige' }
        ],
        exercises: [
          { prompt: 'Bài tập 1: Điền cụm từ trích từ Thân bài 2:', blankSpaceText: 'The _______ of entertainers over intellectuals poses serious risks.', correctAnswer: 'disproportionate idolization', explanation: 'Trích từ bài mẫu.' }
        ],
        createdBy: adminUser._id
      },
      {
        title: 'Real IELTS Writing 2 - August 2025 (Set 2: Organic Food vs Fast Food Taxation)',
        prompt: 'Some people argue that taxing junk food is the best way to encourage healthier eating habits, while others believe subsidizing healthy organic food is more effective. Discuss both views and give your opinion.',
        topic: 'Health',
        targetGroup: 'average',
        scaffoldingTemplate: `### 🚀 Đề bài:
Some people argue that taxing junk food is the best way to encourage healthier eating habits, while others believe subsidizing healthy organic food is more effective. Discuss both views and give your opinion.

### 😵 Dàn ý chi tiết 4 phần (Outline):
1. **Introduction**: Đánh thuế đồ ăn nhanh hay trợ giá thực phẩm hữu cơ. Trợ giá thực phẩm lành mạnh hiệu quả hơn.
2. **Body 1**: Đánh thuế khiến thức ăn nhanh đắt hơn, đe dọa thói quen tiêu dùng tiêu cực.
3. **Body 2**: Trợ giá rau củ tươi giúp mọi tầng lớp tiếp cận thực phẩm giàu dinh dưỡng.
4. **Conclusion**: Kết hợp cả 2 chính sách tài chính.`,
        sampleAnswer: `The debate over public health strategies to curb obesity and dietary diseases has led to contrasting proposals: levying heavy taxes on fast food versus subsidizing organic, nutrient-dense produce. While taxing junk food acts as a financial deterrent, I believe that subsidizing healthy food alternatives is a far more constructive and equitable solution.

On the one hand, imposing taxes on high-sugar and high-fat processed foods can disincentivize consumers from purchasing harmful products. Increased retail prices force individuals, particularly budget-conscious consumers, to reconsider buying fast food frequently. Furthermore, tax revenues generated from junk food sales can be funneled into funding public health campaigns and medical research on diabetes prevention.

On the other hand, subsidizing organic and fresh agricultural produce addresses the root cause of poor dietary choices—affordability. Unhealthy fast food is often cheaper than fresh fruits and vegetables, making nutritious diets cost-prohibitive for low-income families. Government subsidies for local organic farmers reduce market prices of fresh produce, making healthy eating accessible to all socio-economic groups.

In conclusion, although junk food taxes discourage unhealthy eating, government subsidies for fresh organic food represent a more positive policy that empowers citizens to choose nutritious lifestyles.`,
        suggestedVocabulary: [
          { word: 'financial deterrent', meaning: 'Biện pháp ngăn chặn tài chính', collocation: 'taxing junk food acts as a financial deterrent' },
          { word: 'nutrient-dense produce', meaning: 'Nông sản giàu dinh dưỡng', collocation: 'subsidizing organic nutrient-dense produce' }
        ],
        exercises: [
          { prompt: 'Bài tập 1: Điền cụm từ trích từ Mở bài:', blankSpaceText: 'Taxing junk food acts as a financial _______ for consumers.', correctAnswer: 'deterrent', explanation: 'Trích từ bài mẫu.' }
        ],
        createdBy: adminUser._id
      },

      // 📌 THÁNG 09/2025
      {
        title: 'Real IELTS Writing 2 - September 2025 (Set 1: Over-Tourism in Historical Cities)',
        prompt: 'In many countries, historical sites and natural landmarks are suffering from over-tourism. What are the causes of this problem, and what solutions can be implemented?',
        topic: 'Social Issues',
        targetGroup: 'average',
        scaffoldingTemplate: `### 🚀 Đề bài:
In many countries, historical sites and natural landmarks are suffering from over-tourism. What are the causes of this problem, and what solutions can be implemented?

### 😵 Dàn ý chi tiết 4 phần (Outline):
1. **Introduction**: Nêu vấn đề quá tải du lịch tại các địa danh lịch sử.
2. **Body 1 (Causes)**: Giá vé máy bay rẻ, mạng xã hội quảng bá rầm rộ.
3. **Body 2 (Solutions)**: Giới hạn lượng khách đăng ký theo ngày, tăng phí bảo tồn địa danh.
4. **Conclusion**: Du lịch bền vững là xu hướng bắt buộc.`,
        sampleAnswer: `The global surge in international travel has led to severe over-tourism, placing unprecedented strain on ancient historical monuments and delicate natural ecosystems. This essay will examine the primary causes of this phenomenon, namely budget aviation and social media promotion, and propose effective solutions such as visitor quotas and conservation tariffs.

One major driver of over-tourism is the rapid growth of low-cost airlines and budget travel platforms, which make long-distance travel affordable for millions. Additionally, social media platforms like Instagram amplify viral travel trends, encouraging massive crowds to flock to the exact same popular locations simultaneously. As a result, historical sites experience structural damage, littering, and environmental degradation that exceed their physical carrying capacity.

To mitigate this crisis, municipal authorities and heritage foundations must enforce strict daily visitor quotas. Implementing online reservation systems ensures that historical sites operate within safe capacity limits. Furthermore, governments should introduce targeted conservation levies on tourist entry tickets, directing funds directly toward maintaining historic infrastructure and restoring damaged natural habitats.

In conclusion, over-tourism is driven by cheap travel and viral marketing, but it can be contained through strict capacity management and dedicated conservation funding.`,
        suggestedVocabulary: [
          { word: 'unprecedented strain', meaning: 'Áp lực chưa từng có', collocation: 'placing unprecedented strain on monuments' },
          { word: 'visitor quotas', meaning: 'Hạn ngạch lượng khách tham quan', collocation: 'enforce strict daily visitor quotas' }
        ],
        exercises: [
          { prompt: 'Bài tập 1: Điền cụm từ trích từ Thân bài 2:', blankSpaceText: 'Authorities must enforce strict daily _______ to prevent overcrowding.', correctAnswer: 'visitor quotas', explanation: 'Trích từ bài mẫu.' }
        ],
        createdBy: adminUser._id
      },

      // 📌 THÁNG 10/2025
      {
        title: 'Real IELTS Writing 2 - October 2025 (Set 1: Cashless Society & Digital Payments)',
        prompt: 'Many societies are moving toward becoming completely cashless societies where all transactions are electronic. Is this a positive or negative development?',
        topic: 'Technology',
        targetGroup: 'excellent',
        scaffoldingTemplate: `### 🚀 Đề bài:
Many societies are moving toward becoming completely cashless societies where all transactions are electronic. Is this a positive or negative development?

### 😵 Dàn ý chi tiết 4 phần (Outline):
1. **Introduction**: Xu hướng xã hội không tiền mặt. Đánh giá tích cực nhờ tiện lợi và chống tội phạm.
2. **Body 1**: Tiện lợi khi thanh toán, giảm nguy cơ cướp giật và ngăn ngừa trốn thuế.
3. **Body 2**: Rủi ro mất an toàn thông tin mạng và sự khó khăn cho người cao tuổi.
4. **Conclusion**: Ưu điểm vượt trội hơn nhược điểm.`,
        sampleAnswer: `The transition toward a fully cashless economy, driven by digital wallets and contactless payment systems, is accelerating globally. Although this transition creates challenges for elderly citizens and raises cybersecurity concerns, I firmly believe that the move to a cashless society is a overwhelmingly positive development due to its financial efficiency and crime-deterrent capabilities.

On the one hand, digital-only financial ecosystems pose difficulties for vulnerable social groups. Senior citizens and impoverished individuals in rural areas often lack access to smartphones, high-speed internet, or digital financial literacy, leaving them at risk of social exclusion. Moreover, relying entirely on electronic banking exposes financial networks to sophisticated cyberattacks and systemic technical outages.

On the other hand, the benefits of digital transactions for economic productivity are immense. Cashless payments eliminate the administrative costs of printing, transporting, and securing physical currency. Furthermore, digital transaction trails make money laundering, tax evasion, and illegal black-market trade significantly harder to conceal, enabling financial regulators to track illicit funds efficiently.

In conclusion, despite the need for inclusive digital literacy programs, the transition to a cashless society modernizes economic infrastructure and enhances national financial security.`,
        suggestedVocabulary: [
          { word: 'cashless economy', meaning: 'Nền kinh tế không dùng tiền mặt', collocation: 'transition toward a fully cashless economy' },
          { word: 'digital financial literacy', meaning: 'Kỹ năng tài chính số', collocation: 'lack access to digital financial literacy' }
        ],
        exercises: [
          { prompt: 'Bài tập 1: Điền cụm từ trích từ Mở bài:', blankSpaceText: 'The transition toward a fully _______ economy is accelerating.', correctAnswer: 'cashless', explanation: 'Trích từ bài mẫu.' }
        ],
        createdBy: adminUser._id
      },

      // 📌 THÁNG 11/2025
      {
        title: 'Real IELTS Writing 2 - November 2025 (Set 1: Remote Work vs Office Work Culture)',
        prompt: 'An increasing number of companies allow employees to work entirely from home. Do the advantages of remote working outweigh the disadvantages for both employers and employees?',
        topic: 'Technology',
        targetGroup: 'average',
        scaffoldingTemplate: `### 🚀 Đề bài:
An increasing number of companies allow employees to work entirely from home. Do the advantages of remote working outweigh the disadvantages for both employers and employees?

### 😵 Dàn ý chi tiết 4 phần (Outline):
1. **Introduction**: Xu hướng làm việc tại nhà. Lợi ích linh hoạt vượt trội nhược điểm.
2. **Body 1**: Tiết kiệm chi phí văn phòng và thời gian di chuyển.
3. **Body 2**: Thiếu tương tác trực tiếp, nguy cơ cô lập công việc.
4. **Conclusion**: Mô hình làm việc linh hoạt là xu thế tương lai.`,
        sampleAnswer: `The shift toward telecommuting has accelerated rapidly in recent years, with many corporations transitioning to full remote work models. Although working from home presents certain obstacles to team cohesion, I strongly believe that its benefits regarding operational cost efficiency and employee well-being outweigh the drawbacks.

From the perspective of employees, teleworking eliminates long daily commutes, granting individuals more time for family, exercise, and personal development. This enhanced flexibility fosters a superior work-life balance and reduces workplace stress. For employers, remote operations significantly decrease overhead expenditures related to office rentals, utilities, and maintenance.

Conversely, remote working introduces challenges regarding corporate culture and communication. The absence of face-to-face interaction can hinder spontaneous brainstorming and weaken team solidarity. Furthermore, blurred boundaries between personal life and work duties may lead to employee burnout.

In conclusion, despite the challenges in maintaining workplace cohesion, the economic savings and enhanced personal autonomy make remote working a highly advantageous evolution in modern employment.`,
        suggestedVocabulary: [
          { word: 'operational cost efficiency', meaning: 'Hiệu quả chi phí vận hành', collocation: 'benefits regarding operational cost efficiency' },
          { word: 'eliminate long commutes', meaning: 'Xóa bỏ việc đi lại đường dài', collocation: 'teleworking eliminates long daily commutes' }
        ],
        exercises: [
          { prompt: 'Bài tập 1: Điền từ trích từ Thân bài 1:', blankSpaceText: 'Teleworking eliminates long daily _______.', correctAnswer: 'commutes', explanation: 'Trích từ bài mẫu.' }
        ],
        createdBy: adminUser._id
      },

      // 📌 THÁNG 12/2025
      {
        title: 'Real IELTS Writing 2 - December 2025 (Set 1: Fast Fashion & Environmental Waste)',
        prompt: 'The popularity of cheap "fast fashion" clothing has increased dramatically in recent years. What problems does this cause, and what solutions can address this issue?',
        topic: 'Social Issues',
        targetGroup: 'support',
        scaffoldingTemplate: `### 🚀 Đề bài:
The popularity of cheap "fast fashion" clothing has increased dramatically in recent years. What problems does this cause, and what solutions can address this issue?

### 😵 Dàn ý chi tiết 4 phần (Outline):
1. **Introduction**: Vấn đề thời trang nhanh gia tăng.
2. **Body 1 (Problems)**: Rác thải dệt may ô nhiễm môi trường, bóc lột công nhân giá rẻ.
3. **Body 2 (Solutions)**: Khuyến khích thời trang bền vững (sustainable fashion) và áp thuế xả thải.
4. **Conclusion**: Đổi mới tư duy tiêu dùng.`,
        sampleAnswer: `The booming fast fashion industry has revolutionized consumer shopping habits by offering trendy, low-cost clothing at unprecedented speeds. However, this business model generates massive environmental pollution and encourages unsustainable consumerism. To address these grave consequences, governments and apparel brands must enforce eco-labeling and invest in textile recycling infrastructure.

The primary environmental issue caused by fast fashion is the enormous volume of non-biodegradable textile waste deposited into landfills. Cheap synthetic fabrics like polyester take centuries to decompose, leaching microplastics and toxic dyes into soil and water systems. Furthermore, fast fashion brands often exploit underpaid workers in developing countries under unsafe factory conditions to minimize production costs.

To solve these problems, governments should mandate sustainable manufacturing regulations and mandate garment recycling programs. Authorities can impose environmental surcharges on brands that utilize polluting synthetic materials, incentivizing companies to transition toward organic cotton and recycled fibers. Simultaneously, public awareness campaigns can promote "slow fashion," encouraging consumers to buy durable garments and repair existing clothes rather than purchasing disposable apparel.

In conclusion, while fast fashion offers cheap clothing, its environmental and social costs are severe. Regulatory enforcement and sustainable consumer habits are vital to curbing this crisis.`,
        suggestedVocabulary: [
          { word: 'textile waste', meaning: 'Rác thải dệt may', collocation: 'enormous volume of non-biodegradable textile waste' },
          { word: 'sustainable fashion', meaning: 'Thời trang bền vững', collocation: 'promote sustainable fashion choices' }
        ],
        exercises: [
          { prompt: 'Bài tập 1: Điền từ trích từ Thân bài 1:', blankSpaceText: 'Fast fashion creates massive amounts of non-biodegradable _______ waste.', correctAnswer: 'textile', explanation: 'Trích từ bài mẫu.' }
        ],
        createdBy: adminUser._id
      },

      // 📌 THÁNG 01/2026
      {
        title: 'Real IELTS Writing 2 - January 2026 (Set 1: Online Degrees vs Campus Learning)',
        prompt: 'Some people argue that online university degrees are as valuable as degrees obtained through traditional face-to-face campus learning. To what extent do you agree or disagree?',
        topic: 'Education',
        targetGroup: 'excellent',
        scaffoldingTemplate: `### 🚀 Đề bài:
Some people argue that online university degrees are as valuable as degrees obtained through traditional face-to-face campus learning. To what extent do you agree or disagree?

### 😵 Dàn ý chi tiết 4 phần (Outline):
1. **Introduction**: Bằng đại học trực tuyến vs Bằng truyền thống. Bằng truyền thống vẫn giữ ưu thế vượt trội.
2. **Body 1**: Linh hoạt, tiết kiệm chi phí cho người đi làm.
3. **Body 2**: Thực hành phòng thí nghiệm và mạng lưới quan hệ xã hội tại đại học truyền thống.
4. **Conclusion**: Bằng truyền thống mang giá trị toàn diện.`,
        sampleAnswer: `The proliferation of digital learning platforms has revolutionized higher education, enabling prestigious universities to offer accredited degree programs online. While online degrees provide unmatched convenience and accessibility, I disagree with the assertion that they possess equal academic and professional value to traditional campus-based qualifications.

On the one hand, distance learning offers undeniable advantages for non-traditional students and working professionals. Online programs allow learners to access high-quality lectures from renowned international institutions without relocating or sacrificing employment. This flexibility democratizes higher education and significantly reduces tuition fees and living expenses.

On the other hand, traditional campus education offers immersive learning experiences that digital platforms cannot replicate. University campuses foster crucial interpersonal skills, leadership qualities, and spontaneous academic debates through face-to-face interactions with peers and professors. Moreover, specialized disciplines such as medicine and engineering require hands-on laboratory work that virtual environments cannot provide.

In conclusion, although online degrees expand educational access, traditional campus degrees retain superior value due to their holistic development, practical training, and rich networking opportunities.`,
        suggestedVocabulary: [
          { word: 'accredited degree programs', meaning: 'Chương trình bằng cấp được kiểm định', collocation: 'offer accredited degree programs' },
          { word: 'hands-on laboratory work', meaning: 'Thực hành thí nghiệm thực tế', collocation: 'require hands-on laboratory work' }
        ],
        exercises: [
          { prompt: 'Bài tập 1: Điền từ trích từ Thân bài 2:', blankSpaceText: 'Specialized disciplines require hands-on _______ work.', correctAnswer: 'laboratory', explanation: 'Trích từ bài mẫu.' }
        ],
        createdBy: adminUser._id
      },

      // 📌 THÁNG 02/2026 (ĐỀ THI MỚI NHẤT DỰ BÁO Q1/2026)
      {
        title: 'Real IELTS Writing 2 - February 2026 (Set 1: Renewable Energy Subsidies)',
        prompt: 'Governments should stop funding fossil fuels and redirect all subsidies toward solar and wind energy production. To what extent do you agree or disagree?',
        topic: 'Environment',
        targetGroup: 'excellent',
        scaffoldingTemplate: `### 🚀 Đề bài:
Governments should stop funding fossil fuels and redirect all subsidies toward solar and wind energy production. To what extent do you agree or disagree?

### 😵 Dàn ý chi tiết 4 phần (Outline):
1. **Introduction**: Nêu vấn đề chuyển đổi năng lượng hóa thạch sang năng lượng tái tạo. Đồng ý hoàn toàn vì mục tiêu giảm ô nhiễm và khí nhà kính.
2. **Body 1**: Nhiên liệu hóa thạch gây ô nhiễm nghiêm trọng. Trợ giá năng lượng sạch giúp hạ giá thành điện mặt trời và gió.
3. **Body 2**: Đảm bảo an ninh năng lượng trong giai đoạn quá độ.
4. **Conclusion**: Chuyển hướng trợ giá tài chính là bước đi bắt buộc.`,
        sampleAnswer: `The global transition toward green energy has sparked intense debate regarding government fiscal policies. I completely agree that state subsidies for coal, oil, and gas should be eliminated and redirected toward expanding solar, wind, and hydroelectric power infrastructure.

First and foremost, continuing to subsidize fossil fuel industries accelerates global warming and environmental degradation. Fossil fuels are the primary drivers of greenhouse gas emissions and urban air pollution, causing millions of premature deaths annually. By reallocating these massive public funds toward clean energy technologies, governments can dramatically lower the cost of renewable power generation, making solar panels and wind turbines economically competitive with fossil fuels.

Furthermore, investing public revenue in renewable energy fosters long-term economic innovation and energy independence. Solar and wind infrastructure projects create millions of green jobs in engineering, manufacturing, and maintenance. Additionally, relying on domestic renewable energy sources shields nations from global oil price volatility and geopolitical conflicts over fossil fuel reserves.

In conclusion, reallocating government subsidies from fossil fuels to renewable energy technologies is essential for curbing climate change, fostering green economic growth, and achieving energy security.`,
        suggestedVocabulary: [
          { word: 'reallocating public funds', meaning: 'Tái phân bổ vốn công', collocation: 'reallocating public funds toward clean energy' },
          { word: 'renewable power generation', meaning: 'Sự phát điện năng lượng tái tạo', collocation: 'lower the cost of renewable power generation' }
        ],
        exercises: [
          { prompt: 'Bài tập 1: Điền cụm từ trích từ Thân bài 1:', blankSpaceText: 'Governments must lower the cost of renewable power _______.', correctAnswer: 'generation', explanation: 'Trích từ bài mẫu.' }
        ],
        createdBy: adminUser._id
      }
    ];

    for (const item of fullRealExams) {
      await Assignment.findOneAndUpdate(
        { title: item.title },
        item,
        { upsert: true, new: true }
      );
    }

    console.log(`Successfully seeded ${fullRealExams.length} complete real IELTS Task 2 exam prompts from June 2025 to February 2026 into Cloud MongoDB Atlas!`);
  } catch (err) {
    console.error('Error seeding full dataset:', err);
  } finally {
    await mongoose.disconnect();
  }
}

seedFullRealExamsDataset();
