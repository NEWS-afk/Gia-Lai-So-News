# Gia Lai Số News V12

## Đăng nhập Tòa soạn
- Tài khoản: Adminnews
- Mật khẩu: Iako@102

## Điểm mới
- Bổ sung 02 bài Pháp luật ngày 24/10/2026 và 25/10/2026, biên tập từ nguồn Sức khỏe & Đời sống và Soha.
- Giữ nguồn tham khảo và đường dẫn bài gốc ở cuối bài.
- Tòa soạn có thể thay/xóa ảnh đại diện của bài đã đăng.
- Có thể chọn nhiều ảnh từ máy để thêm vào nội dung bài, xóa từng ảnh hoặc xóa toàn bộ ảnh trong bài.
- Ảnh từ máy được tự thu nhỏ và nhúng vào dữ liệu.

## Cách đưa thay đổi lên website
1. Mở admin.html và đăng nhập.
2. Thêm/sửa/xóa bài hoặc hình ảnh.
3. Bấm "Lưu bài".
4. Bấm "Xuất file cập nhật website".
5. Upload file seed-posts.js vừa tải xuống lên repository GitHub, ghi đè file cũ và Commit changes.
6. Mở trang chủ và nhấn Ctrl+F5.

Lưu ý: Ảnh nhúng trực tiếp làm seed-posts.js tăng dung lượng. Nên dùng ảnh vừa phải; hệ thống tự nén ảnh khi chọn từ máy.


## V12.1 - Xem trước thay đổi ngay
- Sau khi bấm **Lưu bài**, trang chủ trên cùng trình duyệt/máy sẽ tự đọc bản biên tập trong localStorage và hiển thị ngay ảnh/nội dung mới.
- Khi đang xem dữ liệu local, đầu trang xuất hiện dòng **BẢN XEM TRƯỚC TRÊN MÁY NÀY – các thay đổi chưa được xuất bản lên GitHub**.
- Để mọi người và các thiết bị khác thấy thay đổi, vẫn phải bấm **Xuất file cập nhật website**, sau đó upload `seed-posts.js` lên GitHub để ghi đè file cũ.
- Sau khi xuất bản xong, có thể vào Admin chọn **Nạp lại dữ liệu từ website** để đồng bộ bản local với bản đã công khai.
