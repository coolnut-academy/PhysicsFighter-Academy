'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { PaymentSlip, COLLECTIONS } from '@/types';
import { Card } from '@/components/ui/card';
import { PaymentVerificationTable } from '@/components/admin/PaymentVerificationTable';
import { Loading } from '@/components/shared/Loading';
import { Receipt } from 'lucide-react';

export default function PaymentsPage() {
          const { user } = useAuthStore();
          const [payments, setPayments] = useState<PaymentSlip[]>([]);
          const [loading, setLoading] = useState(true);

          useEffect(() => {
                    if (user) {
                              fetchPayments();
                    }
          }, [user]);

          const fetchPayments = async () => {
                    try {
                              setLoading(true);
                              // Query payments where ownerId matches current instructor
                              const q = query(
                                        collection(db, COLLECTIONS.PAYMENT_SLIPS),
                                        where('ownerId', '==', user?.id),
                                        orderBy('createdAt', 'desc')
                              );

                              const snapshot = await getDocs(q);
                              const paymentsData = snapshot.docs.map((doc) => ({
                                        id: doc.id,
                                        ...doc.data(),
                              })) as PaymentSlip[];

                              setPayments(paymentsData);
                    } catch (error) {
                              console.error('Error fetching payments:', error);
                    } finally {
                              setLoading(false);
                    }
          };

          const handlePaymentUpdated = () => {
                    // Refresh payments after approval/rejection
                    fetchPayments();
          };

          if (loading) {
                    return <Loading text="Loading payment slips..." />;
          }

          return (
                    <div className="space-y-6">
                              {/* Header */}
                              <div>
                                        <h1 className="text-4xl font-bold text-gradient">Payment Verification</h1>
                                        <p className="text-dark-text-secondary mt-2">
                                                  Review and approve student payment slips for your courses
                                        </p>
                              </div>

                              {/* Payment Table */}
                              {payments.length === 0 ? (
                                        <Card className="glass-card p-12 text-center">
                                                  <Receipt className="w-16 h-16 text-neon-magenta/50 mx-auto mb-4" />
                                                  <h3 className="text-xl font-bold mb-2">No payment slips yet</h3>
                                                  <p className="text-dark-text-secondary">
                                                            Payment slips from students will appear here
                                                  </p>
                                        </Card>
                              ) : (
                                        <Card className="glass-card p-6">
                                                  <PaymentVerificationTable
                                                            payments={payments}
                                                            onPaymentUpdated={handlePaymentUpdated}
                                                  />
                                        </Card>
                              )}
                    </div>
          );
}
