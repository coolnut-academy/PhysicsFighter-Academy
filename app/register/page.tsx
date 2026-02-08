'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';
import { signInWithGoogle, handleGoogleRedirectResult } from '@/lib/firebase/googleAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Flame, Loader2, ArrowRight } from 'lucide-react';
import { useState } from 'react';

export default function RegisterPage() {
  const router = useRouter();
  const { user, initializing, isWaitingForUserData } = useAuthStore();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle Google redirect result on mount
  useEffect(() => {
    handleGoogleRedirectResult()
      .catch((err) => {
        setError(err.message || 'เข้าสู่ระบบด้วย Google ไม่สำเร็จ');
      });
  }, []);

  // Watch for auth state changes and redirect when user is authenticated
  useEffect(() => {
    if (user && !initializing && !isWaitingForUserData) {
      router.push('/dashboard');
    }
  }, [user, initializing, isWaitingForUserData, router]);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      await signInWithGoogle();
      // Don't redirect here - let the useEffect handle it
      // when user state is updated
    } catch (err: any) {
      setError(err.message || 'สมัครสมาชิกด้วย Google ไม่สำเร็จ');
      setGoogleLoading(false);
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
          <p className="text-gray-600 mt-2">สมัครสมาชิกง่าย ๆ ด้วยบัญชี Google</p>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-50 border-2 border-fighter-red text-fighter-red p-3 text-sm font-bold mb-4">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
              <h3 className="font-bold text-blue-900 mb-2">ทำไมต้องใช้ Google?</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">✓</span>
                  <span>สมัครสมาชิกรวดเร็ว ไม่ต้องกรอกข้อมูลเยอะ</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">✓</span>
                  <span>ปลอดภัยด้วยระบบความปลอดภัยของ Google</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">✓</span>
                  <span>ไม่ต้องจำรหัสผ่านหลายอัน</span>
                </li>
              </ul>
            </div>

            <Button
              type="button"
              variant="golden"
              className="w-full h-12 text-base"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || isWaitingForUserData}
            >
              {googleLoading || isWaitingForUserData ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              {googleLoading ? 'กำลังสมัครสมาชิก...' : isWaitingForUserData ? 'กำลังโหลดข้อมูล...' : 'สมัครสมาชิกด้วย Google'}
            </Button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              มีบัญชีอยู่แล้ว?{' '}
              <Link href="/login" className="text-fighter-red font-bold hover:underline inline-flex items-center gap-1">
                เข้าสู่ระบบ <ArrowRight className="w-4 h-4" />
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
