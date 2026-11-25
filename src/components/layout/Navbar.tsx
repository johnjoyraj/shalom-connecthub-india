import { Globe, LogOut, Menu, ShieldCheck, UserCircle2, X } from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getPrimaryDashboardPath, hasAnyAdminRole } from '../../services/permissions';

export function Navbar() {
  const { user, logout, isLiveSupabase } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    setMobileOpen(false);
    navigate('/');
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
      isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-700 text-white shadow-sm">
            <Globe className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <span className="block text-sm font-bold tracking-tight text-slate-900 sm:text-base">
              SHALOM CONNECTHUB INDIA
            </span>
            <span className="hidden text-[11px] font-medium text-slate-500 sm:block">
              Everything Connected. Opportunities Everywhere.
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary Navigation">
          <NavLink to="/staff" className={navLinkClass}>
            Staff Connect
          </NavLink>
          <NavLink to="/properties" className={navLinkClass}>
            Property Connect
          </NavLink>
          <NavLink to="/schools" className={navLinkClass}>
            School Connect
          </NavLink>
          <NavLink to="/pricing" className={navLinkClass}>
            Pricing
          </NavLink>
          <NavLink to="/help" className={navLinkClass}>
            Help
          </NavLink>
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <span
            className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
              isLiveSupabase
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-amber-200 bg-amber-50 text-amber-800'
            }`}
          >
            {isLiveSupabase ? 'Supabase Live' : 'Sandbox Mode'}
          </span>

          {user ? (
            <>
              {hasAnyAdminRole(user.roles) ? (
                <Link
                  to="/admin"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-700 hover:bg-brand-100"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>Admin Centre</span>
                </Link>
              ) : null}
              <Link
                to={getPrimaryDashboardPath(user.roles)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-200"
              >
                <UserCircle2 className="h-4 w-4 text-brand-600" />
                <span className="max-w-[140px] truncate">{user.profile.full_name}</span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-brand-700 px-4 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-800"
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-lg p-2 text-slate-700 hover:bg-slate-100 lg:hidden"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label="Toggle navigation menu"
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen ? (
        <div className="border-t border-slate-200 bg-white px-4 py-3 lg:hidden">
          <div className="flex flex-col gap-1">
            <NavLink to="/staff" className={navLinkClass} onClick={() => setMobileOpen(false)}>
              Staff Connect
            </NavLink>
            <NavLink to="/properties" className={navLinkClass} onClick={() => setMobileOpen(false)}>
              Property Connect
            </NavLink>
            <NavLink to="/schools" className={navLinkClass} onClick={() => setMobileOpen(false)}>
              School Connect
            </NavLink>
            <NavLink to="/pricing" className={navLinkClass} onClick={() => setMobileOpen(false)}>
              Pricing
            </NavLink>
            <NavLink to="/help" className={navLinkClass} onClick={() => setMobileOpen(false)}>
              Help
            </NavLink>
          </div>
          <div className="mt-3 flex flex-col gap-2 border-t border-slate-100 pt-3">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-900"
                >
                  Dashboard ({user.profile.full_name})
                </Link>
                {hasAnyAdminRole(user.roles) ? (
                  <Link
                    to="/admin"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-700"
                  >
                    Admin Control Centre
                  </Link>
                ) : null}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-left text-sm font-medium text-red-700"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-center text-sm font-medium text-slate-800"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg bg-brand-700 px-3 py-2 text-center text-sm font-semibold text-white"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
