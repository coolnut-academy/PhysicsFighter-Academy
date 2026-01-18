'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, CreditCard, Bell, Save, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdminSettingsPage() {
          const { user } = useAuthStore();
          const [loading, setLoading] = useState(false);
          const [bankDetails, setBankDetails] = useState({
                    bankName: user?.bankDetails?.bankName || '',
                    accountNumber: user?.bankDetails?.accountNumber || '',
                    accountName: user?.bankDetails?.accountName || '',
                    promptPayId: user?.bankDetails?.promptPayId || '',
          });

          const handleSubmit = async (e: React.FormEvent) => {
                    e.preventDefault();
                    setLoading(true);
                    // TODO: Implement settings update
                    setTimeout(() => setLoading(false), 1000);
          };

          return (
                    <div className="p-6">
                              <div className="flex items-center gap-4 mb-8">
                                        <Link href="/admin/dashboard">
                                                  <Button variant="outline" size="sm" className="border-ink-black text-ink-black hover:bg-gray-100">
                                                            <ArrowLeft className="w-4 h-4" />
                                                  </Button>
                                        </Link>
                                        <h1 className="font-heading text-4xl uppercase text-ink-black">
                                                  <Settings className="inline w-8 h-8 mr-2" />
                                                  ตั้งค่า
                                        </h1>
                              </div>

                              <div className="grid lg:grid-cols-2 gap-6">
                                        {/* Bank Details */}
                                        <Card>
                                                  <CardHeader>
                                                            <CardTitle className="flex items-center gap-2">
                                                                      <CreditCard className="w-5 h-5 text-golden" />
                                                                      ข้อมูลบัญชีธนาคาร
                                                            </CardTitle>
                                                  </CardHeader>
                                                  <CardContent>
                                                            <form onSubmit={handleSubmit} className="space-y-4">
                                                                      <div>
                                                                                <label className="block text-sm font-bold uppercase mb-2">ชื่อธนาคาร</label>
                                                                                <input
                                                                                          type="text"
                                                                                          value={bankDetails.bankName}
                                                                                          onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                                                                                          className="arcade-input"
                                                                                          placeholder="เช่น ธนาคารกสิกรไทย"
                                                                                />
                                                                      </div>

                                                                      <div>
                                                                                <label className="block text-sm font-bold uppercase mb-2">เลขบัญชี</label>
                                                                                <input
                                                                                          type="text"
                                                                                          value={bankDetails.accountNumber}
                                                                                          onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                                                                                          className="arcade-input"
                                                                                          placeholder="เช่น 123-4-56789-0"
                                                                                />
                                                                      </div>

                                                                      <div>
                                                                                <label className="block text-sm font-bold uppercase mb-2">ชื่อบัญชี</label>
                                                                                <input
                                                                                          type="text"
                                                                                          value={bankDetails.accountName}
                                                                                          onChange={(e) => setBankDetails({ ...bankDetails, accountName: e.target.value })}
                                                                                          className="arcade-input"
                                                                                          placeholder="เช่น นาย สมชาย ใจดี"
                                                                                />
                                                                      </div>

                                                                      <div>
                                                                                <label className="block text-sm font-bold uppercase mb-2">พร้อมเพย์</label>
                                                                                <input
                                                                                          type="text"
                                                                                          value={bankDetails.promptPayId}
                                                                                          onChange={(e) => setBankDetails({ ...bankDetails, promptPayId: e.target.value })}
                                                                                          className="arcade-input"
                                                                                          placeholder="เช่น 0812345678"
                                                                                />
                                                                      </div>

                                                                      <Button type="submit" className="w-full" disabled={loading}>
                                                                                <span style={{ transform: 'skewX(6deg)' }} className="flex items-center gap-2">
                                                                                          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                                                                          {loading ? 'กำลังบันทึก...' : 'บันทึกข้อมูลธนาคาร'}
                                                                                </span>
                                                                      </Button>
                                                            </form>
                                                  </CardContent>
                                        </Card>

                                        {/* Notification Settings */}
                                        <Card>
                                                  <CardHeader>
                                                            <CardTitle className="flex items-center gap-2">
                                                                      <Bell className="w-5 h-5 text-fighter-red" />
                                                                      ตั้งค่าการแจ้งเตือน
                                                            </CardTitle>
                                                  </CardHeader>
                                                  <CardContent>
                                                            <div className="space-y-4">
                                                                      <label className="flex items-center gap-3 p-4 border-2 border-ink-black bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors">
                                                                                <input type="checkbox" defaultChecked className="w-5 h-5 accent-fighter-red" />
                                                                                <div>
                                                                                          <p className="font-bold uppercase text-sm">การลงทะเบียนใหม่</p>
                                                                                          <p className="text-gray-600 text-sm">รับการแจ้งเตือนเมื่อมีนักเรียนลงทะเบียน</p>
                                                                                </div>
                                                                      </label>

                                                                      <label className="flex items-center gap-3 p-4 border-2 border-ink-black bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors">
                                                                                <input type="checkbox" defaultChecked className="w-5 h-5 accent-fighter-red" />
                                                                                <div>
                                                                                          <p className="font-bold uppercase text-sm">สลิปชำระเงิน</p>
                                                                                          <p className="text-gray-600 text-sm">รับการแจ้งเตือนเมื่อมีสลิปรอตรวจสอบ</p>
                                                                                </div>
                                                                      </label>

                                                                      <label className="flex items-center gap-3 p-4 border-2 border-ink-black bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors">
                                                                                <input type="checkbox" defaultChecked className="w-5 h-5 accent-fighter-red" />
                                                                                <div>
                                                                                          <p className="font-bold uppercase text-sm">รีวิวคอร์ส</p>
                                                                                          <p className="text-gray-600 text-sm">รับการแจ้งเตือนเมื่อมีนักเรียนรีวิว</p>
                                                                                </div>
                                                                      </label>
                                                            </div>
                                                  </CardContent>
                                        </Card>
                              </div>
                    </div>
          );
}
