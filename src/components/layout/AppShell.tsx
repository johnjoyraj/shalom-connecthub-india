import { PwaBanner } from '../common/PwaBanner';
import { Footer } from './Footer';
import { Navbar } from './Navbar';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />
      <PwaBanner />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
