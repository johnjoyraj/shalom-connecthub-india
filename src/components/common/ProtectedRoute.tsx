import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { hasAdminScope } from '../../services/permissions';
import type { AdminScope, UserRole } from '../../types/domain';
import { EmptyState, LoadingState } from './StateViews';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
  adminScope?: AdminScope;
}

export function ProtectedRoute({ children, requiredRoles, adminScope }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingState label="Verifying session and permissions..." />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (user.profile.account_status === 'SUSPENDED') {
    return (
      <div className="mx-auto max-w-xl px-4 py-12">
        <EmptyState
          title="Account Suspended"
          description="Your account is currently suspended. Please contact support@shalomconnecthub.in or your Grievance Officer."
        />
      </div>
    );
  }

  if (adminScope && !hasAdminScope(user.roles, adminScope)) {
    return (
      <div className="mx-auto max-w-xl px-4 py-12">
        <EmptyState
          title="Access Restricted (Admin Scope Required)"
          description={`Your account does not hold the "${adminScope}" administrative permission required for this section.`}
        />
      </div>
    );
  }

  if (requiredRoles && requiredRoles.length > 0) {
    const hasMatch =
      user.roles.includes('super_admin') ||
      requiredRoles.some((r) => user.roles.includes(r));
    if (!hasMatch) {
      return (
        <div className="mx-auto max-w-xl px-4 py-12">
          <EmptyState
            title="Role Access Required"
            description="You can enable additional marketplace roles (Employer, Property Owner, School Admin) in your profile settings."
          />
        </div>
      );
    }
  }

  return <>{children}</>;
}
