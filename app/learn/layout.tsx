import { StudentNavbar } from '@/components/layout/StudentNavbar';

export default function LearnLayout({
          children,
}: {
          children: React.ReactNode;
}) {
          return (
                    <div className="min-h-screen bg-paper-white">
                              <StudentNavbar />
                              <main>{children}</main>
                    </div>
          );
}
