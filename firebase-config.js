/*
  GIA LAI SỐ NEWS - CẤU HÌNH FIREBASE
  1) Tạo Firebase project và Web App.
  2) Dán firebaseConfig vào bên dưới.
  3) Đặt enabled = true.
  4) adminEmail: email nội bộ dùng để tạo tài khoản Firebase Authentication.
     Người đăng nhập trên website vẫn chỉ nhập tên tài khoản "Admin".
  5) storageEnabled = true chỉ khi đã bật Firebase Storage (hiện yêu cầu Blaze).
*/
window.GLS_FIREBASE = {
  enabled: true,
  adminUsername: "Admin",
  adminEmail: "Thienphuc150825@gmail.com",
  storageEnabled: false,

  config: {
    apiKey: "AIzaSyABkBfDJDsM5R8pPk0ksj6zg-Ohf9P0Apo",
    authDomain: "gia-lai-so-news.firebaseapp.com",
    projectId: "gia-lai-so-news",
    storageBucket: "gia-lai-so-news.firebasestorage.app",
    messagingSenderId: "416410824818",
    appId: "1:416410824818:web:f3111ccdeaf67037fb12eb"
  }
};