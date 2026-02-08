'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase/config';
import { useAuthStore } from '@/store/useAuthStore';
import { Course, User, COLLECTIONS, DurationMonths, PaymentStatus, EnrollmentStatus } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
          Check,
          ArrowLeft,
          ArrowRight,
          Upload,
          Loader2,
          CreditCard,
          Clock,
          Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';
import { Loading } from '@/components/shared/Loading';

type CheckoutStep = 'duration' | 'payment' | 'confirmation';

export default function CheckoutPage() {
          const params = useParams();
          const router = useRouter();
          const { user } = useAuthStore();
          const { toast } = useToast();
          const courseId = params.courseId as string;

          const [course, setCourse] = useState<Course | null>(null);
          const [courseOwner, setCourseOwner] = useState<User | null>(null);
          const [loading, setLoading] = useState(true);
          const [submitting, setSubmitting] = useState(false);

          const [currentStep, setCurrentStep] = useState<CheckoutStep>('duration');
          const [selectedDuration, setSelectedDuration] = useState<DurationMonths>(3);
          const [selectedPrice, setSelectedPrice] = useState(0);

          const [slipFile, setSlipFile] = useState<File | null>(null);
          const [slipPreview, setSlipPreview] = useState<string>('');
          const [paymentData, setPaymentData] = useState({
                    amount: 0,
                    paymentDate: '',
                    paymentTime: '',
          });

          useEffect(() => {
                    console.log('[DEBUG Checkout] Course ID:', courseId);
                    console.log('[DEBUG Checkout] User:', user?.id, user?.profile?.email);

                    // Check if user is authenticated
                    if (!user) {
                              console.log('[DEBUG Checkout] No user, redirecting to login');
                              toast({
                                        title: 'กรุณาเข้าสู่ระบบ',
                                        description: 'ต้อง login ก่อนสมัครคอร์ส',
                                        variant: 'destructive',
                              });
                              router.push('/login?redirect=/checkout/' + courseId);
                              return;
                    }
                    console.log('[DEBUG Checkout] User authenticated, fetching course data');
                    fetchCourseData();
          }, [courseId, user]);

          const fetchCourseData = async () => {
                    try {
                              setLoading(true);
                              console.log('[DEBUG Checkout] Fetching course:', courseId);

                              // Fetch course
                              const courseDoc = await getDoc(doc(db, COLLECTIONS.COURSES, courseId));
                              console.log('[DEBUG Checkout] Course exists:', courseDoc.exists());

                              if (!courseDoc.exists()) {
                                        toast({
                                                  title: 'Error',
                                                  description: 'Course not found',
                                                  variant: 'destructive',
                                        });
                                        router.push('/courses');
                                        return;
                              }

                              const courseData = { id: courseDoc.id, ...courseDoc.data() } as Course;
                              setCourse(courseData);

                              // Fetch course owner (instructor)
                              const ownerDoc = await getDoc(doc(db, COLLECTIONS.USERS, courseData.ownerId));
                              if (ownerDoc.exists()) {
                                        const ownerData = { id: ownerDoc.id, ...ownerDoc.data() } as User;

                                        // Validate bank details (skip for super_admin testing)
                                        const hasBankDetails = ownerData.bankDetails &&
                                                  (ownerData.bankDetails.qrCodeUrl || ownerData.bankDetails.accountNumber);

                                        // Allow super_admin to bypass bank details check for testing
                                        if (!hasBankDetails && user?.role !== 'super_admin') {
                                                  toast({
                                                            title: 'ยังไม่สามารถสมัครได้',
                                                            description: 'ผู้สอนยังไม่ได้ตั้งค่าบัญชีธนาคาร กรุณาติดต่อผู้สอน',
                                                            variant: 'destructive',
                                                  });
                                                  router.push('/courses');
                                                  return;
                                        }

                                        setCourseOwner(ownerData);
                              }

                              // Set initial price
                              setSelectedPrice(courseData.pricing.threeMonths);
                    } catch (error) {
                              console.error('Error fetching course:', error);
                              toast({
                                        title: 'Error',
                                        description: 'Failed to load course',
                                        variant: 'destructive',
                              });
                    } finally {
                              setLoading(false);
                    }
          };

          const handleDurationChange = (duration: DurationMonths) => {
                    if (!course) return;
                    setSelectedDuration(duration);

                    switch (duration) {
                              case 3:
                                        setSelectedPrice(course.pricing.threeMonths);
                                        break;
                              case 6:
                                        setSelectedPrice(course.pricing.sixMonths);
                                        break;
                              case 12:
                                        setSelectedPrice(course.pricing.twelveMonths);
                                        break;
                    }
          };

          const handleSlipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                    const file = e.target.files?.[0];
                    if (file) {
                              setSlipFile(file);
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                        setSlipPreview(reader.result as string);
                              };
                              reader.readAsDataURL(file);
                    }
          };

          const handleRemoveSlip = () => {
                    setSlipFile(null);
                    setSlipPreview('');
          };

          const handleSubmit = async () => {
                    if (!user || !course || !courseOwner) {
                              toast({
                                        title: 'Error',
                                        description: 'Please login to continue',
                                        variant: 'destructive',
                              });
                              return;
                    }

                    if (!slipFile) {
                              toast({
                                        title: 'Error',
                                        description: 'Please upload payment slip',
                                        variant: 'destructive',
                              });
                              return;
                    }

                    if (!paymentData.amount || !paymentData.paymentDate || !paymentData.paymentTime) {
                              toast({
                                        title: 'Error',
                                        description: 'Please fill in all payment details',
                                        variant: 'destructive',
                              });
                              return;
                    }

                    try {
                              setSubmitting(true);

                              // Upload slip to Firebase Storage
                              const storageRef = ref(
                                        storage,
                                        `payment-slips/${user.id}/${Date.now()}_${slipFile.name}`
                              );
                              await uploadBytes(storageRef, slipFile);
                              const slipImageUrl = await getDownloadURL(storageRef);

                              // Create payment slip document
                              const paymentSlipData = {
                                        studentId: user.id,
                                        courseId: course.id,
                                        ownerId: course.ownerId, // CRITICAL: Course owner, not platform
                                        amount: paymentData.amount,
                                        selectedDuration: selectedDuration,
                                        paymentMethod: 'qr_code' as const,
                                        slipImageUrl,
                                        slipUploadedAt: serverTimestamp(),
                                        bankDetails: courseOwner.bankDetails || {}, // Snapshot of instructor's bank details
                                        status: PaymentStatus.PENDING,
                                        createdAt: serverTimestamp(),
                                        updatedAt: serverTimestamp(),
                              };

                              const paymentSlipRef = await addDoc(collection(db, COLLECTIONS.PAYMENT_SLIPS), paymentSlipData);

                              // Calculate expiration date
                              const startDate = new Date();
                              const expiresAt = new Date(startDate);
                              expiresAt.setMonth(expiresAt.getMonth() + selectedDuration);

                              // Create enrollment document (accessGranted: false)
                              const enrollmentData = {
                                        courseId: course.id,
                                        studentId: user.id,
                                        ownerId: course.ownerId,
                                        startDate: serverTimestamp(), // Will be start date
                                        expiresAt: expiresAt, // Calculated expiration
                                        selectedDuration: selectedDuration,
                                        status: EnrollmentStatus.ACTIVE, // Exists but pending access
                                        accessGranted: false, // Pending approval
                                        paymentSlipId: paymentSlipRef.id,
                                        pricePaid: paymentData.amount,
                                        progress: [],
                                        overallProgress: 0,
                                        createdAt: serverTimestamp(),
                                        updatedAt: serverTimestamp(),
                              };

                              await addDoc(collection(db, COLLECTIONS.ENROLLMENTS), enrollmentData);

                              toast({
                                        title: 'Success!',
                                        description: 'Payment slip submitted. Course is now pending approval.',
                              });

                              router.push('/my-enrollments');
                    } catch (error: any) {
                              console.error('Error submitting payment:', error);
                              toast({
                                        title: 'Error',
                                        description: error.message || 'Failed to submit payment',
                                        variant: 'destructive',
                              });
                    } finally {
                              setSubmitting(false);
                    }
          };

          if (loading) {
                    return <Loading text="Loading checkout..." />;
          }

          if (!course || !courseOwner) {
                    return null;
          }

          return (
                    <div className="min-h-screen py-12 bg-ink-black text-white">
                              <div className="container mx-auto px-4 max-w-4xl">
                                        {/* Header */}
                                        <div className="flex items-center gap-4 mb-8">
                                                  <Link href={`/courses/${courseId}`}>
                                                            <Button variant="outline" size="icon">
                                                                      <ArrowLeft className="w-4 h-4" />
                                                            </Button>
                                                  </Link>
                                                  <div>
                                                            <h1 className="text-4xl font-bold text-gradient">Checkout</h1>
                                                            <p className="text-dark-text-secondary mt-1">{course.title}</p>
                                                  </div>
                                        </div>

                                        {/* Progress Steps */}
                                        <div className="flex items-center justify-center gap-4 mb-12">
                                                  <StepIndicator
                                                            step={1}
                                                            label="Duration"
                                                            active={currentStep === 'duration'}
                                                            completed={currentStep === 'payment' || currentStep === 'confirmation'}
                                                  />
                                                  <div className="w-12 h-[2px] bg-white/10" />
                                                  <StepIndicator
                                                            step={2}
                                                            label="Payment"
                                                            active={currentStep === 'payment'}
                                                            completed={currentStep === 'confirmation'}
                                                  />
                                                  <div className="w-12 h-[2px] bg-white/10" />
                                                  <StepIndicator
                                                            step={3}
                                                            label="Confirm"
                                                            active={currentStep === 'confirmation'}
                                                            completed={false}
                                                  />
                                        </div>

                                        {/* Step Content */}
                                        {currentStep === 'duration' && (
                                                  <DurationStep
                                                            course={course}
                                                            selectedDuration={selectedDuration}
                                                            onDurationChange={handleDurationChange}
                                                            onNext={() => setCurrentStep('payment')}
                                                  />
                                        )}

                                        {currentStep === 'payment' && (
                                                  <PaymentStep
                                                            courseOwner={courseOwner}
                                                            selectedPrice={selectedPrice}
                                                            selectedDuration={selectedDuration}
                                                            onBack={() => setCurrentStep('duration')}
                                                            onNext={() => setCurrentStep('confirmation')}
                                                  />
                                        )}

                                        {currentStep === 'confirmation' && (
                                                  <ConfirmationStep
                                                            selectedPrice={selectedPrice}
                                                            paymentData={paymentData}
                                                            setPaymentData={setPaymentData}
                                                            slipPreview={slipPreview}
                                                            onSlipChange={handleSlipChange}
                                                            onRemoveSlip={handleRemoveSlip}
                                                            onBack={() => setCurrentStep('payment')}
                                                            onSubmit={handleSubmit}
                                                            submitting={submitting}
                                                  />
                                        )}
                              </div>
                    </div>
          );
}

// Step Indicator Component
function StepIndicator({
          step,
          label,
          active,
          completed,
}: {
          step: number;
          label: string;
          active: boolean;
          completed: boolean;
}) {
          return (
                    <div className="flex flex-col items-center gap-2">
                              <div
                                        className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all ${completed
                                                  ? 'bg-neon-cyan text-dark-bg-primary shadow-[0_0_20px_rgba(0,255,240,0.5)]'
                                                  : active
                                                            ? 'bg-neon-magenta text-dark-bg-primary shadow-[0_0_20px_rgba(255,0,255,0.5)]'
                                                            : 'bg-dark-bg-secondary text-dark-text-muted border border-white/10'
                                                  }`}
                              >
                                        {completed ? <Check className="w-6 h-6" /> : step}
                              </div>
                              <span
                                        className={`text-sm ${active ? 'text-neon-magenta font-bold' : 'text-dark-text-secondary'
                                                  }`}
                              >
                                        {label}
                              </span>
                    </div>
          );
}

// Duration Selection Step
function DurationStep({
          course,
          selectedDuration,
          onDurationChange,
          onNext,
}: {
          course: Course;
          selectedDuration: DurationMonths;
          onDurationChange: (duration: DurationMonths) => void;
          onNext: () => void;
}) {
          const durations: { months: DurationMonths; price: number; badge?: string }[] = [
                    { months: 3, price: course.pricing.threeMonths },
                    { months: 6, price: course.pricing.sixMonths, badge: 'Popular' },
                    { months: 12, price: course.pricing.twelveMonths, badge: 'Best Value' },
          ];

          return (
                    <Card className="glass-card p-8">
                              <h2 className="text-2xl font-bold text-neon-cyan mb-6">
                                        Choose Access Duration
                              </h2>

                              <div className="grid md:grid-cols-3 gap-4 mb-8">
                                        {durations.map((duration) => (
                                                  <button
                                                            key={duration.months}
                                                            onClick={() => onDurationChange(duration.months)}
                                                            className={`relative p-6 rounded-lg border-2 transition-all ${selectedDuration === duration.months
                                                                      ? 'border-neon-cyan bg-neon-cyan/10 shadow-[0_0_30px_rgba(0,255,240,0.3)]'
                                                                      : 'border-white/10 hover:border-neon-cyan/50 hover:bg-neon-cyan/5'
                                                                      }`}
                                                  >
                                                            {duration.badge && (
                                                                      <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-neon-magenta/20 text-neon-magenta border-neon-magenta/30">
                                                                                {duration.badge}
                                                                      </Badge>
                                                            )}

                                                            <div className="flex items-center justify-center mb-3">
                                                                      <Clock className="w-8 h-8 text-neon-cyan" />
                                                            </div>

                                                            <div className="text-center">
                                                                      <p className="text-2xl font-bold mb-1">{duration.months} Months</p>
                                                                      <p className="text-3xl font-bold text-neon-cyan mb-2">
                                                                                {formatCurrency(duration.price)}
                                                                      </p>
                                                                      <p className="text-sm text-dark-text-secondary">
                                                                                {formatCurrency(duration.price / duration.months)}/month
                                                                      </p>
                                                            </div>

                                                            {selectedDuration === duration.months && (
                                                                      <div className="absolute top-3 right-3">
                                                                                <div className="w-6 h-6 rounded-full bg-neon-cyan flex items-center justify-center">
                                                                                          <Check className="w-4 h-4 text-dark-bg-primary" />
                                                                                </div>
                                                                      </div>
                                                            )}
                                                  </button>
                                        ))}
                              </div>

                              <Button onClick={onNext} className="w-full">
                                        <span className="flex items-center gap-2">
                                                  Continue to Payment
                                                  <ArrowRight className="w-4 h-4" />
                                        </span>
                              </Button>
                    </Card>
          );
}

// Payment Step
function PaymentStep({
          courseOwner,
          selectedPrice,
          selectedDuration,
          onBack,
          onNext,
}: {
          courseOwner: User;
          selectedPrice: number;
          selectedDuration: DurationMonths;
          onBack: () => void;
          onNext: () => void;
}) {
          return (
                    <Card className="glass-card p-8">
                              <h2 className="text-2xl font-bold text-neon-magenta mb-6">
                                        Payment Information
                              </h2>

                              <div className="space-y-6">
                                        {/* Payment Summary */}
                                        <div className="p-4 rounded-lg border border-white/10 bg-dark-bg-secondary/50">
                                                  <div className="flex justify-between items-center mb-2">
                                                            <span className="text-dark-text-secondary">Access Duration</span>
                                                            <span className="font-bold">{selectedDuration} Months</span>
                                                  </div>
                                                  <div className="flex justify-between items-center">
                                                            <span className="text-dark-text-secondary">Amount to Pay</span>
                                                            <span className="text-2xl font-bold text-neon-cyan">
                                                                      {formatCurrency(selectedPrice)}
                                                            </span>
                                                  </div>
                                        </div>

                                        {/* Instructor Bank Details */}
                                        {courseOwner.bankDetails && (
                                                  <div>
                                                            <h3 className="text-lg font-bold text-neon-cyan mb-4">
                                                                      Scan QR Code to Pay
                                                            </h3>

                                                            <div className="grid md:grid-cols-2 gap-6">
                                                                      {/* QR Code */}
                                                                      {courseOwner.bankDetails.qrCodeUrl && (
                                                                                <div className="flex flex-col items-center">
                                                                                          <div className="p-4 bg-white rounded-lg">
                                                                                                    <img
                                                                                                              src={courseOwner.bankDetails.qrCodeUrl}
                                                                                                              alt="Payment QR Code"
                                                                                                              className="w-64 h-64 object-contain"
                                                                                                    />
                                                                                          </div>
                                                                                          <p className="text-sm text-dark-text-secondary mt-2">
                                                                                                    Scan with banking app
                                                                                          </p>
                                                                                </div>
                                                                      )}

                                                                      {/* Bank Details */}
                                                                      <div className="space-y-4">
                                                                                <div>
                                                                                          <p className="text-sm text-dark-text-secondary">Bank Name</p>
                                                                                          <p className="font-bold text-lg">{courseOwner.bankDetails.bankName}</p>
                                                                                </div>
                                                                                <div>
                                                                                          <p className="text-sm text-dark-text-secondary">Account Name</p>
                                                                                          <p className="font-bold">{courseOwner.bankDetails.accountName}</p>
                                                                                </div>
                                                                                <div>
                                                                                          <p className="text-sm text-dark-text-secondary">Account Number</p>
                                                                                          <p className="font-mono text-lg">{courseOwner.bankDetails.accountNumber}</p>
                                                                                </div>
                                                                                {courseOwner.bankDetails.promptPayId && (
                                                                                          <div>
                                                                                                    <p className="text-sm text-dark-text-secondary">PromptPay ID</p>
                                                                                                    <p className="font-mono">{courseOwner.bankDetails.promptPayId}</p>
                                                                                          </div>
                                                                                )}
                                                                      </div>
                                                            </div>
                                                  </div>
                                        )}

                                        {/* Instructions */}
                                        <div className="p-4 rounded-lg border border-neon-cyan/30 bg-neon-cyan/5">
                                                  <div className="flex gap-3">
                                                            <Zap className="w-5 h-5 text-neon-cyan flex-shrink-0 mt-0.5" />
                                                            <div className="text-sm">
                                                                      <p className="font-bold text-neon-cyan mb-2">Payment Instructions:</p>
                                                                      <ol className="list-decimal list-inside space-y-1 text-dark-text-secondary">
                                                                                <li>Scan the QR code or use the bank details above</li>
                                                                                <li>Transfer exactly {formatCurrency(selectedPrice)}</li>
                                                                                <li>Save or screenshot your payment slip</li>
                                                                                <li>Upload the slip in the next step</li>
                                                                      </ol>
                                                            </div>
                                                  </div>
                                        </div>
                              </div>

                              <div className="flex gap-4 mt-8">
                                        <Button variant="outline" onClick={onBack} className="flex-1">
                                                  <ArrowLeft className="w-4 h-4 mr-2" />
                                                  Back
                                        </Button>
                                        <Button onClick={onNext} className="flex-1">
                                                  <span className="flex items-center gap-2">
                                                            I've Made Payment
                                                            <ArrowRight className="w-4 h-4" />
                                                  </span>
                                        </Button>
                              </div>
                    </Card>
          );
}

// Confirmation Step
function ConfirmationStep({
          selectedPrice,
          paymentData,
          setPaymentData,
          slipPreview,
          onSlipChange,
          onRemoveSlip,
          onBack,
          onSubmit,
          submitting,
}: {
          selectedPrice: number;
          paymentData: { amount: number; paymentDate: string; paymentTime: string };
          setPaymentData: (data: any) => void;
          slipPreview: string;
          onSlipChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
          onRemoveSlip: () => void;
          onBack: () => void;
          onSubmit: () => void;
          submitting: boolean;
}) {
          return (
                    <Card className="glass-card p-8">
                              <h2 className="text-2xl font-bold text-neon-purple mb-6">
                                        Upload Payment Slip
                              </h2>

                              <div className="space-y-6">
                                        {/* Payment Details Form */}
                                        <div className="grid md:grid-cols-2 gap-4">
                                                  <div>
                                                            <Label htmlFor="amount">Amount Paid (THB) *</Label>
                                                            <Input
                                                                      id="amount"
                                                                      type="number"
                                                                      value={paymentData.amount || ''}
                                                                      onChange={(e) =>
                                                                                setPaymentData({ ...paymentData, amount: parseFloat(e.target.value) })
                                                                      }
                                                                      placeholder={selectedPrice.toString()}
                                                                      className="bg-dark-bg-secondary border-white/10 mt-2"
                                                                      required
                                                            />
                                                  </div>
                                                  <div>
                                                            <Label htmlFor="date">Payment Date *</Label>
                                                            <Input
                                                                      id="date"
                                                                      type="date"
                                                                      value={paymentData.paymentDate}
                                                                      onChange={(e) =>
                                                                                setPaymentData({ ...paymentData, paymentDate: e.target.value })
                                                                      }
                                                                      className="bg-dark-bg-secondary border-white/10 mt-2"
                                                                      required
                                                            />
                                                  </div>
                                                  <div className="md:col-span-2">
                                                            <Label htmlFor="time">Payment Time *</Label>
                                                            <Input
                                                                      id="time"
                                                                      type="time"
                                                                      value={paymentData.paymentTime}
                                                                      onChange={(e) =>
                                                                                setPaymentData({ ...paymentData, paymentTime: e.target.value })
                                                                      }
                                                                      className="bg-dark-bg-secondary border-white/10 mt-2"
                                                                      required
                                                            />
                                                  </div>
                                        </div>

                                        {/* Slip Upload */}
                                        <div>
                                                  <Label htmlFor="slip">Payment Slip Image *</Label>
                                                  <div className="mt-2">
                                                            {slipPreview ? (
                                                                      <div className="relative">
                                                                                <img
                                                                                          src={slipPreview}
                                                                                          alt="Payment slip preview"
                                                                                          className="w-full max-w-md mx-auto rounded-lg border border-white/10"
                                                                                />
                                                                                <Button
                                                                                          type="button"
                                                                                          variant="destructive"
                                                                                          size="sm"
                                                                                          className="absolute top-2 right-2"
                                                                                          onClick={onRemoveSlip}
                                                                                >
                                                                                          Remove
                                                                                </Button>
                                                                      </div>
                                                            ) : (
                                                                      <label
                                                                                htmlFor="slip"
                                                                                className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-white/10 rounded-lg cursor-pointer hover:border-neon-purple/50 transition-all"
                                                                      >
                                                                                <Upload className="w-12 h-12 text-neon-purple/50 mb-4" />
                                                                                <p className="text-sm text-dark-text-secondary mb-2">
                                                                                          Click to upload payment slip
                                                                                </p>
                                                                                <p className="text-xs text-dark-text-muted">PNG, JPG up to 10MB</p>
                                                                                <Input
                                                                                          id="slip"
                                                                                          type="file"
                                                                                          accept="image/*"
                                                                                          className="hidden"
                                                                                          onChange={onSlipChange}
                                                                                          required
                                                                                />
                                                                      </label>
                                                            )}
                                                  </div>
                                        </div>
                              </div>

                              <div className="flex gap-4 mt-8">
                                        <Button variant="outline" onClick={onBack} className="flex-1">
                                                  <ArrowLeft className="w-4 h-4 mr-2" />
                                                  Back
                                        </Button>
                                        <Button
                                                  onClick={onSubmit}
                                                  disabled={submitting}
                                                  className="flex-1"
                                        >
                                                  {submitting ? (
                                                            <>
                                                                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                                      Submitting...
                                                            </>
                                                  ) : (
                                                            <span className="flex items-center gap-2">
                                                                      <CreditCard className="w-4 h-4" />
                                                                      Submit Payment
                                                            </span>
                                                  )}
                                        </Button>
                              </div>
                    </Card>
          );
}
