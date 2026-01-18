'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { registerUser } from '@/lib/firebase/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Swords, Mail, Lock, User, Loader2, Flame } from 'lucide-react';

export default function RegisterPage() {
          const router = useRouter();

          const [formData, setFormData] = useState({
                    firstName: '',
                    lastName: '',
                    email: '',
                    password: '',
                    confirmPassword: '',
          });
          const [loading, setLoading] = useState(false);
          const [error, setError] = useState('');

          const handleSubmit = async (e: React.FormEvent) => {
                    e.preventDefault();
                    setLoading(true);
                    setError('');

                    if (formData.password !== formData.confirmPassword) {
                              setError('รหัสผ่านไม่ตรงกัน');
                              setLoading(false);
                              return;
                    }

                    try {
                              await registerUser(formData.email, formData.password, formData.firstName, formData.lastName);
                              router.push('/learn/dashboard');
                    } catch (err: any) {
                              setError(err.message || 'สมัครสมาชิกไม่สำเร็จ');
                    } finally {
                              setLoading(false);
                    }
          };

          return (
                    <div className="min-h-screen bg-paper-white flex items-center justify-center p-4">
                              {/* Background Pattern */}
                              <div
                                        className="fixed inset-0 opacity-5 pointer-events-none"
                                        style={{
                                                  backgroundImage: `radial-gradient(circle, #000 1px, transparent 1px)`,
                                                  backgroundSize: '8px 8px',
                                        }}
                              />

                              <Card className="w-full max-w-md relative z-10">
                                        <CardHeader className="text-center">
                                                  <div className="flex justify-center mb-4">
                                                            <div className="bg-golden p-3 border-[3px] border-ink-black -skew-x-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                                                      <Flame className="w-8 h-8 text-ink-black" style={{ transform: 'skewX(6deg)' }} />
                                                            </div>
                                                  </div>
                                                  <CardTitle className="font-heading text-3xl">เข้าร่วมสนามฝึก</CardTitle>
                                                  <p className="text-gray-600 mt-2">เริ่มต้นเส้นทางการฝึกฝนของคุณ</p>
                                        </CardHeader>
                                        <CardContent>
                                                  <form onSubmit={handleSubmit} className="space-y-4">
                                                            {error && (
                                                                      <div className="bg-red-50 border-2 border-fighter-red text-fighter-red p-3 text-sm font-bold">
                                                                                {error}
                                                                      </div>
                                                            )}

                                                            <div className="grid grid-cols-2 gap-4">
                                                                      <div>
                                                                                <label className="block text-sm font-bold uppercase mb-2">ชื่อ</label>
                                                                                <div className="relative">
                                                                                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                                                          <input
                                                                                                    type="text"
                                                                                                    value={formData.firstName}
                                                                                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                                                                                    className="arcade-input pl-10"
                                                                                                    placeholder="ชื่อจริง"
                                                                                                    required
                                                                                          />
                                                                                </div>
                                                                      </div>
                                                                      <div>
                                                                                <label className="block text-sm font-bold uppercase mb-2">นามสกุล</label>
                                                                                <input
                                                                                          type="text"
                                                                                          value={formData.lastName}
                                                                                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                                                                          className="arcade-input"
                                                                                          placeholder="นามสกุล"
                                                                                          required
                                                                                />
                                                                      </div>
                                                            </div>

                                                            <div>
                                                                      <label className="block text-sm font-bold uppercase mb-2">อีเมล</label>
                                                                      <div className="relative">
                                                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                                                <input
                                                                                          type="email"
                                                                                          value={formData.email}
                                                                                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                                                          className="arcade-input pl-10"
                                                                                          placeholder="email@example.com"
                                                                                          required
                                                                                />
                                                                      </div>
                                                            </div>

                                                            <div>
                                                                      <label className="block text-sm font-bold uppercase mb-2">รหัสผ่าน</label>
                                                                      <div className="relative">
                                                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                                                <input
                                                                                          type="password"
                                                                                          value={formData.password}
                                                                                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                                                          className="arcade-input pl-10"
                                                                                          placeholder="••••••••"
                                                                                          required
                                                                                          minLength={6}
                                                                                />
                                                                      </div>
                                                            </div>

                                                            <div>
                                                                      <label className="block text-sm font-bold uppercase mb-2">ยืนยันรหัสผ่าน</label>
                                                                      <div className="relative">
                                                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                                                <input
                                                                                          type="password"
                                                                                          value={formData.confirmPassword}
                                                                                          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                                                                          className="arcade-input pl-10"
                                                                                          placeholder="••••••••"
                                                                                          required
                                                                                />
                                                                      </div>
                                                            </div>

                                                            <Button type="submit" variant="golden" className="w-full" size="lg" disabled={loading}>
                                                                      <span style={{ transform: 'skewX(6deg)' }} className="flex items-center gap-2">
                                                                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Swords className="w-5 h-5" />}
                                                                                {loading ? 'กำลังสมัคร...' : 'เริ่มต้นฝึกฝน'}
                                                                      </span>
                                                            </Button>
                                                  </form>

                                                  <div className="mt-6 text-center">
                                                            <p className="text-gray-600">
                                                                      มีบัญชีอยู่แล้ว?{' '}
                                                                      <Link href="/login" className="text-fighter-red font-bold hover:underline">
                                                                                เข้าสู่ระบบ
                                                                      </Link>
                                                            </p>
                                                  </div>

                                                  <div className="mt-4 text-center">
                                                            <Link href="/" className="text-gray-500 text-sm hover:text-fighter-red">
                                                                      ← กลับหน้าหลัก
                                                            </Link>
                                                  </div>
                                        </CardContent>
                              </Card>
                    </div>
          );
}
