const puppeteer = require('puppeteer');

(async () => {
  console.log('🚀 KHỞI ĐỘNG TRÌNH DUYỆT PUPPETEER ĐỂ KIỂM THỬ THỰC TẾ TRÊN VERCEL LIVE...');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  try {
    console.log('🌐 1. Truy cập trang web Vercel Live: https://adaptive-lms-ielts-frontend.vercel.app');
    await page.goto('https://adaptive-lms-ielts-frontend.vercel.app', { waitUntil: 'networkidle2', timeout: 30000 });
    
    const title = await page.title();
    console.log(` ✅ Đã tải trang thành công! Title: "${title}"`);

    // 2. Chụp ảnh màn hình trang Đăng Nhập
    const screenshotPath = 'd:/TrackA_Test-Project_GFT/browser_live_test.png';
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(` 📸 Đã chụp ảnh màn hình lưu tại: ${screenshotPath}`);

    console.log('🎉 KIỂM THỬ TRÌNH DUYỆT TỰ ĐỘNG THÀNH CÔNG 100%!');
  } catch (err) {
    console.error('❌ Lỗi khi mở trình duyệt:', err.message);
  } finally {
    await browser.close();
  }
})();
