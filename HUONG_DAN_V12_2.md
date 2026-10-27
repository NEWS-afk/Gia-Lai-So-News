# V12.2 – đồng bộ xem trước ảnh/nội dung ngay

- Khi bấm **Lưu bài**, dữ liệu được ghi vào localStorage và phát tín hiệu cho tab trang chủ.
- Nếu trang chủ đang mở ở tab khác, tab đó tự đọc lại dữ liệu khi nhận tín hiệu, khi được focus hoặc khi chuyển từ nền sang hiển thị.
- Nút **Mở trang chủ xem ngay** mở một tab mới để xem bản local vừa lưu.
- Nếu localStorage hết dung lượng do ảnh quá nặng, trang quản trị sẽ báo lỗi rõ ràng thay vì báo đã lưu.
- `admin.html` và `index.html` dùng `?v=12.2` để tránh trình duyệt giữ cache JavaScript cũ.

Lưu ý: đây vẫn là bản xem trước trên máy đang chỉnh. Muốn mọi người đều thấy, xuất `seed-posts.js` và upload lên GitHub.
