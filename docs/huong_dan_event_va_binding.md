# Hướng Dẫn Sử Dụng Event, Action & Data Binding trong Website Builder

Hệ thống **Event & State Engine** giúp các component tương tác với nhau thông qua **Global State**, **Event Engine**, **Action Engine**, và **Data Binding** mà không cần gọi trực tiếp hàm của nhau. Dưới đây là hướng dẫn chi tiết cách cấu hình và sử dụng.

---

## 1. Quản Lý Page State (Global State)

Trước khi liên kết dữ liệu hoặc cấu hình sự kiện, bạn cần khai báo các biến trạng thái trên trang.

### Cách Khai Báo Biến:
1. Tại sidebar bên phải, chọn tab **State** (biểu tượng Cơ sở dữ liệu).
2. Click vào nút **New Var** (hoặc **Create State Variable**).
3. Nhập các thông tin:
   * **Variable Key Path**: Đường dẫn của biến (ví dụ: `currentUser`, `form.login.email`, `modal.login.open`).
   * **Data Type**: Loại dữ liệu (`String`, `Number`, `Boolean`, `Object`, `Array`).
   * **Default Initial Value**: Giá trị khởi tạo mặc định (Đối với Object/Array thì nhập JSON hợp lệ, Boolean nhập `true` hoặc `false`).
4. Click **Save Variable** để lưu.

> [!NOTE]
> Hệ thống hỗ trợ đường dẫn phân cấp (ví dụ: `form.login.email` sẽ tự động tạo cấu trúc đối tượng lồng nhau `{ form: { login: { email: "" } } }`).

---

## 2. Liên Kết Dữ Liệu (Data Binding)

Data Binding cho phép các thuộc tính của component (như `text` của Button, `value` của Input, `checked` của Switch) tự động cập nhật khi Global State thay đổi.

### Cách Cấu Hình Binding:
1. Click chọn một component trên Preview hoặc Component Tree.
2. Tại sidebar bên phải, chọn tab **Bindings** (biểu tượng mắt xích liên kết).
3. Click **New Binding** và chọn:
   * **Target Attribute**: Thuộc tính của component muốn liên kết (ví dụ: `text`, `value`, `placeholder`, `disabled`).
   * **Global State Path**: Đường dẫn biến trong Global State (ví dụ: `currentUser.name` hoặc `state.currentUser.name`).
   * **Value Transform (Tùy chọn)**: Các hàm biến đổi giá trị (như Phủ định Boolean `!value`, Chuyển sang String, Chuyển sang Number, v.v.).
4. Click **Apply Binding**.

### Khả Năng Đồng Bộ Hai Chiều (Two-Way Binding) của Form Components:
Đối với các **Form Components** (như `Text Input`, `Switch`, `Checkbox`, `Select`, v.v.):
* Khi bạn bind thuộc tính `value` hoặc `checked` tới một biến state (ví dụ: `form.login.email`):
* **Hệ thống tự động thực hiện ghi ngược lại dữ liệu khi người dùng nhập liệu.** Bạn **không** cần phải tạo thêm Event handler `onChange` để gọi `Set State` thủ công.
* Khi người dùng nhập text hoặc bật/tắt switch, Global State sẽ được cập nhật tự động và mọi component khác liên kết tới biến đó sẽ lập tức thay đổi UI.

---

## 3. Hệ Thống Sự Kiện & Hành Động (Event & Action Engine)

Event Engine cho phép cấu hình các phản ứng khi người dùng tương tác với component (như Click, Change, Focus, Blur).

### Cách Cấu HÌnh Event:
1. Click chọn component cần cấu hình.
2. Tại sidebar bên phải, chọn tab **Events** (biểu tượng Tia sét).
3. Tìm sự kiện muốn cấu hình (ví dụ: `onClick` trên Button, `onChange` trên Input) và click **Add Action** (hoặc nút Plus).
4. Chọn loại **Action Type** và điền tham số tương ứng.

### Sử Dụng Placeholder Động (Dynamic Expressions):
Hệ thống hỗ trợ cú pháp `{{expression}}` trong các tham số của Action để tham chiếu giá trị động:

1. **Lấy giá trị của sự kiện vừa kích hoạt:**
   * Sử dụng `{{value}}` hoặc `{{event}}` hoặc `{{eventValue}}`.
   * Ví dụ: Trong sự kiện `onChange` của TextInput, nếu bạn muốn gán giá trị người dùng vừa gõ vào một biến state khác, cấu hình Action `Set State` với:
     * **State Path**: `searchKeyword`
     * **Value**: `{{value}}`

2. **Lấy giá trị từ Global State:**
   * Sử dụng `{{state.path}}` hoặc `{{path}}`.
   * Ví dụ: Trong Action `Show Toast`, bạn muốn hiển thị câu chào cá nhân hóa:
     * **Message**: `Chào mừng {{state.currentUser.name}} quay trở lại!`

3. **Tự Động Chuẩn Hóa Đường Dẫn (Path Normalization):**
   * Bạn có thể viết đường dẫn state có hoặc không có tiền tố `state.` (ví dụ: `state.counter` hay `counter` đều hoạt động chính xác). Hệ thống sẽ tự động chuẩn hóa và xử lý.

---

## 4. Các Loại Action Phổ Biến

| Tên Action | Danh mục | Công dụng | Ví dụ tham số |
| :--- | :--- | :--- | :--- |
| **Set State** | State | Thiết lập giá trị cho một đường dẫn state | Path: `counter` <br> Value: `{{state.counter}} + 1` hoặc `10` |
| **Toggle State** | State | Đảo ngược giá trị Boolean của state | Path: `modal.login.open` |
| **Reset State** | State | Đưa state về giá trị mặc định trong schema | Path: `form.login` |
| **Run Condition** | Flow | Rẽ nhánh logic (If/Else) dựa trên giá trị state | State Path: `currentUser.role` <br> Operator: `Equals` <br> Compare Value: `admin` |
| **Call API** | Data | Gửi request HTTP tới server | URL: `https://api.example.com/users` <br> Store Response In: `table.users.data` |
| **Show Toast** | UI | Hiển thị thông báo góc màn hình | Message: `Đã lưu thành công!` <br> Type: `success` |
| **Open/Close Modal** | UI | Đóng/mở Modal theo ID | Modal Component ID: `modal_login` |
| **Navigate** | Navigation | Chuyển hướng trang | URL: `/dashboard` |
| **Copy to Clipboard** | Utility | Sao chép văn bản vào bộ nhớ tạm | Text: `{{state.shareLink}}` |
