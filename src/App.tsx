import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { AppShell } from './components/layout/AppShell';
import { AuthProvider } from './context/AuthContext';
import { AdminControlCentrePage } from './pages/admin/AdminControlCentrePage';
import {
  CompleteProfilePage,
  ForgotPasswordPage,
  LoginPage,
  RegisterPage,
  VerifyOtpPage,
} from './pages/auth/AuthPages';
import { AdminNotificationsPage } from './pages/communication/AdminNotificationsPage';
import { EnquiriesInboxPage } from './pages/communication/EnquiriesInboxPage';
import { MessagesPage } from './pages/communication/MessagesPage';
import { UserDashboardPage } from './pages/dashboard/UserDashboardPage';
import { AdminFinancePage } from './pages/finance/AdminFinancePage';
import { PaymentsAndBillingPage } from './pages/finance/PaymentsAndBillingPage';
import { OwnerDashboardPage } from './pages/property/OwnerDashboardPage';
import { PropertiesDirectoryPage } from './pages/property/PropertiesDirectoryPage';
import { PropertyDetailPage } from './pages/property/PropertyDetailPage';
import { HomePage } from './pages/public/HomePage';
import { PricingPage } from './pages/public/PricingPage';
import {
  ContactPage,
  HelpPage,
  InfoCompliancePage,
  ModulePreviewPage,
  PrivacyPage,
  TermsPage,
} from './pages/public/StaticCompliancePages';
import { SchoolDashboardPage } from './pages/school/SchoolDashboardPage';
import { SchoolProfilePage } from './pages/school/SchoolProfilePage';
import { SchoolsDirectoryPage } from './pages/school/SchoolsDirectoryPage';
import { CandidateDashboardPage } from './pages/staff/CandidateDashboardPage';
import { CandidatesDirectoryPage } from './pages/staff/CandidatesDirectoryPage';
import { EmployerDashboardPage } from './pages/staff/EmployerDashboardPage';
import { JobsDirectoryPage } from './pages/staff/JobsDirectoryPage';
import { StaffHubPage } from './pages/staff/StaffHubPage';

export function AppRoutes() {
  return (
    <AppShell>
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

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
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
