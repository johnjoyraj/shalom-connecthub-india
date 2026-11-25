import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { LoadingState } from './components/common/StateViews';
import { AppShell } from './components/layout/AppShell';
import { AuthProvider } from './context/AuthContext';
import { HomePage } from './pages/public/HomePage';

const AdminControlCentrePage = lazy(() =>
  import('./pages/admin/AdminControlCentrePage').then((m) => ({ default: m.AdminControlCentrePage }))
);
const AdminAiControlPage = lazy(() =>
  import('./pages/ai/AdminAiControlPage').then((m) => ({ default: m.AdminAiControlPage }))
);
const AiWorkspacePage = lazy(() =>
  import('./pages/ai/AiWorkspacePage').then((m) => ({ default: m.AiWorkspacePage }))
);
const LoginPage = lazy(() => import('./pages/auth/AuthPages').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/auth/AuthPages').then((m) => ({ default: m.RegisterPage })));
const VerifyOtpPage = lazy(() => import('./pages/auth/AuthPages').then((m) => ({ default: m.VerifyOtpPage })));
const ForgotPasswordPage = lazy(() =>
  import('./pages/auth/AuthPages').then((m) => ({ default: m.ForgotPasswordPage }))
);
const CompleteProfilePage = lazy(() =>
  import('./pages/auth/AuthPages').then((m) => ({ default: m.CompleteProfilePage }))
);
const AdminNotificationsPage = lazy(() =>
  import('./pages/communication/AdminNotificationsPage').then((m) => ({ default: m.AdminNotificationsPage }))
);
const EnquiriesInboxPage = lazy(() =>
  import('./pages/communication/EnquiriesInboxPage').then((m) => ({ default: m.EnquiriesInboxPage }))
);
const MessagesPage = lazy(() =>
  import('./pages/communication/MessagesPage').then((m) => ({ default: m.MessagesPage }))
);
const UserDashboardPage = lazy(() =>
  import('./pages/dashboard/UserDashboardPage').then((m) => ({ default: m.UserDashboardPage }))
);
const AdminFinancePage = lazy(() =>
  import('./pages/finance/AdminFinancePage').then((m) => ({ default: m.AdminFinancePage }))
);
const PaymentsAndBillingPage = lazy(() =>
  import('./pages/finance/PaymentsAndBillingPage').then((m) => ({ default: m.PaymentsAndBillingPage }))
);
const OwnerDashboardPage = lazy(() =>
  import('./pages/property/OwnerDashboardPage').then((m) => ({ default: m.OwnerDashboardPage }))
);
const PropertiesDirectoryPage = lazy(() =>
  import('./pages/property/PropertiesDirectoryPage').then((m) => ({ default: m.PropertiesDirectoryPage }))
);
const PropertyDetailPage = lazy(() =>
  import('./pages/property/PropertyDetailPage').then((m) => ({ default: m.PropertyDetailPage }))
);
const PricingPage = lazy(() =>
  import('./pages/public/PricingPage').then((m) => ({ default: m.PricingPage }))
);
const ContactPage = lazy(() =>
  import('./pages/public/StaticCompliancePages').then((m) => ({ default: m.ContactPage }))
);
const HelpPage = lazy(() =>
  import('./pages/public/StaticCompliancePages').then((m) => ({ default: m.HelpPage }))
);
const InfoCompliancePage = lazy(() =>
  import('./pages/public/StaticCompliancePages').then((m) => ({ default: m.InfoCompliancePage }))
);
const ModulePreviewPage = lazy(() =>
  import('./pages/public/StaticCompliancePages').then((m) => ({ default: m.ModulePreviewPage }))
);
const PrivacyPage = lazy(() =>
  import('./pages/public/StaticCompliancePages').then((m) => ({ default: m.PrivacyPage }))
);
const TermsPage = lazy(() =>
  import('./pages/public/StaticCompliancePages').then((m) => ({ default: m.TermsPage }))
);
const SchoolDashboardPage = lazy(() =>
  import('./pages/school/SchoolDashboardPage').then((m) => ({ default: m.SchoolDashboardPage }))
);
const SchoolProfilePage = lazy(() =>
  import('./pages/school/SchoolProfilePage').then((m) => ({ default: m.SchoolProfilePage }))
);
const SchoolsDirectoryPage = lazy(() =>
  import('./pages/school/SchoolsDirectoryPage').then((m) => ({ default: m.SchoolsDirectoryPage }))
);
const CandidateDashboardPage = lazy(() =>
  import('./pages/staff/CandidateDashboardPage').then((m) => ({ default: m.CandidateDashboardPage }))
);
const CandidatesDirectoryPage = lazy(() =>
  import('./pages/staff/CandidatesDirectoryPage').then((m) => ({ default: m.CandidatesDirectoryPage }))
);
const EmployerDashboardPage = lazy(() =>
  import('./pages/staff/EmployerDashboardPage').then((m) => ({ default: m.EmployerDashboardPage }))
);
const JobsDirectoryPage = lazy(() =>
  import('./pages/staff/JobsDirectoryPage').then((m) => ({ default: m.JobsDirectoryPage }))
);
const StaffHubPage = lazy(() =>
  import('./pages/staff/StaffHubPage').then((m) => ({ default: m.StaffHubPage }))
);

export function AppRoutes() {
  return (
    <AppShell>
      <Suspense fallback={<LoadingState label="Loading page..." />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/staff" element={<StaffHubPage />} />
          <Route path="/jobs" element={<JobsDirectoryPage />} />
          <Route path="/candidates" element={<CandidatesDirectoryPage />} />
          <Route path="/properties" element={<PropertiesDirectoryPage preset="ALL" />} />
          <Route path="/rentals" element={<PropertiesDirectoryPage preset="RENTALS" />} />
          <Route path="/property-sales" element={<PropertiesDirectoryPage preset="SALES" />} />
          <Route path="/land-plots" element={<PropertiesDirectoryPage preset="LAND" />} />
          <Route path="/schools" element={<SchoolsDirectoryPage />} />
          <Route path="/schools/:slug" element={<SchoolProfilePage />} />
          <Route path="/listing/:slug" element={<PropertyDetailPage />} />
          <Route
            path="/providers"
            element={
              <ModulePreviewPage
                moduleTitle="Configurable Future Service Modules"
                phaseNumber={1}
                summary="Home services, business directory, vehicle services, transport, construction, events, agriculture, and professional services can be enabled from the Admin Control Centre."
                highlights={['Admin-toggled categories', 'Shared search & location engine', 'Unified enquiry & billing core', 'Zero rebuild expansion']}
              />
            }
          />
          <Route path="/pricing" element={<PricingPage />} />
          <Route
            path="/about"
            element={
              <InfoCompliancePage
                title="About SHALOM CONNECTHUB INDIA"
                subtitle="Everything Connected. Opportunities Everywhere."
                sections={[
                  {
                    heading: 'Our Vision',
                    body: 'One platform connecting people, employment, properties, schools, businesses and professional services across India.',
                  },
                  {
                    heading: 'Architecture & Trust',
                    body: 'Built as a modular multi-role SaaS marketplace with PostgreSQL Row Level Security, All-India location taxonomy, transparent Indian pricing, and DPDPA-compliant consent records.',
                  },
                ]}
              />
            }
          />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/help" element={<HelpPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />

          {/* Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-otp" element={<VerifyOtpPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route
            path="/complete-profile"
            element={
              <ProtectedRoute>
                <CompleteProfilePage />
              </ProtectedRoute>
            }
          />

          {/* User Dashboard Routes */}
          <Route path="/dashboard" element={<ProtectedRoute><UserDashboardPage section="overview" /></ProtectedRoute>} />
          <Route path="/dashboard/enquiries" element={<ProtectedRoute><EnquiriesInboxPage /></ProtectedRoute>} />
          <Route path="/dashboard/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
          <Route path="/dashboard/saved" element={<ProtectedRoute><UserDashboardPage section="saved" /></ProtectedRoute>} />
          <Route path="/dashboard/applications" element={<ProtectedRoute><CandidateDashboardPage /></ProtectedRoute>} />
          <Route path="/dashboard/payments" element={<ProtectedRoute><PaymentsAndBillingPage /></ProtectedRoute>} />
          <Route path="/dashboard/billing" element={<Navigate to="/dashboard/payments" replace />} />
          <Route path="/dashboard/ai" element={<ProtectedRoute><AiWorkspacePage /></ProtectedRoute>} />
          <Route path="/dashboard/settings" element={<ProtectedRoute><UserDashboardPage section="settings" /></ProtectedRoute>} />

          {/* Employer Routes (Phase 2) */}
          <Route path="/employer" element={<ProtectedRoute requiredRoles={['employer', 'school_admin']}><EmployerDashboardPage tab="overview" /></ProtectedRoute>} />
          <Route path="/employer/jobs" element={<ProtectedRoute requiredRoles={['employer', 'school_admin']}><EmployerDashboardPage tab="jobs" /></ProtectedRoute>} />
          <Route path="/employer/candidates" element={<ProtectedRoute requiredRoles={['employer', 'school_admin']}><EmployerDashboardPage tab="candidates" /></ProtectedRoute>} />
          <Route path="/employer/applications" element={<ProtectedRoute requiredRoles={['employer', 'school_admin']}><EmployerDashboardPage tab="applications" /></ProtectedRoute>} />
          <Route path="/employer/shortlist" element={<ProtectedRoute requiredRoles={['employer', 'school_admin']}><EmployerDashboardPage tab="shortlist" /></ProtectedRoute>} />
          <Route path="/employer/subscription" element={<ProtectedRoute requiredRoles={['employer', 'school_admin']}><EmployerDashboardPage tab="subscription" /></ProtectedRoute>} />

          {/* Property Owner & Authorised Agent Routes (Phase 3) */}
          <Route path="/owner" element={<ProtectedRoute requiredRoles={['property_owner', 'property_agent']}><OwnerDashboardPage tab="overview" /></ProtectedRoute>} />
          <Route path="/owner/properties" element={<ProtectedRoute requiredRoles={['property_owner', 'property_agent']}><OwnerDashboardPage tab="properties" /></ProtectedRoute>} />
          <Route path="/owner/enquiries" element={<ProtectedRoute requiredRoles={['property_owner', 'property_agent']}><OwnerDashboardPage tab="enquiries" /></ProtectedRoute>} />
          <Route path="/owner/documents" element={<ProtectedRoute requiredRoles={['property_owner', 'property_agent']}><OwnerDashboardPage tab="documents" /></ProtectedRoute>} />
          <Route path="/owner/subscription" element={<ProtectedRoute requiredRoles={['property_owner', 'property_agent']}><OwnerDashboardPage tab="subscription" /></ProtectedRoute>} />

          {/* School Routes (Phase 4) */}
          <Route path="/school-dashboard" element={<ProtectedRoute requiredRoles={['school_admin']}><SchoolDashboardPage tab="overview" /></ProtectedRoute>} />
          <Route path="/school-dashboard/profile" element={<ProtectedRoute requiredRoles={['school_admin']}><SchoolDashboardPage tab="profile" /></ProtectedRoute>} />
          <Route path="/school-dashboard/admissions" element={<ProtectedRoute requiredRoles={['school_admin']}><SchoolDashboardPage tab="admissions" /></ProtectedRoute>} />
          <Route path="/school-dashboard/vacancies" element={<ProtectedRoute requiredRoles={['school_admin']}><SchoolDashboardPage tab="vacancies" /></ProtectedRoute>} />
          <Route path="/school-dashboard/enquiries" element={<ProtectedRoute requiredRoles={['school_admin']}><SchoolDashboardPage tab="enquiries" /></ProtectedRoute>} />

          {/* Admin Routes */}
          <Route path="/admin" element={<ProtectedRoute adminScope="overview"><AdminControlCentrePage tab="overview" /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute adminScope="users"><AdminControlCentrePage tab="users" /></ProtectedRoute>} />
          <Route path="/admin/organisations" element={<ProtectedRoute adminScope="moderation"><AdminControlCentrePage tab="organisations" /></ProtectedRoute>} />
          <Route path="/admin/listings" element={<ProtectedRoute adminScope="moderation"><AdminControlCentrePage tab="listings" /></ProtectedRoute>} />
          <Route path="/admin/categories" element={<ProtectedRoute adminScope="system"><AdminControlCentrePage tab="categories" /></ProtectedRoute>} />
          <Route path="/admin/locations" element={<ProtectedRoute adminScope="system"><AdminControlCentrePage tab="locations" /></ProtectedRoute>} />
          <Route path="/admin/moderation" element={<ProtectedRoute adminScope="moderation"><AdminControlCentrePage tab="moderation" /></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute adminScope="system"><AdminControlCentrePage tab="settings" /></ProtectedRoute>} />
          <Route path="/admin/audit-logs" element={<ProtectedRoute adminScope="audit"><AdminControlCentrePage tab="audit-logs" /></ProtectedRoute>} />
          <Route path="/admin/jobs" element={<ProtectedRoute adminScope="moderation"><AdminControlCentrePage tab="module-shell" shellTitle="Staff Connect Administration (Phase 2)" /></ProtectedRoute>} />
          <Route path="/admin/properties" element={<ProtectedRoute adminScope="moderation"><AdminControlCentrePage tab="module-shell" shellTitle="Property Connect Administration (Phase 3)" /></ProtectedRoute>} />
          <Route path="/admin/schools" element={<ProtectedRoute adminScope="moderation"><AdminControlCentrePage tab="module-shell" shellTitle="School Connect Administration (Phase 4)" /></ProtectedRoute>} />
          <Route path="/admin/enquiries" element={<ProtectedRoute adminScope="moderation"><AdminNotificationsPage mode="enquiries" /></ProtectedRoute>} />
          <Route path="/admin/subscriptions" element={<ProtectedRoute adminScope="finance"><AdminFinancePage tab="subscriptions" /></ProtectedRoute>} />
          <Route path="/admin/plans" element={<ProtectedRoute adminScope="finance"><AdminFinancePage tab="plans" /></ProtectedRoute>} />
          <Route path="/admin/payments" element={<ProtectedRoute adminScope="finance"><AdminFinancePage tab="payments" /></ProtectedRoute>} />
          <Route path="/admin/refunds" element={<ProtectedRoute adminScope="finance"><AdminFinancePage tab="refunds" /></ProtectedRoute>} />
          <Route path="/admin/commissions" element={<ProtectedRoute adminScope="finance"><AdminFinancePage tab="commissions" /></ProtectedRoute>} />
          <Route path="/admin/reports" element={<ProtectedRoute adminScope="finance"><AdminFinancePage tab="reports" /></ProtectedRoute>} />
          <Route path="/admin/notifications" element={<ProtectedRoute adminScope="system"><AdminNotificationsPage mode="notifications" /></ProtectedRoute>} />
          <Route path="/admin/ai" element={<ProtectedRoute adminScope="system"><AdminAiControlPage /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AppShell>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
