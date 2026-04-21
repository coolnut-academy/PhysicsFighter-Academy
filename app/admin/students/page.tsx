'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { Card } from '@/components/ui/card';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { COLLECTIONS, User as AppUser, Course, Enrollment } from '@/types';
import { Loading } from '@/components/shared/Loading';
import { Users, BookOpen } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface StudentInfo {
    id: string;
    profile: AppUser['profile'];
    enrolledCourses: Course[];
    enrollments: Enrollment[];
}

export default function AdminStudentsPage() {
    const { user } = useAuthStore();
    const [students, setStudents] = useState<StudentInfo[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStudents = async () => {
            if (!user) return;

            try {
                // 1. Fetch Admin's Courses
                const coursesRef = collection(db, COLLECTIONS.COURSES);
                const coursesQ = query(coursesRef, where('ownerId', '==', user.id));
                const coursesSnap = await getDocs(coursesQ);
                const myCourseIds = coursesSnap.docs.map(doc => doc.id);
                
                const coursesMap = new Map<string, Course>();
                coursesSnap.docs.forEach(doc => coursesMap.set(doc.id, { id: doc.id, ...doc.data() } as Course));

                const allEnrollments = new Map<string, Enrollment>();

                // Fetch enrollments by ownerId
                const enrollmentsQ1 = query(collection(db, COLLECTIONS.ENROLLMENTS), where('ownerId', '==', user.id));
                const eSnap1 = await getDocs(enrollmentsQ1);
                eSnap1.forEach(doc => allEnrollments.set(doc.id, { id: doc.id, ...doc.data() } as Enrollment));

                // Fallback: Fetch by courseIds if ownerId isn't fully migrated
                if (myCourseIds.length > 0) {
                    const chunks = [];
                    for (let i = 0; i < myCourseIds.length; i += 10) {
                        chunks.push(myCourseIds.slice(i, i + 10));
                    }
                    for (const chunk of chunks) {
                        const eQ2 = query(collection(db, COLLECTIONS.ENROLLMENTS), where('courseId', 'in', chunk));
                        const eSnap2 = await getDocs(eQ2);
                        eSnap2.forEach(doc => {
                            if (!allEnrollments.has(doc.id)) allEnrollments.set(doc.id, { id: doc.id, ...doc.data() } as Enrollment);
                        });
                    }
                }

                // Group by studentId (Filtered to Active/Granted)
                const studentEnrollmentsMap = new Map<string, Enrollment[]>();
                allEnrollments.forEach((enrollment) => {
                    if (enrollment.accessGranted || enrollment.status === 'active') {
                        if (!studentEnrollmentsMap.has(enrollment.studentId)) {
                            studentEnrollmentsMap.set(enrollment.studentId, []);
                        }
                        studentEnrollmentsMap.get(enrollment.studentId)!.push(enrollment);
                    }
                });

                // Fetch Users data
                const studentSummaries: StudentInfo[] = [];
                for (const [studentId, enrollments] of Array.from(studentEnrollmentsMap.entries())) {
                    const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, studentId));
                    if (userDoc.exists()) {
                        const userData = userDoc.data() as AppUser;
                        const profile = userData.profile || { firstName: 'Unknown', lastName: 'User', email: 'No email', avatarUrl: '' };
                        
                        // Load courses that might not be in our map yet, avoiding duplicates
                        const enrolledCourses: Course[] = [];
                        const seenCourses = new Set<string>();
                        
                        for (const e of enrollments) {
                            if (seenCourses.has(e.courseId)) continue;
                            seenCourses.add(e.courseId);
                            
                            if (coursesMap.has(e.courseId)) {
                                enrolledCourses.push(coursesMap.get(e.courseId)!);
                            } else {
                                const cDoc = await getDoc(doc(db, COLLECTIONS.COURSES, e.courseId));
                                if (cDoc.exists()) {
                                    const cData = { id: cDoc.id, ...cDoc.data() } as Course;
                                    coursesMap.set(cDoc.id, cData);
                                    enrolledCourses.push(cData);
                                }
                            }
                        }

                        studentSummaries.push({
                            id: studentId,
                            profile: profile,
                            enrolledCourses: enrolledCourses,
                            enrollments: enrollments
                        });
                    }
                }

                setStudents(studentSummaries);

            } catch (error) {
                console.error("Error fetching students:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStudents();
    }, [user]);

    if (loading) {
        return <Loading text="กำลังค้นหาข้อมูลนักเรียน..." />;
    }

    return (
        <div className="space-y-8 p-6 max-w-7xl mx-auto">
            <div className="bg-white border-4 border-ink-black shadow-[8px_8px_0_rgba(0,0,0,1)] p-6 relative">
                <div className="absolute -top-4 left-4 bg-fighter-red text-white border-2 border-black px-4 py-1 font-heading uppercase text-lg transform -skew-x-12 shadow-[2px_2px_0_rgba(0,0,0,1)]">
                    ศิษย์ปัจจุบัน
                </div>
                <h1 className="text-3xl font-heading text-ink-black uppercase flex items-center gap-3 mt-4">
                    <Users className="w-8 h-8 text-fighter-red" />
                    รายชื่อนักเรียนของคุณทั้งหมด
                </h1>
                <p className="text-gray-600 font-bold mt-2">
                    แสดงรายชื่อนักเรียนที่มีประวัติการสมัครคอร์สและกำลัง Active อยู่
                </p>
                <div className="mt-4 text-sm font-bold bg-gray-100 w-fit px-4 py-2 border-2 border-ink-black uppercase -skew-x-6">
                    จำนวนนักเรียน: {students.length} คน
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {students.map((student) => (
                    <Card key={student.id} className="border-4 border-ink-black shadow-[4px_4px_0_rgba(0,0,0,1)] rounded-none overflow-hidden relative group hover:-translate-y-1 transition-transform bg-white">
                        <div className="p-6 bg-white flex flex-col h-full relative z-10">
                            <div className="flex items-center gap-4 mb-4">
                                <Avatar className="w-14 h-14 border-2 border-ink-black rounded-none shadow-[2px_2px_0_rgba(0,0,0,1)]">
                                    <AvatarImage src={student.profile?.avatarUrl} />
                                    <AvatarFallback className="bg-golden text-ink-black font-bold font-heading text-xl">
                                        {getInitials(student.profile?.firstName || 'U', student.profile?.lastName || 'N')}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-bold text-lg text-ink-black leading-tight uppercase line-clamp-1 truncate" title={`${student.profile?.firstName} ${student.profile?.lastName}`}>
                                        {student.profile?.firstName} {student.profile?.lastName}
                                    </p>
                                    <p className="text-xs text-gray-500 font-mono truncate" title={student.profile?.email}>
                                        {student.profile?.email}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="mt-auto border-t-4 border-ink-black pt-4">
                                <div className="flex items-center gap-2 mb-3 bg-fighter-red text-white w-fit px-2 py-1 -skew-x-6 border-2 border-ink-black">
                                    <BookOpen className="w-3 h-3" />
                                    <p className="font-bold text-xs uppercase">คอร์สที่ลงทะเบียน ({student.enrolledCourses.length})</p>
                                </div>
                                <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                                    {student.enrolledCourses.map(course => (
                                        <div key={course.id} className="bg-gray-50 border-2 border-ink-black p-2 flex items-center justify-between group-hover:-translate-x-1 transition-transform relative">
                                            <span className="text-xs font-bold font-heading uppercase text-ink-black truncate" title={course.title}>
                                                {course.title}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}

                {students.length === 0 && (
                    <div className="col-span-full border-4 border-ink-black p-12 flex flex-col items-center justify-center text-center shadow-[8px_8px_0_rgba(0,0,0,1)] bg-white">
                        <Users className="w-16 h-16 text-gray-300 mb-4" />
                        <h2 className="text-2xl font-heading text-ink-black uppercase">ยังไม่มีนักเรียนในสำนัก</h2>
                        <p className="text-gray-500 font-bold mt-2">เมื่อมีการลงทะเบียนและอนุมัติผ่าน รายชื่อศิษย์จะมาปรากฏที่นี่</p>
                    </div>
                )}
            </div>
        </div>
    );
}
