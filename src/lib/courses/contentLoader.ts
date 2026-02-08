/**
 * Course Content Loader - Dual-Read Strategy
 * 
 * This module provides unified loading of course content that supports
 * both legacy (nested) and new (flat) content structures during migration.
 * 
 * Migration Phases:
 * - Phase 1: Read from both, prefer flat if available
 * - Phase 2: Write to flat only, read from both
 * - Phase 3: Read from flat only
 */

import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  getDoc,
  doc,
  onSnapshot,
  QuerySnapshot,
  DocumentSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Course } from '@/types';
import { Timestamp } from 'firebase/firestore';

// ============================================================================
// Type re-exports
// ============================================================================

export interface CourseModuleV2 {
  id: string;
  courseId: string;
  ownerId: string;
  title: string;
  description: string;
  order: number;
  lessonsCount: number;
  durationMinutes: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CourseLessonV2 {
  id: string;
  courseId: string;
  moduleId: string;
  ownerId: string;
  order: number;
  title: string;
  description: string;
  videoUrl?: string;
  videoThumbnailUrl?: string;
  videoDurationSeconds: number;
  isPreview: boolean;
  resources: LessonResourceV2[];
  quiz?: QuizV2;
  hasQuiz: boolean;
  requiredToComplete: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface LessonResourceV2 {
  id: string;
  title: string;
  type: 'pdf' | 'doc' | 'link' | 'image' | 'code';
  url: string;
  fileSize?: number;
  description?: string;
}

export interface QuizV2 {
  id: string;
  title: string;
  passingScore: number;
  questions: QuizQuestionV2[];
}

export interface QuizQuestionV2 {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation?: string;
  points: number;
}

export interface ModuleWithLessons {
  module: CourseModuleV2;
  lessons: CourseLessonV2[];
}

export interface CourseContent {
  course: Course;
  modules: ModuleWithLessons[];
  format: 'nested' | 'flat' | 'migrating';
}

// ============================================================================
// Loading Functions
// ============================================================================

/**
 * Loads course content with automatic format detection
 * 
 * This is the main entry point for loading course content.
 * It detects the content format and loads from the appropriate source.
 * 
 * @param courseId - The course ID to load
 * @returns Course content with format indicator
 */
export async function loadCourseContent(courseId: string): Promise<CourseContent> {
  const courseRef = doc(db, 'courses', courseId);
  const courseSnap = await getDoc(courseRef);

  if (!courseSnap.exists()) {
    throw new Error(`Course ${courseId} not found`);
  }

  const course = { id: courseSnap.id, ...courseSnap.data() } as Course;

  // Determine format from course document
  const format = (course as any).contentFormat || 'nested';

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
 * Load content from new flat collections
 * 
 * Queries:
 * 1. Get all modules for course (ordered)
 * 2. Get all lessons for each module (ordered)
 */
async function loadFlatContent(course: Course): Promise<CourseContent> {
  const courseId = course.id;

  // Load modules
  const modulesQuery = query(
    collection(db, 'courseModules'),
    where('courseId', '==', courseId),
    orderBy('order', 'asc')
  );

  const modulesSnap = await getDocs(modulesQuery);

  // Load lessons for all modules in parallel
  const moduleLessonsPromises = modulesSnap.docs.map(async (moduleDoc) => {
    const moduleData = { id: moduleDoc.id, ...moduleDoc.data() } as CourseModuleV2;

    const lessonsQuery = query(
      collection(db, 'courseLessons'),
      where('moduleId', '==', moduleData.id),
      orderBy('order', 'asc')
    );

    const lessonsSnap = await getDocs(lessonsQuery);
    const lessons = lessonsSnap.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as CourseLessonV2)
    );

    return { module: moduleData, lessons };
  });

  const modules = await Promise.all(moduleLessonsPromises);

  return { course, modules, format: 'flat' };
}

/**
 * Load content from legacy nested structure
 * 
 * Converts nested arrays to flat structure format
 */
async function loadNestedContent(course: Course): Promise<CourseContent> {
  const nestedModules = (course as any).modules || [];

  const modules: ModuleWithLessons[] = nestedModules.map(
    (mod: any, moduleIndex: number) => ({
      module: {
        id: mod.id || `module-${moduleIndex}`,
        courseId: course.id,
        ownerId: course.ownerId,
        title: mod.title,
        description: mod.description || '',
        order: mod.order ?? moduleIndex,
        lessonsCount: mod.lessons?.length || 0,
        durationMinutes: mod.durationMinutes || 0,
        createdAt: course.createdAt,
        updatedAt: course.updatedAt,
        createdBy: course.ownerId,
      } as CourseModuleV2,
      lessons: (mod.lessons || []).map((lesson: any, lessonIndex: number) => ({
        id: lesson.id || `lesson-${moduleIndex}-${lessonIndex}`,
        courseId: course.id,
        moduleId: mod.id || `module-${moduleIndex}`,
        ownerId: course.ownerId,
        order: lesson.order ?? lessonIndex,
        title: lesson.title,
        description: lesson.description || '',
        videoUrl: lesson.videoUrl,
        videoThumbnailUrl: lesson.videoThumbnailUrl,
        videoDurationSeconds: lesson.videoDurationSeconds || 0,
        isPreview: lesson.isPreview || false,
        resources: lesson.resources || [],
        quiz: lesson.quiz,
        hasQuiz: !!lesson.quiz,
        requiredToComplete: true,
        createdAt: course.createdAt,
        updatedAt: course.updatedAt,
        createdBy: course.ownerId,
      } as CourseLessonV2)),
    })
  );

  return { course, modules, format: 'nested' };
}

/**
 * Load during migration with fallback
 * 
 * Tries flat structure first, falls back to nested if flat fails
 */
async function loadMigratingContent(course: Course): Promise<CourseContent> {
  try {
    // Try flat first (new structure)
    return await loadFlatContent(course);
  } catch (error) {
    console.warn('[CourseLoader] Flat content failed, falling back to nested', error);
    return loadNestedContent(course);
  }
}

// ============================================================================
// Single Lesson Loading
// ============================================================================

/**
 * Load a single lesson by ID
 * 
 * More efficient than loading entire course when only one lesson needed
 * 
 * @param lessonId - The lesson ID
 * @returns The lesson or null if not found
 */
export async function loadLessonById(lessonId: string): Promise<CourseLessonV2 | null> {
  const lessonRef = doc(db, 'courseLessons', lessonId);
  const lessonSnap = await getDoc(lessonRef);

  if (!lessonSnap.exists()) {
    return null;
  }

  return { id: lessonSnap.id, ...lessonSnap.data() } as CourseLessonV2;
}

/**
 * Load lesson with course and module context
 * 
 * @param lessonId - The lesson ID
 * @returns Lesson with parent context
 */
export async function loadLessonWithContext(lessonId: string): Promise<{
  lesson: CourseLessonV2;
  module: CourseModuleV2;
  course: Course;
} | null> {
  // Load lesson
  const lesson = await loadLessonById(lessonId);
  if (!lesson) return null;

  // Load module
  const moduleRef = doc(db, 'courseModules', lesson.moduleId);
  const moduleSnap = await getDoc(moduleRef);
  if (!moduleSnap.exists()) return null;

  const module = { id: moduleSnap.id, ...moduleSnap.data() } as CourseModuleV2;

  // Load course
  const courseRef = doc(db, 'courses', lesson.courseId);
  const courseSnap = await getDoc(courseRef);
  if (!courseSnap.exists()) return null;

  const course = { id: courseSnap.id, ...courseSnap.data() } as Course;

  return { lesson, module, course };
}

// ============================================================================
// Real-time Subscriptions
// ============================================================================

interface ContentCallbacks {
  onContent?: (content: CourseContent) => void;
  onError?: (error: Error) => void;
  onLoading?: (loading: boolean) => void;
}

/**
 * Subscribe to course content changes
 * 
 * Watches for changes in both course document and content collections
 * 
 * @param courseId - The course ID to watch
 * @param callbacks - Callback functions
 * @returns Unsubscribe function
 */
export function subscribeToCourseContent(
  courseId: string,
  callbacks: ContentCallbacks
): () => void {
  const unsubscribers: (() => void)[] = [];
  let lastFormat: string | null = null;

  const { onContent, onError, onLoading } = callbacks;

  onLoading?.(true);

  // Watch course document for format changes
  const courseUnsub = onSnapshot(
    doc(db, 'courses', courseId),
    async (courseSnap) => {
      if (!courseSnap.exists()) {
        onError?.(new Error('Course not found'));
        return;
      }

      const course = { id: courseSnap.id, ...courseSnap.data() } as Course;
      const format = (course as any).contentFormat || 'nested';

      // If format changed, reload everything
      if (format !== lastFormat) {
        lastFormat = format;

        try {
          const content = await loadCourseContent(courseId);
          onContent?.(content);
        } catch (error) {
          onError?.(error as Error);
        }
      }
    },
    (error) => onError?.(error)
  );

  unsubscribers.push(courseUnsub);

  // Return cleanup
  return () => {
    unsubscribers.forEach((fn) => fn());
  };
}

/**
 * Subscribe to a single lesson
 * 
 * @param lessonId - The lesson ID
 * @param onLesson - Callback when lesson changes
 * @param onError - Callback on error
 * @returns Unsubscribe function
 */
export function subscribeToLesson(
  lessonId: string,
  onLesson: (lesson: CourseLessonV2) => void,
  onError?: (error: Error) => void
): () => void {
  return onSnapshot(
    doc(db, 'courseLessons', lessonId),
    (snap) => {
      if (snap.exists()) {
        onLesson({ id: snap.id, ...snap.data() } as CourseLessonV2);
      }
    },
    onError || console.error
  );
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculate total duration of a course
 * 
 * @param content - Course content
 * @returns Total duration in minutes
 */
export function calculateTotalDuration(content: CourseContent): number {
  return content.modules.reduce((total, mod) => {
    return (
      total +
      mod.lessons.reduce((modTotal, lesson) => {
        return modTotal + (lesson.videoDurationSeconds || 0) / 60;
      }, 0)
    );
  }, 0);
}

/**
 * Find a specific lesson in content
 * 
 * @param content - Course content
 * @param lessonId - Lesson ID to find
 * @returns Lesson with module index and lesson index
 */
export function findLessonInContent(
  content: CourseContent,
  lessonId: string
): { lesson: CourseLessonV2; moduleIndex: number; lessonIndex: number } | null {
  for (let moduleIndex = 0; moduleIndex < content.modules.length; moduleIndex++) {
    const mod = content.modules[moduleIndex];
    const lessonIndex = mod.lessons.findIndex((l) => l.id === lessonId);

    if (lessonIndex !== -1) {
      return {
        lesson: mod.lessons[lessonIndex],
        moduleIndex,
        lessonIndex,
      };
    }
  }

  return null;
}

/**
 * Get next lesson in sequence
 * 
 * @param content - Course content
 * @param currentLessonId - Current lesson ID
 * @returns Next lesson or null if at end
 */
export function getNextLesson(
  content: CourseContent,
  currentLessonId: string
): CourseLessonV2 | null {
  const current = findLessonInContent(content, currentLessonId);
  if (!current) return null;

  const { moduleIndex, lessonIndex } = current;
  const mod = content.modules[moduleIndex];

  // Next lesson in same module
  if (lessonIndex < mod.lessons.length - 1) {
    return mod.lessons[lessonIndex + 1];
  }

  // First lesson of next module
  const nextModule = content.modules[moduleIndex + 1];
  if (nextModule && nextModule.lessons.length > 0) {
    return nextModule.lessons[0];
  }

  return null;
}

/**
 * Get previous lesson in sequence
 * 
 * @param content - Course content
 * @param currentLessonId - Current lesson ID
 * @returns Previous lesson or null if at start
 */
export function getPreviousLesson(
  content: CourseContent,
  currentLessonId: string
): CourseLessonV2 | null {
  const current = findLessonInContent(content, currentLessonId);
  if (!current) return null;

  const { moduleIndex, lessonIndex } = current;

  // Previous lesson in same module
  if (lessonIndex > 0) {
    return content.modules[moduleIndex].lessons[lessonIndex - 1];
  }

  // Last lesson of previous module
  if (moduleIndex > 0) {
    const prevModule = content.modules[moduleIndex - 1];
    if (prevModule.lessons.length > 0) {
      return prevModule.lessons[prevModule.lessons.length - 1];
    }
  }

  return null;
}
