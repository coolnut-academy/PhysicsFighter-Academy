'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Mail, Save, Loader2, Phone, BookOpen, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
          const { user } = useAuthStore();
          const [loading, setLoading] = useState(false);
          const [formData, setFormData] = useState({
                    firstName: user?.profile.firstName || '',
                    lastName: user?.profile.lastName || '',
                    phoneNumber: user?.profile.phoneNumber || '',
                    bio: user?.profile.bio || '',
          });

          const handleSubmit = async (e: React.FormEvent) => {
                    e.preventDefault();
                    setLoading(true);
                    // TODO: Implement profile update
                    setTimeout(() => setLoading(false), 1000);
          };

          return (
                    <div className="container mx-auto py-8 px-4">
                              <div className="flex items-center gap-4 mb-8">
                                        <Link href="/dashboard">
                                                  <Button variant="outline" size="sm" className="border-black text-black hover:bg-gray-100">
                                                            <ArrowLeft className="w-4 h-4" />
                                                  </Button>
                                        </Link>
                                        <h1 className="font-heading text-4xl uppercase text-ink-black">
                                                  <User className="inline w-8 h-8 mr-2" />
                                                  โปรไฟล์<span className="text-fighter-red">นักสู้</span>
                                        </h1>
                              </div>

                              <div className="max-w-2xl">
                                        <Card>
                                                  <CardHeader>
                                                            <CardTitle className="flex items-center gap-2">
                                                                      <BookOpen className="w-5 h-5 text-fighter-red" />
                                                                      ข้อมูลส่วนตัว
                                                            </CardTitle>
                                                  </CardHeader>
                                                  <CardContent>
                                                            {/* Avatar */}
                                                            <div className="flex items-center gap-6 mb-8">
                                                                      <div className="w-24 h-24 bg-fighter-red rounded-full border-4 border-ink-black flex items-center justify-center text-white font-heading text-3xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                                                                {user?.profile.firstName?.[0]}{user?.profile.lastName?.[0]}
                                                                      </div>
                                                                      <div>
                                                                                <h2 className="font-heading text-2xl uppercase text-ink-black">
                                                                                          {user?.profile.firstName} {user?.profile.lastName}
                                                                                </h2>
                                                                                <p className="text-gray-500">{user?.profile.email}</p>
                                                                                <span className="inline-block mt-2 px-3 py-1 bg-golden/20 text-golden border-2 border-golden text-xs font-bold uppercase -skew-x-3">
                                                                                          <span style={{ transform: 'skewX(3deg)', display: 'inline-block' }}>นักเรียน</span>
                                                                                </span>
                                                                      </div>
                                                            </div>

                                                            <form onSubmit={handleSubmit} className="space-y-4">
                                                                      <div className="grid grid-cols-2 gap-4">
                                                                                <div>
                                                                                          <label className="block text-sm font-bold uppercase mb-2">ชื่อ</label>
                                                                                          <input
                                                                                                    type="text"
                                                                                                    value={formData.firstName}
                                                                                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                                                                                    className="arcade-input"
                                                                                          />
                                                                                </div>
                                                                                <div>
                                                                                          <label className="block text-sm font-bold uppercase mb-2">นามสกุล</label>
                                                                                          <input
                                                                                                    type="text"
                                                                                                    value={formData.lastName}
                                                                                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                                                                                    className="arcade-input"
                                                                                          />
                                                                                </div>
                                                                      </div>

                                                                      <div>
                                                                                <label className="block text-sm font-bold uppercase mb-2">อีเมล</label>
                                                                                <div className="relative">
                                                                                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                                                          <input
                                                                                                    type="email"
                                                                                                    value={user?.profile.email || ''}
                                                                                                    disabled
                                                                                                    className="arcade-input pl-10 bg-gray-100 cursor-not-allowed"
                                                                                          />
                                                                                </div>
                                                                      </div>

                                                                      <div>
                                                                                <label className="block text-sm font-bold uppercase mb-2">เบอร์โทรศัพท์</label>
                                                                                <div className="relative">
                                                                                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                                                          <input
                                                                                                    type="tel"
                                                                                                    value={formData.phoneNumber}
                                                                                                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                                                                                    className="arcade-input pl-10"
                                                                                                    placeholder="0812345678"
                                                                                          />
                                                                                </div>
                                                                      </div>

                                                                      <div>
                                                                                <label className="block text-sm font-bold uppercase mb-2">เกี่ยวกับฉัน</label>
                                                                                <textarea
                                                                                          value={formData.bio}
                                                                                          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                                                                          className="arcade-input min-h-[100px]"
                                                                                          placeholder="เล่าให้ฟังหน่อยว่าคุณเป็นใคร..."
                                                                                />
                                                                      </div>

                                                                      <Button type="submit" className="w-full" size="lg" disabled={loading}>
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
