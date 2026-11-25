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
import { UserDashboardPage } from './pages/dashboard/UserDashboardPage';
import { HomePage } from './pages/public/HomePage';
import { PricingPage } from './pages/public/PricingPage';
import {
  ContactPage,
  HelpPage,
  InfoCompliancePage,
  ListingDetailShellPage,
  ModulePreviewPage,
  PrivacyPage,
  TermsPage,
} from './pages/public/StaticCompliancePages';

export function AppRoutes() {
  return (
    <AppShell>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route
          path="/staff"
          element={
            <ModulePreviewPage
              moduleTitle="Staff Connect — Employment & Talent Across India"
              phaseNumber={2}
              summary="Connect employers with verified candidates across full-time, part-time, temporary, and contract vacancies."
              highlights={['Employer & candidate profiles', 'CV uploads with strict private RLS', 'Qualification & salary filters', 'Application tracking & shortlisting']}
            />
          }
        />
        <Route
          path="/jobs"
          element={
            <ModulePreviewPage
              moduleTitle="Job Vacancies"
              phaseNumber={2}
              summary="Browse full-time, part-time, temporary, and contract jobs across all Indian states and PIN codes."
              highlights={['All-India job search', 'Experience & salary filters', 'Direct application tracking', 'Employer verification badges']}
            />
          }
        />
        <Route
          path="/candidates"
          element={
            <ModulePreviewPage
              moduleTitle="Candidate Profiles"
              phaseNumber={2}
              summary="Search candidate qualifications, work experience, and verified skills."
              highlights={['Education & experience records', 'Skill-based matching', 'Privacy-controlled CV sharing', 'Shortlist management']}
            />
          }
        />
        <Route
          path="/properties"
          element={
            <ModulePreviewPage
              moduleTitle="Property Connect — Homes, Commercial & Land"
              phaseNumber={3}
              summary="Rent, buy, sell, or lease residential homes, flats, shops, offices, hostels/PGs, plots, and agricultural land."
              highlights={['Dynamic forms by property type', 'Address privacy controls', 'Owner & authorised agent portals', 'Visit requests & reporting']}
            />
          }
        />
        <Route
          path="/rentals"
          element={
            <ModulePreviewPage
              moduleTitle="Property Rentals & PG / Hostels"
              phaseNumber={3}
              summary="Search rental houses, apartments, hostels, PG accommodation, and commercial leases across India."
              highlights={['Rent & deposit filters', 'Bedrooms & amenities', 'Direct visit scheduling', 'Verified owner listings']}
            />
          }
        />
        <Route
          path="/property-sales"
          element={
            <ModulePreviewPage
              moduleTitle="Property Resale & New Sales"
              phaseNumber={3}
              summary="Explore residential apartments, independent houses, shops, and office spaces for sale."
              highlights={['Price & area filters', 'RERA & disclaimer clarity', 'Buyer enquiry tracking', 'Featured listings']}
            />
          }
        />
        <Route
          path="/land-plots"
          element={
            <ModulePreviewPage
              moduleTitle="Residential Plots & Agricultural Land"
              phaseNumber={3}
              summary="Discover residential plots, commercial land, and agricultural land leases/sales across India."
              highlights={['Area & measurement units', 'District & PIN search', 'Supporting document review', 'No false legal title claims']}
            />
          }
        />
        <Route
          path="/schools"
          element={
            <ModulePreviewPage
              moduleTitle="School Connect — Institutions & Admissions"
              phaseNumber={4}
              summary="Discover schools, colleges, preschools, tuition centres, and coaching institutions across India."
              highlights={['Board & affiliation filters', 'Classes & campus facilities', 'Admission enquiry tracking', 'Teaching & non-teaching vacancies']}
            />
          }
        />
        <Route path="/schools/:slug" element={<ListingDetailShellPage />} />
        <Route path="/listing/:slug" element={<ListingDetailShellPage />} />
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
        <Route path="/dashboard/enquiries" element={<ProtectedRoute><UserDashboardPage section="enquiries" /></ProtectedRoute>} />
        <Route path="/dashboard/messages" element={<ProtectedRoute><UserDashboardPage section="messages" /></ProtectedRoute>} />
        <Route path="/dashboard/saved" element={<ProtectedRoute><UserDashboardPage section="saved" /></ProtectedRoute>} />
        <Route path="/dashboard/applications" element={<ProtectedRoute><UserDashboardPage section="applications" /></ProtectedRoute>} />
        <Route path="/dashboard/payments" element={<ProtectedRoute><UserDashboardPage section="payments" /></ProtectedRoute>} />
        <Route path="/dashboard/settings" element={<ProtectedRoute><UserDashboardPage section="settings" /></ProtectedRoute>} />

        {/* Role Portal Shells (Phases 2-4) */}
        <Route path="/employer/*" element={<ProtectedRoute requiredRoles={['employer']}><UserDashboardPage section="employer-portal" /></ProtectedRoute>} />
        <Route path="/owner/*" element={<ProtectedRoute requiredRoles={['property_owner', 'property_agent']}><UserDashboardPage section="property-owner-portal" /></ProtectedRoute>} />
        <Route path="/school-dashboard/*" element={<ProtectedRoute requiredRoles={['school_admin']}><UserDashboardPage section="school-portal" /></ProtectedRoute>} />

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
        <Route path="/admin/enquiries" element={<ProtectedRoute adminScope="moderation"><AdminControlCentrePage tab="module-shell" shellTitle="Enquiries Administration (Phase 6)" /></ProtectedRoute>} />
        <Route path="/admin/subscriptions" element={<ProtectedRoute adminScope="finance"><AdminControlCentrePage tab="finance-shell" shellTitle="Subscriptions Management (Phase 5)" /></ProtectedRoute>} />
        <Route path="/admin/plans" element={<ProtectedRoute adminScope="finance"><AdminControlCentrePage tab="finance-shell" shellTitle="Subscription Plans Configuration (Phase 5)" /></ProtectedRoute>} />
        <Route path="/admin/payments" element={<ProtectedRoute adminScope="finance"><AdminControlCentrePage tab="finance-shell" shellTitle="Razorpay Payments Ledger (Phase 5)" /></ProtectedRoute>} />
        <Route path="/admin/refunds" element={<ProtectedRoute adminScope="finance"><AdminControlCentrePage tab="finance-shell" shellTitle="Refunds & Disputes (Phase 5)" /></ProtectedRoute>} />
        <Route path="/admin/commissions" element={<ProtectedRoute adminScope="finance"><AdminControlCentrePage tab="finance-shell" shellTitle="Service Charges & Commission Rules (Phase 5)" /></ProtectedRoute>} />
        <Route path="/admin/reports" element={<ProtectedRoute adminScope="finance"><AdminControlCentrePage tab="finance-shell" shellTitle="Financial & Usage Reports (Phase 5)" /></ProtectedRoute>} />
        <Route path="/admin/notifications" element={<ProtectedRoute adminScope="system"><AdminControlCentrePage tab="module-shell" shellTitle="Notification Templates & Delivery Logs (Phase 6)" /></ProtectedRoute>} />

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
