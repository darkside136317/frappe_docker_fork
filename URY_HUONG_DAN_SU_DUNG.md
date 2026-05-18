# Hướng dẫn sử dụng URY Restaurant POS

> Tài liệu dành cho **thu ngân**, **quản lý ca** và **quản lý nhà hàng** sau khi hệ thống đã được cài đặt.  
> Cài đặt kỹ thuật: xem [`URY_INSTALL_GUIDE.md`](URY_INSTALL_GUIDE.md).  
> Phân tích quy trình & báo cáo: xem [`URY_WORKFLOW_VA_BAO_CAO_DOANH_THU.md`](URY_WORKFLOW_VA_BAO_CAO_DOANH_THU.md).

---

## Mục lục

1. [Giới thiệu](#1-giới-thiệu)
2. [Đăng nhập & truy cập](#2-đăng-nhập--truy-cập)
3. [Giao diện POS](#3-giao-diện-pos)
4. [Chuẩn bị trước khi bán](#4-chuẩn-bị-trước-khi-bán)
5. [Bán hàng — Ăn tại chỗ (Dine In)](#5-bán-hàng--ăn-tại-chỗ-dine-in)
6. [Bán hàng — Mang đi / Giao hàng / Điện thoại](#6-bán-hàng--mang-đi--giao-hàng--điện-thoại)
7. [Bán hàng — Aggregator](#7-bán-hàng--aggregator)
8. [Quản lý đơn hàng](#8-quản-lý-đơn-hàng)
9. [Thanh toán](#9-thanh-toán)
10. [In hóa đơn](#10-in-hóa-đơn)
11. [Hủy đơn & sửa đơn](#11-hủy-đơn--sửa-đơn)
12. [Đóng ca](#12-đóng-ca)
13. [Xem báo cáo doanh thu (Quản lý)](#13-xem-báo-cáo-doanh-thu-quản-lý)
14. [Kitchen Display (Bếp)](#14-kitchen-display-bếp)
15. [Xử lý sự cố thường gặp](#15-xử-lý-sự-cố-thường-gặp)
16. [Phím tắt & mẹo nhanh](#16-phím-tắt--mẹo-nhanh)

---

## 1. Giới thiệu

**URY POS** là phần mềm bán hàng tại quầy cho nhà hàng, tích hợp:

- Ghi đơn, in tạm tính, thu tiền
- Quản lý bàn theo phòng (room)
- Gửi lệnh bếp (KOT) — nếu đã cấu hình
- Báo cáo doanh thu trên ERPNext Desk

**Hai giao diện POS** (cùng dữ liệu backend):

| Giao diện | URL | Ghi chú |
|-----------|-----|---------|
| **React POS** (khuyến nghị) | `http://<site>/pos` | Giao diện mới trong fork này |
| **Vue POS** (urypos) | `http://<site>/urypos` | Giao diện trong hướng dẫn cài đặt gốc |

> **Không dùng** URL `/pos` của ERPNext Standard POS — đó là ứng dụng khác, sẽ báo lỗi quyền.

---

## 2. Đăng nhập & truy cập

### 2.1 Tài khoản

| Vai trò | Dùng cho |
|---------|----------|
| **URY Cashier** | Bán hàng hàng ngày trên POS |
| **URY Manager** / **System Manager** | Desk: mở/đóng ca, báo cáo, cấu hình |

**Quan trọng:**

- **Không dùng** tài khoản `Administrator` để bán trên POS — hệ thống không nhận diện chi nhánh.
- Mỗi thu ngân phải được gắn **Branch** trong bảng **URY User** (trên Desk).

### 2.2 Đăng nhập POS

1. Mở trình duyệt (Chrome khuyến nghị).
2. Truy cập `http://<site>/pos` (hoặc `/urypos`).
3. Nếu chưa đăng nhập → chuyển sang trang login Frappe.
4. Nhập email và mật khẩu thu ngân → đăng nhập.
5. Hệ thống kiểm tra quyền **POS Profile** → vào màn hình POS.

### 2.3 Màn hình chặn khi chưa mở ca

Nếu thấy thông báo **POS chưa mở** hoặc **ca hôm trước chưa đóng**:

1. Bấm **Chuyển sang Desk** → mở tab ERPNext.
2. Tạo **POS Opening Entry** (mục 4) hoặc đóng ca cũ.
3. Quay lại POS → bấm **Tải lại trang**.

---

## 3. Giao diện POS

Sau khi đăng nhập thành công, thanh điều hướng dưới cùng có **3 tab**:

| Tab | Biểu tượng | Chức năng |
|-----|------------|-----------|
| **POS** | Lưới | Chọn món, giỏ hàng, lưu đơn |
| **Bàn** | Bàn | Sơ đồ bàn theo phòng — dine-in |
| **Đơn hàng** | Danh sách | Xem / in / thanh toán / hủy đơn |

**Thanh trên (Header):**

- Ô tìm kiếm (menu hoặc đơn hàng tùy tab).
- Menu user: đăng xuất, làm mới.
- Phím tắt tìm kiếm: **Ctrl+K** (hoặc **Cmd+K** trên Mac).

**Panel bên phải (màn POS):** Giỏ hàng, khách hàng, loại đơn, nút **Lưu đơn**.

---

## 4. Chuẩn bị trước khi bán

> Thao tác này thường do **quản lý** thực hiện trên **ERPNext Desk** (`/app`), không làm trên POS.

### 4.1 Mở ca — POS Opening Entry

**Bắt buộc** trước khi thu ngân bán được.

1. Desk → tìm **POS Opening Entry** → **New**.
2. Điền:
   - **POS Profile**: profile của nhà hàng (vd: `URY POS`)
   - **User**: thu ngân đang làm ca
   - **Period Start Date**: ngày hôm nay
3. Bảng **Rooms**: thêm **ít nhất một phòng** (vd: `Main Room`) — **bắt buộc**, nếu thiếu sẽ không thấy bàn.
4. Bảng **Balance Details**: nhập số tiền đầu ca (vd: Cash = 0).
5. **Save** → **Submit**.

### 4.2 Kiểm tra nhanh

| Hạng mục | Cách kiểm tra |
|----------|----------------|
| Ca đã mở | POS không hiện dialog "chưa mở ca" |
| Có bàn | Tab **Bàn** hiện danh sách phòng & bàn |
| Có menu | Tab **POS** hiện món ăn |
| Máy in | In thử một đơn nháp (mục 10) |

---

## 5. Bán hàng — Ăn tại chỗ (Dine In)

Đây là quy trình **chuẩn nhà hàng có bàn**. Thứ tự bắt buộc: **Ghi đơn → Lưu → (thêm món nếu cần) → In → Thu tiền**.

### 5.1 Mở bàn mới

1. Vào tab **Bàn**.
2. Chọn **phòng** (room) ở phía trên.
3. Tìm bàn **Trống** (màu xanh) → **chạm / click** vào bàn.
4. Hệ thống chuyển sang tab **POS** với loại đơn **Dine In** và bàn đã chọn.

### 5.2 Ghi món & lưu đơn

1. Chọn **khách hàng** (bắt buộc).
2. Chạm món trên menu để thêm vào giỏ:
   - **Một lần chạm**: thêm 1 phần.
   - **Hai lần chạm**: mở hộp thoại tùy chọn (biến thể, addon, ghi chú món).
3. Chỉnh số lượng (+ / −) hoặc xóa món trong giỏ.
4. (Tùy chọn) Thêm **ghi chú đơn**.
5. Bấm **Lưu đơn** (Submit order).

**Kết quả:**

- Đơn được lưu dưới dạng **nháp** (Draft).
- Bàn chuyển sang **Đang dùng** (màu vàng) trên sơ đồ bàn.
- Bếp có thể nhận KOT (nếu đã cấu hình).

### 5.3 Thêm món cho bàn đang dùng

**Cách 1 — Từ sơ đồ bàn:**

1. Tab **Bàn** → bàn **Đang dùng** → **Preview** (biểu tượng mắt).
2. Thêm món → **Lưu đơn** lại.

**Cách 2 — Từ danh sách đơn:**

1. Tab **Đơn hàng** → lọc **Draft** hoặc **Unbilled**.
2. Chọn đơn → **Sửa** (biểu tượng bút) → thêm món → **Lưu đơn**.

### 5.4 In tạm tính (trước khi thu tiền)

**Bắt buộc** với đơn có bàn trước khi thanh toán.

**Cách 1 — Từ tab Đơn hàng (khuyến nghị):**

1. Tab **Đơn hàng** → **Unbilled** (đơn đã lưu, chưa in).
2. Chọn đơn → bấm **In** (biểu tượng máy in).
3. Chờ máy in xong.

**Cách 2 — Từ sơ đồ bàn:**

1. Tab **Bàn** → bàn đang dùng → **Print**.

**Sau khi in:**

- Bàn chuyển về **Trống** (khách có thể rời bàn).
- Đơn chuyển sang trạng thái có thể **thanh toán** (Draft đã in).
- Nút **Thanh toán** được bật.

### 5.5 Thu tiền

Xem [mục 9 — Thanh toán](#9-thanh-toán).

### 5.6 Sơ đồ quy trình Dine In

```
Mở bàn → Chọn món → Lưu đơn → [Thêm món] → In tạm tính → Thanh toán → Xong
```

---

## 6. Bán hàng — Mang đi / Giao hàng / Điện thoại

Không cần chọn bàn.

1. Tab **POS**.
2. Chọn loại đơn: **Take Away**, **Delivery** hoặc **Phone In**.
3. Chọn **khách hàng**.
4. Thêm món → **Lưu đơn**.
5. Tab **Đơn hàng** → chọn đơn **Draft**.
6. **In** (nếu quy trình nhà hàng yêu cầu in trước).
7. **Thanh toán**.

> Một số cấu hình vẫn yêu cầu in trước submit — nếu không in được, hỏi quản lý về cấu hình POS Profile.

---

## 7. Bán hàng — Aggregator

Dùng cho đơn từ app giao đồ ăn (Grab, ShopeeFood, …) khi đã cấu hình trên Desk.

1. Tab **POS** → loại đơn **Aggregators**.
2. Chọn **Aggregator** (khách hàng platform).
3. Thêm món từ menu aggregator (giá có thể khác menu trong nhà).
4. **Lưu đơn** → **In** → **Thanh toán** (hoặc xử lý theo quy trình công nợ nếu branch bật `custom_make_unpaid`).

---

## 8. Quản lý đơn hàng

Tab **Đơn hàng** là trung tâm theo dõi mọi đơn trong ca.

### 8.1 Các trạng thái

| Trạng thái | Ý nghĩa | Thao tác thường dùng |
|------------|---------|----------------------|
| **Draft** | Đơn nháp (đã lưu; dine-in có thể đã in) | Sửa, In, Thanh toán, Hủy |
| **Unbilled** | Đơn có bàn, **chưa in** | Sửa, **In**, Hủy |
| **Recently Paid** | Vừa thanh toán (trong giới hạn `paid_limit`) | Xem, Hủy (nếu cho phép) |
| **Paid** | Đã thu tiền | Xem (khi bật `view_all_status`) |
| **Consolidated** | Đã hợp nhất kế toán | Xem |
| **Return** | Hoàn trả | Xem |

### 8.2 Tìm đơn

- Dùng ô tìm kiếm trên header: mã hóa đơn, tên khách, số điện thoại.
- Chọn trạng thái ở **cột trái**.
- Dùng **Trang trước / Trang sau** nếu danh sách dài.

### 8.3 Xem chi tiết đơn

1. Chạm vào thẻ đơn ở giữa màn hình.
2. Panel bên phải hiện: khách, bàn, waiter, danh sách món, thuế, tổng tiền.

### 8.4 Thanh thao tác (panel phải)

| Nút | Khi nào dùng |
|-----|----------------|
| **In** | In tạm tính hoặc in lại |
| **Thanh toán** | Chỉ khi đã in (`invoice_printed = 1`) với dine-in |
| **Sửa** | Draft / Unbilled / Recently Paid |
| **Hủy** | Draft / Unbilled / Recently Paid — bắt buộc nhập lý do |

---

## 9. Thanh toán

### 9.1 Điều kiện

- Đơn ở trạng thái **Draft**, **Unbilled** hoặc **Recently Paid**.
- Với **dine-in có bàn**: phải **in trước** — nếu chưa in, hệ thống báo *"Please print first"*.

### 9.2 Các bước

1. Tab **Đơn hàng** → chọn đơn → **Thanh toán**.
2. Hộp thoại thanh toán hiện ra:
   - Xem **tổng tiền**, thuế, làm tròn.
   - (Tùy chọn) Nhập **chiết khấu %** → **Áp dụng**.
   - Nhập số tiền theo **hình thức thanh toán** (Cash, Card, …).
   - Hỗ trợ **chia bill**: nhập nhiều hình thức, tổng phải khớp số cần thu.
3. Bấm xác nhận thanh toán.
4. Hệ thống submit hóa đơn → trạng thái **Paid** → trừ kho.

**Mặc định:** Nếu chỉ có **Cash**, hệ thống tự điền đủ số tiền.

### 9.3 Sau thanh toán

- Đơn chuyển sang **Recently Paid** hoặc **Paid**.
- Có thể in biên lai thanh toán (tùy cấu hình máy in).
- Doanh thu được ghi nhận vào **POS Invoice** trên hệ thống.

---

## 10. In hóa đơn

Hệ thống hỗ trợ nhiều kiểu in (cấu hình trên **POS Profile**):

| Kiểu | Mô tả |
|------|--------|
| **QZ Tray** | In qua phần mềm QZ trên máy tính |
| **Network** | In qua máy in mạng / CUPS |
| **Socket / Browser** | Mở cửa sổ in trình duyệt |

### 10.1 In từ POS

- Tab **Đơn hàng** → chọn đơn → nút **In**.
- Tab **Bàn** → bàn đang dùng → **Print**.

### 10.2 Lỗi in thường gặp

| Triệu chứng | Gợi ý xử lý |
|-------------|-------------|
| Không in được | Kiểm tra máy in bật, QZ Tray chạy (nếu dùng QZ) |
| In trắng | Kiểm tra **Print Format** trên POS Profile |
| Không thanh toán được sau in | Tải lại trang; kiểm tra đơn đã chuyển khỏi Unbilled |

---

## 11. Hủy đơn & sửa đơn

### 11.1 Sửa đơn

1. Tab **Đơn hàng** → Draft / Unbilled.
2. Chọn đơn → **Sửa** (bút chì).
3. Thêm / bớt món trên tab **POS**.
4. **Lưu đơn** lại.

**Lưu ý:** Sau khi **đã in**, một số cấu hình **không cho** xóa món hoặc giảm số lượng — hệ thống báo lỗi bảo vệ.

### 11.2 Hủy đơn

1. Chọn đơn → **Hủy** (dấu X).
2. **Bắt buộc** nhập lý do hủy.
3. Xác nhận.

| Trạng thái đơn | Hệ quả |
|----------------|--------|
| Nháp (Draft) | Hủy → nhả bàn (nếu có) |
| Đã thanh toán (Paid) | Hủy theo quy trình ERPNext (hoàn tiền / điều chỉnh kho tùy cấu hình) |

### 11.3 Đồng thời hai thu ngân

Nếu hai người sửa cùng một đơn, hệ thống có thể báo **dữ liệu đã thay đổi** → bấm tải lại và kiểm tra lại giỏ hàng.

---

## 12. Đóng ca

> Thực hiện trên **ERPNext Desk**, thường cuối ca.

### 12.1 Đóng ca thu ngân

1. Desk → **POS Closing Entry** → **New**.
2. Chọn **POS Profile** và **POS Opening Entry** tương ứng ca đang mở.
3. Hệ thống liệt kê hóa đơn và số tiền theo hình thức thanh toán.
4. Đếm tiền thực tế → nhập **Closing Amount** từng loại.
5. **Save** → **Submit**.

### 12.2 Multi-cashier (nhiều thu ngân)

- **Sub-cashier** đóng **Sub POS Closing** trước.
- **Main cashier** đóng **POS Closing Entry** sau.

### 12.3 Đóng ca bắt buộc mỗi ngày

Nếu POS Profile bật **Daily POS Close**, sang ngày mới POS sẽ **chặn** cho đến khi ca hôm trước được đóng → làm đóng ca trên Desk rồi tải lại POS.

---

## 13. Xem báo cáo doanh thu (Quản lý)

> Thu ngân **không** xem báo cáo tổng ngày trên POS. Dùng **Desk** với role **URY Manager** hoặc **System Manager**.

### 13.1 Báo cáo doanh thu & lợi nhuận ngày

**URY Daily P and L**

1. Đăng nhập Desk: `http://<site>/app`
2. Tìm **URY Daily P and L**
3. **New** → chọn **Branch**, **Date**
4. Nhập chỉ số điện (Opening / Closing) → **Save** → **Submit**
5. Xem **Gross Sales**, **Net Sales**, **COGS**, **Net Profit**, …

**Điều kiện:** Đã có **URY Report Settings** cho branch; các đơn **Paid** trong ngày kinh doanh.

### 13.2 Tra cứu từng hóa đơn

Desk → **POS Invoice** → lọc **Status = Paid**, **Branch**, **Posting Date**.

### 13.3 Đối soát theo ca

Desk → **POS Closing Entry** → mở bản ghi ca đã đóng.

### 13.4 Xem nhanh trên POS (không phải báo cáo tổng)

Tab **Đơn hàng** → **Recently Paid** / **Paid**: xem từng đơn và số tiền, **không** có tổng doanh thu ngày.

---

## 14. Kitchen Display (Bếp)

Dành cho nhân viên bếp xem lệnh nấu.

| Mục | Giá trị |
|-----|---------|
| URL | `http://<site>/URYMosaic/<Tên Production Unit>` |
| Nguồn dữ liệu | **URY KOT** sinh khi lưu đơn trên POS |

Cấu hình Production Unit và máy in KOT: trên Desk (quản lý).

---

## 15. Xử lý sự cố thường gặp

| Vấn đề | Nguyên nhân | Cách xử lý |
|--------|-------------|------------|
| **Access Denied** trên POS | User không có role billing | Thêm role vào POS Profile → `role_allowed_for_billing` |
| **POS Profile not found** | Dùng Administrator hoặc chưa gắn Branch | Đăng nhập user cashier; kiểm tra **URY User** trên Branch |
| **POS chưa mở** | Chưa Submit Opening Entry | Tạo **POS Opening Entry** + chọn **Rooms** |
| Không thấy bàn | Opening thiếu Room | Sửa Opening Entry, thêm đúng phòng |
| **Hết hàng** khi lưu đơn | Tồn kho không đủ | Giảm số lượng hoặc nhập kho trên Desk |
| **Please print first** | Dine-in chưa in | In đơn trước khi bấm Thanh toán |
| Không thanh toán được | Chưa in / đơn đã Paid | Kiểm tra trạng thái tab Đơn hàng |
| Báo cáo doanh thu = 0 | Chưa Submit Daily P&L / chưa có đơn Paid | Submit đơn; tạo Daily P&L đúng ngày |
| Số báo cáo lệch giờ | **URY Report Settings** `hours` | Cấu hình lại giờ bắt đầu ngày kinh doanh |

---

## 16. Phím tắt & mẹo nhanh

| Thao tác | Cách làm |
|----------|----------|
| Tìm kiếm nhanh | **Ctrl+K** / **Cmd+K** |
| Thêm món nhanh | Một lần chạm trên menu |
| Tùy chọn món | Hai lần chạm trên menu |
| Làm mới sơ đồ bàn | Chạm lại tab phòng hoặc đổi phòng rồi quay lại |
| Xem sơ đồ layout | Tab **Bàn** → **Layout View** |

---

## Phụ lục — Ai làm gì?

| Công việc | Người thực hiện | Ở đâu |
|-----------|-----------------|-------|
| Mở / đóng ca | Quản lý / thu ngân ca chính | Desk |
| Bán hàng, in, thu tiền | Thu ngân | `/pos` hoặc `/urypos` |
| Báo cáo doanh thu ngày | Quản lý | Desk → URY Daily P and L |
| Cấu hình menu, bàn, giá | Quản lý | Desk |
| Xem KOT | Bếp | `/URYMosaic/...` |

---

## Tài liệu liên quan

| File | Nội dung |
|------|----------|
| [`URY_INSTALL_GUIDE.md`](URY_INSTALL_GUIDE.md) | Cài đặt Docker, site, master data |
| [`URY_WORKFLOW_VA_BAO_CAO_DOANH_THU.md`](URY_WORKFLOW_VA_BAO_CAO_DOANH_THU.md) | Phân tích quy trình & báo cáo kỹ thuật |
| [`SALES_LOGIC_QA_CHECKLIST.md`](SALES_LOGIC_QA_CHECKLIST.md) | Checklist kiểm thử luồng bán |

---

*Phiên bản tài liệu: theo React POS (`/pos`) và backend URY trong repo `frappe_docker_fork`.*
