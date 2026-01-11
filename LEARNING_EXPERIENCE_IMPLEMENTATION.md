# Final Phase: Student Learning Experience

## ✅ Created Components & Pages

### **1. Time Calculation Utilities**

**File:** `src/lib/utils.ts` (additions)

**Added Functions:**
```typescript
export interface TimeRemaining {
  days: number;
  hours: number;
  expired: boolean;
  percentage: number; // 0-100 for progress bar
}

export function calculateTimeRemaining(enrollment: Enrollment): TimeRemaining {
  const now = new Date();
  const expiresAt = enrollment.expiresAt.toDate();
  const startDate = enrollment.startDate.toDate();
  
  // Check if expired
  const expired = isPast(expiresAt);
  
  if (expired) {
    return { days: 0, hours: 0, expired: true, percentage: 0 };
  }
  
  // Calculate remaining time
  const days = differenceInDays(expiresAt, now);
  const hours = differenceInHours(expiresAt, now) % 24;
  
  // Calculate percentage remaining (for progress bar)
  const totalDuration = expiresAt.getTime() - startDate.getTime();
  const timeUsed = now.getTime() - startDate.getTime();
  const percentage = 100 - (timeUsed / totalDuration) * 100;
  
  return { days, hours, expired: false, percentage };
}
```

**Uses date-fns:**
- ✅ `isPast()` - Check if date has passed
- ✅ `differenceInDays()` - Get days remaining
- ✅ `differenceInHours()` - Get hours remaining

---

### **2. MyLearningCard Component**

**File:** `src/components/learn/MyLearningCard.tsx`

**Critical Features:**

#### **Countdown Timer** ✅
```typescript
const [timeRemaining, setTimeRemaining] = useState(calculateTimeRemaining(enrollment));

// Update every minute
useEffect(() => {
  const interval = setInterval(() => {
    setTimeRemaining(calculateTimeRemaining(enrollment));
  }, 60000);
  return () => clearInterval(interval);
}, [enrollment]);
```

#### **Progress Bar** ✅
```typescript
<div className="relative h-2 bg-dark-bg-secondary rounded-full">
  <div
    className={getProgressBarColor()} // Changes based on time remaining
    style={{ width: `${timeRemaining.percentage}%` }}
  />
</div>
```

**Color Logic:**
- Red: Expired or < 20% time left
- Yellow: < 50% time left
- Cyan: > 50% time left

#### **Expiration Logic** ✅
```typescript
{timeRemaining.expired ? (
  <Button disabled className="opacity-50 cursor-not-allowed">
    <AlertCircle className="w-4 h-4 mr-2" />
    Access Expired
  </Button>
) : (
  <Link href={`/learn/course/${enrollment.courseId}`}>
    <Button className="neon-button">
      <Play className="w-4 h-4 mr-2" />
      {enrollment.overallProgress > 0 ? 'Continue Learning' : 'Start Course'}
    </Button>
  </Link>
)}
```

**Display Elements:**
- ✅ Course thumbnail
- ✅ Status badge (Active/Expired)
- ✅ Progress badge (X% Complete)
- ✅ Countdown: "30d 12h remaining"
- ✅ Progress bar (color-coded)
- ✅ Warning for < 7 days
- ✅ Disabled "Enter Class" if expired

---

### **3. My Learning Dashboard**

**File:** `app/learn/dashboard/page.tsx`

**Features:**

#### **Query Enrollments** ✅
```typescript
const q = query(
  collection(db, COLLECTIONS.ENROLLMENTS),
  where('studentId', '==', user?.id)
);
```

#### **Stats Cards** ✅
- Active Courses
- Completed Courses
- Total Courses

#### **Course Grid** ✅
- Displays all enrollments with MyLearningCard
- Empty state with link to browse courses

---

### **4. Course Player**

**File:** `app/learn/course/[id]/page.tsx`

**Protection Logic** ✅ - CRITICAL

```typescript
const checkEnrollmentAndLoadCourse = async () => {
  // 1. Check if student is enrolled
  const enrollmentQuery = query(
    collection(db, COLLECTIONS.ENROLLMENTS),
    where('studentId', '==', user?.id),
    where('courseId', '==', courseId)
  );
  
  if (enrollmentSnapshot.empty) {
    // Not enrolled → redirect
    router.push('/courses');
    return;
  }
  
  const enrollment = enrollmentSnapshot.docs[0].data();
  
  // 2. Check if expired
  const timeRemaining = calculateTimeRemaining(enrollment);
  if (timeRemaining.expired) {
    toast({ title: 'Access Expired' });
    router.push('/learn/dashboard');
    return;
  }
  
  // 3. Check if status is active
  if (enrollment.status !== 'active') {
    toast({ title: 'Enrollment not active' });
    router.push('/learn/dashboard');
    return;
  }
  
  // ✅ AUTHORIZED - load course
  setAuthorized(true);
  setCourse(courseData);
};
```

**Layout:**

#### **Header (Sticky)** ✅
- Back to dashboard button
- Course title
- Progress percentage
- **Time remaining display**
- Progress bar

#### **Sidebar (Scrollable)** ✅
```typescript
{course.modules.map((module, moduleIndex) => (
  <div>
    <h3>{module.title}</h3>
    {module.lessons.map((lesson) => {
      const completed = isLessonCompleted(lesson.id);
      const isCurrent = currentLesson?.id === lesson.id;
      
      return (
        <button onClick={() => setCurrentLesson(lesson)}>
          {completed ? <CheckCircle /> : <Play />}
          {lesson.title}
          <Clock /> {lesson.durationMinutes} min
        </button>
      );
    })}
  </div>
))}
```

**Features:**
- Check icon for completed lessons
- Play icon for current lesson
- Duration display
- Click to select lesson
- Highlight current lesson

#### **Content Area** ✅
```typescript
{currentLesson && (
  <>
    <h2>{currentLesson.title}</h2>
    
    {/* YouTube Video Player */}
    {currentLesson.videoUrl && (
      <iframe
        src={currentLesson.videoUrl.replace('watch?v=', 'embed/')}
        allowFullScreen
      />
    )}
    
    {/* Lesson Resources */}
    {currentLesson.resources?.map(resource => (
      <a href={resource.url} target="_blank">
        {resource.title}
      </a>
    ))}
    
    {/* Mark Complete */}
    {!isLessonCompleted(currentLesson.id) && (
      <Button onClick={() => markLessonComplete(currentLesson.id)}>
        Mark as Complete
      </Button>
    )}
  </>
)}
```

#### **Progress Tracking** ✅
```typescript
const markLessonComplete = async (lessonId: string) => {
  await updateDoc(doc(db, COLLECTIONS.ENROLLMENTS, enrollment.id), {
    progress: arrayUnion({
      lessonId,
      completed: true,
      completedAt: new Date(),
    }),
  });
  
  toast({ title: 'Progress Saved' });
};
```

---

## 🔑 Critical Features Summary

### **Countdown Logic:**
1. ✅ Calculate time remaining using `differenceInDays` and `differenceInHours`
2. ✅ Check if `Date.now() > expiresAt` using `isPast()`
3. ✅ Calculate percentage for progress bar
4. ✅ Update countdown every minute
5. ✅ Color-coded warnings (red < 20%, yellow < 50%, cyan > 50%)

### **Enrollment Protection:**
1. ✅ Query `enrollments` where `studentId == currentUser`
2. ✅ Check enrollment exists
3. ✅ Check `expiresAt` not expired
4. ✅ Check `status === 'active'`
5. ✅ Redirect if unauthorized
6. ✅ Only render course player if all checks pass

### **Course Player Features:**
1. ✅ Sidebar with modules/lessons
2. ✅ YouTube video player (unlisted videos supported)
3. ✅ Progress tracking (mark complete)
4. ✅ Lesson resources
5. ✅ Time remaining in header
6. ✅ Visual progress indicators

---

## 📁 Files Created

```
✅ src/lib/utils.ts (calculateTimeRemaining added)
✅ src/components/learn/MyLearningCard.tsx
✅ app/learn/dashboard/page.tsx
✅ app/learn/course/[id]/page.tsx
✅ src/components/ui/progress.tsx
```

---

## ✅ Requirements Checklist

### My Courses Dashboard:
- [x] Query `enrollments` for current student
- [x] **Calculate "Time Remaining" based on `expiresAt`**
- [x] **Display progress bar for expiration**
- [x] **Show countdown (e.g., "30 days left")**
- [x] **If `Date.now() > expiresAt`, disable "Enter Class" button**
- [x] **Show "Expired" status**
- [x] Updates every minute

### Course Player:
- [x] Sidebar with chapter/lesson list
- [x] **Video player (YouTube Unlisted)**
- [x] **Protection: Check enrollment status before rendering**
- [x] Check if enrollment exists
- [x] Check if not expired
- [x] Check if status is active
- [x] Redirect if unauthorized
- [x] Mark lessons as complete
- [x] Track progress
- [x] Display lesson resources

---

## 🎯 User Flow

```
1. Student logs in
   ↓
2. Visits /learn/dashboard
   ↓
3. Sees enrolled courses with:
   - Countdown timer (e.g., "15d 8h remaining")
   - Progress bar (color-coded)
   - Overall progress (X% complete)
   - Warning if < 7 days left
   ↓
4. If NOT expired:
   - Clicks "Continue Learning" → /learn/course/{id}
   ↓
5. **Protection Check:**
   - Is student enrolled? ✅
   - Is enrollment active? ✅
   - Is access expired? ✅
   - If any fail → redirect
   ↓
6. Course Player loads:
   - Header shows time remaining
   - Sidebar lists modules/lessons
   - Student selects lesson
   ↓
7. Video plays (YouTube iframe)
   ↓
8. After watching, clicks "Mark as Complete"
   ↓
9. Progress saved to Firestore
   - Updates enrollment.progress array
   - Checkmark appears in sidebar
   ↓
10. If expired:
    - "Enter Class" button disabled
    - Shows "Access Expired" message
    - Cannot access course player
```

---

## 🎨 Cyberpunk Design Elements

### MyLearningCard:
- ✅ Glass card with backdrop blur
- ✅ Gradient overlays
- ✅ Neon badges (status, progress)
- ✅ Color-coded progress bars
- ✅ Warning alerts with neon borders
- ✅ Pulsing animation for low time

### Course Player:
- ✅ Dark sidebar with hover effects
- ✅ Check icons for completed lessons
- ✅ Neon highlights for current lesson
- ✅ Glass cards for content
- ✅ Sticky header with progress bar

---

**All student learning features complete!** ✅🎓

The platform now has:
1. ✅ Admin dashboards with payment verification
2. ✅ Student marketplace with checkout
3. ✅ **Learning experience with countdown & protection**
4. ✅ Full Cyberpunk theme throughout

The Physics Fighter Academy is ready for deployment! 🚀
