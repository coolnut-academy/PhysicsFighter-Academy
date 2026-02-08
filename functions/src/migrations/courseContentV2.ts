/**
 * Course Content V2 Migration
 * 
 * Migrates courses from nested modules/lessons to flat collections.
 * 
 * Migration Strategy:
 * 1. Read course with nested structure
 * 2. Create module documents
 * 3. Create lesson documents with references
 * 4. Update course metadata
 * 5. Mark course as migrated
 */

import { onCall } from 'firebase-functions/v2/https';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';

const db = getFirestore();

// ============================================================================
// Configuration
// ============================================================================

const REGION = 'asia-southeast1';
const MEMORY = '512MiB';
const TIMEOUT_SECONDS = 300; // 5 minutes for large courses

// ============================================================================
// Types
// ============================================================================

interface MigrationResult {
  success: boolean;
  courseId: string;
  modulesCreated: number;
  lessonsCreated: number;
  errors?: string[];
  durationMs?: number;
}

interface LegacyLesson {
  id?: string;
  title: string;
  description?: string;
  order?: number;
  videoUrl?: string;
  videoThumbnailUrl?: string;
  videoDurationSeconds?: number;
  isPreview?: boolean;
  resources?: any[];
  quiz?: any;
}

interface LegacyModule {
  id?: string;
  title: string;
  description?: string;
  order?: number;
  durationMinutes?: number;
  lessons?: LegacyLesson[];
}

// ============================================================================
// Main Migration Function
// ============================================================================

/**
 * Migrates a single course from nested to flat structure
 * 
 * @param courseId - The course ID to migrate
 * @param options - Migration options
 * @returns Migration result
 */
export async function migrateCourseToV2(
  courseId: string,
  options: { dryRun?: boolean } = {}
): Promise<MigrationResult> {
  const startTime = Date.now();
  const result: MigrationResult = {
    success: false,
    courseId,
    modulesCreated: 0,
    lessonsCreated: 0,
    errors: [],
  };

  logger.info('Starting course migration', { courseId, dryRun: options.dryRun });

  try {
    // Get course document
    const courseRef = db.collection('courses').doc(courseId);
    const courseSnap = await courseRef.get();

    if (!courseSnap.exists) {
      throw new Error(`Course ${courseId} not found`);
    }

    const courseData = courseSnap.data()!;

    // Check if already migrated
    if (courseData.contentFormat === 'flat' && !options.dryRun) {
      logger.info('Course already migrated', { courseId });
      return { ...result, success: true };
    }

    // Check for nested modules
    const nestedModules: LegacyModule[] = courseData.modules || [];
    
    if (nestedModules.length === 0) {
      logger.info('Course has no modules to migrate', { courseId });
      
      if (!options.dryRun) {
        await courseRef.update({
          contentFormat: 'flat',
          migrationVersion: 2,
          modulesCount: 0,
          lessonsCount: 0,
        });
      }
      
      return { ...result, success: true };
    }

    // Mark as migrating (if not dry run)
    if (!options.dryRun) {
      await courseRef.update({ contentFormat: 'migrating' });
    }

    // Migrate each module
    for (const [moduleIndex, moduleData] of nestedModules.entries()) {
      try {
        // Create module document
        const moduleRef = db.collection('courseModules').doc();
        const moduleId = moduleRef.id;

        const moduleDoc = {
          id: moduleId,
          courseId,
          ownerId: courseData.ownerId,
          title: moduleData.title,
          description: moduleData.description || '',
          order: moduleData.order ?? moduleIndex,
          lessonsCount: moduleData.lessons?.length || 0,
          durationMinutes: moduleData.durationMinutes || 0,
          createdAt: courseData.createdAt || Timestamp.now(),
          updatedAt: Timestamp.now(),
          createdBy: courseData.ownerId,
          // Denormalize for rules
          isPublished: courseData.isPublished || false,
        };

        if (!options.dryRun) {
          await moduleRef.set(moduleDoc);
        }

        result.modulesCreated++;
        logger.info('Module created', { 
          courseId, 
          moduleId, 
          title: moduleData.title,
          dryRun: options.dryRun 
        });

        // Migrate lessons
        const lessons = moduleData.lessons || [];
        
        for (const [lessonIndex, lessonData] of lessons.entries()) {
          try {
            const lessonRef = db.collection('courseLessons').doc();
            const lessonId = lessonRef.id;

            const lessonDoc = {
              id: lessonId,
              courseId,
              moduleId,
              ownerId: courseData.ownerId,
              order: lessonData.order ?? lessonIndex,
              title: lessonData.title,
              description: lessonData.description || '',
              videoUrl: lessonData.videoUrl || null,
              videoThumbnailUrl: lessonData.videoThumbnailUrl || null,
              videoDurationSeconds: lessonData.videoDurationSeconds || 0,
              isPreview: lessonData.isPreview || false,
              resources: lessonData.resources || [],
              quiz: lessonData.quiz || null,
              hasQuiz: !!lessonData.quiz,
              requiredToComplete: true,
              createdAt: courseData.createdAt || Timestamp.now(),
              updatedAt: Timestamp.now(),
              createdBy: courseData.ownerId,
              // Denormalize for rules
              isPublished: courseData.isPublished || false,
            };

            if (!options.dryRun) {
              await lessonRef.set(lessonDoc);
            }

            result.lessonsCreated++;
          } catch (lessonError: any) {
            const errorMsg = `Failed to migrate lesson ${lessonData.title}: ${lessonError.message}`;
            logger.error(errorMsg, { courseId, moduleIndex, lessonIndex });
            result.errors!.push(errorMsg);
          }
        }
      } catch (moduleError: any) {
        const errorMsg = `Failed to migrate module ${moduleData.title}: ${moduleError.message}`;
        logger.error(errorMsg, { courseId, moduleIndex });
        result.errors!.push(errorMsg);
      }
    }

    // Update course metadata
    if (!options.dryRun) {
      await courseRef.update({
        contentFormat: 'flat',
        migrationVersion: 2,
        modulesCount: result.modulesCreated,
        lessonsCount: result.lessonsCreated,
        // Keep nested modules for rollback (removed in Phase 3)
        // modules: FieldValue.delete(), // Uncomment in Phase 3
      });
    }

    result.success = result.errors!.length === 0;
    result.durationMs = Date.now() - startTime;

    logger.info('Migration complete', { 
      courseId, 
      success: result.success,
      modulesCreated: result.modulesCreated,
      lessonsCreated: result.lessonsCreated,
      durationMs: result.durationMs,
      dryRun: options.dryRun,
    });

    return result;

  } catch (error: any) {
    const errorMsg = `Migration failed: ${error.message}`;
    logger.error(errorMsg, { courseId, stack: error.stack });
    
    // Revert to nested on failure
    if (!options.dryRun) {
      try {
        await db.collection('courses').doc(courseId).update({
          contentFormat: 'nested',
        });
      } catch (revertError) {
        logger.error('Failed to revert course format', { courseId, revertError });
      }
    }

    result.errors!.push(errorMsg);
    result.durationMs = Date.now() - startTime;
    return result;
  }
}

// ============================================================================
// HTTP Callable: Trigger Migration
// ============================================================================

/**
 * HTTP Callable: Migrate a course to V2
 * 
 * Permission: Course owner or super_admin
 */
export const migrateCourseV2 = onCall(
  {
    region: REGION,
    memory: MEMORY,
    timeoutSeconds: TIMEOUT_SECONDS,
  },
  async (request) => {
    const { courseId, dryRun = false } = request.data;

    // Auth check
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be authenticated');
    }

    // Validate input
    if (!courseId || typeof courseId !== 'string') {
      throw new HttpsError('invalid-argument', 'courseId is required');
    }

    // Get course and check permissions
    const course = await db.collection('courses').doc(courseId).get();
    
    if (!course.exists) {
      throw new HttpsError('not-found', 'Course not found');
    }

    const courseData = course.data()!;
    const isOwner = courseData.ownerId === request.auth.uid;
    const isSuperAdmin = request.auth.token?.role === 'super_admin';

    if (!isOwner && !isSuperAdmin) {
      throw new HttpsError('permission-denied', 'Must be course owner or super_admin');
    }

    // Execute migration
    const result = await migrateCourseToV2(courseId, { dryRun });
    
    return result;
  }
);

// ============================================================================
// HTTP Callable: Batch Migration (Super Admin Only)
// ============================================================================

/**
 * HTTP Callable: Migrate multiple courses
 * 
 * Permission: super_admin only
 */
export const batchMigrateCoursesV2 = onCall(
  {
    region: REGION,
    memory: '1GiB',
    timeoutSeconds: 540, // 9 minutes
  },
  async (request) => {
    const { courseIds, dryRun = true } = request.data;

    // Auth check
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be authenticated');
    }

    // Super admin only
    if (request.auth.token?.role !== 'super_admin') {
      throw new HttpsError('permission-denied', 'Super admin only');
    }

    // Validate
    if (!Array.isArray(courseIds) || courseIds.length === 0) {
      throw new HttpsError('invalid-argument', 'courseIds array required');
    }

    if (courseIds.length > 50) {
      throw new HttpsError('invalid-argument', 'Maximum 50 courses per batch');
    }

    logger.info('Starting batch migration', { count: courseIds.length, dryRun });

    const results: MigrationResult[] = [];
    
    for (const courseId of courseIds) {
      const result = await migrateCourseToV2(courseId, { dryRun });
      results.push(result);
      
      // Small delay to prevent rate limiting
      if (!dryRun) {
        await new Promise(r => setTimeout(r, 100));
      }
    }

    const summary = {
      total: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      totalModules: results.reduce((sum, r) => sum + r.modulesCreated, 0),
      totalLessons: results.reduce((sum, r) => sum + r.lessonsCreated, 0),
      results,
    };

    logger.info('Batch migration complete', summary);
    return summary;
  }
);

// ============================================================================
// Rollback Function
// ============================================================================

/**
 * HTTP Callable: Rollback a course to V1 (nested)
 * 
 * Permission: super_admin only
 */
export const rollbackCourseV2 = onCall(
  {
    region: REGION,
    memory: MEMORY,
    timeoutSeconds: TIMEOUT_SECONDS,
  },
  async (request) => {
    const { courseId, deleteFlat = false } = request.data;

    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be authenticated');
    }

    if (request.auth.token?.role !== 'super_admin') {
      throw new HttpsError('permission-denied', 'Super admin only');
    }

    logger.info('Starting rollback', { courseId, deleteFlat });

    try {
      // Update course to nested format
      await db.collection('courses').doc(courseId).update({
        contentFormat: 'nested',
        migrationVersion: FieldValue.delete(),
      });

      // Optionally delete flat documents
      if (deleteFlat) {
        // Delete lessons
        const lessonsQuery = await db.collection('courseLessons')
          .where('courseId', '==', courseId)
          .get();
        
        const lessonBatch = db.batch();
        lessonsQuery.docs.forEach(doc => lessonBatch.delete(doc.ref));
        await lessonBatch.commit();

        // Delete modules
        const modulesQuery = await db.collection('courseModules')
          .where('courseId', '==', courseId)
          .get();
        
        const moduleBatch = db.batch();
        modulesQuery.docs.forEach(doc => moduleBatch.delete(doc.ref));
        await moduleBatch.commit();

        logger.info('Deleted flat documents', { 
          courseId, 
          lessonsDeleted: lessonsQuery.size,
          modulesDeleted: modulesQuery.size,
        });
      }

      return { success: true, courseId, deleteFlat };

    } catch (error: any) {
      logger.error('Rollback failed', { courseId, error: error.message });
      throw new HttpsError('internal', `Rollback failed: ${error.message}`);
    }
  }
);

// ============================================================================
// Sync Function (Phase 1-2)
// ============================================================================

/**
 * Syncs writes from flat structure back to nested (during transition)
 * 
 * This ensures nested structure stays up-to-date during Phase 1-2
 */
export const syncFlatToNested = onDocumentWritten(
  {
    document: 'courseLessons/{lessonId}',
    region: REGION,
    memory: '256MiB',
  },
  async (event: any) => {
    const lessonId = event.params.lessonId;
    const after = event.data?.after?.data();
    const before = event.data?.before?.data();

    // Determine course ID
    const courseId = after?.courseId || before?.courseId;
    
    if (!courseId) {
      logger.warn('No courseId found for lesson', { lessonId });
      return;
    }

    // Check if course needs sync (nested or migrating)
    const course = await db.collection('courses').doc(courseId).get();
    const contentFormat = course.data()?.contentFormat;

    if (contentFormat === 'flat') {
      // Already migrated, no need to sync back
      return;
    }

    if (!after) {
      // Lesson deleted - complex to remove from nested, log for manual fix
      logger.info('Lesson deleted, nested structure may need manual update', {
        lessonId,
        courseId,
      });
      return;
    }

    // Sync to nested structure
    // This is a simplified version - full implementation would update the nested array
    logger.debug('Would sync to nested', { lessonId, courseId, action: after ? 'update' : 'delete' });
    
    // Note: Full implementation would:
    // 1. Find the lesson in the nested modules array
    // 2. Update the corresponding fields
    // 3. Update the course document
    // 
    // This is complex and may not be worth implementing if migration is fast
  }
);

// ============================================================================
// Validation Function
// ============================================================================

/**
 * Validates that a course was migrated correctly
 */
export async function validateMigration(courseId: string): Promise<{
  valid: boolean;
  errors: string[];
  warnings: string[];
}> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const course = await db.collection('courses').doc(courseId).get();
    
    if (!course.exists) {
      return { valid: false, errors: ['Course not found'], warnings: [] };
    }

    const courseData = course.data()!;

    // Check format
    if (courseData.contentFormat !== 'flat') {
      errors.push(`Course format is ${courseData.contentFormat}, expected flat`);
    }

    // Get flat structure counts
    const modulesQuery = await db.collection('courseModules')
      .where('courseId', '==', courseId)
      .get();
    
    const lessonsQuery = await db.collection('courseLessons')
      .where('courseId', '==', courseId)
      .get();

    const flatModuleCount = modulesQuery.size;
    const flatLessonCount = lessonsQuery.size;

    // Compare with nested (if still present)
    if (courseData.modules) {
      const nestedModuleCount = courseData.modules.length;
      const nestedLessonCount = courseData.modules.reduce(
        (sum: number, mod: any) => sum + (mod.lessons?.length || 0), 
        0
      );

      if (flatModuleCount !== nestedModuleCount) {
        errors.push(`Module count mismatch: flat=${flatModuleCount}, nested=${nestedModuleCount}`);
      }

      if (flatLessonCount !== nestedLessonCount) {
        errors.push(`Lesson count mismatch: flat=${flatLessonCount}, nested=${nestedLessonCount}`);
      }
    }

    // Check metadata
    if (courseData.modulesCount !== flatModuleCount) {
      warnings.push(`Course modulesCount (${courseData.modulesCount}) doesn't match actual (${flatModuleCount})`);
    }

    if (courseData.lessonsCount !== flatLessonCount) {
      warnings.push(`Course lessonsCount (${courseData.lessonsCount}) doesn't match actual (${flatLessonCount})`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };

  } catch (error: any) {
    return {
      valid: false,
      errors: [`Validation error: ${error.message}`],
      warnings: [],
    };
  }
}
