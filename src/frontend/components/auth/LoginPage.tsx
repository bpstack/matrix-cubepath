import { useState, useRef, useEffect, FormEvent } from 'react';
import { PasswordInput } from '../ui/PasswordInput';
import { useUiStore } from '../../stores/ui.store';
import { t } from '../../lib/i18n';
import { toast } from '../../lib/toast';

interface LoginPageProps {
  onLoginSuccess: (isDemo: boolean) => void;
}

const DEMO_EMAIL = 'demo@demo.stackbp';
const DEMO_PASS = 'demo1234';
const TYPE_SPEED = 90;
const CURSOR_MOVE_MS = 600;
const PAUSE_MS = 500;
const SPECIAL_CHAR_RE = /[!@#$%^&*()\-_=+[\]{};:'",.<>/?\\|`~]/;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function getElementCenter(el: Element) {
  const rect = el.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

async function doLogin(email: string, pass: string): Promise<{ error: string | null; isDemo: boolean }> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: pass }),
  });
  const data = await res.json().catch(() => ({}));
  if (res.ok) return { error: null, isDemo: !!data.isDemo };
  return { error: data.error || null, isDemo: false };
}

type Mode = 'login' | 'register' | 'forgot';

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotDone, setForgotDone] = useState(false);
  const [forgotNoSmtp, setForgotNoSmtp] = useState(false);
  const [demotyping, setDemotyping] = useState(false);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const [cursorAnimating, setCursorAnimating] = useState(false);
  const abortRef = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const demoBtnRef = useRef<HTMLButtonElement>(null);

  const [registrationOpen, setRegistrationOpen] = useState(false);

  const { theme, setTheme, language, setLanguage } = useUiStore();
  const isRegister = mode === 'register';
  const isForgot = mode === 'forgot';
  const l = (key: Parameters<typeof t>[0]) => t(key, language);

  useEffect(() => {
    fetch('/api/auth/info')
      .then((r) => r.json())
      .then((data) => setRegistrationOpen(!!data.registrationOpen))
      .catch(() => {});
  }, []);

  function toggleTheme() {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }

  function toggleLanguage() {
    setLanguage(language === 'en' ? 'es' : 'en');
  }

  function validateLogin(): string | null {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return l('emailInvalidFormat');
    if (!password) return l('passwordRequired');
    return null;
  }

  function validateRegister(): string | null {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return l('emailInvalidFormat');
    if (username && (username.length < 3 || username.length > 20 || !/^[a-z0-9_]+$/.test(username)))
      return l('usernameInvalidLength');
    if (password.length < 8) return l('passwordTooShort');
    if (password.length > 20) return l('passwordTooLong');
    if (!SPECIAL_CHAR_RE.test(password)) return l('passwordSpecialChar');
    if (password !== confirmPassword) return l('passwordsDoNotMatch');
    return null;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (isForgot) {
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setError(l('emailInvalidFormat'));
        return;
      }
      setLoading(true);
      try {
        const res = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          setForgotNoSmtp(!data.emailSent);
          setForgotDone(true);
        } else {
          setError(data.error || l('networkError'));
        }
      } catch {
        setError(l('networkError'));
      } finally {
        setLoading(false);
      }
      return;
    }

    const validationError = isRegister ? validateRegister() : validateLogin();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const body = isRegister ? { email, username: username.trim() || undefined, password } : { email, password };
      const res = await fetch(endpoint, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.ok('toastLoginSuccess');
        onLoginSuccess(!!data.isDemo);
      } else {
        setError(data.error || l(isRegister ? 'registrationFailed' : 'loginFailed'));
      }
    } catch {
      setError(l('networkError'));
    } finally {
      setLoading(false);
    }
  }

  function switchMode(newMode: Mode) {
    setMode(newMode);
    setError('');
    setForgotDone(false);
    setForgotNoSmtp(false);
    setConfirmPassword('');
    setUsername('');
  }

  function cancelDemo() {
    abortRef.current = true;
    setDemotyping(false);
    setCursorPos(null);
    setCursorAnimating(false);
  }

  async function typeText(text: string, setter: (v: string) => void) {
    for (let i = 0; i <= text.length; i++) {
      if (abortRef.current) return;
      setter(text.slice(0, i));
      await wait(TYPE_SPEED);
    }
  }

  async function moveCursorTo(el: Element) {
    setCursorPos(getElementCenter(el));
    await wait(CURSOR_MOVE_MS);
  }

  async function handleDemoLogin() {
    if (demotyping || loading) return;
    abortRef.current = false;
    setDemotyping(true);
    setError('');
    switchMode('login');
    setEmail('');
    setPassword('');

    if (demoBtnRef.current) {
      setCursorAnimating(false);
      setCursorPos(getElementCenter(demoBtnRef.current));
    }

    await wait(400);
    await typeText(DEMO_EMAIL, setEmail);
    if (abortRef.current) return;
    await wait(PAUSE_MS);

    await typeText(DEMO_PASS, setPassword);
    if (abortRef.current) return;
    await wait(PAUSE_MS);

    setCursorAnimating(true);
    const eyeBtn = formRef.current?.querySelector<HTMLButtonElement>(
      '[aria-label="Show password"], [aria-label="Hide password"]',
    );
    if (eyeBtn && !abortRef.current) {
      await moveCursorTo(eyeBtn);
      if (abortRef.current) return;
      eyeBtn.click();
      await wait(800);
      if (abortRef.current) return;
    }

    const submitBtn = formRef.current?.querySelector<HTMLButtonElement>('button[type="submit"]');
    if (submitBtn && !abortRef.current) {
      await moveCursorTo(submitBtn);
      if (abortRef.current) return;
      await wait(300);
    }

    setCursorPos(null);
    setCursorAnimating(false);
    setDemotyping(false);
    setLoading(true);
    try {
      const { error: err, isDemo } = await doLogin(DEMO_EMAIL, DEMO_PASS);
      if (err) setError(err);
      else onLoginSuccess(isDemo);
    } catch {
      setError(l('networkError'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={`min-h-screen bg-matrix-bg flex items-center justify-center p-4${demotyping ? ' cursor-none' : ''}`}
    >
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-matrix-accent tracking-widest uppercase">Matrix</h1>
          <p className="text-xs text-matrix-muted mt-1 tracking-wider">{l('appSubtitle')}</p>
          <a
            href="https://stackbp.es"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-2 text-[10px] font-mono text-matrix-muted/70 hover:text-matrix-accent dark:hover:text-matrix-accent hover:text-purple-500 tracking-widest uppercase transition-colors duration-200"
          >
            by stackbp.es
          </a>
        </div>

        {/* Tab toggle — only shown when registration is open */}
        {registrationOpen && !isForgot && (
          <div className="relative flex mb-4 border border-matrix-border rounded-lg overflow-hidden">
            <div
              className="absolute inset-y-0 w-1/2 bg-matrix-accent rounded-md transition-transform duration-300 ease-out"
              style={{ transform: mode === 'register' ? 'translateX(100%)' : 'translateX(0)' }}
            />
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`relative flex-1 py-2 text-xs font-medium tracking-wide uppercase transition-colors duration-300 ${
                mode === 'login' ? 'text-matrix-bg' : 'text-matrix-muted hover:text-matrix-text'
              }`}
            >
              {l('signIn')}
            </button>
            <button
              type="button"
              onClick={() => switchMode('register')}
              className={`relative flex-1 py-2 text-xs font-medium tracking-wide uppercase transition-colors duration-300 ${
                mode === 'register' ? 'text-matrix-bg' : 'text-matrix-muted hover:text-matrix-text'
              }`}
            >
              {l('register')}
            </button>
          </div>
        )}

        {/* Forgot-password heading */}
        {isForgot && <p className="text-sm text-gray-400 mb-4 text-center">{l('forgotPassword')}</p>}

        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="bg-matrix-surface border border-matrix-border rounded-lg p-6 space-y-4"
        >
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-xs text-matrix-muted mb-1 tracking-wide uppercase">
              {l('email')}
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => {
                cancelDemo();
                setEmail(e.target.value);
              }}
              placeholder="your@email.com"
              className="w-full bg-matrix-bg border border-matrix-border rounded px-3 py-2 text-sm text-matrix-text placeholder:text-matrix-muted/50 focus:outline-none focus:border-matrix-accent focus:shadow-[0_0_8px_rgba(var(--matrix-accent),0.12)] transition-all duration-200"
              required
            />
          </div>

          {/* Username — register only */}
          {isRegister && (
            <div>
              <label htmlFor="username" className="block text-xs text-matrix-muted mb-1 tracking-wide uppercase">
                {l('usernameOptional')}
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={l('usernamePlaceholder')}
                className="w-full bg-matrix-bg border border-matrix-border rounded px-3 py-2 text-sm text-matrix-text placeholder:text-matrix-muted/50 focus:outline-none focus:border-matrix-accent focus:shadow-[0_0_8px_rgba(var(--matrix-accent),0.12)] transition-all duration-200"
              />
            </div>
          )}

          {/* Password */}
          {!isForgot && (
            <div>
              <label htmlFor="password" className="block text-xs text-matrix-muted mb-1 tracking-wide uppercase">
                {l('password')}
              </label>
              <PasswordInput
                id="password"
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => {
                  cancelDemo();
                  setPassword(e.target.value);
                }}
                placeholder={isRegister ? l('passwordPlaceholder') : ''}
                className="w-full bg-matrix-bg border border-matrix-border rounded px-3 py-2 text-sm text-matrix-text placeholder:text-matrix-muted/50 focus:outline-none focus:border-matrix-accent focus:shadow-[0_0_8px_rgba(var(--matrix-accent),0.12)] transition-all duration-200"
                required
              />
            </div>
          )}

          {/* Confirm password — register only */}
          {isRegister && (
            <div>
              <label htmlFor="confirm" className="block text-xs text-matrix-muted mb-1 tracking-wide uppercase">
                {l('confirmPassword')}
              </label>
              <PasswordInput
                id="confirm"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-matrix-bg border border-matrix-border rounded px-3 py-2 text-sm text-matrix-text placeholder:text-matrix-muted/50 focus:outline-none focus:border-matrix-accent focus:shadow-[0_0_8px_rgba(var(--matrix-accent),0.12)] transition-all duration-200"
                required
              />
            </div>
          )}

          {error && <p className="text-xs text-red-400 text-center animate-[shake_0.3s_ease-in-out]">{error}</p>}

          {/* Forgot-password success messages */}
          {isForgot && forgotDone && (
            <p className="text-xs text-matrix-success text-center">
              {forgotNoSmtp ? l('resetEmailNoSmtp') : l('resetEmailSent')}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || (isForgot && forgotDone)}
            className="w-full bg-matrix-accent text-matrix-bg font-semibold text-sm py-2.5 rounded hover:brightness-110 hover:shadow-[0_0_16px_rgba(var(--matrix-accent),0.25)] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:hover:shadow-none disabled:active:scale-100"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-matrix-bg/30 border-t-matrix-bg rounded-full animate-spin" />
                {isForgot ? l('sendingResetLink') : l(isRegister ? 'creatingAccount' : 'authenticating')}
              </span>
            ) : isForgot ? (
              l('sendResetLink')
            ) : isRegister ? (
              l('createAccount')
            ) : (
              l('signIn')
            )}
          </button>

          {/* Forgot / back-to-login links */}
          <div className="flex justify-between items-center pt-1">
            {!isForgot && !isRegister && (
              <button
                type="button"
                onClick={() => switchMode('forgot')}
                className="text-xs text-matrix-muted hover:text-matrix-accent dark:hover:text-matrix-accent hover:text-purple-500 transition-colors duration-200"
              >
                {l('forgotPassword')}
              </button>
            )}
            {isForgot && (
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="text-xs text-matrix-muted hover:text-matrix-text transition-colors"
              >
                ← {l('backToLogin')}
              </button>
            )}
          </div>
        </form>

        <div className="mt-5 flex items-center justify-center gap-3">
          <button
            ref={demoBtnRef}
            type="button"
            onClick={handleDemoLogin}
            disabled={demotyping || loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-matrix-border/50 text-matrix-muted text-xs font-mono tracking-wide hover:border-matrix-accent/60 hover:text-matrix-accent hover:shadow-[0_0_12px_rgba(var(--matrix-accent),0.15)] transition-all duration-300 disabled:opacity-40"
          >
            <span className="text-matrix-accent/70">$</span>
            <span>access</span>
            <span className="text-matrix-accent">--demo</span>
            <span
              className={`w-1.5 h-3.5 bg-current ${demotyping ? 'animate-pulse' : 'animate-[blink_1s_step-end_infinite]'}`}
            />
          </button>

          <span className="w-px h-4 bg-matrix-border/30" />

          <button
            type="button"
            onClick={toggleTheme}
            className="p-1 text-matrix-muted hover:text-matrix-accent dark:hover:text-matrix-accent hover:text-purple-500 transition-colors duration-200"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
                />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"
                />
              </svg>
            )}
          </button>

          <button
            type="button"
            onClick={toggleLanguage}
            className="p-1 text-[10px] font-mono text-matrix-muted hover:text-matrix-accent dark:hover:text-matrix-accent hover:text-purple-500 tracking-wider uppercase transition-colors duration-200 leading-none"
          >
            {language === 'en' ? 'es' : 'en'}
          </button>
        </div>
      </div>

      {/* Animated demo cursor */}
      {cursorPos && (
        <div
          className="fixed pointer-events-none z-50"
          style={{
            left: cursorPos.x,
            top: cursorPos.y,
            transition: cursorAnimating
              ? `left ${CURSOR_MOVE_MS}ms cubic-bezier(0.4, 0, 0.2, 1), top ${CURSOR_MOVE_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`
              : 'none',
          }}
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            className="-translate-x-1 -translate-y-1 drop-shadow-[0_0_6px_rgba(var(--matrix-accent),0.5)]"
          >
            <path
              d="M5 3l14 8.5L12.5 14l-2 6.5L5 3z"
              fill="rgb(var(--matrix-accent))"
              stroke="rgba(0,0,0,0.6)"
              strokeWidth="1.2"
            />
          </svg>
        </div>
      )}
    </div>
  );
}
