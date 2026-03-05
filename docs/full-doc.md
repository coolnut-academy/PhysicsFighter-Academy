# Project Overview

* **Project name**: Physics Fighter Academy
* **Short description**: Complete online course delivery and management platform. Includes video lessons, quizzes, secure exams, progress tracking, and payment processing.
* **Target users**: Students (learners), Admins (instructors/course owners), Super Admins (platform managers).
* **Core problem the project solves**: Securely delivers premium video and document-based physics courses, handles user access natively via payment slip uploads, tracks student progress, and provides anti-cheating guard integration for exams.

# Tech Stack

| Layer          | Technology                                              |
| -------------- | ------------------------------------------------------- |
| Frontend       | Next.js (App Router), React 18, Tailwind CSS, Radix UI  |
| Backend        | Firebase SDK, Next.js Server Components, Turbopack      |
| Database       | Firebase Firestore                                      |
| Hosting        | Vercel / Firebase Hosting                               |
| Authentication | Firebase Auth                                           |
| State Mgmt     | Zustand                                                 |

# System Architecture

Serverless & JAMstack (React Server Components + Client Hooks).

* **Request flow**: Client triggers action → Update local Zustand state (if needed) → Call Firebase SDK function (Firestore/Auth) → Update remote database → Sync UI.
* **Client → Server → Database interactions**: 
  * Static UI rendered on server via Next.js RSC.
  * Realtime state forms and data tables handled by client components mutating Firestore documents directly via secure rules (`firestore.rules`).
  * File uploads (payment slips, videos) bypass backend directly into Firebase Storage.

# Folder Structure

```
app/
├ (student)/
├ admin/
├ checkout/
├ courses/
├ dashboard/
├ learn/
├ login/
├ my-courses/
├ profile/
├ register/
└ super-admin/
src/
├ components/
├ hooks/
├ lib/
├ store/
└ types/
```

# Core Modules

* **Module: Authentication**
  * **Responsibility**: Firebase authentication initialization, protected route guards, and tracking user sessions globally. 
  * **Main files**: `src/store/useAuthStore.ts`, `src/components/guards/`

* **Module: Course Management**
  * **Responsibility**: CRUD operations for modules, lessons, and quizzes; configuring pricing.
  * **Main files**: `app/admin/courses/`, `src/components/courses/`

* **Module: Enrollment & Checkout**
  * **Responsibility**: Processing bank slip uploads, verifying duration bounds, and admins manually granting course access.
  * **Main files**: `app/checkout/`, `app/admin/payments/`, `src/components/enrollment/`

* **Module: Learning View (LMS)**
  * **Responsibility**: Interactive video consumption, quiz taking, passing thresholds, tracking completion percentage.
  * **Main files**: `app/learn/`, `src/components/ui/`

# Data Models

| Model        | Fields                                                                 |
| ------------ | ---------------------------------------------------------------------- |
| User         | id, role, profile (name, phone), bankDetails, isActive, createdAt      |
| Course       | id, title, modules, pricing, difficulty, totalEnrollments, isPublished |
| Enrollment   | id, courseId, studentId, status, accessGranted, progress, expiresAt    |
| PaymentSlip  | id, studentId, amount, slipImageUrl, selectedDuration, status          |
| CourseReview | id, courseId, studentId, rating, comment, isPublished                  |
| Notification | id, userId, type, title, message, isRead                               |

# API Endpoints (Firestore Operations)

Because the project relies on serverless Firebase SDK, standard REST APIs are replaced by Firebase operations.

* **Operation: Upload Slip**
  * **Purpose**: Student uploads a payment slip.
  * **Request details**: Add document to `paymentSlips` collection + upload image to Storage.
  * **Response**: Slip Document ID.

* **Operation: Approve Payment**
  * **Purpose**: Admin grants course access.
  * **Request details**: Update `paymentSlips` status to APPROVED, create/update `enrollments` document with `accessGranted: true`.
  * **Response**: Success boolean.

* **Operation: Update Progress**
  * **Purpose**: Track lesson or quiz completeness.
  * **Request details**: Patch `enrollments.progress[]` map for a specific lessonId.
  * **Response**: Updated progress percentage.

# UI Structure

* `/` → Landing page and public course catalog
* `/login` & `/register` → Authentication boundaries
* `/dashboard` → Student Hub (analytics & recent progress)
* `/my-courses` → List of enrolled courses for a student
* `/learn/[courseId]` → Embedded course content and video player
* `/checkout/[courseId]` → Payment slip submission terminal
* `/admin` → Instructor control panel (revenue charts, manage courses, verify payments)
* `/super-admin` → Platform owner panel (oversee roles, global integrity guard management)

# Coding Conventions

* **Typing**: Use strict TypeScript definitions defined exclusively in `src/types/index.ts`.
* **Styling**: Tailwind CSS combined with `clsx` and `tailwind-merge` utility functions.
* **Component Design**: Pure functional components (`React.FC`). Avoid class components.
* **Architecture**: Extract complex logic out of UI components into custom React Hooks (`src/hooks`) or Zustand stores.
* **Imports**: Use relative or root wildcard aliases consistently.

# Dependency Rules

* `src/components/` must be completely agnostic to Next.js route structures (`app/`).
* Page components (`page.tsx`) should act as data-fetchers/orchestrators passing props into `src/components/ui/`.
* Server components cannot import interactive React hooks (`useState`, `useEffect`).
* Use Radix UI primitives inside `src/components/ui/` securely; do not randomly add heavy third-party UI libraries unless critical.

# Current Features

* Fully scoped User Roles (Student, Admin/Instructor, Super Admin)
* Multi-tiered course structure (Course > Modules > Lessons > Resources)
* Bank Transfer checkout flow with slip image parsing
* Secure video player wrapper and lesson progress tracking
* Role-based course analytics (Revenue tracking, Rating reviews)
* Progressive Web App (PWA) compatibility

# Planned Features

* Integrity Guard (anti-cheating) behavior overriding for Super Admin roles
* Enforcement of pre-registered Student Number database (whitelist logins)
* Exam status reporting adjustments (pending vs. unattempted distinct states)
* CSV parsing and file template downloads for bulk student enrollment
