import Link from 'next/link';
import { CalendarDays, Users, FileText } from 'lucide-react';

export default function Sidebar() {
  return (
    <div className="flex flex-col w-64 h-screen px-4 py-8 bg-[var(--color-primary)] border-r shadow-lg">
      <h2 className="text-2xl font-bold text-white mb-10 text-center tracking-wide">
        Junta de<br />
        <span className="text-[var(--color-secondary)]">Aguas Rurales</span>
      </h2>
      <div className="flex flex-col justify-between flex-1 mt-6">
        <nav>
          <Link href="/" className="flex items-center px-4 py-3 mt-2 text-gray-200 hover:bg-[var(--color-secondary)] hover:text-white rounded-lg transition-colors group">
            <CalendarDays className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="mx-4 font-medium">Calendario</span>
          </Link>

          <Link href="/users" className="flex items-center px-4 py-3 mt-4 text-gray-200 hover:bg-[var(--color-secondary)] hover:text-white rounded-lg transition-colors group">
            <Users className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="mx-4 font-medium">Usuarios</span>
          </Link>

          <Link href="/agreements" className="flex items-center px-4 py-3 mt-4 text-gray-200 hover:bg-[var(--color-secondary)] hover:text-white rounded-lg transition-colors group">
            <FileText className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="mx-4 font-medium">Convenios</span>
          </Link>
        </nav>
      </div>
    </div>
  );
}
