# 🥋 Physics Fighter Academy - Project Reference Document (For AI Agents)

**🚨 CRITICAL INSTRUCTION FOR AI:** 
อ่านเอกสารนี้ให้เข้าใจก่อนเริ่มดำเนินการแก้ไขหรือเขียนโค้ดใหม่ทุกครั้ง เป้าหมายคือป้องกัน Regression (การทำลายโค้ดเดิมที่ทำงานได้ดีอยู่แล้ว), ลด Token usage จากการค้นหาไฟล์ซ้ำซ้อน, และรักษาคุณภาพของ Design UI/UX ให้เป็นไปตาม "The Dojo / Arcade Theme" การอัปเดตจะต้องช่วยเสริมประสิทธิภาพของแอปเท่านั้น ห้ามทำให้ข้อมูลของ User เสียหาย (Data Loss) หรือทำลายฟีเจอร์เดิมโดยเด็ดขาด

---

## 1. Project Overview & Architecture
- **Project Name**: Physics Fighter Academy
- **Type**: Online LMS (Learning Management System) สำหรับการเรียนการสอนออนไลน์
- **Tech Stack**:
  - **Framework**: Next.js 14+ (ใช้งาน App Router)
  - **Database & Auth**: Firebase (Firestore, Authentication, Storage)
  - **State Management**: Zustand (จัดการ Global State โดยเน้นไปที่ `useAuthStore` เป็นหลัก)
  - **Styling**: Tailwind CSS (กำหนด Custom Config ใน `tailwind.config.ts`)
  - **Language**: TypeScript (Strict typing บังคับใช้ Type เสมอ)
  - **Bundler/Dev**: ใช้ Turbopack ในการรัน Dev environment เพื่อประสิทธิภาพที่สูงขึ้น

---

## 2. Core Data Models (`src/types/index.ts`)
⚠️ **กฎข้อสำคัญ: `src/types/index.ts` คือ Single Source of Truth สำหรับ Database**
หากมีการปรับ Schema จะต้องแก้ไขที่นี่ก่อนเสมอ
- **Collections หลัก**: `users`, `courses`, `enrollments`, `payment_slips`
- **Course Structure (สำคัญ-อยู่ในช่วง Migration)**:
  - ปัจจุบันโปรเจกต์กำลังรองรับโครงสร้างเนื้อหา 2 รูปแบบคือแบบ `nested` (Data โครงสร้างเก่า) และ `flat` (Data โครงสร้างใหม่)
  - เวลาดึงเนื้อหาบทเรียน **ห้ามดึงโดยตรงเด็ดขาด** ให้ใช้ `src/lib/courses/contentLoader.ts` เพื่อจัดการและรองรับข้อแม้ (Fallback) ของโครงสร้างทั้งสองแบบ
- **Enrollment**: อ้างอิงสถานะของนักเรียนว่ามีสิทธิ์เรียนหรือไม่จาก field `status` (`'active' | 'expired' | 'revoked'`) และเช็คระยะเวลาด้วย `expiresAt`
- **Users Roles**: มีแค่ 3 roles คือ `student` (นักเรียน), `admin` (ผู้สอน/เจ้าของคอร์ส), `super_admin` (ผู้ดูแลระบบสูงสุด) ซึ่ง field ที่บอกบทบาทคือ `role`

---

## 3. RBAC & Security (Role-Based Access Control)
โปรเจกต์มีการป้องกันสิทธิ์ระดับสูงเพื่อรักษาความเป็นส่วนตัวและข้อมูลคอร์ส:
1. **Database Level (Firestore Rules)**: การอ่านเขียนทุกชนิดถูกจำกัดที่ `firestore.rules` (เช่น คอร์สที่ไม่ `publish` นักเรียนทั่วไปจะมองไม่เห็น) ต้องระวังหากแก้ Rules ใหม่
2. **Client/Route Level (Guards)**:
   - **`TokenRoleGuard`**: ใช้ Custom Claims บน Firebase Auth Token เพื่อตรวจสอบสิทธิ์การเข้าหน้าเว็บเบื้องต้น ซึ่งทำงานได้รวดเร็วระดับ Client โดยไม่ต้อง Query DB เสียโควต้า
   - **`RoleGuard`**: โหลด Role สดๆ จาก Firestore document ตรงๆ (ใช้กรณีต้องการข้อมูลเป๊ะจริงๆ)
   - 🦸‍♂️ สิทธิ์ `super_admin` เป็นสิทธิ์ขั้นสูงสุดที่สามารถ bypass ระบบได้เสมือนพระเจ้า (เช่นเข้าดูคอร์สไหนก็ได้โดยไม่ต้องลงทะเบียนเรียน ดู UI/UX หน้าเรียนเสมือนนักเรียนคนหนึ่ง)

---

## 4. UI/UX & Design System (Theme Directive)
⚠️ **ห้ามสร้าง Component แบบ "Minimalist รอกๆ" หรือใช้ Button/Card เรียบๆ (แบนๆ) เด็ดขาด ขัดกับเอกลักษณ์ของเว็บ**
- **Theme**: เน้นโทน **"Arcade / Fighting Game Dojo"** ดุดัน สดใส ปลุกใจนักสู้!
- **Colors**: ตรวจสอบสีจาก `tailwind.config.ts` เช่น:
  - `bg-fighter-red` (#E31E24) ตัดกับขาว/ดำ
  - `text-golden` (#f59e0b) สีทองสำหรับของขวัญ/โปรโมทชันหรือ Admin
  - `bg-ink-black` สีเอกลักษณ์ (ไม่ใช่ดำสนิท Tailwind)
- **Effects & Shapes**:
  - สไตล์ **Neo-brutalism**: ต้องใช้ขอบหนาๆ (`border-2 border-black` หรือ `border-4`)
  - กล่องข้อความ/ปุ่มมักจะใช้คุณสมบัติทแยงเอียงหน้า (`skew-x-[-10deg]` หรือ `-skew-x-12`)
  - เงาต้องแข็งและทึบ เช่น `shadow-[4px_4px_0_rgba(0,0,0,1)]` แทนการเบลอ 
- **Typography**: รองรับฟอนต์อักษรพิเศษเช่น `font-heading` สำหรับหัวข้อใหญ่ และให้เนื้อหาปกติใช้ภาษาไทยตัวเน้นหนาได้ (`font-bold`)
- **Navbars**: แบ่ง Component Navbar ไปตาม Role แบบชัดเจน:
  - `StudentNavbar`
  - `AdminNavbar`
  - `SuperAdminNavbar`
  *หมายเหตุ: ทุกแบบรองรับหน้าจอเล็ก (Mobile Response) ผ่าน Hamburger Icon เสมอ*

---

## 5. Development & AI Constraints (ข้อบังคับสำคัญสำหรับ AI Agent)
1. **No Breaking Changes**: ห้ามปรับเปลี่ยน Schema ของ DB จนกว่าจะมั่นใจ 100% ว่าแก้ที่ Interface และครอบคลุมของเก่า (Backward Compatibility) ให้กำหนดค่าเป็น Optional (`?`) ถ้านี่คือฟีเจอร์ใหม่
2. **Enrollment Check**: ใช้ระบบ `validateAccessWithServer` จาก `src/lib/enrollment/access.ts` (หรือ Utility ที่เกี่ยวข้อง) ทุกครั้งที่จะตรวจสอบสิทธิ์แบบมั่นใจที่สุด
3. **Component Reusability**: ก่อนสร้าง UI ใหม่ เช็คในโฟลเดอร์ `src/components/ui/` เสมอ (เช่น `Button`, `Dialog`, `Loading`, `LogoIcon`)
4. **State Consistency**: การเชื่อมต่อกับ Current User ทำแค่จุดเดียวผ่าน `import { useAuthStore } from '@/store/useAuthStore'`
5. **No Hardcoded Keys**: Firebase SDK Config ต้องเรียกจาก `src/lib/firebase/config.ts` ห้าม Hardcode credential ไปหา Firebase เด็ดขาด 
6. **Graceful Handling**: ทุก Action ที่เป็น Async ต้องมี Loading state และแสดง `toast` แจ้งเตือนผู้ใช้ถึงความผิดพลาดเสมอ (ห้าม Console.error ดื้อๆ แล้วจบ)
7. **Clean Imports**: ใช้ `@/` ในการ import แทน Relative paths ยาวๆ ให้สมเหตุสมผล

---

## 6. Project Structure Overview
สำหรับการนำทางไฟล์ (Navigation) อย่างรวดเร็ว:
- `app/` : เก็บหน้าและ Routing ต่างๆ แยกตามสิทธิ์อย่างชัดเจน (`admin/`, `super-admin/`, `learn/`, `courses/`)
- `src/components/` : เก็บ UI Components
  - `/layout`: Navbars
  - `/ui`: ของพื้นฐาน (Buttons, Tabs, Dialogs)
  - `/guards`: Role checker components
- `src/lib/` : ลอจิกสำคัญในการคำนวณและเชื่อมต่อเซอร์วิส (Firebase, utils.ts, content loader)
- `src/store/` : เก็บ Zustand (useAuthStore.ts) ที่ไว้เก็บ Global state เรื่อง Auth
- `src/types/` : Interface models เป็นไฟล์ที่สำคัญที่สุด
- `docs/` : เก็บพวกไฟล์ Documentation จุกจิก (เช่น `full-doc.md`, `file-map.md`) ทิ้งไว้ให้อ้างอิงลึกๆ

---
*End of Reference Rules.*
*หาก AI ได้รับแจ้งเตือนหรือให้วิเคราะห์คำสั่งของ User ให้กลับมาอ่านจุดนี้เสมอเพื่อความรอบคอบสูงสุด*
