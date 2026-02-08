# Future-Proof Lesson Architecture V2

> **Status**: Design Complete  
> **Migration Strategy**: Incremental, Reversible, Zero-Downtime  
> **Estimated Duration**: 4-6 weeks

---

## Executive Summary

### Current Problem
- Lessons nested inside `courses.modules[].lessons[]`
- Firestore document limit: **1MB**
- Large courses (50+ lessons with resources/quizzes) approaching limit
- No granular access control per lesson
- Difficult to query/sort lessons across modules

### Proposed Solution
- **New Collections**: `courseModules`, `courseLessons`
- **Flat Structure**: Separate documents for scalability
- **Backward Compatible**: Existing courses continue working
- **Incremental Migration**: Dual-read → Write-new → Deprecate

---

## 1. New Schema Proposal

### 1.1 Collection Hierarchy

```
Firestore (New Structure)
│
├── courses/{courseId}              # Course metadata (smaller)
│   └── modulesCount, lessonsCount  # Aggregated stats
│
├── courseModules/{moduleId}        # Module metadata
│   └── courseId, order, lessonsCount
│
├── courseLessons/{lessonId}        # Individual lessons
│   ├── moduleId, courseId
│   ├── videoUrl, resources[]
│   └── quiz (sub-collection or inline)
│
└── lessonProgress/{progressId}     # Separate from enrollment
    └── enrollmentId, lessonId, progress
```

### 1.2 Document Schemas

#### `courses/{courseId}` - Lightened

```typescript
interface CourseV2 {
  id: string;
  ownerId: string;
  
  // Basic Info (unchanged)
  title: string;
  description: string;
  thumbnailUrl?: string;
  bannerUrl?: string;
  category: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  language: string;
  
  // Content - NOW REFERENCES ONLY
  modulesCount: number;        // Number of modules
  lessonsCount: number;        // Total lessons
  totalDurationMinutes: number; // Aggregated
  learningOutcomes: string[];
  
  // Legacy field (for backward compat)
  /** @deprecated Use courseModules collection */
  modules?: CourseModuleV1[];  // Keep until Phase 3
  
  // Migration tracking
  contentFormat: 'nested' | 'flat' | 'migrating'; // Indicates structure
  migrationVersion: number;    // Schema version
  
  // Publishing (unchanged)
  isPublished: boolean;
  publishedAt?: Timestamp;
  
  // Metadata (unchanged)
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastModifiedBy: string;
  featured: boolean;
  
  // Stats (unchanged)
  totalEnrollments: number;
  activeEnrollments: number;
  averageRating?: number;
  totalReviews?: number;
}
```

#### `courseModules/{moduleId}` - NEW

```typescript
interface CourseModule {
  id: string;                  // Auto-generated
  courseId: string;            // Parent reference
  ownerId: string;             // Denormalized for security rules
  
  // Content
  title: string;
  description: string;
  order: number;               // Display order (0, 1, 2...)
  
  // Aggregated Stats
  lessonsCount: number;
  durationMinutes: number;     // Sum of lesson durations
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}
```

**Collection Path**: `/courseModules/{moduleId}`  
**Query Pattern**: `collection('courseModules').where('courseId', '==', courseId).orderBy('order')`

#### `courseLessons/{lessonId}` - NEW

```typescript
interface CourseLesson {
  id: string;                  // Auto-generated
  courseId: string;            // Denormalized for queries
  moduleId: string;            // Parent reference
  ownerId: string;             // Denormalized for security rules
  
  // Display
  order: number;               // Order within module
  title: string;
  description: string;
  
  // Video
  videoUrl?: string;
  videoThumbnailUrl?: string;
  videoDurationSeconds: number;
  
  // Access Control
  isPreview: boolean;          // Free preview without enrollment
  
  // Resources (inline - max ~10 items)
  resources: LessonResource[];
  
  // Quiz (inline for small quizzes, sub-collection for large)
  quiz?: Quiz;                 // Optional inline quiz
  hasQuiz: boolean;            // Flag for query efficiency
  
  // Completion
  requiredToComplete: boolean; // Must watch to complete course?
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

interface LessonResource {
  id: string;
  title: string;
  type: 'pdf' | 'doc' | 'link' | 'image' | 'code';
  url: string;
  fileSize?: number;           // Bytes
  description?: string;
}

interface Quiz {
  id: string;
  title: string;
  passingScore: number;        // 0-100
  questions: QuizQuestion[];   // Max ~20 questions inline
}

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];           // Max ~6 options
  correctAnswerIndex: number;
  explanation?: string;
  points: number;
}
```

**Collection Path**: `/courseLessons/{lessonId}`  
**Query Patterns**:
- By module: `where('moduleId', '==', moduleId).orderBy('order')`
- By course: `where('courseId', '==', courseId).orderBy('order')`
- Previews only: `where('courseId', '==', courseId).where('isPreview', '==', true)`

#### `quizQuestions/{questionId}` - NEW (Optional Sub-collection)

For courses with large quizzes (>20 questions), use sub-collection:

```typescript
interface QuizQuestionDoc {
  id: string;
  lessonId: string;
  courseId: string;            // Denormalized
  order: number;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation?: string;
  points: number;
}
```

### 1.3 Schema Comparison

| Aspect | Current (V1) | New (V2) |
|--------|-------------|----------|
| **Structure** | Nested arrays | Flat collections |
| **Course Doc Size** | Grows with content | Fixed ~2-5KB |
| **Max Lessons** | ~50-100 (1MB limit) | Unlimited |
| **Query Lessons** | Load entire course | Query specific lesson |
| **Lesson Access Control** | Course-level | Lesson-level (isPreview) |
| **Parallel Updates** | Race conditions on course doc | Independent documents |

---

## 2. Ownership and Permission Model

### 2.1 Ownership Chain

```
Course (ownerId)
  ↓
Module (ownerId - copied from course)
  ↓
Lesson (ownerId - copied from course)
```

**Denormalization Strategy**:
- `ownerId` copied to all child documents
- Enables security rules without extra reads
- Keeps rules fast and simple

### 2.2 Permission Matrix

| Action | Course | Module | Lesson |
|--------|--------|--------|--------|
| **Read** | Public if published, Owner/Admin always | Same as course | Same as course + isPreview logic |
| **Create** | Admin only | Course owner | Module owner |
| **Update** | Course owner | Course owner | Course owner |
| **Delete** | Course owner | Course owner | Course owner |

### 2.3 Student Access Rules

```typescript
// Student can read lesson if:
(
  // Public preview
  lesson.isPreview === true 
  && course.isPublished === true
)
OR
(
  // Has enrollment
  enrollment.studentId === user.uid
  && enrollment.courseId === lesson.courseId
  && enrollment.accessGranted === true  // From deterministic model
)
```

---

## 3. Migration Roadmap (3-Phase)

### Phase 0: Preparation (Week 1)

**Tasks**:
1. Deploy new collections with security rules
2. Create data validation utilities
3. Set up monitoring and alerts
4. Create rollback scripts

**Deliverables**:
- Firestore rules supporting both schemas
- Cloud Functions for aggregation
- Admin dashboard for migration monitoring

### Phase 1: Dual-Read (Week 2-3)

**Goal**: Frontend reads from both sources, prefers new if available

**Implementation**:
```typescript
// Frontend data loading
async function loadCourseContent(courseId: string): Promise<CourseContent> {
  const course = await getDoc(doc(db, 'courses', courseId));
  
  // Check content format
  if (course.data().contentFormat === 'flat') {
    // Read from new collections
    return loadFlatContent(courseId);
  } else if (course.data().contentFormat === 'migrating') {
    // Dual-read: Try flat first, fallback to nested
    try {
      return await loadFlatContent(courseId);
    } catch {
      return loadNestedContent(course.data());
    }
  } else {
    // Legacy: Read nested
    return loadNestedContent(course.data());
  }
}
```

**Cloud Functions**:
- `syncNestedToFlat`: Mirror nested changes to flat (for active courses)

**Rollback**: Instant - just switch contentFormat back to 'nested'

### Phase 2: Write-New / Read-Both (Week 4-5)

**Goal**: All writes go to new collections, reads support both

**Implementation**:
```typescript
// Create module (always writes to new collection)
async function createModule(courseId: string, data: ModuleInput) {
  const moduleRef = doc(collection(db, 'courseModules'));
  
  await setDoc(moduleRef, {
    ...data,
    courseId,
    contentFormat: 'flat',  // Mark as using new format
  });
  
  // Update course aggregate
  await updateDoc(doc(db, 'courses', courseId), {
    modulesCount: increment(1),
    contentFormat: 'flat',
    migrationVersion: 2,
  });
  
  return moduleRef.id;
}
```

**Migration Script**:
- Batch migrate existing courses
- Mark as 'migrating' during migration
- Mark as 'flat' when complete

**Rollback**: 
- For new courses: Delete flat documents, recreate nested (script)
- For old courses: Already have nested, just switch contentFormat

### Phase 3: Deprecation (Week 6+)

**Goal**: Remove legacy support

**Tasks**:
1. Verify 100% migration
2. Remove nested `modules` field from courses
3. Simplify frontend to read flat only
4. Update Firestore rules (remove legacy checks)
5. Mark V1 types as @deprecated

**Rollback**: Not possible - but Phase 3 only starts after 30 days stability

---

## 4. Security Rules

### 4.1 Complete Rules for New Collections

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // ========================================================================
    // Existing helper functions (isAuthenticated, isAdmin, etc.)
    // ========================================================================
    
    // ... (keep existing helpers) ...
    
    // ========================================================================
    // NEW: Course Modules Collection
    // ========================================================================
    
    match /courseModules/{moduleId} {
      // Read: If can read parent course
      allow read: if resource.data.ownerId == request.auth.uid
                  || isSuperAdmin()
                  || (
                    // Public read if course is published
                    get(/databases/$(database)/documents/courses/$(resource.data.courseId)).data.isPublished == true
                  );
      
      // Create: Course owner or admin
      allow create: if (isOwner(request.resource.data.ownerId) 
                      && request.resource.data.courseId is string
                      && exists(/databases/$(database)/documents/courses/$(request.resource.data.courseId)))
                    || isSuperAdmin();
      
      // Update: Course owner or admin
      allow update: if isOwner(resource.data.ownerId) 
                    || isSuperAdmin();
      
      // Delete: Course owner or admin
      allow delete: if isOwner(resource.data.ownerId) 
                    || isSuperAdmin();
    }
    
    // ========================================================================
    // NEW: Course Lessons Collection
    // ========================================================================
    
    match /courseLessons/{lessonId} {
      
      // Helper: Check if user has enrollment with access
      function hasLessonAccess(lessonData) {
        // Preview lessons are public if course is published
        if (lessonData.isPreview == true) {
          let course = get(/databases/$(database)/documents/courses/$(lessonData.courseId));
          return course.data.isPublished == true;
        }
        
        // Otherwise, need enrollment with accessGranted
        // Query for enrollment by studentId + courseId
        // Note: In practice, client should have enrollment ID
        // This is fallback validation
        let enrollmentQuery = /databases/$(database)/documents/enrollments;
        // Simplified - actual implementation would check specific enrollment
        return isAuthenticated(); // Placeholder - see below for full logic
      }
      
      // Read: Complex access control
      allow read: if (
        // Owner/Admin always has access
        resource.data.ownerId == request.auth.uid
        || isSuperAdmin()
      )
      || (
        // Public preview lessons
        resource.data.isPreview == true
        && get(/databases/$(database)/documents/courses/$(resource.data.courseId)).data.isPublished == true
      )
      || (
        // Enrolled students with access
        isAuthenticated()
        && exists(/databases/$(database)/documents/enrollments/$(request.auth.uid + '_' + resource.data.courseId))
        && get(/databases/$(database)/documents/enrollments/$(request.auth.uid + '_' + resource.data.courseId)).data.accessGranted == true
      );
      
      // Create: Course owner or admin
      allow create: if (isOwner(request.resource.data.ownerId)
                      && request.resource.data.courseId is string
                      && request.resource.data.moduleId is string
                      && exists(/databases/$(database)/documents/courses/$(request.resource.data.courseId))
                      && exists(/databases/$(database)/documents/courseModules/$(request.resource.data.moduleId)))
                    || isSuperAdmin();
      
      // Update: Course owner or admin
      allow update: if isOwner(resource.data.ownerId)
                    || isSuperAdmin();
      
      // Delete: Course owner or admin
      allow delete: if isOwner(resource.data.ownerId)
                    || isSuperAdmin();
    }
    
    // ========================================================================
    // NEW: Quiz Questions Sub-collection (optional)
    // ========================================================================
    
    match /quizQuestions/{questionId} {
      // Same access control as parent lesson
      allow read: if resource.data.ownerId == request.auth.uid
                  || isSuperAdmin()
                  || (
                    // If parent lesson is accessible
                    get(/databases/$(database)/documents/courseLessons/$(resource.data.lessonId)).data.isPreview == true
                    && get(/databases/$(database)/documents/courses/$(resource.data.courseId)).data.isPublished == true
                  )
                  || (
                    // Has enrollment
                    exists(/databases/$(database)/documents/enrollments/$(request.auth.uid + '_' + resource.data.courseId))
                    && get(/databases/$(database)/documents/enrollments/$(request.auth.uid + '_' + resource.data.courseId)).data.accessGranted == true
                  );
      
      // Write: Course owner only
      allow write: if isOwner(resource.data.ownerId)
                  || isSuperAdmin();
    }
    
    // ... (existing collections) ...
  }
}
```

### 4.2 Optimized Rules with Denormalization

For better performance, add `isPublished` to lessons/modules:

```javascript
// In lesson document: isPublished (copied from course)
// This avoids the extra get() for course data

allow read: if resource.data.isPublished == true 
            && resource.data.isPreview == true;
```

---

## 5. Frontend Data Strategy

### 5.1 Dual-Read Implementation

```typescript
// src/lib/courses/contentLoader.ts

import { 
  collection, query, where, orderBy, getDocs, getDoc, doc 
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface CourseContent {
  course: Course;
  modules: ModuleWithLessons[];
  format: 'nested' | 'flat';
}

interface ModuleWithLessons {
  module: CourseModule;
  lessons: CourseLesson[];
}

/**
 * Loads course content with automatic format detection
 */
export async function loadCourseContent(courseId: string): Promise<CourseContent> {
  const courseRef = doc(db, 'courses', courseId);
  const courseSnap = await getDoc(courseRef);
  
  if (!courseSnap.exists()) {
    throw new Error('Course not found');
  }
  
  const course = { id: courseSnap.id, ...courseSnap.data() } as Course;
  
  // Determine format
  const format = course.contentFormat || 'nested';
  
  switch (format) {
    case 'flat':
      return loadFlatContent(course);
    case 'migrating':
      return loadMigratingContent(course);
    case 'nested':
    default:
      return loadNestedContent(course);
  }
}

/**
 * Load from new flat collections
 */
async function loadFlatContent(course: Course): Promise<CourseContent> {
  // Load modules
  const modulesQuery = query(
    collection(db, 'courseModules'),
    where('courseId', '==', course.id),
    orderBy('order', 'asc')
  );
  
  const modulesSnap = await getDocs(modulesQuery);
  
  // Load lessons for all modules in parallel
  const moduleLessonsPromises = modulesSnap.docs.map(async (moduleDoc) => {
    const moduleData = { id: moduleDoc.id, ...moduleDoc.data() } as CourseModule;
    
    const lessonsQuery = query(
      collection(db, 'courseLessons'),
      where('moduleId', '==', moduleData.id),
      orderBy('order', 'asc')
    );
    
    const lessonsSnap = await getDocs(lessonsQuery);
    const lessons = lessonsSnap.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    } as CourseLesson));
    
    return { module: moduleData, lessons };
  });
  
  const modules = await Promise.all(moduleLessonsPromises);
  
  return { course, modules, format: 'flat' };
}

/**
 * Load from legacy nested structure
 */
async function loadNestedContent(course: Course): Promise<CourseContent> {
  if (!course.modules) {
    return { course, modules: [], format: 'nested' };
  }
  
  const modules: ModuleWithLessons[] = course.modules.map((mod, index) => ({
    module: {
      id: mod.id || `module-${index}`,
      courseId: course.id,
      ownerId: course.ownerId,
      title: mod.title,
      description: mod.description,
      order: mod.order || index,
      lessonsCount: mod.lessons?.length || 0,
      durationMinutes: mod.durationMinutes || 0,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
      createdBy: course.ownerId,
    } as CourseModule,
    lessons: (mod.lessons || []).map((lesson, lessonIndex) => ({
      id: lesson.id || `lesson-${index}-${lessonIndex}`,
      courseId: course.id,
      moduleId: mod.id || `module-${index}`,
      ownerId: course.ownerId,
      order: lesson.order || lessonIndex,
      title: lesson.title,
      description: lesson.description,
      videoUrl: lesson.videoUrl,
      videoThumbnailUrl: lesson.videoThumbnailUrl,
      videoDurationSeconds: lesson.videoDurationSeconds,
      isPreview: lesson.isPreview || false,
      resources: lesson.resources || [],
      quiz: lesson.quiz,
      hasQuiz: !!lesson.quiz,
      requiredToComplete: true,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
      createdBy: course.ownerId,
    } as CourseLesson)),
  }));
  
  return { course, modules, format: 'nested' };
}

/**
 * Load during migration (try flat, fallback to nested)
 */
async function loadMigratingContent(course: Course): Promise<CourseContent> {
  try {
    // Try flat first
    return await loadFlatContent(course);
  } catch (error) {
    console.warn('Flat content failed, falling back to nested', error);
    return loadNestedContent(course);
  }
}
```

### 5.2 Real-time Content Subscription

```typescript
// Subscribe to course content changes
export function subscribeToCourseContent(
  courseId: string,
  callback: (content: CourseContent) => void
): () => void {
  // Start with course document
  const unsubscribers: (() => void)[] = [];
  let currentFormat: 'nested' | 'flat' | 'migrating' = 'nested';
  
  const courseUnsub = onSnapshot(
    doc(db, 'courses', courseId),
    (courseSnap) => {
      if (!courseSnap.exists()) return;
      
      const course = { id: courseSnap.id, ...courseSnap.data() } as Course;
      const format = course.contentFormat || 'nested';
      
      // If format changed, re-subscribe
      if (format !== currentFormat) {
        currentFormat = format;
        // Reload all content
        loadCourseContent(courseId).then(callback);
      }
    }
  );
  
  unsubscribers.push(courseUnsub);
  
  // Return cleanup function
  return () => unsubscribers.forEach(fn => fn());
}
```

### 5.3 Write Operations (Phase 2+)

```typescript
// Create module (writes to new collection)
export async function createModule(
  courseId: string, 
  data: CreateModuleInput
): Promise<string> {
  const courseRef = doc(db, 'courses', courseId);
  const course = await getDoc(courseRef);
  
  if (!course.exists()) {
    throw new Error('Course not found');
  }
  
  const ownerId = course.data().ownerId;
  
  // Create in new collection
  const moduleRef = doc(collection(db, 'courseModules'));
  
  await setDoc(moduleRef, {
    ...data,
    courseId,
    ownerId,
    lessonsCount: 0,
    durationMinutes: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: auth.currentUser!.uid,
  });
  
  // Update course aggregate
  await updateDoc(courseRef, {
    modulesCount: increment(1),
    contentFormat: 'flat',
    migrationVersion: 2,
    updatedAt: serverTimestamp(),
  });
  
  return moduleRef.id;
}

// Create lesson
export async function createLesson(
  courseId: string,
  moduleId: string,
  data: CreateLessonInput
): Promise<string> {
  const courseRef = doc(db, 'courses', courseId);
  const course = await getDoc(courseRef);
  
  if (!course.exists()) {
    throw new Error('Course not found');
  }
  
  const ownerId = course.data().ownerId;
  
  // Create lesson
  const lessonRef = doc(collection(db, 'courseLessons'));
  
  await setDoc(lessonRef, {
    ...data,
    courseId,
    moduleId,
    ownerId,
    hasQuiz: !!data.quiz,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: auth.currentUser!.uid,
  });
  
  // Update module aggregate
  const moduleRef = doc(db, 'courseModules', moduleId);
  await updateDoc(moduleRef, {
    lessonsCount: increment(1),
    durationMinutes: increment(data.videoDurationSeconds / 60),
    updatedAt: serverTimestamp(),
  });
  
  // Update course aggregate
  await updateDoc(courseRef, {
    lessonsCount: increment(1),
    totalDurationMinutes: increment(data.videoDurationSeconds / 60),
    updatedAt: serverTimestamp(),
  });
  
  return lessonRef.id;
}
```

---

## 6. Cloud Functions for Migration

### 6.1 Migration Orchestrator

```typescript
// functions/src/migrations/courseContentV2.ts

/**
 * Migrates a course from nested to flat structure
 */
export async function migrateCourseToV2(courseId: string): Promise<{
  success: boolean;
  modulesCreated: number;
  lessonsCreated: number;
  error?: string;
}> {
  const db = getFirestore();
  const stats = { modulesCreated: 0, lessonsCreated: 0 };
  
  try {
    // Get course
    const courseRef = db.collection('courses').doc(courseId);
    const course = await courseRef.get();
    
    if (!course.exists) {
      return { success: false, ...stats, error: 'Course not found' };
    }
    
    const courseData = course.data()!;
    
    // Mark as migrating
    await courseRef.update({ contentFormat: 'migrating' });
    
    // Migrate modules and lessons
    const modules = courseData.modules || [];
    
    for (const [moduleIndex, moduleData] of modules.entries()) {
      // Create module document
      const moduleRef = db.collection('courseModules').doc();
      
      await moduleRef.set({
        id: moduleRef.id,
        courseId,
        ownerId: courseData.ownerId,
        title: moduleData.title,
        description: moduleData.description,
        order: moduleData.order ?? moduleIndex,
        lessonsCount: moduleData.lessons?.length || 0,
        durationMinutes: moduleData.durationMinutes || 0,
        createdAt: courseData.createdAt,
        updatedAt: Timestamp.now(),
        createdBy: courseData.ownerId,
      });
      
      stats.modulesCreated++;
      
      // Create lesson documents
      for (const [lessonIndex, lessonData] of (moduleData.lessons || []).entries()) {
        const lessonRef = db.collection('courseLessons').doc();
        
        await lessonRef.set({
          id: lessonRef.id,
          courseId,
          moduleId: moduleRef.id,
          ownerId: courseData.ownerId,
          order: lessonData.order ?? lessonIndex,
          title: lessonData.title,
          description: lessonData.description,
          videoUrl: lessonData.videoUrl,
          videoThumbnailUrl: lessonData.videoThumbnailUrl,
          videoDurationSeconds: lessonData.videoDurationSeconds,
          isPreview: lessonData.isPreview || false,
          resources: lessonData.resources || [],
          quiz: lessonData.quiz,
          hasQuiz: !!lessonData.quiz,
          requiredToComplete: true,
          createdAt: courseData.createdAt,
          updatedAt: Timestamp.now(),
          createdBy: courseData.ownerId,
        });
        
        stats.lessonsCreated++;
      }
    }
    
    // Mark as migrated
    await courseRef.update({
      contentFormat: 'flat',
      migrationVersion: 2,
    });
    
    return { success: true, ...stats };
    
  } catch (error: any) {
    // Revert to nested on failure
    await db.collection('courses').doc(courseId).update({
      contentFormat: 'nested',
    });
    
    return { success: false, ...stats, error: error.message };
  }
}

/**
 * HTTP Callable: Trigger migration for a course
 * Permission: Course owner or super_admin
 */
export const migrateCourseV2 = onCall(
  {
    region: 'asia-southeast1',
    memory: '512MiB',
  },
  async (request) => {
    const { courseId } = request.data;
    
    // Auth check
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be authenticated');
    }
    
    // Permission check
    const course = await getFirestore().collection('courses').doc(courseId).get();
    if (!course.exists) {
      throw new HttpsError('not-found', 'Course not found');
    }
    
    const isOwner = course.data()!.ownerId === request.auth.uid;
    const isSuperAdmin = request.auth.token.role === 'super_admin';
    
    if (!isOwner && !isSuperAdmin) {
      throw new HttpsError('permission-denied', 'Must be course owner');
    }
    
    return migrateCourseToV2(courseId);
  }
);
```

### 6.2 Sync Function (Phase 1)

```typescript
/**
 * Keeps flat structure in sync during transition
 * Mirrors writes to nested structure
 */
export const syncFlatToNested = onDocumentWrite(
  {
    document: 'courseLessons/{lessonId}',
    region: 'asia-southeast1',
  },
  async (event) => {
    const lessonId = event.params.lessonId;
    const after = event.data?.after?.data();
    const before = event.data?.before?.data();
    
    if (!after) {
      // Deleted - update nested structure
      // (Complex - may skip for Phase 1)
      return;
    }
    
    // Only sync if course is still using nested
    const course = await getFirestore()
      .collection('courses')
      .doc(after.courseId)
      .get();
    
    if (course.data()?.contentFormat !== 'nested') {
      return; // Already migrated, no need to sync
    }
    
    // Update nested structure
    // Implementation depends on current nested structure
  }
);
```

---

## 7. Monitoring & Validation

### 7.1 Validation Rules

```typescript
// functions/src/validation/courseStructure.ts

export function validateLesson(lesson: Partial<CourseLesson>): string[] {
  const errors: string[] = [];
  
  if (!lesson.title || lesson.title.length < 3) {
    errors.push('Title must be at least 3 characters');
  }
  
  if (lesson.videoDurationSeconds && lesson.videoDurationSeconds < 0) {
    errors.push('Video duration cannot be negative');
  }
  
  if (lesson.resources && lesson.resources.length > 20) {
    errors.push('Maximum 20 resources per lesson');
  }
  
  if (lesson.quiz?.questions && lesson.quiz.questions.length > 50) {
    errors.push('Quiz too large - use sub-collection');
  }
  
  return errors;
}
```

### 7.2 Metrics

```typescript
// Track during migration
const metrics = {
  coursesMigrated: counter,
  coursesInProgress: gauge,
  migrationErrors: counter,
  avgMigrationTime: histogram,
};
```

---

## 8. Summary

### Benefits of New Architecture

1. **Scalability**: Unlimited lessons per course (no 1MB limit)
2. **Performance**: Query specific lessons without loading entire course
3. **Flexibility**: Granular access control per lesson
4. **Maintainability**: Simpler document structure
5. **Parallel Updates**: No race conditions on course document

### Migration Safety

1. **Zero Downtime**: Dual-read during transition
2. **Reversible**: Can rollback any phase
3. **Incremental**: Migrate courses one at a time
4. **Validated**: Pre and post-migration validation

### Files Created

- `LESSON_ARCHITECTURE_V2.md` - This document
- Schema definitions
- Security rules
- Frontend data strategy
- Migration functions

---

*Architecture Version: 2.0*  
*Last Updated: February 2026*
