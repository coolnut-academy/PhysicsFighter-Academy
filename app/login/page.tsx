'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Swords, Mail, Lock, Loader2, Flame } from 'lucide-react';

export default function LoginPage() {
          const router = useRouter();
          const { login } = useAuthStore();
          const [email, setEmail] = useState('');
          const [password, setPassword] = useState('');
          const [loading, setLoading] = useState(false);
          const [error, setError] = useState('');

          const handleSubmit = async (e: React.FormEvent) => {
                    e.preventDefault();
                    setLoading(true);
                    setError('');

                    try {
                              await login(email, password);
                              router.push('/dashboard');
                    } catch (err: any) {
                              setError(err.message || 'เข้าสู่ระบบไม่สำเร็จ');
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
                                                            <div className="bg-fighter-red p-3 border-[3px] border-ink-black -skew-x-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                                                      <Swords className="w-8 h-8 text-white" style={{ transform: 'skewX(6deg)' }} />
                                                            </div>
                                                  </div>
                                                  <CardTitle className="font-heading text-3xl">เข้าสู่สนามประลอง</CardTitle>
                                                  <p className="text-gray-600 mt-2">ใส่ข้อมูลเพื่อเข้าสู่ระบบ</p>
                                        </CardHeader>
                                        <CardContent>
                                                  <form onSubmit={handleSubmit} className="space-y-4">
                                                            {error && (
                                                                      <div className="bg-red-50 border-2 border-fighter-red text-fighter-red p-3 text-sm font-bold">
                                                                                {error}
                                                                      </div>
                                                            )}

                                                            <div>
                                                                      <label className="block text-sm font-bold uppercase mb-2">อีเมล</label>
                                                                      <div className="relative">
                                                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                                                <input
                                                                                          type="email"
                                                                                          value={email}
                                                                                          onChange={(e) => setEmail(e.target.value)}
                                                                                          className="arcade-input pl-10"
                                                                                          placeholder="fighter@dojo.com"
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
                                                                                          value={password}
                                                                                          onChange={(e) => setPassword(e.target.value)}
                                                                                          className="arcade-input pl-10"
                                                                                          placeholder="••••••••"
                                                                                          required
                                                                                />
                                                                      </div>
                                                            </div>

                                                            <Button type="submit" className="w-full" size="lg" disabled={loading}>
                                                                      <span style={{ transform: 'skewX(6deg)' }} className="flex items-center gap-2">
                                                                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Flame className="w-5 h-5" />}
                                                                                {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
                                                                      </span>
                                                            </Button>
                                                  </form>

                                                  <div className="mt-6 text-center">
                                                            <p className="text-gray-600">
                                                                      ยังไม่มีบัญชี?{' '}
                                                                      <Link href="/register" className="text-fighter-red font-bold hover:underline">
                                                                                สมัครสมาชิก
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
