const puppeteer = require('puppeteer');

(async () => {
  console.log('🚀 KHỞI ĐỘNG TRÌNH DUYỆT PUPPETEER ĐỂ ĐIỀU KHIỂN CHI TIẾT TRÊN LIVE...');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  try {
    // 1. Đăng nhập với tài khoản học viên thật
    await page.goto('https://adaptive-lms-ielts-frontend.vercel.app/login', { waitUntil: 'networkidle2' });
    await page.type('input[type="email"]', 'test.support@gft.edu.vn');
    await page.type('input[type="password"]', '123456');

    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2' })
    ]);

    // Đợi 2.5s để API load hết dữ liệu trang Dashboard
    await new Promise(r => setTimeout(r, 2500));
    await page.screenshot({ path: 'd:/TrackA_Test-Project_GFT/browser_step1_dashboard.png', fullPage: true });

    // 2. Chuyển sang trang Đề Thi Thực Hành
    await page.goto('https://adaptive-lms-ielts-frontend.vercel.app/assignments', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2500));
    await page.screenshot({ path: 'd:/TrackA_Test-Project_GFT/browser_step2_assignments.png', fullPage: true });

    console.log('🎉 KIỂM THỬ TRÌNH DUYỆT CHI TIẾT THÀNH CÔNG!');
  } catch (err) {
    console.error('❌ Lỗi:', err.message);
  } finally {
    await browser.close();
  }
})();
