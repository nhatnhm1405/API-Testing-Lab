# API Testing Lab

Một web app học **API & API Testing** theo phong cách tương tác (kiểu Brilliant.org / Duolingo):
học qua câu chuyện, bài tập kéo–thả, và một "phòng lab" gửi request mô phỏng.
Giao diện tiếng Anh, hiệu ứng động, tông "giấy ấm".

>  **Tài liệu này là hướng dẫn trải nghiệm, app chưa đi đến giai đoạn hoàn thiện thật sự.** Mục dưới đi qua
> lần lượt **các chức năng đã demo được**, kèm gợi ý đường đi trong app. Những phần
> **chưa hoàn thiện / đang phát triển** được ghi chú ở cuối.

---

## 1. Chạy app

```bash
npm install      # cài dependencies
npm run dev      # chạy dev server (mặc định http://localhost:5173)
```

Build production:

```bash
npm run build    # xuất ra thư mục dist/
```

> Bản deploy (Vercel): _điền link tại đây sau khi deploy_ — ví dụ `https://api-testing-lab.vercel.app`

---

## 2. Lối đi nhanh (tour gợi ý)

Vào app sẽ ở màn **Home**. Trình tự trải nghiệm khuyến nghị:

1. **Banner "How does an API actually work?"** (trên cùng) → bấm **Explore** để xem câu chuyện tương tác.
2. Quay lại Home → bấm card **"API Testing Lab"** (bên trái) để vào thẳng phòng lab gửi request.
3. Bấm **"Start Lesson →"** ở card Module 1 để làm thử các dạng bài tập.
4. Hoàn thành 1 module để xem màn **Result** và **Skill Check**.
5. Cố tình trả lời **sai** vài câu → xem **điểm phản ánh đúng** + mục **"Review your mistakes"**.
6. Với module đã xong → thử nút **Restart / Replay** để làm lại.

---

## 3. Các chức năng đã demo được

### 3.1. Home Dashboard
- **Banner tương tác** "How does an API actually work?" — điểm vào câu chuyện.
- **Card "API Testing Lab"** — lối tắt vào thẳng simulator (gửi request thử 4 method).
- Thẻ **Streak / XP**, 2 ô thống kê **Lessons done** & **Modules**.
- **Card Module gợi ý (Recommended)** kèm tiến độ, danh sách lesson, nút Start/Continue.
- Dải **"All Modules"** — bấm để xem trước (preview) từng module trong card gợi ý.
- **"View learning path"** — mở bản đồ lộ trình.
- **Card "Review your mistakes"** (màu đỏ) — chỉ hiện khi đã có câu trả lời sai.

### 3.2. Câu chuyện "How does an API actually work?"
Một flow điện ảnh nhiều chặng, giải thích API bằng ẩn dụ quán phở:

`🍜 intro → Câu chuyện phở (hỏi–đáp) → 🔌 chuyển cảnh → Câu chuyện API → 🚀 Welcome → Phòng lab → 📋 Sơ đồ tổng kết`

- **Câu chuyện phở**: hội thoại từng bước, mỗi bước có câu hỏi 2 lựa chọn "chuyện gì đang xảy ra?". Sai thì lắc + gợi ý; đúng thì lộ ra thuật ngữ API tương ứng.
- **Câu chuyện API**: kể lại đúng hành trình đó bằng ngôn ngữ HTTP (Client ↔ Server, request line, headers, 200 OK, JSON body) kèm animation client–server.
- **Sơ đồ tổng kết**: 2 sơ đồ "Request & Response" và "Anatomy of an HTTP Request".
- Có thể **tap để bỏ qua** các cảnh chữ lớn, và **Restart story**.

### 3.3. API Simulator (phòng lab gửi request)
Vào từ card "API Testing Lab" ở Home, hoặc ở cuối câu chuyện. Đây là **request builder mô phỏng**:

- **5 chế độ**: 🟢 Normal (GET), 🔐 Debug (sửa lỗi 401 bằng header Authorization), và POST / PUT / DELETE.
- **Request Builder**: chọn method (GET/POST/PUT/DELETE), nhập URL, thêm/sửa **Headers** (accordion), sửa **Body** (với POST/PUT), và **Hint** từng bước.
- Bấm **Send** → hoạt ảnh "gói tin" chạy Client → Server → Client.
- **Response viewer**: status pill (200/401/404/405… tô màu theo nhóm), JSON hiện ra từng dòng, **confetti** khi đúng, nút **"Why?"** giải thích Method / URL / Response.
- Trả lời sai (sai method/URL/thiếu auth) → có gợi ý "vì sao chưa đúng".

### 3.4. Learning Path (bản đồ lộ trình)
- Bản đồ kiểu "candy map": mỗi lesson là một node (đã xong ✓ / đang học ▶ / khoá 🔒).
- Nhóm theo 4 module, hiển thị tiến độ `x/y`.
- Module đã hoàn thành có **nút ↺ Restart** ngay trên nhãn chương.

### 3.5. Lessons — 5 dạng bài tập
Mỗi lesson có thanh tiến độ, nút **Check**, ô phản hồi đúng/sai kèm linh vật, và **modal "Why?"** giải thích. 5 dạng:

| Dạng | Mô tả |
|------|-------|
| **MCQ** | Trắc nghiệm 1 đáp án. |
| **Fill-blank** | Điền chỗ trống — chip từ "Word Bank" **trượt mượt** vào ô (animation chia sẻ layout). |
| **Drag-categorize** | Kéo thẻ vào đúng nhóm (bucket). |
| **Drag-order** | Sắp xếp thứ tự — kéo bằng `Reorder` của motion; **đáp án được giấu** cho tới khi bấm Check. |
| **Postman** | Console mini gửi request (mô phỏng) — gồm cả bài **Debug** request lỗi. |

### 3.6. Result & Skill Check
- **Result** (sau khi xong 1 module): cúp + confetti, **điểm phản ánh đúng số câu đúng** (vd sai 1 → 3/4, 75%), XP earned (chỉ tính câu đúng), streak.
  - Nếu có câu sai trong module → hiện **danh sách câu sai + giải thích** ngay tại đây.
  - Nút **"Replay this module"** để làm lại; **"Next up"** sang Skill Check.
- **Skill Check**: màn chốt kiến thức của module (hiện các chủ đề đã học, dẫn sang module kế hoặc lộ trình).

### 3.7. Ghi nhận & ôn câu sai (Mistakes review)
- Mọi câu trả lời sai được **ghi lại tự động**.
- Màn **"Review your mistakes"**: liệt kê từng câu từng sai — kèm tên module, đề bài, và **lời giải thích (Why)**.
- Vào được từ **card đỏ ở Home** và phần liệt kê trên **Result**.

### 3.8. Làm lại module (Restart)
Có ở **3 nơi**: card module đã xong ở Home, màn Result, và nhãn chương ở Learning Path.
Khi restart: xoá tiến độ + câu sai của module đó rồi vào học lại từ lesson 1.

---

## 4. Nội dung khoá học (4 module)

| # | Module | Chủ đề | Số lesson |
|---|--------|--------|-----------|
| 1 | **What is an API?** | Khái niệm cốt lõi, HTTP methods, status codes | 4 (MCQ) |
| 2 | **HTTP Methods & Status Codes** | GET/POST/PUT/DELETE, nhóm status, CRUD lifecycle | 5 (MCQ, fill, kéo–thả) |
| 3 | **Practice with Requests** | Headers, body, gửi GET/POST đầu tiên, Authentication | 5 (fill, Postman) |
| 4 | **Real-world API Testing** | Test case, debug request lỗi, PASS/FAIL | 4 (MCQ, fill, Postman, kéo–thả) |

---

## 5. Chưa hoàn thiện / đang phát triển (note)

Những điểm dưới đây **chưa hoàn chỉnh**, nằm trong kế hoạch phát triển tiếp:

- **Chưa lưu tiến độ**: toàn bộ tiến độ / XP / câu sai chỉ ở bộ nhớ phiên (in-memory). **Tải lại trang là reset** — chưa có backend hay `localStorage`. (Demo nên trải nghiệm liền mạch, tránh refresh.)
- **Streak & một số chỉ số là dữ liệu mẫu**: streak "15 ngày", lịch tuần, và pill "12" trong simulator đang để **giá trị cứng** để minh hoạ.
- **Request là mô phỏng, không gọi mạng thật**: Postman console và Simulator trả về **response dựng sẵn**, chưa bắn HTTP thật tới server.
- **Skill Check là màn dẫn (teaser)**: hiện mới là màn tổng kết/định hướng, **chưa có bộ câu hỏi kiểm tra riêng**.
- **Replay cộng lại XP**: làm lại module hiện **cộng trùng XP** (chưa khử trùng) — sẽ chỉnh.
- **Nút "Continue →" trong simulator** (ở trạng thái trả lời đúng) hiện là **placeholder**, chưa nối hành động.
- **Chưa có routing / deep-link**: điều hướng bằng state nội bộ; không có URL riêng cho từng màn, refresh sẽ về Home.
- **Chưa có**: đăng nhập/tài khoản, bảng xếp hạng, nhiều người dùng, đa ngôn ngữ.
- Thư mục `figma fix/` chỉ là **bản export thiết kế** dùng để lấy component, **không thuộc app** (không được track trong git).

---

## 6. Tech stack

React 18 · TypeScript · Vite 6 · Tailwind v4 · Motion (framer-motion) · lucide-react · canvas-confetti.
Điều hướng bằng state machine trong `src/app/App.tsx` (chưa dùng router). Style chủ yếu inline + design tokens `--atl-*` trong `src/styles/theme.css`.
