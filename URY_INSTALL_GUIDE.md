# Hướng dẫn cài đặt URY Restaurant Management System

> **URY** là hệ thống quản lý nhà hàng xây dựng trên nền tảng ERPNext (Frappe Framework), tích hợp POS, Kitchen Display System (KDS), và quản lý nhân sự (HRMS).

> ⚠️ **Quan trọng**: URY POS dùng URL `/urypos`, **KHÔNG PHẢI** `/pos`.
> URL `/pos` là ERPNext Standard POS (khác app, khác permission) — sẽ báo "Permission Required".

---

## Mục lục

- [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
- [Bước 1: Chuẩn bị mã nguồn](#bước-1-chuẩn-bị-mã-nguồn)
- [Bước 2: Build Docker image](#bước-2-build-docker-image)
- [Bước 3: Cấu hình môi trường](#bước-3-cấu-hình-môi-trường)
- [Bước 4: Cấu hình hosts file](#bước-4-cấu-hình-hosts-file)
- [Bước 5: Khởi chạy stack](#bước-5-khởi-chạy-stack)
- [Bước 6: Tạo site và cài ứng dụng](#bước-6-tạo-site-và-cài-ứng-dụng)
- [Bước 7: Fix assets](#bước-7-fix-assets)
- [Bước 8: Setup dữ liệu ban đầu](#bước-8-setup-dữ-liệu-ban-đầu)
- [Bước 9: Tạo POS Opening và sử dụng](#bước-9-tạo-pos-opening-và-sử-dụng)
- [Khởi động lại sau khi tắt máy](#khởi-động-lại-sau-khi-tắt-máy)
- [Xử lý lỗi phổ biến](#xử-lý-lỗi-phổ-biến)

---

## Yêu cầu hệ thống

| Thành phần     | Yêu cầu                              |
|----------------|--------------------------------------|
| Docker Desktop | 4.x trở lên                          |
| RAM            | Tối thiểu **8GB** (khuyến nghị 16GB) |
| Disk           | Tối thiểu **20GB** trống             |
| OS             | Windows 10/11 hoặc Linux Ubuntu 22.04+ |

---

## Bước 1: Chuẩn bị mã nguồn

```bash
# Clone frappe_docker
git clone https://github.com/frappe/frappe_docker.git
cd frappe_docker
```

Tạo file `apps.json` tại thư mục gốc:

```json
[
  {
    "url": "https://github.com/frappe/erpnext.git",
    "branch": "version-15"
  },
  {
    "url": "https://github.com/frappe/hrms.git",
    "branch": "version-15"
  },
  {
    "url": "https://github.com/darkside136317/ury_fork.git",
    "branch": "develop"
  }
]
```

> **Lưu ý**: URY chỉ có branch `develop`, không có `main`.

---

## Bước 2: Build Docker image

**Linux/macOS:**
```bash
docker build \
  --secret id=apps_json,src=apps.json \
  --build-arg FRAPPE_BRANCH=version-15 \
  --tag ury-custom:latest \
  --file images/custom/Containerfile \
  .
```

**Windows (PowerShell):**
```powershell
docker build `
  --secret id=apps_json,src=apps.json `
  --build-arg FRAPPE_BRANCH=version-15 `
  --tag ury-custom:latest `
  --file images/custom/Containerfile `
  .
```

> Quá trình build mất khoảng **15–30 phút**. Image khoảng **4.86GB**.

---

## Bước 3: Cấu hình môi trường

### 3.1 Tạo file `.env`

```env
# Phiên bản ERPNext (dùng cho frontend image)
ERPNEXT_VERSION=v15.44.4

# Custom image đã build ở bước 2
CUSTOM_IMAGE=ury-custom
CUSTOM_TAG=latest

# Không pull từ registry, chỉ dùng image local
PULL_POLICY=never

# Mật khẩu database MariaDB
DB_PASSWORD=your_strong_password

# Tên site (phải khớp với hosts file)
FRAPPE_SITE_NAME_HEADER=ury.local

# Port truy cập web
HTTP_PUBLISH_PORT=8080

# Chính sách restart
RESTART_POLICY=unless-stopped
```

### 3.2 Tạo file `overrides/compose.frontend-override.yaml`

> **Tại sao cần file này?**
> Custom image chỉ có backend stage, không có nginx.
> Dùng image chính thức `frappe/erpnext:version-15` cho frontend.
> Tách named volume `assets` riêng để tránh anonymous volume shadow.

```yaml
services:
  backend:
    volumes:
      - sites:/home/frappe/frappe-bench/sites
      - assets:/home/frappe/frappe-bench/sites/assets

  frontend:
    image: frappe/erpnext:version-15
    pull_policy: missing
    volumes:
      - sites:/home/frappe/frappe-bench/sites
      - assets:/home/frappe/frappe-bench/sites/assets

  websocket:
    volumes:
      - sites:/home/frappe/frappe-bench/sites
      - assets:/home/frappe/frappe-bench/sites/assets

  queue-short:
    volumes:
      - sites:/home/frappe/frappe-bench/sites
      - assets:/home/frappe/frappe-bench/sites/assets

  queue-long:
    volumes:
      - sites:/home/frappe/frappe-bench/sites
      - assets:/home/frappe/frappe-bench/sites/assets

  scheduler:
    volumes:
      - sites:/home/frappe/frappe-bench/sites
      - assets:/home/frappe/frappe-bench/sites/assets

volumes:
  assets:
```

---

## Bước 4: Cấu hình hosts file

**Windows** — Mở Notepad **với quyền Administrator**, mở file:
```
C:\Windows\System32\drivers\etc\hosts
```
Thêm dòng:
```
127.0.0.1   ury.local
```

**Linux/macOS:**
```bash
echo "127.0.0.1   ury.local" | sudo tee -a /etc/hosts
```

---

## Bước 5: Khởi chạy stack

**Linux/macOS:**
```bash
docker compose \
  -f compose.yaml \
  -f overrides/compose.mariadb.yaml \
  -f overrides/compose.redis.yaml \
  -f overrides/compose.noproxy.yaml \
  -f overrides/compose.frontend-override.yaml \
  --env-file .env \
  up -d
```

**Windows (PowerShell):**
```powershell
docker compose `
  -f compose.yaml `
  -f overrides/compose.mariadb.yaml `
  -f overrides/compose.redis.yaml `
  -f overrides/compose.noproxy.yaml `
  -f overrides/compose.frontend-override.yaml `
  --env-file .env `
  up -d
```

Kiểm tra trạng thái — tất cả phải `Up`:
```bash
docker ps
```

Kết quả mong đợi (9 services):
```
frappe_docker-backend-1     ury-custom:latest         Up
frappe_docker-frontend-1    frappe/erpnext:v15        Up (0.0.0.0:8080->8080/tcp)
frappe_docker-websocket-1   ury-custom:latest         Up
frappe_docker-queue-short-1 ury-custom:latest         Up
frappe_docker-queue-long-1  ury-custom:latest         Up
frappe_docker-scheduler-1   ury-custom:latest         Up
frappe_docker-db-1          mariadb:11.8              Up (healthy)
frappe_docker-redis-cache-1 redis:6.2-alpine          Up
frappe_docker-redis-queue-1 redis:6.2-alpine          Up
```

---

## Bước 6: Tạo site và cài ứng dụng

```bash
# Tạo site (thay your_strong_password bằng DB_PASSWORD trong .env)
docker compose exec backend bench new-site ury.local \
  --db-root-password your_strong_password \
  --admin-password your_strong_password \
  --no-mariadb-socket

# Cài ERPNext (~5 phút)
docker compose exec backend bench --site ury.local install-app erpnext

# Cài HRMS (~3 phút)
docker compose exec backend bench --site ury.local install-app hrms

# Cài URY (~2 phút)
docker compose exec backend bench --site ury.local install-app ury

# Migrate database
docker compose exec backend bench --site ury.local migrate

# Bật scheduler
docker compose exec backend bench --site ury.local enable-scheduler
```

---

## Bước 7: Fix assets

> **Vấn đề**: `bench build` tạo symlinks trong `sites/assets/` trỏ tới `apps/*/public`.
> Frontend container không có thư mục `apps/` nên symlinks bị broken → 404 CSS/JS.
>
> **Giải pháp**: Copy file thực sự (dereference symlinks) vào named volume `assets`.

```bash
# Thay 'frappe_docker' bằng tên thư mục của bạn
PROJECT=frappe_docker

docker exec ${PROJECT}-backend-1 sh -c \
  "cp -rL /home/frappe/frappe-bench/apps/ury/ury/public \
    /home/frappe/frappe-bench/sites/assets/ury"

docker exec ${PROJECT}-backend-1 sh -c \
  "cp -rL /home/frappe/frappe-bench/apps/frappe/frappe/public \
    /home/frappe/frappe-bench/sites/assets/frappe"

docker exec ${PROJECT}-backend-1 sh -c \
  "cp -rL /home/frappe/frappe-bench/apps/erpnext/erpnext/public \
    /home/frappe/frappe-bench/sites/assets/erpnext"

docker exec ${PROJECT}-backend-1 sh -c \
  "cp -rL /home/frappe/frappe-bench/apps/hrms/hrms/public \
    /home/frappe/frappe-bench/sites/assets/hrms"
```

Xác nhận thành công:
```bash
docker exec ${PROJECT}-frontend-1 ls /home/frappe/frappe-bench/sites/assets/
# Phải thấy: frappe  erpnext  hrms  ury  ...
```

> Bước này chỉ cần làm **một lần**. Data được lưu trong named volume `assets`.

---

## Bước 8: Setup dữ liệu ban đầu

Truy cập `http://ury.local:8080`, đăng nhập `Administrator` / `your_strong_password`.

### 8.1 Hoàn thành Setup Wizard

Làm theo wizard: chọn ngôn ngữ → quốc gia/timezone/tiền tệ → tên công ty → hoàn tất.

### 8.2 Tạo User POS

> **Bắt buộc**: `Administrator` **không thể** dùng URY POS do logic code `getBranch()` bỏ qua Administrator. Phải tạo user riêng.

**ERPNext Desk** → tìm **User** → **New**:
- **Email**: `cashier@ury.local` (hoặc tên tùy ý)
- **First Name**: `Cashier`
- **New Password**: (đặt mật khẩu)
- **Roles**: Thêm `URY Cashier` + `System Manager`
- Lưu

### 8.3 Tạo Branch

**ERPNext Desk** → tìm **Branch** → **New**:
- **Branch Name**: `Main Branch`
- Bảng **Users**: Thêm `cashier@ury.local`
- Lưu

### 8.4 Cấp quyền Read cho URY Cashier trên POS Profile

**ERPNext Desk** → tìm **DocType** → mở `POS Profile` → tab **Permissions** → Add row:
- **Role**: `URY Cashier`
- **Read**: ✓
- Lưu

### 8.5 Tạo POS Profile

**ERPNext Desk** → tìm **POS Profile** → **New**:
- **Name**: `URY POS`
- **Company**: (chọn công ty vừa tạo)
- **Warehouse**: (chọn kho, ví dụ `Finished Goods`)
- **Branch**: `Main Branch`
- **Mode of Payment**: Thêm row → chọn `Cash` → bật **Default** ✓
- **Write Off Account**: (chọn tài khoản chi phí, ví dụ `Administrative Expenses`)
- **Applicable for Users**: Thêm `cashier@ury.local` → bật **Default** ✓
- Lưu

### 8.6 Tạo URY Restaurant

**ERPNext Desk** → tìm **URY Restaurant** → **New**:
- **Name**: `Main Restaurant`
- **Company**: (chọn công ty)
- **Branch**: `Main Branch`
- **Invoice Series Prefix**: `INV-`
- Lưu

### 8.7 Tạo URY Room

**ERPNext Desk** → tìm **URY Room** → **New**:
- **Name**: `Main Room`
- **Branch**: `Main Branch`
- Lưu

Quay lại **URY Restaurant** → **Default Room** → chọn `Main Room` → Lưu.

### 8.8 Tạo URY Table

**ERPNext Desk** → tìm **URY Table** → **New**:
- **Name**: `Table 1`
- **Restaurant**: `Main Restaurant`
- **Restaurant Room**: `Main Room`
- **No of Seats**: `4`
- **Layout X**: `10`, **Layout Y**: `10`
- **Layout Width**: `100`, **Layout Height**: `100`
- Lưu

### 8.9 Thêm User Permission

**ERPNext Desk** → tìm **User Permission** → tạo 2 permission:

| User | Allow | For Value | Apply to All |
|------|-------|-----------|--------------|
| `cashier@ury.local` | `POS Profile` | `URY POS` | ✓ |
| `cashier@ury.local` | `Branch` | `Main Branch` | ✓ |

---

## Bước 9: Tạo POS Opening và sử dụng

### 9.1 Tạo POS Opening Entry

> POS Opening Entry phải được Submit trước khi cashier có thể dùng POS.

**ERPNext Desk** → tìm **POS Opening Entry** → **New**:
- **POS Profile**: `URY POS`
- **User**: `cashier@ury.local`
- **Period Start Date**: hôm nay
- Bảng **Rooms**: Thêm row → chọn `Main Room` (**bắt buộc**)
- Bảng **Balance Details**: Thêm row → `Cash` → Opening Amount = `0`
- Click **Submit**

### 9.2 Truy cập URY POS

Đăng xuất Administrator → đăng nhập với `cashier@ury.local` → truy cập:

```
http://ury.local:8080/urypos
```

Kết quả: **Table 1** hiển thị với badge **Free** và nút **Open Table**.

### 9.3 Các URL

| Module | URL | Ghi chú |
|--------|-----|----------|
| ERPNext Desk | `http://ury.local:8080/app` | Admin, cấu hình |
| **URY POS** | **`http://ury.local:8080/urypos`** | ✅ Dùng cái này |
| URY KDS (Kitchen) | `http://ury.local:8080/URYMosaic/<Tên Production Unit>` | Kitchen Display |
| ~~ERPNext POS~~ | ~~`http://ury.local:8080/pos`~~ | ❌ Không dùng — không phải URY POS |

---

## Khởi động lại sau khi tắt máy

```bash
cd /path/to/frappe_docker

# Linux/macOS
docker compose \
  -f compose.yaml \
  -f overrides/compose.mariadb.yaml \
  -f overrides/compose.redis.yaml \
  -f overrides/compose.noproxy.yaml \
  -f overrides/compose.frontend-override.yaml \
  --env-file .env \
  up -d
```

```powershell
# Windows PowerShell
docker compose `
  -f compose.yaml `
  -f overrides/compose.mariadb.yaml `
  -f overrides/compose.redis.yaml `
  -f overrides/compose.noproxy.yaml `
  -f overrides/compose.frontend-override.yaml `
  --env-file .env `
  up -d
```

> Không cần làm lại bước 6, 7, 8. Dữ liệu được lưu trong Docker volumes.

---

## Xử lý lỗi phổ biến

### "POS Profile not found" (HTTP 417)

**Nguyên nhân**: Đang login bằng `Administrator`.
Hàm `getBranch()` trong URY **bỏ qua** Administrator và trả về `None`.

**Fix**: Đăng xuất → login với user có role `URY Cashier`.

---

### "User is not Associated with any Branch"

**Nguyên nhân**: User chưa có trong bảng Users của Branch.

**Fix**: ERPNext Desk → **Branch** → mở `Main Branch` → bảng **Users** → thêm user → Lưu.

---

### "403 Forbidden" khi lấy POS Profile

**Nguyên nhân**: Role `URY Cashier` thiếu Read permission trên DocType `POS Profile`.

**Fix**: ERPNext Desk → **DocType** → `POS Profile` → tab **Permissions** → thêm row Role `URY Cashier` với Read = ✓.

---

### "Please Open POS Entry"

**Nguyên nhân**: Chưa có POS Opening Entry ở trạng thái Submitted + Open.

**Fix**: Tạo POS Opening Entry (xem Bước 9.1), nhớ click **Submit**.

---

### Tables không hiển thị (chỉ thấy "Tables not found")

**Nguyên nhân**: POS Opening Entry không có Room trong bảng `Rooms` (custom_rooms).

**Fix**:
1. ERPNext Desk → **POS Opening Entry** → hủy (Cancel) entry hiện tại
2. Tạo mới, thêm `Main Room` vào bảng **Rooms**
3. Submit

---

### CSS/JS không load (404 trên assets)

**Nguyên nhân**: Symlinks trong `sites/assets/` bị broken do frontend container thiếu thư mục `apps/`.

**Fix**: Chạy lại Bước 7 để copy assets thực sự, sau đó:
```bash
docker restart ${PROJECT}-frontend-1
```

---

### "nginx-entrypoint.sh not found" hoặc frontend crash

**Nguyên nhân**: Custom image không có nginx (chỉ có backend Python).

**Fix**: Đảm bảo file `overrides/compose.frontend-override.yaml` đã được thêm vào lệnh `docker compose` và service `frontend` dùng image `frappe/erpnext:version-15`.

---

## Cấu trúc thư mục

```
frappe_docker/
├── apps.json                           # Danh sách app cần build vào image
├── .env                                # Biến môi trường
├── compose.yaml                        # Docker Compose chính
├── images/
│   └── custom/
│       └── Containerfile               # Dockerfile build custom image
├── overrides/
│   ├── compose.mariadb.yaml            # MariaDB service
│   ├── compose.redis.yaml              # Redis service
│   ├── compose.noproxy.yaml            # Không dùng Traefik
│   └── compose.frontend-override.yaml  # Fix nginx + assets volume
└── URY_INSTALL_GUIDE.md                # File này
```

---

## Tóm tắt thông tin đăng nhập

| Mục | Giá trị |
|-----|---------|
| URL | `http://ury.local:8080` |
| ERPNext Admin | `Administrator` / `<DB_PASSWORD>` |
| URY POS Login | `cashier@ury.local` / `<password_đã_đặt>` |

---

*Tài liệu dựa trên cài đặt thực tế. Phiên bản: ERPNext v15 + URY branch `develop`.*
