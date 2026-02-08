import { StudentNavbar } from '@/components/layout/StudentNavbar';

export default function LearnLayout({
          children,
}: {
          children: React.ReactNode;
}) {
          return (
                    <div className="min-h-screen bg-paper-white relative">
                              <StudentNavbar />
                              <main className="container mx-auto px-4 py-6">
                                        {children}
                              </main>
                    </div>
          );
}
