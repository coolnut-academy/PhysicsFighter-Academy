// ============================================================================
// Physics Fighter - Type Definitions
// ============================================================================

import { Timestamp } from 'firebase/firestore';

// ============================================================================
// Enums & Constants
// ============================================================================

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  STUDENT = 'student',
}

export enum PaymentStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum CourseDifficulty {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
}

export enum EnrollmentStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

export type DurationMonths = 3 | 6 | 12;

// ============================================================================
// User Types
// ============================================================================

export interface BankDetails {
  bankName: string;
  accountNumber: string;
  accountName: string;
  qrCodeUrl?: string; // URL to QR code image in Firebase Storage
  promptPayId?: string;
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  avatarUrl?: string;
  bio?: string;
}

export interface User {
  id: string; // Firebase Auth UID
  role: UserRole;
  profile: UserProfile;

  // Admin-specific fields
  bankDetails?: BankDetails; // Only for ADMIN role
  instructorBio?: string; // Only for ADMIN role

  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLoginAt?: Timestamp;
  isActive: boolean;

  // Statistics (auto-calculated)
  totalCoursesCreated?: number; // For ADMIN
  totalEnrollments?: number; // For STUDENT
  totalRevenue?: number; // For ADMIN (in THB)
}

// ============================================================================
// Course Types
// ============================================================================

export interface CoursePricing {
  threeMonths: number; // Price in THB for 3 months access
  sixMonths: number; // Price in THB for 6 months access
  twelveMonths: number; // Price in THB for 12 months access
}

export interface CourseModule {
  id: string;
  title: string;
  description: string;
  order: number;
  lessons: CourseLesson[];
  durationMinutes: number; // Total duration of all lessons
}

export interface CourseLesson {
  id: string;
  title: string;
  description: string;
  order: number;
  videoUrl?: string; // Firebase Storage URL
  videoThumbnailUrl?: string;
  videoDurationSeconds: number;
  durationMinutes?: number;
  resources: LessonResource[]; // PDFs, docs, etc.
  quiz?: Quiz;
  isPreview: boolean; // Can be viewed without enrollment
}

export interface LessonResource {
  id: string;
  title: string;
  type: 'pdf' | 'doc' | 'link' | 'image';
  url: string;
  fileSize?: number; // In bytes
  description?: string;
}

export interface Quiz {
  id: string;
  title: string;
  questions: QuizQuestion[];
  passingScore: number; // Percentage (0-100)
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation?: string;
}

export interface Course {
  id: string;
  ownerId: string; // Reference to User.id (must be ADMIN role)

  // Basic Info
  title: string;
  description: string;
  thumbnailUrl?: string;
  bannerUrl?: string;
  category: string;
  tags: string[];
  difficulty: CourseDifficulty;
  language: string; // e.g., 'th', 'en'

  // Content
  modules: CourseModule[];
  totalDurationMinutes: number; // Sum of all module durations
  totalLessons: number; // Count of all lessons
  learningOutcomes?: string[];

  // Pricing
  pricing: CoursePricing;

  // Enrollment Stats
  totalEnrollments: number;
  activeEnrollments: number;

  // Publishing
  isPublished: boolean;
  publishedAt?: Timestamp;

  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastModifiedBy: string; // User ID

  // SEO & Discovery
  featured: boolean; // Can be set by SUPER_ADMIN
  averageRating?: number; // 0-5
  totalReviews?: number;
}

// ============================================================================
// Enrollment Types
// ============================================================================

export interface EnrollmentProgress {
  lessonId: string;
  completedAt?: Timestamp;
  watchedPercentage: number; // 0-100
  quizScore?: number; // 0-100
  quizAttempts: number;
}

export interface Enrollment {
  id: string;
  courseId: string; // Reference to Course.id
  studentId: string; // Reference to User.id (must be STUDENT role)
  ownerId: string; // Reference to Course.ownerId (ADMIN who created the course)

  // Access Control
  startDate: Timestamp;
  expiresAt: Timestamp; // Calculated: startDate + selectedDuration
  selectedDuration: DurationMonths; // 3, 6, or 12 months
  status: EnrollmentStatus;

  // Payment Info
  paymentSlipId: string; // Reference to PaymentSlip.id
  pricePaid: number; // In THB (snapshot from course pricing)

  // Progress Tracking
  progress: EnrollmentProgress[];
  overallProgress: number; // 0-100 (percentage of lessons completed)
  lastAccessedAt?: Timestamp;
  completedAt?: Timestamp; // When 100% progress reached

  // Certificate
  certificateUrl?: string; // Generated when course is completed
  certificateIssuedAt?: Timestamp;

  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================================================
// Payment Slip Types
// ============================================================================

export interface PaymentSlip {
  id: string;
  studentId: string; // Reference to User.id (STUDENT)
  courseId: string; // Reference to Course.id
  ownerId: string; // Reference to Course.ownerId (ADMIN instructor)

  // Payment Details
  amount: number; // In THB
  selectedDuration: DurationMonths; // 3, 6, or 12 months
  paymentMethod: 'bank_transfer' | 'promptpay' | 'qr_code';

  // Slip Upload
  slipImageUrl: string; // Firebase Storage URL of uploaded slip
  slipUploadedAt: Timestamp;

  // Bank Details (snapshot from Admin's bank details at time of payment)
  bankDetails: BankDetails;

  // Status & Review
  status: PaymentStatus;
  reviewedBy?: string; // User ID (ADMIN or SUPER_ADMIN)
  reviewedAt?: Timestamp;
  rejectionReason?: string;
  adminNotes?: string; // Internal notes for ADMIN/SUPER_ADMIN

  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================================================
// Review & Rating Types
// ============================================================================

export interface CourseReview {
  id: string;
  courseId: string;
  studentId: string;
  enrollmentId: string;

  rating: number; // 1-5
  comment?: string;

  // Instructor Response
  instructorResponse?: string;
  instructorResponseAt?: Timestamp;

  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isPublished: boolean; // Can be moderated by SUPER_ADMIN
}

// ============================================================================
// Analytics & Reporting Types
// ============================================================================

export interface RevenueRecord {
  id: string;
  ownerId: string; // ADMIN instructor
  enrollmentId: string;
  paymentSlipId: string;

  amount: number; // In THB
  courseId: string;
  courseName: string; // Snapshot
  studentId: string;
  studentName: string; // Snapshot

  date: Timestamp;
  month: string; // Format: 'YYYY-MM' for easy querying
  year: number;
}

export interface AdminStatistics {
  userId: string; // ADMIN

  // Revenue
  totalRevenue: number;
  monthlyRevenue: Record<string, number>; // { 'YYYY-MM': amount }

  // Courses
  totalCourses: number;
  publishedCourses: number;

  // Enrollments
  totalEnrollments: number;
  activeEnrollments: number;

  // Reviews
  averageRating: number;
  totalReviews: number;

  lastUpdated: Timestamp;
}

export interface PlatformStatistics {
  // Only accessible by SUPER_ADMIN

  // Users
  totalUsers: number;
  totalAdmins: number;
  totalStudents: number;

  // Courses
  totalCourses: number;
  publishedCourses: number;

  // Revenue
  totalPlatformRevenue: number;
  monthlyRevenue: Record<string, number>;

  // Enrollments
  totalEnrollments: number;
  activeEnrollments: number;

  lastUpdated: Timestamp;
}

// ============================================================================
// Notification Types
// ============================================================================

export interface Notification {
  id: string;
  userId: string; // Recipient
  type: 'payment_approved' | 'payment_rejected' | 'new_enrollment' | 'course_update' | 'review_received' | 'system';

  title: string;
  message: string;

  // Related entities
  relatedCourseId?: string;
  relatedEnrollmentId?: string;
  relatedPaymentSlipId?: string;

  isRead: boolean;
  createdAt: Timestamp;
  readAt?: Timestamp;
}

// ============================================================================
// Utility Types for Client-Side Forms
// ============================================================================

export type CreateCourseInput = Omit<Course, 'id' | 'ownerId' | 'totalEnrollments' | 'activeEnrollments' | 'createdAt' | 'updatedAt' | 'lastModifiedBy' | 'featured' | 'averageRating' | 'totalReviews'>;

export type UpdateCourseInput = Partial<CreateCourseInput>;

export type CreateUserInput = Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'lastLoginAt' | 'totalCoursesCreated' | 'totalEnrollments' | 'totalRevenue'>;

export type UpdateUserInput = Partial<CreateUserInput>;

export type SubmitPaymentSlipInput = Omit<PaymentSlip, 'id' | 'status' | 'reviewedBy' | 'reviewedAt' | 'rejectionReason' | 'adminNotes' | 'createdAt' | 'updatedAt'>;

// ============================================================================
// Collection Names (Constants for consistency)
// ============================================================================

export const COLLECTIONS = {
  USERS: 'users',
  COURSES: 'courses',
  ENROLLMENTS: 'enrollments',
  PAYMENT_SLIPS: 'paymentSlips',
  REVIEWS: 'reviews',
  REVENUE_RECORDS: 'revenueRecords',
  ADMIN_STATISTICS: 'adminStatistics',
  PLATFORM_STATISTICS: 'platformStatistics',
  NOTIFICATIONS: 'notifications',
} as const;
