'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Crown, Mail, Save, Loader2, Shield, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function SuperAdminProfilePage() {
          const { user } = useAuthStore();
          const [loading, setLoading] = useState(false);
          const [formData, setFormData] = useState({
                    firstName: user?.profile.firstName || '',
                    lastName: user?.profile.lastName || '',
                    phoneNumber: user?.profile.phoneNumber || '',
          });

          const handleSubmit = async (e: React.FormEvent) => {
                    e.preventDefault();
                    setLoading(true);
                    setTimeout(() => setLoading(false), 1000);
          };

          return (
                    <div className="p-6 min-h-screen bg-ink-black">
                              <div className="flex items-center gap-4 mb-8">
                                        <Link href="/super-admin/dashboard">
                                                  <Button variant="outline" size="sm" className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-black">
                                                            <ArrowLeft className="w-4 h-4" />
                                                  </Button>
                                        </Link>
                                        <h1 className="font-heading text-4xl uppercase text-white">
                                                  <Crown className="inline w-8 h-8 mr-2 text-golden" />
                                                  โปรไฟล์<span className="text-golden">ผู้ดูแลระบบ</span>
                                        </h1>
                              </div>

                              <div className="max-w-2xl">
                                        <Card className="bg-ink-black border-golden">
                                                  <CardHeader>
                                                            <CardTitle className="flex items-center gap-2 text-white">
                                                                      <Shield className="w-5 h-5 text-golden" />
                                                                      ข้อมูลส่วนตัว
                                                            </CardTitle>
                                                  </CardHeader>
                                                  <CardContent>
                                                            {/* Avatar */}
                                                            <div className="flex items-center gap-6 mb-8">
                                                                      <div className="w-24 h-24 bg-golden rounded-full border-4 border-white flex items-center justify-center text-ink-black font-heading text-3xl">
                                                                                {user?.profile.firstName?.[0]}{user?.profile.lastName?.[0]}
                                                                      </div>
                                                                      <div>
                                                                                <h2 className="font-heading text-2xl uppercase text-white">
                                                                                          {user?.profile.firstName} {user?.profile.lastName}
                                                                                </h2>
                                                                                <p className="text-gray-400">{user?.profile.email}</p>
                                                                                <span className="inline-flex items-center gap-1 mt-2 px-3 py-1 bg-golden text-ink-black text-xs font-bold uppercase">
                                                                                          <Crown className="w-3 h-3" /> ผู้ดูแลระบบ
                                                                                </span>
                                                                      </div>
                                                            </div>

                                                            <form onSubmit={handleSubmit} className="space-y-4">
                                                                      <div className="grid grid-cols-2 gap-4">
                                                                                <div>
                                                                                          <label className="block text-sm font-bold uppercase mb-2 text-white">ชื่อ</label>
                                                                                          <input
                                                                                                    type="text"
                                                                                                    value={formData.firstName}
                                                                                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                                                                                    className="arcade-input bg-gray-800 border-golden text-white"
                                                                                          />
                                                                                </div>
                                                                                <div>
                                                                                          <label className="block text-sm font-bold uppercase mb-2 text-white">นามสกุล</label>
                                                                                          <input
                                                                                                    type="text"
                                                                                                    value={formData.lastName}
                                                                                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                                                                                    className="arcade-input bg-gray-800 border-golden text-white"
                                                                                          />
                                                                                </div>
                                                                      </div>

                                                                      <div>
                                                                                <label className="block text-sm font-bold uppercase mb-2 text-white">อีเมล</label>
                                                                                <div className="relative">
                                                                                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                                                                          <input
                                                                                                    type="email"
                                                                                                    value={user?.profile.email || ''}
                                                                                                    disabled
                                                                                                    className="arcade-input pl-10 bg-gray-700 border-gray-600 text-gray-400 cursor-not-allowed"
                                                                                          />
                                                                                </div>
                                                                      </div>

                                                                      <div>
                                                                                <label className="block text-sm font-bold uppercase mb-2 text-white">เบอร์โทรศัพท์</label>
                                                                                <input
                                                                                          type="tel"
                                                                                          value={formData.phoneNumber}
                                                                                          onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                                                                          className="arcade-input bg-gray-800 border-golden text-white"
                                                                                          placeholder="0812345678"
                                                                                />
                                                                      </div>

                                                                      <Button type="submit" variant="golden" className="w-full" size="lg" disabled={loading}>
                                                                                <span style={{ transform: 'skewX(6deg)' }} className="flex items-center gap-2">
                                                                                          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                                                                          {loading ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                                                                                </span>
                                                                      </Button>
                                                            </form>
                                                  </CardContent>
                                        </Card>
                              </div>
                    </div>
          );
}
