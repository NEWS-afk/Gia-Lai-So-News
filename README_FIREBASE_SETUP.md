# GIA LAI SỐ NEWS V8 – ĐĂNG BÀI ONLINE BẰNG TÀI KHOẢN ADMIN

## Mô hình hoạt động
- GitHub Pages: hiển thị website công khai.
- Firebase Authentication: xác thực người đăng bài.
- Cloud Firestore: lưu toàn bộ bài viết online.
- Firebase Storage: tùy chọn để tải ảnh trực tiếp từ trang quản trị.

Mật khẩu Admin KHÔNG được lưu trong GitHub hoặc JavaScript.

---

## PHẦN A – TẠO FIREBASE (chỉ làm một lần)

### 1. Tạo project
Vào https://console.firebase.google.com/
- Add project
- Đặt tên ví dụ: `gia-lai-so-news`
- Analytics có thể bỏ qua.

### 2. Tạo Web App
Trong Project Overview:
- Bấm biểu tượng `</>` (Web)
- Đặt tên app: `Gia Lai So News Web`
- Register app
- Firebase sẽ hiện đoạn `firebaseConfig`.

Mở file `firebase-config.js` của bộ V8 và dán các giá trị tương ứng.

Đổi:
`enabled: false` thành `enabled: true`

### 3. Bật Authentication
Firebase Console → Authentication → Get started → Sign-in method.
Bật **Email/Password**.

Vào tab Users → Add user:
- Email: có thể dùng một email riêng của anh dành cho quản trị.
- Password: đặt mật khẩu quản trị anh đã chọn.

Sau khi tạo user:
- Copy **User UID**.

Trong `firebase-config.js`:
- `adminUsername` giữ là `Admin`
- `adminEmail` nhập đúng email vừa tạo.

Người dùng trang quản trị chỉ nhìn thấy ô tài khoản `Admin`, không cần nhập email.

### 4. Tạo Firestore
Firebase Console → Firestore Database → Create database.
Chọn Standard edition và vị trí phù hợp.

Mở tab Rules rồi dán nội dung file `firestore.rules`.
Trong Rules, thay:
`ADMIN_UID_HERE`
bằng UID của Admin rồi Publish.

### 5. Upload bộ web lên GitHub
Upload toàn bộ file/thư mục V8 vào thư mục gốc repository Gia-Lai-So-News và Commit.

Truy cập:
`https://news-afk.github.io/Gia-Lai-So-News/admin.html`

Đăng nhập:
- Tài khoản: Admin
- Mật khẩu: mật khẩu đã tạo trong Firebase Authentication.

Sau lần đăng nhập đầu tiên bấm:
**Khởi tạo 121 bài mẫu**

Từ đó dữ liệu sẽ được lưu trên Firestore.

---

## PHẦN B – ĐĂNG BÀI HẰNG NGÀY

Vào `/admin.html` → đăng nhập.

Bấm `+ Bài mới` rồi nhập:
- Tiêu đề
- Chuyên mục
- Ngày đăng
- Tóm tắt
- Nội dung
- Ảnh
- Đơn vị phối hợp (nếu có)
- Nguồn tham khảo
- Trạng thái công khai / bản nháp

Bấm **Lưu bài**.

Không cần vào GitHub để sửa `articles.json` nữa.

---

## PHẦN C – ẢNH BÀI VIẾT

### Cách miễn phí, không cần Firebase Storage
Trong ô “Ảnh đại diện - URL/đường dẫn”:
- Dán URL ảnh mà anh có quyền sử dụng; hoặc
- Upload ảnh thủ công vào thư mục `images/` trên GitHub rồi nhập:
  `images/ten-anh.jpg`

### Cách tiện nhất: tải ảnh trực tiếp trong Admin
Firebase Storage hiện yêu cầu project ở gói Blaze.
Sau khi bật Storage:
1. Dán `storage.rules`, thay `ADMIN_UID_HERE`.
2. Trong `firebase-config.js` đổi:
   `storageEnabled: false` → `true`.
3. Trang Admin sẽ cho chọn file ảnh và tự tải lên.

---

## PHẦN D – SAO LƯU / DUY TRÌ LÂU DÀI

Khuyến nghị:
- Không xóa repository GitHub.
- Giữ quyền truy cập tài khoản Google/Firebase.
- Bật xác thực 2 bước cho tài khoản Google và GitHub.
- Định kỳ xuất dữ liệu Firestore hoặc sao lưu nội dung bài.
- Không để mật khẩu Admin trong file HTML/JS.
- Khi đổi mật khẩu, đổi trực tiếp trong Firebase Authentication; không phải sửa website.

## LƯU Ý
Website dùng font hệ thống và UTF-8, tránh lỗi dấu tiếng Việt.
