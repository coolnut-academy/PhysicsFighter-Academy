'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useUserRole } from '@/store/useAuthStore';
import { UserRole } from '@/types';
import { Swords, GraduationCap, Award, Trophy, Flame, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  const router = useRouter();
  const { user, initializing } = useAuthStore();
  const userRole = useUserRole();

  useEffect(() => {
    // Redirect authenticated users to their dashboard
    if (!initializing && user && userRole) {
      switch (userRole) {
        case UserRole.SUPER_ADMIN:
          router.push('/super-admin/dashboard');
          break;
        case UserRole.ADMIN:
          router.push('/admin/dashboard');
          break;
        case UserRole.STUDENT:
          router.push('/dashboard');
          break;
      }
    }
  }, [user, userRole, initializing, router]);

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper-white">
        <div className="arcade-spinner" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper-white">
      {/* 🎮 SPEED LINES BACKGROUND */}
      <div
        className="fixed inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 50px,
              #dc2626 50px,
              #dc2626 51px
            )
          `,
        }}
      />

      {/* ========================================
          🥋 HERO SECTION - Game Title Screen
          ======================================== */}
      <div className="relative overflow-hidden border-b-4 border-ink-black">
        {/* Halftone Pattern Background */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `radial-gradient(circle, #000 1px, transparent 1px)`,
            backgroundSize: '8px 8px',
          }}
        />

        <div className="container mx-auto px-4 py-8 relative z-10">
          {/* Navigation */}
          <nav className="flex justify-between items-center mb-16">
            <div className="flex items-center gap-3">
              <div className="bg-fighter-red p-3 border-[3px] border-ink-black -skew-x-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <Swords className="w-8 h-8 text-white" style={{ transform: 'skewX(6deg)' }} />
              </div>
              <h1 className="text-3xl font-heading uppercase tracking-wide text-ink-black -skew-x-3">
                Physics Fighter
              </h1>
            </div>
            <div className="flex gap-3">
              <Link href="/login">
                <Button variant="outline" size="lg" className="border-2 border-ink-black text-ink-black hover:bg-gray-100">
                  <span style={{ transform: 'skewX(6deg)' }}>เข้าสู่ระบบ</span>
                </Button>
              </Link>
              <Link href="/register">
                <Button size="lg">
                  <span style={{ transform: 'skewX(6deg)' }}>สมัครเลย!</span>
                </Button>
              </Link>
            </div>
          </nav>

          {/* Hero Content */}
          <div className="text-center max-w-5xl mx-auto py-16">
            {/* "ROUND 1" Badge */}
            <div className="inline-block mb-6">
              <div className="bg-ink-black text-white px-8 py-2 font-heading text-2xl uppercase tracking-widest -skew-x-6 border-4 border-golden shadow-[4px_4px_0px_0px_rgba(245,158,11,1)]">
                <span style={{ transform: 'skewX(6deg)', display: 'inline-block' }}>⚡ ยกที่ 1 ⚡</span>
              </div>
            </div>

            {/* Main Headline */}
            <h2 className="font-heading text-7xl md:text-8xl lg:text-9xl uppercase text-ink-black mb-4 leading-none">
              พิชิต
              <br />
              <span className="text-fighter-red" style={{ textShadow: '4px 4px 0px #000' }}>
                ฟิสิกส์!
              </span>
            </h2>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-gray-700 max-w-2xl mx-auto mb-10 font-bold">
              ฝึกฝนกับครูผู้เชี่ยวชาญ เลเวลอัพความรู้ของคุณ
              <br />
              <span className="text-fighter-red">มาเป็นแชมป์ฟิสิกส์กันเถอะ!</span>
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/register">
                <button className="relative px-12 py-5 bg-fighter-red text-white font-heading text-2xl uppercase tracking-wider border-[4px] border-ink-black -skew-x-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] transition-all animate-pulse">
                  <span style={{ transform: 'skewX(6deg)', display: 'inline-block' }} className="flex items-center gap-2">
                    <Flame className="w-6 h-6" />
                    เริ่มต้นการต่อสู้
                    <ChevronRight className="w-6 h-6" />
                  </span>
                </button>
              </Link>
              <Link href="/courses">
                <Button variant="secondary" size="lg" className="text-lg px-8">
                  <span style={{ transform: 'skewX(6deg)' }} className="flex items-center gap-2">
                    ดูคอร์สทั้งหมด
                  </span>
                </Button>
              </Link>
            </div>

            {/* Stats Bar */}
            <div className="flex justify-center gap-8 mt-12">
              <div className="text-center">
                <div className="font-heading text-4xl text-fighter-red">500+</div>
                <div className="text-sm uppercase font-bold text-gray-600">นักสู้</div>
              </div>
              <div className="w-px bg-ink-black" />
              <div className="text-center">
                <div className="font-heading text-4xl text-golden">50+</div>
                <div className="text-sm uppercase font-bold text-gray-600">คอร์ส</div>
              </div>
              <div className="w-px bg-ink-black" />
              <div className="text-center">
                <div className="font-heading text-4xl text-green-600">95%</div>
                <div className="text-sm uppercase font-bold text-gray-600">อัตราชนะ</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================
          🎯 FEATURES SECTION - Power Ups
          ======================================== */}
      <section className="py-20 bg-ink-black">
        <div className="container mx-auto px-4">
          <h3 className="font-heading text-5xl uppercase text-center text-white mb-4">
            เลือก <span className="text-golden">สกิลพิเศษ</span>
          </h3>
          <p className="text-center text-gray-400 mb-12 text-lg">ปลดล็อคศักยภาพของคุณด้วยโปรแกรมฝึกฝนของเรา</p>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-white border-[3px] border-ink-black p-8 shadow-[6px_6px_0px_0px_rgba(220,38,38,1)] hover:shadow-[3px_3px_0px_0px_rgba(220,38,38,1)] hover:translate-x-[3px] hover:translate-y-[3px] transition-all">
              <div className="w-16 h-16 bg-fighter-red border-2 border-ink-black flex items-center justify-center mb-4 -skew-x-6">
                <GraduationCap className="w-8 h-8 text-white" style={{ transform: 'skewX(6deg)' }} />
              </div>
              <h4 className="font-heading text-2xl uppercase text-ink-black mb-2">ครูระดับเทพ</h4>
              <p className="text-gray-600">
                เรียนรู้จากครูสอนฟิสิกส์ที่มีประสบการณ์สอนมากมาย ผ่านสนามรบมาแล้วหลายยก
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white border-[3px] border-ink-black p-8 shadow-[6px_6px_0px_0px_rgba(245,158,11,1)] hover:shadow-[3px_3px_0px_0px_rgba(245,158,11,1)] hover:translate-x-[3px] hover:translate-y-[3px] transition-all">
              <div className="w-16 h-16 bg-golden border-2 border-ink-black flex items-center justify-center mb-4 -skew-x-6">
                <Trophy className="w-8 h-8 text-ink-black" style={{ transform: 'skewX(6deg)' }} />
              </div>
              <h4 className="font-heading text-2xl uppercase text-ink-black mb-2">คว้าชัยชนะ</h4>
              <p className="text-gray-600">
                เรียนจบครบคอร์ส รับใบประกาศเพื่อโชว์ความสำเร็จของคุณได้อย่างภาคภูมิ
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white border-[3px] border-ink-black p-8 shadow-[6px_6px_0px_0px_rgba(34,197,94,1)] hover:shadow-[3px_3px_0px_0px_rgba(34,197,94,1)] hover:translate-x-[3px] hover:translate-y-[3px] transition-all">
              <div className="w-16 h-16 bg-green-500 border-2 border-ink-black flex items-center justify-center mb-4 -skew-x-6">
                <Award className="w-8 h-8 text-white" style={{ transform: 'skewX(6deg)' }} />
              </div>
              <h4 className="font-heading text-2xl uppercase text-ink-black mb-2">เลเวลอัพเร็ว</h4>
              <p className="text-gray-600">
                เลือกเวลาเข้าถึงได้ยืดหยุ่น (3, 6 หรือ 12 เดือน) ให้เหมาะกับตารางฝึกซ้อมของคุณ
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================
          🏁 FOOTER
          ======================================== */}
      <footer className="border-t-4 border-ink-black bg-white py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Swords className="w-6 h-6 text-fighter-red" />
            <span className="font-heading text-xl uppercase">Physics Fighter Academy</span>
          </div>
          <p className="text-gray-500 font-bold uppercase text-sm">
            © 2026 สงวนลิขสิทธิ์ทุกประการ สู้เพื่อความรู้!
          </p>
        </div>
      </footer>
    </div>
  );
}
