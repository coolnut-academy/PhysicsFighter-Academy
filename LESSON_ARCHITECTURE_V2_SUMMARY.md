# Lesson Architecture V2 - Implementation Summary

> **Status**: Ready for Deployment  
> **Migration Type**: Incremental, Zero-Downtime  
> **Backward Compatible**: Yes

---

## Quick Overview

### Current Problem
```
/courses/{courseId}
  └── modules[]                    # Nested array
       └── lessons[]               # Nested array (1MB limit!)
            └── resources[]        # Deep nesting
```

### New Solution
```
/courses/{courseId}                # Metadata only (~2KB)
/courseModules/{moduleId}          # Flat collection
/courseLessons/{lessonId}          # Flat collection
/quizQuestions/{questionId}        # Optional sub-collection
```

---

## Schema Delta

### New Collections

| Collection | Purpose | Document Size |
|------------|---------|---------------|
| `courseModules` | Module metadata | ~1KB |
| `courseLessons` | Lesson content | ~5-10KB |
| `quizQuestions` | Large quizzes (optional) | ~2KB each |

### New Fields in `courses`

| Field | Type | Purpose |
|-------|------|---------|
| `contentFormat` | `string` | `'nested' \| 'flat' \| 'migrating'` |
| `migrationVersion` | `number` | Schema version (2) |
| `modulesCount` | `number` | Aggregated count |
| `lessonsCount` | `number` | Aggregated count |

### Legacy Fields (Preserved)

| Field | Status | Notes |
|-------|--------|-------|
| `modules[]` | Deprecated | Kept until Phase 3 for rollback |

---

## Migration Roadmap (3-Phase)

```
Week 1: Preparation
├── Deploy new collections
├── Deploy Cloud Functions
└── Deploy updated security rules

Week 2-3: Phase 1 - Dual-Read
├── Frontend reads from both sources
├── Prefers flat if available
└── All writes go to nested (legacy)

Week 4-5: Phase 2 - Write-New / Read-Both
├── All writes go to flat (new)
├── Reads still support both
├── Migrate existing courses
└── Test thoroughly

Week 6+: Phase 3 - Deprecation
├── Remove legacy code
├── Delete nested modules[]
└── Simplify rules
```

---

## Security Rules

### Ownership Model

```
Course (ownerId)
  ↓ copied to
Module (ownerId)
  ↓ copied to
Lesson (ownerId)
```

### Access Control

| Resource | Read | Write |
|----------|------|-------|
| Module | Course owner, Admin, or Course published | Course owner or Admin |
| Lesson | Course owner, Admin, Enrolled student (with access), or Preview | Course owner or Admin |

### Key Rule Patterns

```javascript
// Lesson access with preview support
allow read: if (
  // Owner/Admin
  isOwner(resource.data.ownerId) || isSuperAdmin()
) || (
  // Public preview
  resource.data.isPreview == true 
  && isCoursePublished(resource.data.courseId)
) || (
  // Enrolled with access
  hasEnrollmentAccess(resource.data.courseId)
);
```

---

## Frontend Integration

### Dual-Read Strategy

```typescript
// Automatic format detection
const content = await loadCourseContent(courseId);
// Returns: { course, modules, format: 'nested' | 'flat' | 'migrating' }

// Components work with both formats
<CourseViewer content={content} />
```

### Real-time Updates

```typescript
// Subscribe to content changes
const unsubscribe = subscribeToCourseContent(
  courseId,
  {
    onContent: (content) => setContent(content),
    onError: (error) => toast.error(error.message),
  }
);
```

### Navigation

```typescript
// Get next/previous lessons
const nextLesson = getNextLesson(content, currentLessonId);
const prevLesson = getPreviousLesson(content, currentLessonId);
```

---

## Cloud Functions

### Migration Functions

| Function | Trigger | Purpose |
|----------|---------|---------|
| `migrateCourseV2` | HTTP Callable | Migrate single course |
| `batchMigrateCoursesV2` | HTTP Callable | Migrate up to 50 courses |
| `rollbackCourseV2` | HTTP Callable | Rollback to nested |

### Usage

```bash
# Deploy
firebase deploy --only functions

# Migrate single course (owner or admin)
curl -X POST https://.../migrateCourseV2 \
  -d '{"courseId": "course123", "dryRun": true}'

# Batch migrate (super admin only)
curl -X POST https://.../batchMigrateCoursesV2 \
  -d '{"courseIds": ["c1", "c2"], "dryRun": false}'
```

---

## File Structure

```
functions/src/
├── migrations/
│   └── courseContentV2.ts    # Migration functions
├── enrollments/              # (existing)
├── auth/                     # (existing)
└── index.ts                  # Updated exports

src/lib/courses/
└── contentLoader.ts          # Dual-read loader

firestore-rules-lesson-v2.rules  # New rules
LESSON_ARCHITECTURE_V2.md        # Full documentation
```

---

## Deployment Checklist

### Pre-deployment
- [ ] Backup existing courses collection
- [ ] Test migration on staging
- [ ] Verify Firestore indexes created

### Deployment
- [ ] Deploy Cloud Functions
- [ ] Deploy Firestore rules
- [ ] Deploy frontend with dual-read

### Post-deployment (Phase 1)
- [ ] Verify dual-read working
- [ ] Monitor error rates
- [ ] Check performance metrics

### Migration (Phase 2)
- [ ] Run migration for test courses
- [ ] Validate migrated data
- [ ] Migrate production courses gradually

### Cleanup (Phase 3)
- [ ] Verify 100% migration
- [ ] Remove legacy code
- [ ] Update documentation

---

## Rollback Plan

### Phase 1-2 Rollback
```bash
# Instant - switch back to reading nested
# No data migration needed
firebase functions:delete migrateCourseV2,batchMigrateCoursesV2
```

### Phase 3 Rollback (if needed)
```bash
# Use rollback function (super admin only)
curl -X POST https://.../rollbackCourseV2 \
  -d '{"courseId": "course123", "deleteFlat": false}'
```

---

## Performance Comparison

| Metric | V1 (Nested) | V2 (Flat) |
|--------|-------------|-----------|
| Course doc size | 50-500KB | ~2KB |
| Max lessons/course | ~50-100 | Unlimited |
| Load single lesson | Load entire course | ~5KB read |
| Query lessons | Not possible | Full query support |
| Parallel updates | Race conditions | Independent |

---

## Edge Cases Handled

| Case | Solution |
|------|----------|
| Migration interruption | Resume from checkpoint, idempotent |
| Partial migration | Validation detects mismatches |
| Large courses (>100 lessons) | Batched processing |
| Concurrent edits | Transaction-based updates |
| Rollback needed | Preserves nested during Phase 1-2 |

---

## Monitoring

### Key Metrics
- Migration success rate
- Read latency comparison
- Error rates
- Document size distribution

### Alerts
- Migration failures > 5%
- Read latency > 500ms
- Rollback requests

---

*Implementation Date: February 2026*  
*Architecture Version: 2.0*
