'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import { initializeApp, deleteApp, getApps } from 'firebase/app';
import { db, auth } from '@/lib/firebase/config';
import { User, COLLECTIONS } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
          Users,
          UserPlus,
          Trash2,
          Shield,
          Search,
          X,
          Save,
          Loader2,
          ArrowLeft,
          Crown,
          RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

export default function UsersManagementPage() {
          const { toast } = useToast();
          const [users, setUsers] = useState<User[]>([]);
          const [loading, setLoading] = useState(true);
          const [searchQuery, setSearchQuery] = useState('');
          const [showAddModal, setShowAddModal] = useState(false);
          const [saving, setSaving] = useState(false);
          const [newUser, setNewUser] = useState({
                    firstName: '',
                    lastName: '',
                    email: '',
                    password: '',
                    role: 'student' as string,
          });

          useEffect(() => {
                    fetchUsers();
          }, []);

          const fetchUsers = async () => {
                    try {
                              setLoading(true);
                              const snapshot = await getDocs(collection(db, COLLECTIONS.USERS));
                              const usersData = snapshot.docs.map((doc) => ({
                                        id: doc.id,
                                        ...doc.data(),
                              })) as User[];
                              setUsers(usersData);
                    } catch (error) {
                              console.error('Error fetching users:', error);
                              toast({
                                        title: 'เกิดข้อผิดพลาด',
                                        description: 'ไม่สามารถโหลดข้อมูลผู้ใช้ได้',
                                        variant: 'destructive',
                              });
                    } finally {
                              setLoading(false);
                    }
          };

          const handleAddUser = async (e: React.FormEvent) => {
                    e.preventDefault();
                    setSaving(true);

                    try {
                              // Create a secondary Firebase app to create user without signing out current user
                              const secondaryApp = initializeApp(
                                        {
                                                  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
                                                  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
                                                  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
                                        },
                                        'secondary-' + Date.now()
                              );

                              const secondaryAuth = getAuth(secondaryApp);

                              // Create user with secondary auth (won't sign out main user)
                              const userCredential = await createUserWithEmailAndPassword(
                                        secondaryAuth,
                                        newUser.email,
                                        newUser.password
                              );

                              // Create Firestore document for the new user
                              await setDoc(doc(db, COLLECTIONS.USERS, userCredential.user.uid), {
                                        role: newUser.role,
                                        profile: {
                                                  firstName: newUser.firstName,
                                                  lastName: newUser.lastName,
                                                  email: newUser.email,
                                        },
                                        createdAt: serverTimestamp(),
                                        updatedAt: serverTimestamp(),
                                        isActive: true,
                              });

                              // Delete the secondary app
                              await deleteApp(secondaryApp);

                              toast({
                                        title: 'สำเร็จ',
                                        description: 'สร้างผู้ใช้ใหม่เรียบร้อยแล้ว',
                              });

                              setShowAddModal(false);
                              setNewUser({ firstName: '', lastName: '', email: '', password: '', role: 'student' });
                              fetchUsers();
                    } catch (error: any) {
                              toast({
                                        title: 'เกิดข้อผิดพลาด',
                                        description: error.message || 'ไม่สามารถสร้างผู้ใช้ได้',
                                        variant: 'destructive',
                              });
                    } finally {
                              setSaving(false);
                    }
          };

          const handleUpdateRole = async (userId: string, newRole: string) => {
                    try {
                              await updateDoc(doc(db, COLLECTIONS.USERS, userId), {
                                        role: newRole,
                                        updatedAt: serverTimestamp(),
                              });

                              toast({
                                        title: 'สำเร็จ',
                                        description: 'อัพเดทบทบาทเรียบร้อยแล้ว',
                              });

                              fetchUsers();
                    } catch (error: any) {
                              toast({
                                        title: 'เกิดข้อผิดพลาด',
                                        description: error.message || 'ไม่สามารถอัพเดทบทบาทได้',
                                        variant: 'destructive',
                              });
                    }
          };

          const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
                    try {
                              await updateDoc(doc(db, COLLECTIONS.USERS, userId), {
                                        isActive: !currentStatus,
                                        updatedAt: serverTimestamp(),
                              });

                              toast({
                                        title: 'สำเร็จ',
                                        description: `${!currentStatus ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}ผู้ใช้เรียบร้อยแล้ว`,
                              });

                              fetchUsers();
                    } catch (error: any) {
                              toast({
                                        title: 'เกิดข้อผิดพลาด',
                                        description: error.message || 'ไม่สามารถอัพเดทสถานะได้',
                                        variant: 'destructive',
                              });
                    }
          };

          const handleDeleteUser = async (userId: string) => {
                    if (!confirm('คุณต้องการลบผู้ใช้นี้หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้')) {
                              return;
                    }

                    try {
                              await deleteDoc(doc(db, COLLECTIONS.USERS, userId));

                              toast({
                                        title: 'สำเร็จ',
                                        description: 'ลบผู้ใช้เรียบร้อยแล้ว',
                              });

                              fetchUsers();
                    } catch (error: any) {
                              toast({
                                        title: 'เกิดข้อผิดพลาด',
                                        description: error.message || 'ไม่สามารถลบผู้ใช้ได้',
                                        variant: 'destructive',
                              });
                    }
          };

          const filteredUsers = users.filter(user =>
                    user.profile.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    user.profile.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    user.profile.lastName.toLowerCase().includes(searchQuery.toLowerCase())
          );

          const getRoleBadgeStyle = (role: string) => {
                    switch (role) {
                              case 'super_admin':
                                        return 'bg-golden text-ink-black';
                              case 'admin':
                                        return 'bg-fighter-red text-white';
                              default:
                                        return 'bg-gray-200 text-gray-700';
                    }
          };

          const getRoleLabel = (role: string) => {
                    switch (role) {
                              case 'super_admin':
                                        return 'ผู้ดูแลระบบ';
                              case 'admin':
                                        return 'ผู้สอน';
                              default:
                                        return 'นักเรียน';
                    }
          };

          if (loading) {
                    return (
                              <div className="flex items-center justify-center h-96">
                                        <div className="arcade-spinner" />
                              </div>
                    );
          }

          return (
                    <div className="p-6 min-h-screen bg-ink-black">
                              {/* Header */}
                              <div className="flex items-center gap-4 mb-8">
                                        <Link href="/super-admin/dashboard">
                                                  <Button variant="outline" size="sm" className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-black">
                                                            <ArrowLeft className="w-4 h-4" />
                                                  </Button>
                                        </Link>
                                        <div className="flex-1">
                                                  <h1 className="font-heading text-4xl uppercase text-white">
                                                            <Users className="inline w-8 h-8 mr-2" />
                                                            จัดการ<span className="text-golden">ผู้ใช้งาน</span>
                                                  </h1>
                                                  <p className="text-gray-400 text-sm mt-1">
                                                            {users.length} ผู้ใช้ในระบบ
                                                  </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                                  <Button
                                                            variant="outline"
                                                            onClick={() => {
                                                                      fetchUsers();
                                                                      toast({
                                                                                title: 'รีเฟรชข้อมูล',
                                                                                description: 'โหลดข้อมูลผู้ใช้จาก Firestore เรียบร้อยแล้ว',
                                                                      });
                                                            }}
                                                            disabled={loading}
                                                            className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-black"
                                                  >
                                                            <span style={{ transform: 'skewX(6deg)' }} className="flex items-center gap-2">
                                                                      <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                                                                      Sync ข้อมูล
                                                            </span>
                                                  </Button>
                                                  <Button onClick={() => setShowAddModal(true)}>
                                                            <span style={{ transform: 'skewX(6deg)' }} className="flex items-center gap-2">
                                                                      <UserPlus className="w-4 h-4" />
                                                                      เพิ่มผู้ใช้
                                                            </span>
                                                  </Button>
                                        </div>
                              </div>

                              {/* Search */}
                              <div className="mb-6">
                                        <div className="relative max-w-md">
                                                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                  <input
                                                            type="text"
                                                            value={searchQuery}
                                                            onChange={(e) => setSearchQuery(e.target.value)}
                                                            className="arcade-input pl-10 bg-gray-800 border-golden text-white"
                                                            placeholder="ค้นหาผู้ใช้..."
                                                  />
                                        </div>
                              </div>

                              {/* Users Table */}
                              <Card className="bg-ink-black border-golden">
                                        <CardContent className="p-0">
                                                  <div className="overflow-x-auto">
                                                            <table className="w-full">
                                                                      <thead>
                                                                                <tr className="border-b-2 border-golden bg-gray-900">
                                                                                          <th className="text-left p-4 font-bold uppercase text-sm text-golden">ชื่อ</th>
                                                                                          <th className="text-left p-4 font-bold uppercase text-sm text-golden">อีเมล</th>
                                                                                          <th className="text-left p-4 font-bold uppercase text-sm text-golden">บทบาท</th>
                                                                                          <th className="text-left p-4 font-bold uppercase text-sm text-golden">สถานะ</th>
                                                                                          <th className="text-left p-4 font-bold uppercase text-sm text-golden">จัดการ</th>
                                                                                </tr>
                                                                      </thead>
                                                                      <tbody>
                                                                                {filteredUsers.map((user) => (
                                                                                          <tr key={user.id} className="border-b border-gray-700 hover:bg-gray-800">
                                                                                                    <td className="p-4 text-white font-bold">
                                                                                                              {user.profile.firstName} {user.profile.lastName}
                                                                                                    </td>
                                                                                                    <td className="p-4 text-gray-400">{user.profile.email}</td>
                                                                                                    <td className="p-4">
                                                                                                              <select
                                                                                                                        value={user.role}
                                                                                                                        onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                                                                                                                        className={`px-3 py-1 text-xs font-bold uppercase border-2 border-ink-black cursor-pointer ${getRoleBadgeStyle(user.role)}`}
                                                                                                              >
                                                                                                                        <option value="student">นักเรียน</option>
                                                                                                                        <option value="admin">ผู้สอน</option>
                                                                                                                        <option value="super_admin">ผู้ดูแลระบบ</option>
                                                                                                              </select>
                                                                                                    </td>
                                                                                                    <td className="p-4">
                                                                                                              <button
                                                                                                                        onClick={() => handleToggleStatus(user.id, user.isActive)}
                                                                                                                        className={`px-3 py-1 text-xs font-bold uppercase border-2 border-ink-black cursor-pointer transition-colors ${user.isActive
                                                                                                                                  ? 'bg-green-500 text-white hover:bg-green-600'
                                                                                                                                  : 'bg-red-500 text-white hover:bg-red-600'
                                                                                                                                  }`}
                                                                                                              >
                                                                                                                        {user.isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                                                                                                              </button>
                                                                                                    </td>
                                                                                                    <td className="p-4">
                                                                                                              <Button
                                                                                                                        variant="destructive"
                                                                                                                        size="sm"
                                                                                                                        onClick={() => handleDeleteUser(user.id)}
                                                                                                              >
                                                                                                                        <Trash2 className="w-4 h-4" />
                                                                                                              </Button>
                                                                                                    </td>
                                                                                          </tr>
                                                                                ))}
                                                                      </tbody>
                                                            </table>
                                                  </div>
                                        </CardContent>
                              </Card>

                              {/* Add User Modal */}
                              {showAddModal && (
                                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                                                  <Card className="w-full max-w-md bg-white">
                                                            <CardHeader>
                                                                      <div className="flex items-center justify-between">
                                                                                <CardTitle className="flex items-center gap-2">
                                                                                          <UserPlus className="w-5 h-5 text-fighter-red" />
                                                                                          เพิ่มผู้ใช้ใหม่
                                                                                </CardTitle>
                                                                                <button onClick={() => setShowAddModal(false)}>
                                                                                          <X className="w-5 h-5" />
                                                                                </button>
                                                                      </div>
                                                            </CardHeader>
                                                            <CardContent>
                                                                      <form onSubmit={handleAddUser} className="space-y-4">
                                                                                <div className="grid grid-cols-2 gap-4">
                                                                                          <div>
                                                                                                    <label className="block text-sm font-bold uppercase mb-2">ชื่อ</label>
                                                                                                    <input
                                                                                                              type="text"
                                                                                                              value={newUser.firstName}
                                                                                                              onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                                                                                                              className="arcade-input"
                                                                                                              required
                                                                                                    />
                                                                                          </div>
                                                                                          <div>
                                                                                                    <label className="block text-sm font-bold uppercase mb-2">นามสกุล</label>
                                                                                                    <input
                                                                                                              type="text"
                                                                                                              value={newUser.lastName}
                                                                                                              onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                                                                                                              className="arcade-input"
                                                                                                              required
                                                                                                    />
                                                                                          </div>
                                                                                </div>

                                                                                <div>
                                                                                          <label className="block text-sm font-bold uppercase mb-2">อีเมล</label>
                                                                                          <input
                                                                                                    type="email"
                                                                                                    value={newUser.email}
                                                                                                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                                                                                    className="arcade-input"
                                                                                                    required
                                                                                          />
                                                                                </div>

                                                                                <div>
                                                                                          <label className="block text-sm font-bold uppercase mb-2">รหัสผ่าน</label>
                                                                                          <input
                                                                                                    type="password"
                                                                                                    value={newUser.password}
                                                                                                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                                                                                    className="arcade-input"
                                                                                                    required
                                                                                                    minLength={6}
                                                                                          />
                                                                                </div>

                                                                                <div>
                                                                                          <label className="block text-sm font-bold uppercase mb-2">บทบาท</label>
                                                                                          <select
                                                                                                    value={newUser.role}
                                                                                                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                                                                                                    className="arcade-input"
                                                                                          >
                                                                                                    <option value="student">นักเรียน</option>
                                                                                                    <option value="admin">ผู้สอน</option>
                                                                                                    <option value="super_admin">ผู้ดูแลระบบ</option>
                                                                                          </select>
                                                                                </div>

                                                                                <Button type="submit" className="w-full" disabled={saving}>
                                                                                          <span style={{ transform: 'skewX(6deg)' }} className="flex items-center gap-2">
                                                                                                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                                                                                    {saving ? 'กำลังสร้าง...' : 'สร้างผู้ใช้'}
                                                                                          </span>
                                                                                </Button>
                                                                      </form>
                                                            </CardContent>
                                                  </Card>
                                        </div>
                              )}
                    </div>
          );
}
