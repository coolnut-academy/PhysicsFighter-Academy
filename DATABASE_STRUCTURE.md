# โครงสร้างฐานข้อมูล (Database Structure) - PhysicsFighter Academy

> **หมายเหตุ:** โปรเจคนี้ใช้ **Firebase Firestore** (NoSQL Document Database) เป็นฐานข้อมูลหลัก

---

## 📊 ภาพรวม Collections

```
firestore/
├── users/                          # ข้อมูลผู้ใช้งานทุก role
├── courses/                        # ข้อมูลคอร์สเรียน
├── enrollments/                    # ข้อมูลการลงทะเบียนเรียน
├── paymentSlips/                   # ข้อมูลสลิปการชำระเงิน
├── reviews/                        # รีวิวและคะแนนคอร์ส
├── revenueRecords/                 # บันทึกรายได้ (สำหรับ Admin)
├── adminStatistics/                # สถิติของแต่ละ Admin
├── platformStatistics/             # สถิติระดับแพลตฟอร์ม (Super Admin เท่านั้น)
└── notifications/                  # การแจ้งเตือนของผู้ใช้
```

---

## 👤 1. Users Collection

**Path:** `/users/{userId}`

**คำอธิบาย:** เก็บข้อมูลผู้ใช้งานทั้งหมด (Super Admin, Admin/Instructor, Student)

| Field | Type | คำอธิบาย |
|-------|------|---------|
| `id` | string | Firebase Auth UID |
| `role` | string | `super_admin` / `admin` / `student` |
| `profile` | object | ข้อมูลส่วนตัว |
| `profile.firstName` | string | ชื่อ |
| `profile.lastName` | string | นามสกุล |
| `profile.email` | string | อีเมล |
| `profile.phoneNumber` | string | เบอร์โทร (optional) |
| `profile.avatarUrl` | string | URL รูปโปรไฟล์ |
| `profile.bio` | string | ประวัติย่อ |
| `bankDetails` | object | ข้อมูลธนาคาร (สำหรับ Admin เท่านั้น) |
| `bankDetails.bankName` | string | ชื่อธนาคาร |
| `bankDetails.accountNumber` | string | เลขบัญชี |
| `bankDetails.accountName` | string | ชื่อบัญชี |
| `bankDetails.qrCodeUrl` | string | URL รูป QR Code |
| `bankDetails.promptPayId` | string | ID PromptPay |
| `instructorBio` | string | ประวัติผู้สอน (สำหรับ Admin) |
| `createdAt` | timestamp | วันที่สร้าง |
| `updatedAt` | timestamp | วันที่อัปเดตล่าสุด |
| `lastLoginAt` | timestamp | วันที่เข้าสู่ระบบล่าสุด |
| `isActive` | boolean | สถานะบัญชี (active/inactive) |
| `totalCoursesCreated` | number | จำนวนคอร์สที่สร้าง (สำหรับ Admin) |
| `totalEnrollments` | number | จำนวนคอร์สที่ลงเรียน (สำหรับ Student) |
| `totalRevenue` | number | รายได้รวม (สำหรับ Admin) |

**Security Rules:**
- อ่าน: ตนเอง หรือ Super Admin
- สร้าง: Super Admin หรือ ตนเอง (สมัครเป็น student เท่านั้น)
- อัปเดต: ตนเอง (ยกเว้น role) หรือ Super Admin
- ลบ: Super Admin เท่านั้น

---

## 📚 2. Courses Collection

**Path:** `/courses/{courseId}`

**คำอธิบาย:** เก็บข้อมูลคอร์สเรียนทั้งหมด

| Field | Type | คำอธิบาย |
|-------|------|---------|
| `id` | string | Course ID (Auto-generated) |
| `ownerId` | string | รหัสผู้สร้าง (Admin) |
| `title` | string | ชื่อคอร์ส |
| `description` | string | รายละเอียดคอร์ส |
| `thumbnailUrl` | string | URL รูป thumbnail |
| `bannerUrl` | string | URL รูป banner |
| `category` | string | หมวดหมู่ |
| `tags` | string[] | แท็กต่างๆ |
| `difficulty` | string | `beginner` / `intermediate` / `advanced` |
| `language` | string | ภาษา (เช่น `th`, `en`) |
| `modules` | array | โมดูลการเรียน |
| `modules[].id` | string | รหัสโมดูล |
| `modules[].title` | string | ชื่อโมดูล |
| `modules[].description` | string | รายละเอียดโมดูล |
| `modules[].order` | number | ลำดับโมดูล |
| `modules[].durationMinutes` | number | ความยาวรวม (นาที) |
| `modules[].lessons` | array | บทเรียนในโมดูล |
| `modules[].lessons[].id` | string | รหัสบทเรียน |
| `modules[].lessons[].title` | string | ชื่อบทเรียน |
| `modules[].lessons[].description` | string | รายละเอียดบทเรียน |
| `modules[].lessons[].order` | number | ลำดับบทเรียน |
| `modules[].lessons[].videoUrl` | string | URL วิดีโอ |
| `modules[].lessons[].videoThumbnailUrl` | string | URL thumbnail วิดีโอ |
| `modules[].lessons[].videoDurationSeconds` | number | ความยาววิดีโอ (วินาที) |
| `modules[].lessons[].resources` | array | ไฟล์แนบ (PDF, DOC, etc.) |
| `modules[].lessons[].quiz` | object | แบบทดสอบ |
| `modules[].lessons[].isPreview` | boolean | ดูได้โดยไม่ต้องลงทะเบียน |
| `totalDurationMinutes` | number | ความยาวรวมทั้งคอร์ส |
| `totalLessons` | number | จำนวนบทเรียนทั้งหมด |
| `learningOutcomes` | string[] | สิ่งที่จะได้รับจากคอร์ส |
| `pricing` | object | ราคา |
| `pricing.threeMonths` | number | ราคา 3 เดือน (บาท) |
| `pricing.sixMonths` | number | ราคา 6 เดือน (บาท) |
| `pricing.twelveMonths` | number | ราคา 12 เดือน (บาท) |
| `totalEnrollments` | number | จำนวนคนลงทะเบียนทั้งหมด |
| `activeEnrollments` | number | จำนวนคนลงทะเบียนที่ active |
| `isPublished` | boolean | สถานะเผยแพร่ |
| `publishedAt` | timestamp | วันที่เผยแพร่ |
| `createdAt` | timestamp | วันที่สร้าง |
| `updatedAt` | timestamp | วันที่อัปเดต |
| `lastModifiedBy` | string | ผู้แก้ไขล่าสุด (User ID) |
| `featured` | boolean | คอร์สแนะนำ (Super Admin กำหนด) |
| `averageRating` | number | คะแนนเฉลี่ย (0-5) |
| `totalReviews` | number | จำนวนรีวิว |

**Security Rules:**
- อ่าน: คอร์สที่ published, เจ้าของคอร์ส, หรือ Super Admin
- สร้าง: Admin (เฉพาะของตนเอง) หรือ Super Admin
- อัปเดต: เจ้าของคอร์ส หรือ Super Admin
- ลบ: เจ้าของคอร์ส หรือ Super Admin

---

## 🎓 3. Enrollments Collection

**Path:** `/enrollments/{enrollmentId}`

**คำอธิบาย:** เก็บข้อมูลการลงทะเบียนเรียนของนักเรียน

| Field | Type | คำอธิบาย |
|-------|------|---------|
| `id` | string | Enrollment ID |
| `courseId` | string | รหัสคอร์ส |
| `studentId` | string | รหัสนักเรียน |
| `ownerId` | string | รหัสเจ้าของคอร์ส (Admin) |
| `startDate` | timestamp | วันที่เริ่มเรียน |
| `expiresAt` | timestamp | วันที่หมดอายุ |
| `selectedDuration` | number | ระยะเวลาที่เลือก (3, 6, 12 เดือน) |
| `status` | string | `active` / `expired` / `cancelled` / `completed` |
| `paymentSlipId` | string | รหัสสลิปการชำระเงิน |
| `pricePaid` | number | ราคาที่จ่ายจริง (บาท) |
| `progress` | array | ความก้าวหน้าการเรียน |
| `progress[].lessonId` | string | รหัสบทเรียน |
| `progress[].completedAt` | timestamp | วันที่เรียนจบ |
| `progress[].watchedPercentage` | number | เปอร์เซ็นต์การดูวิดีโอ (0-100) |
| `progress[].quizScore` | number | คะแนนแบบทดสอบ (0-100) |
| `progress[].quizAttempts` | number | จำนวนครั้งที่ทำแบบทดสอบ |
| `overallProgress` | number | ความก้าวหน้ารวม (0-100) |
| `lastAccessedAt` | timestamp | เข้าใช้ล่าสุด |
| `completedAt` | timestamp | เรียนจบเมื่อ |
| `certificateUrl` | string | URL ใบประกาศนียบัตร |
| `certificateIssuedAt` | timestamp | วันออกใบประกาศ |
| `createdAt` | timestamp | วันที่สร้าง |
| `updatedAt` | timestamp | วันที่อัปเดต |

**Security Rules:**
- อ่าน: ตนเอง (student), เจ้าของคอร์ส, หรือ Super Admin
- สร้าง: นักเรียนตนเอง หรือ Super Admin
- อัปเดต: Super Admin หรือ นักเรียนตนเอง (เฉพาะ progress, overallProgress, lastAccessedAt, completedAt)
- ลบ: Super Admin เท่านั้น

---

## 💳 4. Payment Slips Collection

**Path:** `/paymentSlips/{slipId}`

**คำอธิบาย:** เก็บข้อมูลสลิปการชำระเงินที่นักเรียนอัปโหลด

| Field | Type | คำอธิบาย |
|-------|------|---------|
| `id` | string | Slip ID |
| `studentId` | string | รหัสนักเรียน |
| `courseId` | string | รหัสคอร์ส |
| `ownerId` | string | รหัสเจ้าของคอร์ส |
| `amount` | number | จำนวนเงิน (บาท) |
| `selectedDuration` | number | ระยะเวลาที่เลือก (3, 6, 12) |
| `paymentMethod` | string | `bank_transfer` / `promptpay` / `qr_code` |
| `slipImageUrl` | string | URL รูปสลิป |
| `slipUploadedAt` | timestamp | วันที่อัปโหลดสลิป |
| `bankDetails` | object | ข้อมูลธนาคาร (snapshot ตอนจ่าย) |
| `status` | string | `pending` / `approved` / `rejected` |
| `reviewedBy` | string | ผู้ตรวจสอบ (User ID) |
| `reviewedAt` | timestamp | วันที่ตรวจสอบ |
| `rejectionReason` | string | เหตุผลที่ปฏิเสธ |
| `adminNotes` | string | บันทึกภายใน Admin |
| `createdAt` | timestamp | วันที่สร้าง |
| `updatedAt` | timestamp | วันที่อัปเดต |

**Security Rules:**
- อ่าน: ตนเอง (student), เจ้าของคอร์ส, หรือ Super Admin
- สร้าง: นักเรียนตนเอง
- อัปเดต: เจ้าของคอร์ส, Super Admin หรือ นักเรียนตนเอง (เฉพาะตอน status = pending)
- ลบ: Super Admin เท่านั้น

---

## ⭐ 5. Reviews Collection

**Path:** `/reviews/{reviewId}`

**คำอธิบาย:** เก็บรีวิวและคะแนนของคอร์ส

| Field | Type | คำอธิบาย |
|-------|------|---------|
| `id` | string | Review ID |
| `courseId` | string | รหัสคอร์ส |
| `studentId` | string | รหัสนักเรียน |
| `enrollmentId` | string | รหัสการลงทะเบียน |
| `rating` | number | คะแนน (1-5) |
| `comment` | string | ความคิดเห็น |
| `instructorResponse` | string | คำตอบของผู้สอน |
| `instructorResponseAt` | timestamp | วันที่ตอบกลับ |
| `createdAt` | timestamp | วันที่สร้าง |
| `updatedAt` | timestamp | วันที่อัปเดต |
| `isPublished` | boolean | สถานะเผยแพร่ (Super Admin กำหนด) |

**Security Rules:**
- อ่าน: รีวิวที่ published, ตนเอง, เจ้าของคอร์ส, หรือ Super Admin
- สร้าง: นักเรียนที่ลงทะเบียนแล้วเท่านั้น
- อัปเดต: ตนเอง, เจ้าของคอร์ส (เฉพาะ instructorResponse), หรือ Super Admin
- ลบ: ตนเอง หรือ Super Admin

---

## 💰 6. Revenue Records Collection

**Path:** `/revenueRecords/{recordId}`

**คำอธิบาย:** บันทึกรายได้ของแต่ละ Admin (สร้างโดย Cloud Functions)

| Field | Type | คำอธิบาย |
|-------|------|---------|
| `id` | string | Record ID |
| `ownerId` | string | รหัส Admin |
| `enrollmentId` | string | รหัสการลงทะเบียน |
| `paymentSlipId` | string | รหัสสลิป |
| `amount` | number | จำนวนเงิน (บาท) |
| `courseId` | string | รหัสคอร์ส |
| `courseName` | string | ชื่อคอร์ส (snapshot) |
| `studentId` | string | รหัสนักเรียน |
| `studentName` | string | ชื่อนักเรียน (snapshot) |
| `date` | timestamp | วันที่ |
| `month` | string | เดือน (รูปแบบ `YYYY-MM`) |
| `year` | number | ปี |

**Security Rules:**
- อ่าน: เจ้าของรายการ หรือ Super Admin
- สร้าง/อัปเดต/ลบ: Super Admin หรือ Cloud Functions เท่านั้น

---

## 📈 7. Admin Statistics Collection

**Path:** `/adminStatistics/{userId}`

**คำอธิบาย:** สถิติของแต่ละ Admin

| Field | Type | คำอธิบาย |
|-------|------|---------|
| `userId` | string | รหัส Admin |
| `totalRevenue` | number | รายได้รวม |
| `monthlyRevenue` | map | รายได้รายเดือน `{ 'YYYY-MM': amount }` |
| `totalCourses` | number | จำนวนคอร์สทั้งหมด |
| `publishedCourses` | number | จำนวนคอร์สที่ published |
| `totalEnrollments` | number | จำนวนการลงทะเบียนทั้งหมด |
| `activeEnrollments` | number | จำนวนการลงทะเบียนที่ active |
| `averageRating` | number | คะแนนเฉลี่ย |
| `totalReviews` | number | จำนวนรีวิว |
| `lastUpdated` | timestamp | อัปเดตล่าสุด |

**Security Rules:**
- อ่าน: ตนเอง หรือ Super Admin
- สร้าง/อัปเดต/ลบ: Super Admin หรือ Cloud Functions เท่านั้น

---

## 🌍 8. Platform Statistics Collection

**Path:** `/platformStatistics/{statId}`

**คำอธิบาย:** สถิติระดับแพลตฟอร์มทั้งหมด

| Field | Type | คำอธิบาย |
|-------|------|---------|
| `totalUsers` | number | จำนวนผู้ใช้ทั้งหมด |
| `totalAdmins` | number | จำนวน Admin |
| `totalStudents` | number | จำนวนนักเรียน |
| `totalCourses` | number | จำนวนคอร์สทั้งหมด |
| `publishedCourses` | number | จำนวนคอร์สที่ published |
| `totalPlatformRevenue` | number | รายได้รวมทั้งแพลตฟอร์ม |
| `monthlyRevenue` | map | รายได้รายเดือน `{ 'YYYY-MM': amount }` |
| `totalEnrollments` | number | จำนวนการลงทะเบียนทั้งหมด |
| `activeEnrollments` | number | จำนวนการลงทะเบียนที่ active |
| `lastUpdated` | timestamp | อัปเดตล่าสุด |

**Security Rules:**
- อ่าน/เขียน: Super Admin เท่านั้น

---

## 🔔 9. Notifications Collection

**Path:** `/notifications/{notificationId}`

**คำอธิบาย:** การแจ้งเตือนของผู้ใช้

| Field | Type | คำอธิบาย |
|-------|------|---------|
| `id` | string | Notification ID |
| `userId` | string | ผู้รับแจ้งเตือน |
| `type` | string | `payment_approved` / `payment_rejected` / `new_enrollment` / `course_update` / `review_received` / `system` |
| `title` | string | หัวข้อ |
| `message` | string | ข้อความ |
| `relatedCourseId` | string | รหัสคอร์สที่เกี่ยวข้อง (optional) |
| `relatedEnrollmentId` | string | รหัสการลงทะเบียน (optional) |
| `relatedPaymentSlipId` | string | รหัสสลิป (optional) |
| `isRead` | boolean | สถานะอ่านแล้ว |
| `createdAt` | timestamp | วันที่สร้าง |
| `readAt` | timestamp | วันที่อ่าน |

**Security Rules:**
- อ่าน: ตนเอง หรือ Super Admin
- สร้าง: Super Admin หรือ Cloud Functions
- อัปเดต: ตนเอง (เฉพาะ isRead) หรือ Super Admin
- ลบ: ตนเอง หรือ Super Admin

---

## 🔗 Relationships Diagram

```
┌─────────────────┐
│     Users       │
│  (ทุก Role)      │
└────────┬────────┘
         │
         │ 1:N (Admin สร้าง)
         ▼
┌─────────────────┐     ┌──────────────────┐
│    Courses      │◄────┤  Reviews         │
│  (คอร์สเรียน)    │     │  (รีวิว)          │
└────────┬────────┘     └──────────────────┘
         │
         │ 1:N (นักเรียนลงทะเบียน)
         ▼
┌─────────────────┐     ┌──────────────────┐
│   Enrollments   │◄────┤  PaymentSlips    │
│  (การลงทะเบียน)  │     │  (สลิปโอนเงิน)     │
└────────┬────────┘     └──────────────────┘
         │
         │ (สร้าง RevenueRecord)
         ▼
┌─────────────────┐
│ RevenueRecords  │
│  (บันทึกรายได้)  │
└─────────────────┘

┌─────────────────┐     ┌──────────────────┐
│ AdminStatistics │     │ PlatformStatistics│
│ (สถิติแต่ละAdmin)│     │ (สถิติทั้งระบบ)   │
└─────────────────┘     └──────────────────┘

┌─────────────────┐
│  Notifications  │
│  (แจ้งเตือน)     │
└─────────────────┘
```

---

## 📝 Enum Values Summary

### UserRole
- `super_admin` - ผู้ดูแลระบบสูงสุด
- `admin` - ผู้สอน/ผู้ดูแล
- `student` - นักเรียน

### PaymentStatus
- `pending` - รอตรวจสอบ
- `approved` - อนุมัติแล้ว
- `rejected` - ปฏิเสธ

### EnrollmentStatus
- `active` - กำลังเรียน
- `expired` - หมดอายุ
- `cancelled` - ยกเลิก
- `completed` - เรียนจบ

### CourseDifficulty
- `beginner` - ระดับเริ่มต้น
- `intermediate` - ระดับกลาง
- `advanced` - ระดับสูง

---

## 🔐 สรุป Security Rules

| Collection | Read | Create | Update | Delete |
|------------|------|--------|--------|--------|
| users | Self, Super Admin | Super Admin, Self (Student) | Self (no role change), Super Admin | Super Admin |
| courses | Public (published), Owner, Super Admin | Admin (self), Super Admin | Owner, Super Admin | Owner, Super Admin |
| enrollments | Self, Owner, Super Admin | Self (Student), Super Admin | Super Admin, Self (progress only) | Super Admin |
| paymentSlips | Self, Owner, Super Admin | Self (Student) | Owner, Super Admin, Self (pending only) | Super Admin |
| reviews | Public (published), Self, Owner, Super Admin | Enrolled Students | Self, Owner (response only), Super Admin | Self, Super Admin |
| revenueRecords | Owner, Super Admin | Super Admin | Super Admin | Super Admin |
| adminStatistics | Self, Super Admin | Super Admin | Super Admin | Super Admin |
| platformStatistics | Super Admin | Super Admin | Super Admin | Super Admin |
| notifications | Self, Super Admin | Super Admin | Self (mark read), Super Admin | Self, Super Admin |

---

*เอกสารนี้สร้างขึ้นเมื่อ: 8 กุมภาพันธ์ 2026*
*PhysicsFighter Academy - Database Documentation*
