# Solartec - Energy Blog & Website System

Đây là mã nguồn của trang web và blog năng lượng sạch Solartec, tích hợp hệ quản trị cơ sở dữ liệu Supabase để quản lý bài viết, danh mục và nội dung trang chủ động.

## Hướng dẫn cài đặt cơ sở dữ liệu Supabase

Để chạy được dự án này với đầy đủ tính năng (blog, quản trị admin, liên hệ, cấu hình trang chủ động), bạn cần thiết lập một dự án Supabase theo hướng dẫn dưới đây.

### Bước 1: Tạo dự án mới trên Supabase

1. Truy cập vào [Supabase Dashboard](https://supabase.com) và đăng nhập hoặc đăng ký tài khoản.
2. Nhấp vào nút **New Project** để tạo một dự án mới.
3. Nhập tên dự án (ví dụ: `Energy Blog`), mật khẩu cơ sở dữ liệu, và chọn vùng gần bạn nhất. Nhấp **Create new project** và đợi vài phút để dự án được khởi tạo.

### Bước 2: Chạy SQL Setup Schema

1. Khi dự án đã tạo xong, ở thanh menu bên trái, chọn **SQL Editor** (biểu tượng `>_`).
2. Nhấp vào **New query**.
3. Mở file [supabase-schema.sql](file:///Users/doxuanquang/Documents/BioWraps/Blog/solartec-1.0.0/supabase-schema.sql) trong dự án này, copy toàn bộ nội dung của file đó.
4. Dán nội dung SQL vào ô nhập liệu của Supabase SQL Editor.
5. Nhấp nút **Run** (ở góc dưới cùng bên phải) để thực thi.
   * Lệnh này sẽ tạo các bảng: `categories`, `posts`, `homepage_content`.
   * Thiết lập Row Level Security (RLS) để cho phép đọc/ghi dữ liệu công khai (dành cho phát triển/thử nghiệm).
   * Tạo bucket lưu trữ `media` dùng để chứa hình ảnh bài viết và hình ảnh trang chủ.
   * Tạo trigger tự động cập nhật thời gian (`updated_at`) khi có thay đổi nội dung.
   * Thêm dữ liệu mẫu ban đầu cho trang chủ (`homepage_content`).

### Bước 3: Kiểm tra Storage Bucket
Lưu ý: Đoạn mã SQL ở Bước 1 đã tự động khởi tạo bucket blog-images cho bạn. Bạn không cần làm thủ công bước này nữa.

1. Đi tới phần **Storage** ở menu bên trái (biểu tượng thư mục).
2. Kiểm tra xem bucket có tên `media` đã được tạo hay chưa.
3. Đảm bảo bucket `media` được thiết lập ở chế độ **Public** (Công khai) để trang web có thể hiển thị hình ảnh tải lên từ bucket này. Nếu chưa, hãy bấm vào nút ba chấm bên cạnh bucket `media`, chọn **Edit bucket** và bật tùy chọn **Public bucket**.

### Bước 4: Cấu hình API Credentials trong dự án

1. Đi tới phần **Project Settings** (biểu tượng bánh răng) -> **API** ở thanh menu bên trái Supabase.
2. Sao chép các thông tin sau:
   * **Project URL**: Đường dẫn URL của dự án.
   * **anon public key**: Mã khóa API công khai.
3. Mở file [js/supabase-config.js](file:///Users/doxuanquang/Documents/BioWraps/Blog/solartec-1.0.0/js/supabase-config.js) trong mã nguồn dự án của bạn:
   ```javascript
   const SUPABASE_CONFIG = {
       url: "YOUR_SUPABASE_PROJECT_URL",
       anonKey: "YOUR_SUPABASE_ANON_PUBLIC_KEY"
   };
   ```
4. Thay thế `YOUR_SUPABASE_PROJECT_URL` và `YOUR_SUPABASE_ANON_PUBLIC_KEY` bằng thông tin bạn vừa sao chép từ Supabase. Lưu lại file.



## Các tính năng chính của dự án

* **Trang chủ động (Dynamic Homepage)**: Toàn bộ nội dung trang chủ từ Banner, Mô tả, Dịch vụ, Tính năng nổi bật, Dữ liệu thống kê,... đều được đồng bộ thời gian thực với Supabase và có thể chỉnh sửa trực tiếp thông qua Admin Panel.
* **Hệ thống Blog**: Quản lý bài viết blog theo danh mục, thêm mới/chỉnh sửa/xóa bài viết kèm hình ảnh thu nhỏ (thumbnail) được upload trực tiếp lên Supabase Storage.
* **Giao diện Admin (Admin Dashboard)**: Truy cập vào [admin.html](file:///Users/doxuanquang/Documents/BioWraps/Blog/solartec-1.0.0/admin.html) để thực hiện quản lý bài viết, danh mục, cấu hình trang chủ, và theo dõi các tin nhắn liên hệ.
* **Đăng ký liên hệ**: Khách hàng gửi liên hệ ở trang [contact.html](file:///Users/doxuanquang/Documents/BioWraps/Blog/solartec-1.0.0/contact.html) hoặc nhận báo giá ở trang [quote.html](file:///Users/doxuanquang/Documents/BioWraps/Blog/solartec-1.0.0/quote.html) sẽ được lưu trữ tự động (hoặc gửi thông báo tùy theo cấu hình mở rộng).
