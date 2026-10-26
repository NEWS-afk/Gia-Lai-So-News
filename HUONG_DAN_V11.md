# GIA LAI SỐ NEWS V11 - BẢN KHÔNG FIREBASE

## Đăng nhập tòa soạn
- Tài khoản: Adminnews
- Mật khẩu: Iako@102

## Cách hoạt động
Bản V11 bỏ hoàn toàn Firebase. Trang công khai đọc dữ liệu từ `seed-posts.js`.
Trang `admin.html` lưu các chỉnh sửa trong trình duyệt của máy đang sử dụng.

## Đưa bài đã chỉnh lên website
1. Vào `admin.html`, đăng nhập và chỉnh/sửa bài.
2. Bấm **Xuất file cập nhật website**. Trình duyệt tải về file `seed-posts.js`.
3. Vào repository GitHub `Gia-Lai-So-News`, upload file `seed-posts.js` để ghi đè file cũ và Commit changes.
4. Mở trang chủ và nhấn Ctrl+F5.

## Sao lưu
Bấm **Sao lưu JSON** để giữ một bản dữ liệu riêng. Có thể nhập lại file JSON hoặc JS tại mục **Nhập dữ liệu đã sao lưu**.

## Lưu ý bảo mật
Do đây là website tĩnh trên GitHub Pages, giao diện đăng nhập chỉ bảo vệ việc biên tập trên trình duyệt. Việc xuất bản lên website vẫn cần quyền truy cập repository GitHub, nên người không có quyền GitHub không thể tự đưa bài lên trang.
