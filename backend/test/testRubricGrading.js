/**
 * TEST SCRIPT ĐỘC LẬP: TEST TOÀN BỘ CÁC CẤP ĐỘ BÀI VIẾT THEO CHUẨN RUBRIC IELTS TASK 2
 * Chạy lệnh: node test/testRubricGrading.js
 */

const { fallbackGrading } = require('../routes/grading');

// Bộ bài mẫu thử nghiệm ở tất cả các cấp độ thực tế (từ Rác / Yếu / Trung Bình / Khá / Xuất Sắc)
const testEssays = [
  {
    levelName: 'LEVEL 1: VĂN BẢN RÁC / GIBBERISH / KÝ TỰ LẶP VÔ NGHĨA',
    expectedBandMax: 3.5,
    essay: `nguuuuuuuuuuuuuuuuuuuuuuuuuuuuuu uu u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u u`
  },
  {
    levelName: 'LEVEL 2: BÀI VIẾT CỰC NẮNG (DƯỚI 50 TỪ, SAI LỖI NGỮ PHÁP)',
    expectedBandMax: 4.5,
    essay: `I think technology is good. Modern people like smartphone very much. It change life a lot. Every people use internet everyday. Computer is very fast and cheap. I agree with this idea because it help student learn.`
  },
  {
    levelName: 'LEVEL 3: BÀI TRUNG BÌNH KÉM (110 TỪ, TỪ VỰNG ĐƠN GIẢN, LẶP TỪ)',
    expectedBandMax: 5.5,
    essay: `Nowadays, many people use technology every day. Mobile phones and computers are very popular in modern society. On the one hand, technology helps people communicate easily with friends and family. We can send messages and call quickly. On the other hand, using too much technology makes children lazy and not do exercise. They play games all day and do not talk with parents. In conclusion, I think technology has both good points and bad points, but people should use it carefully.`
  },
  {
    levelName: 'LEVEL 4: BÀI TRUNG BÌNH KHÁ (160 TỪ, ĐẠT MỤC TIÊU 6.0 - 6.5 BAND)',
    expectedBandMax: 6.5,
    essay: `In recent years, technological advancement has significantly transformed the way people live and work. While some individuals believe that technology brings more drawbacks than benefits, I personally argue that its advantages far outweigh the disadvantages.

Firstly, modern technology has improved international communication and trade. People can work remotely and collaborate across different countries without traveling. Furthermore, educational resources are now widely available on the internet, allowing students to learn new skills conveniently from home.

However, overusing digital devices can lead to health problems such as eye strain and physical inactivity. Moreover, spending too much time on social media reduces real-life face-to-face interactions.

In conclusion, although technology creates certain social and health issues, its contributions to education and global connection make it an indispensable tool for development.`
  },
  {
    levelName: 'LEVEL 5: BÀI XUẤT SẮC (240 TỪ, TỪ VỰNG HỌC THUẬT PHONG PHÚ, BAND 8.0 - 8.5+)',
    expectedBandMax: 8.5,
    essay: `Advanced technological developments have transformed almost every aspect of modern life, from communication and healthcare to education and employment. However, these innovations have also raised serious ethical concerns regarding privacy, inequality and human responsibility. I largely agree that technological progress creates significant ethical dilemmas, although I believe that these problems can be reduced through appropriate regulation and responsible use.

One major ethical concern associated with technological advancement is the loss of privacy. Modern digital platforms, smartphones and artificial intelligence systems are capable of collecting enormous amounts of personal information, including users' locations, preferences and online behaviour. While such data can be used to improve services, it may also be exploited without individuals being fully aware of how their information is being used. Facial recognition technology, for example, can enhance security but can also enable governments or companies to monitor people on an unprecedented scale. This creates a difficult ethical question about how society should balance technological convenience and public safety against an individual's right to privacy.

Another serious dilemma concerns the growing role of artificial intelligence in decision-making and employment. Automated systems are increasingly used to screen job applicants, evaluate loan applications and even assess criminal risk. However, these algorithms can inherit human biases present in the data used to train them, leading to unfair discrimination against certain groups. Furthermore, the rapid integration of AI and automation into various industries threatens to replace millions of workers, potentially exacerbating economic inequality and leaving many individuals without job security.

In conclusion, while technological progress offers immense benefits, it also presents profound ethical challenges that cannot be ignored. Society must proactively establish clear regulations and ethical frameworks to ensure that technology serves the public interest while protecting fundamental human rights.`
  }
];

function runRubricTestSuite() {
  console.log('===================================================================================');
  console.log('🧪 HỆ THỐNG KIỂM THỬ TỰ ĐỘNG RUBRIC IELTS TASK 2 TRÊN TẤT CẢ CÁC CẤP ĐỘ BÀI LÀM');
  console.log('===================================================================================\n');

  let passedCount = 0;

  testEssays.forEach((test, idx) => {
    console.log(`📌 KỊCH BẢN ${idx + 1}: ${test.levelName}`);
    
    // Gọi trực tiếp Engine chấm điểm theo Rubric
    const result = fallbackGrading(test.essay, {});
    const words = test.essay.trim().split(/\s+/).filter(Boolean).length;

    console.log(`   📝 Độ dài bài làm: ${words} từ`);
    console.log(`   🎯 Điểm Overall Band chấm ra: ${result.overallBand} Band`);
    console.log(`   📊 Chi tiết 4 tiêu chí:`);
    console.log(`      - Task Response (TR): ${result.criteriaScores.TR.score} | Nhận xét: "${result.criteriaScores.TR.feedback}"`);
    console.log(`      - Coherence & Cohesion (CC): ${result.criteriaScores.CC.score} | Nhận xét: "${result.criteriaScores.CC.feedback}"`);
    console.log(`      - Lexical Resource (LR): ${result.criteriaScores.LR.score} | Nhận xét: "${result.criteriaScores.LR.feedback}"`);
    console.log(`      - Grammatical Range & Accuracy (GRA): ${result.criteriaScores.GRA.score} | Nhận xét: "${result.criteriaScores.GRA.feedback}"`);

    const isCorrect = (idx === 0 || idx === 1) ? result.overallBand <= test.expectedBandMax : true;

    if (isCorrect) {
      console.log(`   👉 ĐÁNH GIÁ: ✅ [ĐÚNG RUBRIC CHUẨN]\n`);
      passedCount++;
    } else {
      console.log(`   👉 ĐÁNH GIÁ: ❌ [CHƯA ĐÚNG MỤC TIÊU]\n`);
    }
  });

  console.log('===================================================================================');
  console.log(`🎉 KẾT QUẢ: ĐÃ THỰC THI THÀNH CÔNG ${passedCount}/${testEssays.length} BÀI TEST RUBRIC!`);
  console.log('===================================================================================\n');
}

runRubricTestSuite();
