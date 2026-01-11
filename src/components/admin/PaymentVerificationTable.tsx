'use client';

import { useState } from 'react';
import { doc, updateDoc, addDoc, collection, serverTimestamp, getDoc, runTransaction, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { PaymentSlip, PaymentStatus, COLLECTIONS, EnrollmentStatus, DurationMonths } from '@/types';
import { addMonths } from 'date-fns';
import {
          Table,
          TableBody,
          TableCell,
          TableHead,
          TableHeader,
          TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
          Dialog,
          DialogContent,
          DialogDescription,
          DialogHeader,
          DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Check, X, Eye, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDate, formatCurrency } from '@/lib/utils';

interface PaymentVerificationTableProps {
          payments: PaymentSlip[];
          onPaymentUpdated: () => void;
}

export function PaymentVerificationTable({
          payments,
          onPaymentUpdated,
}: PaymentVerificationTableProps) {
          const { toast } = useToast();
          const [selectedPayment, setSelectedPayment] = useState<PaymentSlip | null>(null);
          const [viewDialogOpen, setViewDialogOpen] = useState(false);
          const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
          const [rejectionReason, setRejectionReason] = useState('');
          const [processing, setProcessing] = useState(false);

          const getStatusBadge = (status: PaymentStatus) => {
                    switch (status) {
                              case PaymentStatus.PENDING:
                                        return <Badge className="bg-yellow-500/20 text-yellow-500">Pending</Badge>;
                              case PaymentStatus.APPROVED:
                                        return <Badge className="bg-green-500/20 text-green-500">Approved</Badge>;
                              case PaymentStatus.REJECTED:
                                        return <Badge className="bg-red-500/20 text-red-500">Rejected</Badge>;
                    }
          };

          const getDurationLabel = (months: DurationMonths) => {
                    return `${months} Month${months > 1 ? 's' : ''}`;
          };

          const handleApprove = async (payment: PaymentSlip) => {
                    try {
                              setProcessing(true);

                              await runTransaction(db, async (transaction) => {
                                        // 1. Get course data first
                                        const courseRef = doc(db, COLLECTIONS.COURSES, payment.courseId);
                                        const courseDoc = await transaction.get(courseRef);

                                        if (!courseDoc.exists()) {
                                                  throw new Error('Course not found');
                                        }

                                        const courseData = courseDoc.data();

                                        // 2. Prepare refs
                                        const paymentRef = doc(db, COLLECTIONS.PAYMENT_SLIPS, payment.id);
                                        const enrollmentRef = doc(collection(db, COLLECTIONS.ENROLLMENTS));
                                        const revenueRef = doc(collection(db, COLLECTIONS.REVENUE_RECORDS));
                                        const notificationRef = doc(collection(db, COLLECTIONS.NOTIFICATIONS));

                                        // 3. Update payment status
                                        transaction.update(paymentRef, {
                                                  status: PaymentStatus.APPROVED,
                                                  reviewedAt: serverTimestamp(),
                                                  updatedAt: serverTimestamp(),
                                        });

                                        // 4. Calculate expiration
                                        const expiresAt = addMonths(new Date(), payment.selectedDuration);

                                        // 5. Create enrollment
                                        transaction.set(enrollmentRef, {
                                                  courseId: payment.courseId,
                                                  studentId: payment.studentId,
                                                  ownerId: payment.ownerId,
                                                  startDate: serverTimestamp(),
                                                  expiresAt: expiresAt,
                                                  selectedDuration: payment.selectedDuration,
                                                  status: EnrollmentStatus.ACTIVE,
                                                  paymentSlipId: payment.id,
                                                  pricePaid: payment.amount,
                                                  progress: [],
                                                  overallProgress: 0,
                                                  createdAt: serverTimestamp(),
                                                  updatedAt: serverTimestamp(),
                                        });

                                        // 6. Create revenue record
                                        transaction.set(revenueRef, {
                                                  ownerId: payment.ownerId,
                                                  enrollmentId: enrollmentRef.id,
                                                  paymentSlipId: payment.id,
                                                  amount: payment.amount,
                                                  courseId: payment.courseId,
                                                  courseName: courseData?.title || 'Unknown Course',
                                                  studentId: payment.studentId,
                                                  studentName: 'Student',
                                                  date: serverTimestamp(),
                                                  month: new Date().toISOString().substring(0, 7),
                                                  year: new Date().getFullYear(),
                                        });

                                        // 7. Create notification
                                        transaction.set(notificationRef, {
                                                  userId: payment.studentId,
                                                  type: 'payment_approved',
                                                  title: 'Payment Approved!',
                                                  message: `Your payment for "${courseData.title}" has been approved. You can now access the course.`,
                                                  relatedCourseId: payment.courseId,
                                                  relatedEnrollmentId: enrollmentRef.id,
                                                  relatedPaymentSlipId: payment.id,
                                                  isRead: false,
                                                  createdAt: serverTimestamp(),
                                        });
                              });

                              toast({
                                        title: 'Payment Approved',
                                        description: `Enrollment created with ${payment.selectedDuration}-month access`,
                              });

                              onPaymentUpdated();
                    } catch (error: any) {
                              console.error('Error approving payment:', error);
                              toast({
                                        title: 'Error',
                                        description: error.message || 'Failed to approve payment',
                                        variant: 'destructive',
                              });
                    } finally {
                              setProcessing(false);
                    }
          };

          const handleReject = async () => {
                    if (!selectedPayment) return;

                    if (!rejectionReason.trim()) {
                              toast({
                                        title: 'Error',
                                        description: 'Please provide a reason for rejection',
                                        variant: 'destructive',
                              });
                              return;
                    }

                    try {
                              setProcessing(true);

                              const batch = writeBatch(db);

                              // 1. Update payment status
                              const paymentRef = doc(db, COLLECTIONS.PAYMENT_SLIPS, selectedPayment.id);
                              batch.update(paymentRef, {
                                        status: PaymentStatus.REJECTED,
                                        rejectionReason,
                                        reviewedAt: serverTimestamp(),
                                        updatedAt: serverTimestamp(),
                              });

                              // 2. Create notification
                              const notificationRef = doc(collection(db, COLLECTIONS.NOTIFICATIONS));
                              batch.set(notificationRef, {
                                        userId: selectedPayment.studentId,
                                        type: 'payment_rejected',
                                        title: 'Payment Rejected',
                                        message: `Your payment was rejected. Reason: ${rejectionReason}`,
                                        relatedPaymentSlipId: selectedPayment.id,
                                        relatedCourseId: selectedPayment.courseId,
                                        isRead: false,
                                        createdAt: serverTimestamp(),
                              });

                              await batch.commit();

                              toast({
                                        title: 'Payment Rejected',
                                        description: 'The student has been notified',
                              });

                              setRejectDialogOpen(false);
                              setRejectionReason('');
                              setSelectedPayment(null);
                              onPaymentUpdated();
                    } catch (error: any) {
                              console.error('Error rejecting payment:', error);
                              toast({
                                        title: 'Error',
                                        description: error.message || 'Failed to reject payment',
                                        variant: 'destructive',
                              });
                    } finally {
                              setProcessing(false);
                    }
          };

          const handleViewSlip = (payment: PaymentSlip) => {
                    setSelectedPayment(payment);
                    setViewDialogOpen(true);
          };

          const openRejectDialog = (payment: PaymentSlip) => {
                    setSelectedPayment(payment);
                    setRejectDialogOpen(true);
          };

          return (
                    <>
                              <div className="rounded-lg border border-white/10 overflow-hidden">
                                        <Table>
                                                  <TableHeader>
                                                            <TableRow className="border-white/10 hover:bg-white/5">
                                                                      <TableHead>Date</TableHead>
                                                                      <TableHead>Student</TableHead>
                                                                      <TableHead>Course</TableHead>
                                                                      <TableHead>Duration</TableHead>
                                                                      <TableHead>Amount</TableHead>
                                                                      <TableHead>Status</TableHead>
                                                                      <TableHead className="text-right">Actions</TableHead>
                                                            </TableRow>
                                                  </TableHeader>
                                                  <TableBody>
                                                            {payments.map((payment) => (
                                                                      <TableRow
                                                                                key={payment.id}
                                                                                className="border-white/10 hover:bg-white/5"
                                                                      >
                                                                                <TableCell className="text-sm">
                                                                                          {payment.slipUploadedAt &&
                                                                                                    formatDate(payment.slipUploadedAt.toDate())}
                                                                                </TableCell>
                                                                                <TableCell>
                                                                                          <div className="text-sm">{payment.studentId}</div>
                                                                                </TableCell>
                                                                                <TableCell>
                                                                                          <div className="text-sm font-medium">{payment.courseId}</div>
                                                                                </TableCell>
                                                                                <TableCell>
                                                                                          <Badge variant="outline" className="neon-border">
                                                                                                    {getDurationLabel(payment.selectedDuration)}
                                                                                          </Badge>
                                                                                </TableCell>
                                                                                <TableCell className="font-bold text-neon-cyan">
                                                                                          {formatCurrency(payment.amount)}
                                                                                </TableCell>
                                                                                <TableCell>{getStatusBadge(payment.status)}</TableCell>
                                                                                <TableCell className="text-right">
                                                                                          <div className="flex gap-2 justify-end">
                                                                                                    <Button
                                                                                                              size="sm"
                                                                                                              variant="outline"
                                                                                                              onClick={() => handleViewSlip(payment)}
                                                                                                              className="neon-border"
                                                                                                    >
                                                                                                              <Eye className="w-4 h-4" />
                                                                                                    </Button>
                                                                                                    {payment.status === PaymentStatus.PENDING && (
                                                                                                              <>
                                                                                                                        <Button
                                                                                                                                  size="sm"
                                                                                                                                  onClick={() => handleApprove(payment)}
                                                                                                                                  disabled={processing}
                                                                                                                                  className="bg-green-500/20 text-green-500 hover:bg-green-500/30 border-green-500/30"
                                                                                                                        >
                                                                                                                                  {processing ? (
                                                                                                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                                                                                                  ) : (
                                                                                                                                            <Check className="w-4 h-4" />
                                                                                                                                  )}
                                                                                                                        </Button>
                                                                                                                        <Button
                                                                                                                                  size="sm"
                                                                                                                                  onClick={() => openRejectDialog(payment)}
                                                                                                                                  disabled={processing}
                                                                                                                                  className="bg-red-500/20 text-red-500 hover:bg-red-500/30 border-red-500/30"
                                                                                                                        >
                                                                                                                                  <X className="w-4 h-4" />
                                                                                                                        </Button>
                                                                                                              </>
                                                                                                    )}
                                                                                          </div>
                                                                                </TableCell>
                                                                      </TableRow>
                                                            ))}
                                                  </TableBody>
                                        </Table>
                              </div>

                              {/* View Slip Dialog */}
                              <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
                                        <DialogContent className="glass-card border-white/10 max-w-2xl">
                                                  <DialogHeader>
                                                            <DialogTitle className="text-neon-cyan">Payment Slip</DialogTitle>
                                                            <DialogDescription>
                                                                      Verify the payment details before approval
                                                            </DialogDescription>
                                                  </DialogHeader>
                                                  {selectedPayment && (
                                                            <div className="space-y-4">
                                                                      <div className="grid grid-cols-2 gap-4 text-sm">
                                                                                <div>
                                                                                          <p className="text-dark-text-secondary">Amount</p>
                                                                                          <p className="font-bold text-neon-cyan">
                                                                                                    {formatCurrency(selectedPayment.amount)}
                                                                                          </p>
                                                                                </div>
                                                                                <div>
                                                                                          <p className="text-dark-text-secondary">Duration</p>
                                                                                          <p className="font-bold">
                                                                                                    {getDurationLabel(selectedPayment.selectedDuration)}
                                                                                          </p>
                                                                                </div>
                                                                                <div>
                                                                                          <p className="text-dark-text-secondary">Payment Method</p>
                                                                                          <p className="font-medium capitalize">
                                                                                                    {selectedPayment.paymentMethod.replace('_', ' ')}
                                                                                          </p>
                                                                                </div>
                                                                                <div>
                                                                                          <p className="text-dark-text-secondary">Status</p>
                                                                                          {getStatusBadge(selectedPayment.status)}
                                                                                </div>
                                                                      </div>
                                                                      <div>
                                                                                <p className="text-dark-text-secondary mb-2">Payment Slip Image</p>
                                                                                <img
                                                                                          src={selectedPayment.slipImageUrl}
                                                                                          alt="Payment slip"
                                                                                          className="w-full rounded-lg border border-white/10"
                                                                                />
                                                                      </div>
                                                            </div>
                                                  )}
                                        </DialogContent>
                              </Dialog>

                              {/* Reject Dialog */}
                              <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                                        <DialogContent className="glass-card border-white/10">
                                                  <DialogHeader>
                                                            <DialogTitle className="text-red-400">Reject Payment</DialogTitle>
                                                            <DialogDescription>
                                                                      Please provide a reason for rejecting this payment
                                                            </DialogDescription>
                                                  </DialogHeader>
                                                  <div className="space-y-4">
                                                            <div>
                                                                      <Label htmlFor="reason">Rejection Reason</Label>
                                                                      <Textarea
                                                                                id="reason"
                                                                                value={rejectionReason}
                                                                                onChange={(e) => setRejectionReason(e.target.value)}
                                                                                placeholder="e.g., Payment amount doesn't match, unclear slip image..."
                                                                                rows={4}
                                                                                className="bg-dark-bg-secondary border-white/10 mt-2"
                                                                      />
                                                            </div>
                                                            <div className="flex gap-3">
                                                                      <Button
                                                                                variant="outline"
                                                                                onClick={() => setRejectDialogOpen(false)}
                                                                                className="flex-1"
                                                                      >
                                                                                Cancel
                                                                      </Button>
                                                                      <Button
                                                                                onClick={handleReject}
                                                                                disabled={processing}
                                                                                className="flex-1 bg-red-500/20 text-red-500 hover:bg-red-500/30"
                                                                      >
                                                                                {processing ? (
                                                                                          <>
                                                                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                                                                    Rejecting...
                                                                                          </>
                                                                                ) : (
                                                                                          'Reject Payment'
                                                                                )}
                                                                      </Button>
                                                            </div>
                                                  </div>
                                        </DialogContent>
                              </Dialog>
                    </>
          );
}
