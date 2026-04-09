import { useState, FormEvent } from 'react';
import { PasswordInput } from '../ui/PasswordInput';
import { useUiStore } from '../../stores/ui.store';
import { t } from '../../lib/i18n';

interface ResetPasswordPageProps {
  token: string;
  onDone: () => void; // navigate back to login
}

const SPECIAL_CHAR_RE = /[!@#$%^&*()\-_=+[\]{};:'",.<>/?\\|`~]/;

export function ResetPasswordPage({ token, onDone }: ResetPasswordPageProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const { language } = useUiStore();
  const l = (key: Parameters<typeof t>[0]) => t(key, language);

  function validate(): string | null {
    if (newPassword.length < 8) return l('passwordTooShort');
    if (newPassword.length > 20) return l('passwordTooLong');
    if (!SPECIAL_CHAR_RE.test(newPassword)) return l('passwordSpecialChar');
    if (newPassword !== confirmPassword) return l('passwordsDoNotMatch');
    return null;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setSuccess(true);
      } else {
        setError(
          data.error === 'Invalid or expired reset token' ? l('resetTokenInvalid') : data.error || l('networkError'),
        );
      }
    } catch {
      setError(l('networkError'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-matrix-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-matrix-accent tracking-widest uppercase">Matrix</h1>
          <p className="text-xs text-matrix-muted mt-1 tracking-wider">{l('resetPasswordTitle')}</p>
        </div>

        {success ? (
          <div className="bg-matrix-surface border border-matrix-border rounded-lg p-6 space-y-4 text-center">
            <p className="text-sm text-matrix-success">{l('resetPasswordSuccess')}</p>
            <button
              onClick={onDone}
              className="w-full bg-matrix-accent text-matrix-bg font-semibold text-sm py-2.5 rounded hover:brightness-110 transition-all duration-200"
            >
              {l('signIn')}
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-matrix-surface border border-matrix-border rounded-lg p-6 space-y-4"
          >
            <div>
              <label htmlFor="new-password" className="block text-xs text-matrix-muted mb-1 tracking-wide uppercase">
                {l('newPassword')}
              </label>
              <PasswordInput
                id="new-password"
                autoComplete="new-password"
                autoFocus
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={l('passwordPlaceholder')}
                className="w-full bg-matrix-bg border border-matrix-border rounded px-3 py-2 text-sm text-matrix-text placeholder:text-matrix-muted/50 focus:outline-none focus:border-matrix-accent focus:shadow-[0_0_8px_rgba(var(--matrix-accent),0.12)] transition-all duration-200"
                required
              />
            </div>

            <div>
              <label
                htmlFor="confirm-password"
                className="block text-xs text-matrix-muted mb-1 tracking-wide uppercase"
              >
                {l('confirmPassword')}
              </label>
              <PasswordInput
                id="confirm-password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-matrix-bg border border-matrix-border rounded px-3 py-2 text-sm text-matrix-text placeholder:text-matrix-muted/50 focus:outline-none focus:border-matrix-accent focus:shadow-[0_0_8px_rgba(var(--matrix-accent),0.12)] transition-all duration-200"
                required
              />
            </div>

            {error && <p className="text-xs text-red-400 text-center">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-matrix-accent text-matrix-bg font-semibold text-sm py-2.5 rounded hover:brightness-110 hover:shadow-[0_0_16px_rgba(var(--matrix-accent),0.25)] active:scale-[0.98] transition-all duration-200 disabled:opacity-50"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-matrix-bg/30 border-t-matrix-bg rounded-full animate-spin" />
                  {l('resettingPassword')}
                </span>
              ) : (
                l('resetPasswordTitle')
              )}
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={onDone}
                className="text-xs text-matrix-muted hover:text-matrix-text transition-colors"
              >
                ← {l('backToLogin')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
