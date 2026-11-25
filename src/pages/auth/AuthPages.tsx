import { Lock, Mail, Phone, ShieldCheck, UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LocationPicker } from '../../components/common/LocationPicker';
import { ErrorBanner, SuccessBanner } from '../../components/common/StateViews';
import { useAuth } from '../../context/AuthContext';
import { getPrimaryDashboardPath, ROLE_LABELS, SELF_ASSIGNABLE_ROLES } from '../../services/permissions';
import { platformStore } from '../../services/platformStore';
import type { LocationNode, PreferredLanguage, UserRole } from '../../types/domain';

export function LoginPage() {
  const { login, quickDemoLogin, isLiveSupabase } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as { from?: string } | null)?.from;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const signedIn = await login(email, password);
      navigate(redirectTo || getPrimaryDashboardPath(signedIn.roles), { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemo = async (userId: string) => {
    setError(null);
    setSubmitting(true);
    try {
      const signedIn = await quickDemoLogin(userId);
      navigate(redirectTo || getPrimaryDashboardPath(signedIn.roles), { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center gap-2 text-brand-700">
          <Lock className="h-5 w-5" />
          <span className="text-xs font-bold uppercase tracking-wider">Unified Sign In</span>
        </div>
        <h1 className="mt-2 text-2xl font-extrabold text-slate-900">Sign in to ConnectHub</h1>
        <p className="mt-1 text-sm text-slate-600">
          One account for Staff Connect, Property Connect, School Connect, and Administration.
        </p>

        {error ? <div className="mt-4"><ErrorBanner message={error} /></div> : null}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="login-email" className="mb-1 block text-xs font-medium text-slate-700">
              Email Address
            </label>
            <input
              id="login-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.in"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none"
            />
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label htmlFor="login-password" className="text-xs font-medium text-slate-700">
                Password
              </label>
              <Link to="/forgot-password" className="text-xs font-medium text-brand-700 hover:underline">
                Forgot password?
              </Link>
            </div>
            <input
              id="login-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
          >
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-4 flex items-center justify-between text-xs text-slate-600">
          <Link to="/verify-otp" className="font-medium text-brand-700 hover:underline">
            Sign in / verify with OTP
          </Link>
          <Link to="/register" className="font-semibold text-brand-700 hover:underline">
            Create account →
          </Link>
        </div>

        {!isLiveSupabase ? (
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs font-bold text-amber-900">Local Sandbox Quick Access</p>
            <p className="mt-0.5 text-[11px] text-amber-800">
              <code>VITE_SUPABASE_ANON_KEY</code> is not set yet. Test any role locally:
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemo('usr-super-admin')}
                className="rounded-lg border border-amber-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 hover:bg-amber-100"
              >
                Super Admin
              </button>
              <button
                type="button"
                onClick={() => handleDemo('usr-employer-demo')}
                className="rounded-lg border border-amber-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 hover:bg-amber-100"
              >
                Employer
              </button>
              <button
                type="button"
                onClick={() => handleDemo('usr-school-admin')}
                className="rounded-lg border border-amber-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 hover:bg-amber-100"
              >
                School Admin
              </button>
              <button
                type="button"
                onClick={() => handleDemo('usr-property-owner')}
                className="rounded-lg border border-amber-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 hover:bg-amber-100"
              >
                Property Owner
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>(['customer']);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [whatsappConsent, setWhatsappConsent] = useState(false);
  const [emailConsent, setEmailConsent] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const toggleRole = (role: UserRole) => {
    if (role === 'customer') return;
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register({
        fullName,
        email,
        phone,
        password,
        roles: selectedRoles,
        acceptedTerms,
        acceptedPrivacy,
        whatsappConsent,
        emailConsent,
      });
      navigate('/complete-profile', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center gap-2 text-brand-700">
          <UserPlus className="h-5 w-5" />
          <span className="text-xs font-bold uppercase tracking-wider">Unified Registration</span>
        </div>
        <h1 className="mt-2 text-2xl font-extrabold text-slate-900">Create your ConnectHub account</h1>
        <p className="mt-1 text-sm text-slate-600">
          One unified account supports multiple roles and organisations across India.
        </p>

        {error ? <div className="mt-4"><ErrorBanner message={error} /></div> : null}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="reg-name" className="mb-1 block text-xs font-medium text-slate-700">
                Full Name *
              </label>
              <input
                id="reg-name"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="reg-phone" className="mb-1 block text-xs font-medium text-slate-700">
                Mobile Number (India)
              </label>
              <input
                id="reg-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98XXXXXXXX"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="reg-email" className="mb-1 block text-xs font-medium text-slate-700">
                Email Address *
              </label>
              <input
                id="reg-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.in"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="reg-password" className="mb-1 block text-xs font-medium text-slate-700">
                Password (min 8 chars) *
              </label>
              <input
                id="reg-password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Strong password"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <span className="mb-2 block text-xs font-medium text-slate-700">
              How will you use SHALOM CONNECTHUB INDIA? (Select all that apply)
            </span>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {SELF_ASSIGNABLE_ROLES.map((role) => {
                const checked = selectedRoles.includes(role);
                return (
                  <label
                    key={role}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition ${
                      checked ? 'border-brand-500 bg-brand-50 text-brand-800' : 'border-slate-200 text-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={role === 'customer'}
                      onChange={() => toggleRole(role)}
                      className="rounded border-slate-300 text-brand-700"
                    />
                    <span>{ROLE_LABELS[role]}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700">
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-0.5 rounded border-slate-300"
              />
              <span>
                I accept the <Link to="/terms" className="font-semibold text-brand-700 underline">Terms of Service</Link> *
              </span>
            </label>
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={acceptedPrivacy}
                onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                className="mt-0.5 rounded border-slate-300"
              />
              <span>
                I consent to personal data processing under the <Link to="/privacy" className="font-semibold text-brand-700 underline">Privacy Policy (DPDPA)</Link> *
              </span>
            </label>
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={emailConsent}
                onChange={(e) => setEmailConsent(e.target.checked)}
                className="mt-0.5 rounded border-slate-300"
              />
              <span>Receive transactional &amp; enquiry notifications via Email</span>
            </label>
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={whatsappConsent}
                onChange={(e) => setWhatsappConsent(e.target.checked)}
                className="mt-0.5 rounded border-slate-300"
              />
              <span>Opt in to Official WhatsApp Business alerts (optional)</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
          >
            {submitting ? 'Creating account...' : 'Create Unified Account'}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-slate-600">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-brand-700 hover:underline">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
}

export function VerifyOtpPage() {
  const { refreshUser } = useAuth();
  const navigate = useNavigate();
  const [target, setTarget] = useState('');
  const [otp, setOtp] = useState('');
  const [sentMessage, setSentMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await platformStore.sendOtp(target);
      setSentMessage(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP.');
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const user = await platformStore.verifyOtp(target, otp);
      await refreshUser();
      navigate(getPrimaryDashboardPath(user.roles), { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OTP verification failed.');
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center gap-2 text-brand-700">
          <Phone className="h-5 w-5" />
          <span className="text-xs font-bold uppercase tracking-wider">OTP Verification</span>
        </div>
        <h1 className="mt-2 text-2xl font-extrabold text-slate-900">Verify with OTP</h1>
        <p className="mt-1 text-sm text-slate-600">
          Request a one-time passcode via registered email or phone.
        </p>

        {error ? <div className="mt-4"><ErrorBanner message={error} /></div> : null}
        {sentMessage ? <div className="mt-4"><SuccessBanner message={sentMessage} /></div> : null}

        <form onSubmit={handleSend} className="mt-5 space-y-3">
          <label htmlFor="otp-target" className="block text-xs font-medium text-slate-700">
            Email or Mobile (+91...)
          </label>
          <input
            id="otp-target"
            type="text"
            required
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="employer@example.in"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="w-full rounded-lg border border-brand-600 px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50"
          >
            Send OTP
          </button>
        </form>

        <form onSubmit={handleVerify} className="mt-5 space-y-3 border-t border-slate-100 pt-5">
          <label htmlFor="otp-code" className="block text-xs font-medium text-slate-700">
            6-Digit OTP Code
          </label>
          <input
            id="otp-code"
            type="text"
            required
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="123456"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="w-full rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
          >
            Verify &amp; Continue
          </button>
        </form>
      </div>
    </div>
  );
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStatusMsg(null);
    try {
      const msg = await platformStore.requestPasswordReset(email);
      setStatusMsg(msg);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send reset email.');
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center gap-2 text-brand-700">
          <Mail className="h-5 w-5" />
          <span className="text-xs font-bold uppercase tracking-wider">Account Recovery</span>
        </div>
        <h1 className="mt-2 text-2xl font-extrabold text-slate-900">Reset your password</h1>
        <p className="mt-1 text-sm text-slate-600">
          Enter your account email and we will send recovery instructions.
        </p>

        {error ? <div className="mt-4"><ErrorBanner message={error} /></div> : null}
        {statusMsg ? <div className="mt-4"><SuccessBanner message={statusMsg} /></div> : null}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.in"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="w-full rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800"
          >
            Send Recovery Email
          </button>
        </form>
      </div>
    </div>
  );
}

export function CompleteProfilePage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [locations, setLocations] = useState<LocationNode[]>([]);
  const [fullName, setFullName] = useState(user?.profile.full_name ?? '');
  const [phone, setPhone] = useState(user?.profile.phone ?? '');
  const [language, setLanguage] = useState<PreferredLanguage>(user?.profile.preferred_language ?? 'en');
  const [locationId, setLocationId] = useState<string | null>(user?.profile.primary_location_id ?? null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void platformStore.getLocations(false).then(setLocations);
  }, []);

  if (!user) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await platformStore.updateMyProfile(user.profile.id, {
        full_name: fullName,
        phone: phone || null,
        preferred_language: language,
        primary_location_id: locationId,
        onboarding_completed: true,
      });
      await refreshUser();
      navigate(getPrimaryDashboardPath(user.roles), { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center gap-2 text-brand-700">
          <ShieldCheck className="h-5 w-5" />
          <span className="text-xs font-bold uppercase tracking-wider">Complete Your Profile</span>
        </div>
        <h1 className="mt-2 text-2xl font-extrabold text-slate-900">Location &amp; Language Preferences</h1>

        {error ? <div className="mt-4"><ErrorBanner message={error} /></div> : null}

        <form onSubmit={handleSave} className="mt-6 space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Preferred Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as PreferredLanguage)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="en">English</option>
                <option value="hi">Hindi (हिन्दी)</option>
                <option value="ml">Malayalam (മലയാളം)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">Mobile Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98XXXXXXXX"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <LocationPicker
            locations={locations}
            value={locationId}
            onChange={setLocationId}
            label="Primary Location"
          />

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save & Go to Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
}
