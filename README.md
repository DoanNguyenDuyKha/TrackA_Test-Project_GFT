# ENGLISH ADAPTIVE LMS - HỆ THỐNG HỌC TẬP THÍCH ỨNG & CHẤM BÀI IELTS WRITING TASK 2 TỰ ĐỘNG VỚI AI

## 🌟 GIỚI THIỆU HỆ THỐNG

**English Adaptive LMS** là hệ thống quản lý học tập cá nhân hóa thông minh (Adaptive Learning Management System) chuyên biệt cho chứng chỉ **IELTS Writing Task 2**. Hệ thống giải quyết triệt để 3 bài toán lớn trong giảng dạy ngôn ngữ:
1. **Phân nhóm năng lực tự động & thích ứng nội dung (Adaptive Content)**: Lớp học luôn tồn tại 3 nhóm học viên trái ngược nhau (`support` - Cần hỗ trợ, `average` - Trung bình, `excellent` - Xuất sắc). Hệ thống tự động phân loại và gợi ý Đề thi, Dàn ý Scaffolding, Từ vựng Collocations đắt giá cũng như Bài giảng phù hợp nhất với từng nhóm.
2. **Chấm bài tự luận minh bạch & khắt khe với OpenAI GPT-4o**: Đánh giá chính xác theo 4 tiêu chí của tài liệu *IELTS Task 2 Writing Band Descriptors* (Task Response, Coherence & Cohesion, Lexical Resource, Grammar Range & Accuracy) kèm bản đồ bóc tách câu sai ngữ pháp/từ vựng trực quan.
3. **Thuật toán Chuyển đổi Cấp độ (Level Migration Engine)**: Tự động tính điểm trung bình di động (*Moving Average*) của 3 bài làm gần nhất để điều chỉnh tăng/hạ nhóm năng lực học viên realtime.

---

## 🏛️ SƠ ĐỒ KIẾN TRÚC & LUỒNG DỮ LIỆU (SYSTEM ARCHITECTURE)

```
[ReactJS Client (Vite + Tailwind CSS)]
        │
        ▼ (REST API / Bearer JWT Token)
[Node.js / ExpressJS Backend]
        ├── Express Routing & Authorization Middleware (Role & StudentGroup)
        ├── Automatic Adaptive Routing Engine (Moving Average Level Migration)
        └── OpenAI GPT-4o Integration (JSON Mode Evaluation)
        │
        ▼
[MongoDB Cloud Atlas Cluster] (Mongoose Models: User, Assignment, Lecture, Exercise, Submission)
```

---

## 🗄️ THIẾT KẾ CƠ SỞ DỮ LIỆU (DATABASE SCHEMAS)

Hệ thống bao gồm 5 Mongoose Models chuẩn hóa:
1. **User Schema**: `name`, `email` (unique index), `password` (băm bcrypt), `role` (`student` | `admin`), `studentGroup` (`support` | `average` | `excellent`), `targetBand`.
2. **Assignment Schema**: `title`, `prompt`, `topic`, `targetGroup`, `scaffoldingTemplate` (Dàn ý 4 phần cho nhóm Support), `suggestedVocabulary` (Mảng `{ word, meaning, collocation }` cho nhóm Excellent).
3. **Lecture Schema**: `title`, `content` (Markdown), `focusCriterion` (`TR` | `CC` | `LR` | `GRA`), `targetGroup`.
4. **Exercise Schema**: `lectureId` (ref Lecture), `title`, `type` (`gap-fill` | `rewriting`), `questions`.
5. **Submission Schema**: `studentId`, `assignmentId`, `studentAnswers`, `overallBand`, `criteriaScores` (`TR`, `CC`, `LR`, `GRA`), `detailedCorrections` (`{ original, corrected, explanation }`).

---

## ⚙️ HƯỚNG DẪN CÀI ĐẶT & KHỞI CHẠY (INSTALLATION GUIDE)

### 1. Khởi chạy Backend:
```bash
cd backend
npm install
```

Tạo tệp `.env` tại thư mục `backend/` với nội dung:
```env
PORT=5000
MONGO_URI=mongodb+srv://doannguyenduykha08_db_user:Kha.0804@englishadaptivelms.6dtqe9l.mongodb.net/lms_adaptive?appName=EnglishAdaptiveLMS
JWT_SECRET=adaptive_lms_secret_key_2026
OPENAI_API_KEY=your_openai_api_key_here
```

Khởi chạy Server Backend:
```bash
npm start
```

### 2. Khởi chạy Frontend:
```bash
cd frontend
npm install
npm run dev
```
Giao diện Web ứng dụng sẽ được chạy tại địa chỉ: `http://localhost:5173`.

---

## 🌱 HƯỚNG DẪN NẠP DỮ LIỆU MẪU HỌC LIỆU (SEEDER)

Chạy tập tin seeder độc lập để dọn dẹp CSDL cũ và nạp bộ dữ liệu mẫu thực tế chuẩn IELTS:
```bash
cd backend
npm run seed
```

**Tài khoản đăng nhập có sẵn:**
- 🎓 **Học viên**: Email `student@gft.edu.vn` | Password: `123456` (Nhóm: `support`)
- 👑 **Quản trị viên**: Email `admin@gft.edu.vn` | Password: `123456` (Role: `admin`)

---

## 📹 HƯỚNG DẪN QUAY VIDEO DEMO SẢN PHẨM (TỐI ĐA 5 PHÚT)

Để trình bày sản phẩm sắc bén và thuyết phục Hội đồng Đánh giá GFT, ứng viên nên thực hiện video theo 5 luồng hoạt động cốt lõi sau:

1. **Phút 0:00 - 0:45 | Đăng nhập & Huy hiệu Nhóm Năng Lực Thích Ứng:**
   - Đăng nhập tài khoản Học viên `student@gft.edu.vn`. Show Huy hiệu Đỏ **"CẦN HỖ TRỢ"** nổi bật trên Navbar và Dashboard.
2. **Phút 0:45 - 2:00 | Workspace Thực hành & Adaptive Sidebar:**
   - Vào một đề thi IELTS Task 2. Giải thích bộ đếm thời gian 40 phút, đếm số từ tự động.
   - Thể hiện sự thích ứng: Với nhóm `support`, cột phải hiển thị **Dàn ý 4 phần Scaffolding Template** giúp học viên không bị bí ý.
3. **Phút 2:00 - 3:30 | Chấm bài AI GPT-4o & Bản Đồ Sửa Lỗi Trực Quan (Corrections Canvas):**
   - Bấm "Nộp Bài Chấm AI". Show hiệu ứng Loading chấm điểm theo Rubric 4 tiêu chí của Cambridge.
   - Tại màn hình Kết quả: Show Band điểm Overall, 4 tiêu chí TR, CC, LR, GRA và **rê chuột vào các câu bôi màu đỏ** để hiển thị Tooltip Popover giải thích lỗi sai ngữ pháp/dùng từ chi tiết bằng tiếng Việt.
4. **Phút 3:30 - 4:15 | Biểu đồ Tiến bộ Recharts Multi-Axis & Phân Tích Chuyển Band Rubric:**
   - Truy cập `StudentDashboard`: Show **Biểu đồ đường 4 tiêu chí** theo thời gian để nhận diện điểm nghẽn.
   - Thao tác công cụ **Tra cứu Rubric & Phân Tích Chuyển Band AI** (ví dụ: Band 6 up Band 7).
5. **Phút 4:15 - 5:00 | Trang Quản Trị Admin & Can Thiệp Sư Phạm (Override):**
   - Đăng nhập tài khoản Admin `admin@gft.edu.vn`. Show trang Quản lý Đề thi (Grid Card, đính kèm Scaffolding/Vocab) và trang Giám sát Học viên (cho phép can thiệp Override nhóm năng lực học viên thủ công).
