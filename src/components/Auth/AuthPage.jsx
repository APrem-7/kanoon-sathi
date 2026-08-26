import React, { useState } from 'react';
import './AuthPage.css';

// ── Google "G" SVG Icon ──────────────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg className="auth-google-icon" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <path fill="#EA4335" d="M24 9.5c3.14 0 5.95 1.08 8.16 2.85l6.08-6.08C34.38 3.2 29.47 1 24 1 14.8 1 6.99 6.48 3.38 14.27l7.07 5.49C12.1 13.48 17.6 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.52 24.5c0-1.64-.15-3.22-.43-4.75H24v9.01h12.68c-.55 2.95-2.2 5.45-4.68 7.13l7.19 5.59C43.52 37.57 46.52 31.56 46.52 24.5z"/>
      <path fill="#FBBC05" d="M10.45 28.24A14.6 14.6 0 0 1 9.5 24c0-1.47.25-2.89.69-4.24l-7.07-5.49A23.9 23.9 0 0 0 .5 24c0 3.86.92 7.51 2.55 10.74l7.4-6.5z"/>
      <path fill="#34A853" d="M24 46.5c5.47 0 10.06-1.81 13.41-4.91l-7.19-5.59C28.46 37.74 26.35 38.5 24 38.5c-6.38 0-11.87-3.97-13.55-9.52l-7.4 6.5C6.65 43.17 14.73 46.5 24 46.5z"/>
    </svg>
  );
}

// ── Eye (show) icon ──────────────────────────────────────────────────────────
function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

// ── Eye-off (hide) icon ──────────────────────────────────────────────────────
function EyeOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

// ── Shared Header (logo + brand) ─────────────────────────────────────────────
function AuthHeader() {
  return (
    <div className="auth-header">
      {/* Secured badge */}
      <div className="auth-secured-badge">
        <span className="auth-secured-icon">🔒</span>
        <span className="auth-secured-text">Secured by<br />Kanoon AI</span>
      </div>

      {/* Logo */}
      <div className="auth-logo-wrap">
        <img src="/Kanoon_Saathi-logo-1.png" alt="Kanoon Saathi" className="auth-logo-img" />
      </div>

      <div className="auth-brand-name">Kanoon Saathi</div>
      <div className="auth-brand-sub">AI-Powered Legal Document Intelligence</div>
    </div>
  );
}

// ── Password Input with Eye Toggle ───────────────────────────────────────────
function PasswordInput({ id, placeholder, value, onChange }) {
  const [show, setShow] = useState(false);
  return (
    <div className="auth-input-wrap">
      <input
        id={id}
        type={show ? 'text' : 'password'}
        className="auth-input has-toggle"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        autoComplete="off"
      />
      <button
        type="button"
        className="auth-eye-btn"
        onClick={() => setShow((s) => !s)}
        tabIndex={-1}
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
}

// ── OAuth Divider + Google Button ────────────────────────────────────────────
function OAuthSection({ label, onGoogle }) {
  return (
    <>
      <div className="auth-oauth-divider">
        <div className="auth-oauth-line" />
        <span className="auth-oauth-label">{label}</span>
        <div className="auth-oauth-line" />
      </div>
      <button
        type="button"
        className="auth-btn-google"
        id="auth-google-btn"
        onClick={onGoogle}
      >
        <GoogleIcon />
        {label.includes('up') ? 'Sign up with Google' : 'Sign in with Google'}
      </button>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SIGN IN VIEW
// ══════════════════════════════════════════════════════════════════════════════
function SignInView({ onLogin, onSwitch }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin();
  };

  return (
    <div className="auth-view-enter">

      <div className="auth-card-divider" />
      <div className="auth-form-title">Secure Access to Your Legal Workspace</div>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {/* Email */}
        <div className="auth-input-wrap">
          <input
            id="signin-email"
            type="email"
            className="auth-input"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>

        {/* Password */}
        <PasswordInput
          id="signin-password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {/* Controls row */}
        <div className="auth-controls-row">
          <label className="auth-remember" htmlFor="signin-remember">
            <input
              id="signin-remember"
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            Remember Me
          </label>
          <button type="button" className="auth-forgot" id="forgot-password-btn">
            Forgot Password?
          </button>
        </div>

        <button type="submit" className="auth-btn-primary" id="signin-submit-btn">
          Sign In
        </button>

        <OAuthSection label="Or sign in with:" onGoogle={onLogin} />
      </form>

      <div className="auth-footer-switch">
        Don't have an account?{' '}
        <button type="button" id="goto-signup-btn" onClick={onSwitch}>
          Create one.
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SIGN UP VIEW
// ══════════════════════════════════════════════════════════════════════════════
const PROFESSIONAL_ROLES = [
  'Lawyer',
  'Paralegal',
  'Firm Administrator',
  'Other Legal Professional',
];

const AREAS_OF_PRACTICE = [
  'Property & Real Estate Law',
  'Corporate & Commercial Law',
  'Criminal Law',
  'Family Law',
  'Constitutional Law',
  'Labour & Employment Law',
  'Intellectual Property',
  'Taxation Law',
  'Civil Litigation',
  'Other',
];

function SignUpView({ onLogin, onSwitch }) {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    firmName: '',
    areaOfPractice: '',
    terms: false,
  });

  const set = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin();
  };

  return (
    <div className="auth-view-enter">

      <div className="auth-card-divider" />
      <div className="auth-form-title">Welcome! Create Your Account</div>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {/* Full Name */}
        <div className="auth-input-wrap">
          <input
            id="signup-fullname"
            type="text"
            className="auth-input"
            placeholder="Full Name"
            value={form.fullName}
            onChange={set('fullName')}
            autoComplete="name"
          />
        </div>

        {/* Professional Email */}
        <div className="auth-input-wrap">
          <input
            id="signup-email"
            type="email"
            className="auth-input"
            placeholder="Professional Email Address"
            value={form.email}
            onChange={set('email')}
            autoComplete="email"
          />
        </div>

        {/* Password row (side-by-side) */}
        <div className="auth-row">
          <PasswordInput
            id="signup-password"
            placeholder="Choose Password"
            value={form.password}
            onChange={set('password')}
          />
          <PasswordInput
            id="signup-confirm-password"
            placeholder="Confirm Password"
            value={form.confirmPassword}
            onChange={set('confirmPassword')}
          />
        </div>

        {/* Professional Role */}
        <select
          id="signup-role"
          className="auth-select"
          value={form.role}
          onChange={set('role')}
        >
          <option value="" disabled>Professional Role</option>
          {PROFESSIONAL_ROLES.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>

        {/* Company / Firm Name */}
        <div className="auth-input-wrap">
          <input
            id="signup-firm"
            type="text"
            className="auth-input"
            placeholder="Company / Firm Name"
            value={form.firmName}
            onChange={set('firmName')}
          />
        </div>

        {/* Area of Practice */}
        <select
          id="signup-area-of-practice"
          className="auth-select"
          value={form.areaOfPractice}
          onChange={set('areaOfPractice')}
        >
          <option value="" disabled>Area of Practice</option>
          {AREAS_OF_PRACTICE.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>

        {/* Terms */}
        <label className="auth-terms" htmlFor="signup-terms">
          <input
            id="signup-terms"
            type="checkbox"
            checked={form.terms}
            onChange={set('terms')}
          />
          <span>
            I agree to the Kanoon Saathi{' '}
            <a href="#" onClick={(e) => e.preventDefault()}>Terms of Service</a>{' '}
            and{' '}
            <a href="#" onClick={(e) => e.preventDefault()}>Privacy Policy</a>.
          </span>
        </label>

        <button type="submit" className="auth-btn-primary" id="signup-submit-btn">
          Create Account
        </button>

        {/* Footer switch link shown ABOVE the OAuth section on signup */}
        <div className="auth-footer-switch">
          Already have an account?{' '}
          <button type="button" id="goto-signin-btn" onClick={onSwitch}>
            Sign In
          </button>
        </div>

        <OAuthSection label="Or sign up with:" onGoogle={onLogin} />
      </form>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// AUTH PAGE (root export)
// ══════════════════════════════════════════════════════════════════════════════
export default function AuthPage({ onLogin }) {
  const [view, setView] = useState('signin'); // 'signin' | 'signup'

  const isSignUp = view === 'signup';

  return (
    <div className="auth-shell">
      <div className={`auth-card ${isSignUp ? 'signup' : ''}`}>
        <AuthHeader />
        {isSignUp ? (
          <SignUpView
            onLogin={onLogin}
            onSwitch={() => setView('signin')}
          />
        ) : (
          <SignInView
            onLogin={onLogin}
            onSwitch={() => setView('signup')}
          />
        )}
      </div>
    </div>
  );
}
