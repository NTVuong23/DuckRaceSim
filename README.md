# Trò chơi Đua Vịt - Duck Racing Game

Đây là trò chơi đua vịt tương tác được triển khai với hai phiên bản:
1. Phiên bản Node.js Express (TypeScript)
2. Phiên bản Python Flask

## Giới thiệu

Trò chơi Đua Vịt là một nền tảng vui nhộn cho phép người dùng tạo, tùy chỉnh và đua các con vịt ảo. Trò chơi hỗ trợ đến 100 con vịt, tùy chỉnh màu sắc, tên, và thậm chí có thể cài đặt trước người chiến thắng.

## Tính năng

- Tùy chỉnh màu sắc vịt với bảng màu đầy đủ
- Hỗ trợ tối đa 100 con vịt
- Giao diện tiếng Việt
- Hiệu ứng hình ảnh 3D cho vịt (bóng đổ, highlight)
- Hỗ trợ nhập hàng loạt tên vịt
- Tùy chỉnh thời gian đua
- Khả năng đặt trước người chiến thắng (bí mật)
- Hiển thị kết quả đua đầy đủ sau khi kết thúc

## Công nghệ sử dụng

### Phiên bản Node.js (Express)
- Backend: Node.js, Express, TypeScript
- Frontend: React, Tailwind CSS
- Build Tool: Vite

### Phiên bản Python
- Backend: Python Flask
- Frontend: HTML, CSS, JavaScript
- Animation: Canvas API
- Styling: CSS custom (không sử dụng framework)

## Cách chạy ứng dụng

### Phiên bản Node.js (Express)
```bash
npm run dev
```
Ứng dụng sẽ chạy tại địa chỉ http://127.0.0.1:5000

### Phiên bản Python Flask
```bash
python run_flask.py
```
Ứng dụng sẽ chạy tại địa chỉ http://localhost:8081

## Cấu trúc dự án

### Phiên bản Node.js (Express)
- `server/`: Chứa mã nguồn backend Express
  - `index.ts`: File chính của ứng dụng Express
  - `routes/`: Chứa các route API
- `client/`: Chứa mã nguồn frontend React
  - `src/`: Mã nguồn React
  - `public/`: Tài nguyên tĩnh

### Phiên bản Python Flask
- `run_flask.py`: File chính của ứng dụng Flask
- `app.py`: Logic xử lý chính
- `templates/`: Chứa file HTML
  - `index.html`: Giao diện người dùng
- `static/`: Chứa file tĩnh
  - `css/`: Chứa file CSS
    - `style.css`: Định dạng giao diện
  - `js/`: Chứa các file JavaScript
    - `app.js`: Logic chính của ứng dụng
    - `duck.js`: Xử lý việc vẽ và hoạt ảnh của vịt

## Ghi chú

Dự án này có hai phiên bản với cùng tính năng và trải nghiệm người dùng tương tự, được triển khai bằng các công nghệ khác nhau.