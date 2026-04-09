import { useState, useEffect, useCallback } from 'react';
import { useDialogStore } from '../../stores/dialog.store';
import { useSettings, useUpdateSetting, useGitHubStatus, useLanguageSwitch } from '../../hooks/useSettings';
import { usePasswordStatus, useChangeMasterPassword, useUnlockVault, useLockVault } from '../../hooks/usePasswords';
import { useExternalServices, useSetExternalServices, ExternalServices } from '../../hooks/useSystemStatus';
import { useMission, useDeleteMission } from '../../hooks/useMission';
import { useShortcuts, Shortcut, formatKeyCombo } from '../../hooks/useShortcuts';
import { useUiStore, Theme } from '../../stores/ui.store';
import { t, LangKey } from '../../lib/i18n';
import { apiFetch } from '../../lib/api';
import { toast } from '../../lib/toast';
import { ResizableTextarea } from '../ui/ResizableTextarea';
import { Modal } from '../ui/Modal';

function formatLogTimestamps(content: string): string {
  return content.replace(/\[(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})\.\d+Z\]/g, (_, iso) => {
    const date = new Date(iso + 'Z');
    const parts = new Intl.DateTimeFormat('es-ES', {
      timeZone: 'Europe/Madrid',
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).formatToParts(date);
    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '??';
    return `[${get('day')}/${get('month')}/${get('year')} ${get('hour')}:${get('minute')}:${get('second')}]`;
  });
}

function SectionCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-matrix-surface border border-matrix-border rounded-lg overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

function SectionHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-4 py-3 border-b border-matrix-border/60">
      <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">{title}</h3>
      {right}
    </div>
  );
}

function SettingRow({ label, children, last = false }: { label: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div
      className={`flex flex-col items-start gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${!last ? 'border-b border-matrix-border/30' : ''}`}
    >
      <span className="text-sm text-gray-400">{label}</span>
      <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">{children}</div>
    </div>
  );
}

export function SettingsView() {
  const { language, theme, setTheme, isDemo } = useUiStore();
  const { data: settings } = useSettings();
  const { data: githubStatus, refetch: refetchGitHubStatus } = useGitHubStatus();
  const updateSetting = useUpdateSetting();
  const switchLanguage = useLanguageSwitch();
  const { shortcuts, updateShortcuts, resetToDefaults } = useShortcuts();
  const { confirm } = useDialogStore();
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [localShortcuts, setLocalShortcuts] = useState<Shortcut[]>(shortcuts);
  const [recordingAction, setRecordingAction] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [githubToken, setGithubToken] = useState('');
  const [logContent, setLogContent] = useState('');
  const [logPath, setLogPath] = useState('');

  // External Services
  const [servicesInfoOpen, setServicesInfoOpen] = useState(false);
  const { data: servicesData } = useExternalServices();
  const setServicesApi = useSetExternalServices();
  const [servicesOpen, setServicesOpen] = useState(false);
  const [localServices, setLocalServices] = useState<ExternalServices>({ render: [], databases: [] });
  const [servicesModified, setServicesModified] = useState(false);
  const [visibleConnStrings, setVisibleConnStrings] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (servicesData && !servicesModified) {
      setLocalServices(servicesData);
    }
  }, [servicesData]);

  useEffect(() => {
    setLocalShortcuts(shortcuts);
    setHasChanges(false);
  }, [shortcuts]);

  useEffect(() => {
    setGithubToken(settings?.['github_token'] || '');
  }, [settings]);

  const handleKeyRecord = useCallback(
    (e: KeyboardEvent) => {
      if (!recordingAction) return;
      e.preventDefault();
      e.stopPropagation();

      const combo = formatKeyCombo(e);
      if (!combo) return;

      setLocalShortcuts((prev) => prev.map((s) => (s.action === recordingAction ? { ...s, key: combo } : s)));
      setRecordingAction(null);
      setHasChanges(true);
    },
    [recordingAction],
  );

  useEffect(() => {
    if (recordingAction) {
      window.addEventListener('keydown', handleKeyRecord, true);
      return () => window.removeEventListener('keydown', handleKeyRecord, true);
    }
  }, [recordingAction, handleKeyRecord]);

  useEffect(() => {
    apiFetch<{ content: string; path: string }>('/logs').then((data) => {
      setLogContent(data.content);
      setLogPath(data.path);
    });
  }, []);

  const { data: passwordStatus, refetch: refetchPwdStatus } = usePasswordStatus();
  const changeMasterPwd = useChangeMasterPassword();
  const unlockVault = useUnlockVault();
  const lockVault = useLockVault();
  const [unlockPwd, setUnlockPwd] = useState('');
  const [unlockError, setUnlockError] = useState('');

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showDemoVaultNotice, setShowDemoVaultNotice] = useState(false);
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState(false);

  // Delete Mission
  const { data: missions } = useMission();
  const mission = missions?.[0];
  const deleteMission = useDeleteMission();
  const [showDeleteMission, setShowDeleteMission] = useState(false);
  const [demoRestoring, setDemoRestoring] = useState(false);
  const [deleteMissionPwd, setDeleteMissionPwd] = useState('');
  const [showBackupInfo, setShowBackupInfo] = useState(false);
  const [deleteMissionError, setDeleteMissionError] = useState('');
  const [deleteMissionSuccess, setDeleteMissionSuccess] = useState(false);

  const handleLanguageChange = (lang: 'en' | 'es') => switchLanguage(lang);

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    updateSetting.mutate({ key: 'theme', value: newTheme });
  };

  const handleUnlock = async () => {
    try {
      await unlockVault.mutateAsync(unlockPwd);
      setUnlockPwd('');
      setUnlockError('');
      refetchPwdStatus();
    } catch {
      setUnlockError(t('incorrectPassword', language));
    }
  };

  const handleLock = async () => {
    await lockVault.mutateAsync();
    refetchPwdStatus();
  };

  const handleChangePassword = async () => {
    setPwdError('');
    if (newPwd.length < 8) {
      setPwdError(t('passwordTooShort', language));
      return;
    }
    if (newPwd !== confirmPwd) {
      setPwdError(t('passwordsDoNotMatch', language));
      return;
    }
    try {
      await changeMasterPwd.mutateAsync({ currentPassword: currentPwd, newPassword: newPwd });
      setPwdSuccess(true);
      setTimeout(() => {
        setShowChangePassword(false);
        setCurrentPwd('');
        setNewPwd('');
        setConfirmPwd('');
        setPwdSuccess(false);
      }, 2000);
    } catch {
      setPwdError(t('incorrectCurrentPassword', language));
    }
  };

  const handleDeleteMission = async () => {
    setDeleteMissionError('');
    try {
      await apiFetch('/passwords/unlock', {
        method: 'POST',
        body: JSON.stringify({ masterPassword: deleteMissionPwd }),
      });
      await deleteMission.mutateAsync({ id: mission!.id, action: 'cascade' });
      setDeleteMissionSuccess(true);
      setTimeout(() => {
        setShowDeleteMission(false);
        setDeleteMissionPwd('');
        setDeleteMissionSuccess(false);
      }, 1500);
    } catch {
      setDeleteMissionError(t('incorrectPassword' as LangKey, language));
    }
  };

  const pilledButton = (active: boolean) =>
    `px-3.5 py-1.5 rounded-md text-sm font-medium transition-all ${
      active ? 'bg-matrix-accent shadow-sm pilled-active' : 'text-gray-400 hover:text-gray-200 hover:bg-matrix-bg'
    }`;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-5 pt-5 pb-3 shrink-0">
        <h1 className="text-xl font-semibold text-gray-200">{t('settings', language)}</h1>
      </div>

      {/* 2-column scrollable layout */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-5 pb-5">
          <div className="grid grid-cols-2 gap-3 items-start">
            {/* ── Left column ── */}
            <div className="flex flex-col gap-3">
              {/* Appearance */}
              <SectionCard>
                <SectionHeader title={language === 'es' ? 'Apariencia' : 'Appearance'} />
                <SettingRow label="Language / Idioma">
                  <div className="flex bg-matrix-bg rounded-lg p-0.5">
                    {(['en', 'es'] as const).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => handleLanguageChange(lang)}
                        className={pilledButton(language === lang)}
                      >
                        {lang === 'en' ? 'English' : 'Español'}
                      </button>
                    ))}
                  </div>
                </SettingRow>
                <SettingRow label="Theme / Tema" last>
                  <div className="flex bg-matrix-bg rounded-lg p-0.5">
                    {(
                      [
                        ['dark', 'Dark', 'Oscuro'],
                        ['light', 'Light', 'Claro'],
                      ] as const
                    ).map(([key, en, es]) => (
                      <button
                        key={key}
                        onClick={() => handleThemeChange(key as Theme)}
                        className={pilledButton(theme === key)}
                      >
                        {language === 'es' ? es : en}
                      </button>
                    ))}
                  </div>
                </SettingRow>
              </SectionCard>

              {/* Notifications */}
              <SectionCard>
                <SectionHeader title={language === 'es' ? 'Notificaciones' : 'Notifications'} />
                <SettingRow label={t('deadlineAlerts', language)} last>
                  <button
                    onClick={() => {
                      const current = settings?.['deadlineAlerts'];
                      updateSetting.mutate({ key: 'deadlineAlerts', value: current === 'false' ? 'true' : 'false' });
                    }}
                    className={`w-10 h-5 rounded-full transition-colors relative ${settings?.['deadlineAlerts'] === 'false' ? 'bg-matrix-border' : 'bg-matrix-accent'}`}
                  >
                    <span
                      className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${settings?.['deadlineAlerts'] === 'false' ? 'left-0.5' : 'left-[22px]'}`}
                    />
                  </button>
                </SettingRow>
              </SectionCard>

              {/* Vault */}
              {passwordStatus?.isSetup && (
                <SectionCard>
                  <SectionHeader title={t('vault', language)} />
                  <div className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {passwordStatus.isUnlocked ? (
                        <>
                          <div className="flex items-center gap-1.5 text-sm text-matrix-success">
                            <span className="w-2 h-2 rounded-full bg-matrix-success" />
                            {language === 'es' ? 'Desbloqueado' : 'Unlocked'}
                          </div>
                          <div className="flex-1" />
                          <button
                            onClick={() => (isDemo ? setShowDemoVaultNotice(true) : setShowChangePassword(true))}
                            className="px-3 py-1.5 rounded-md text-xs text-gray-400 hover:text-gray-200 hover:bg-matrix-bg transition-colors"
                          >
                            {t('changeMasterPassword', language)}
                          </button>
                          <button
                            onClick={handleLock}
                            className="px-3 py-1.5 rounded-md text-xs text-gray-400 border border-matrix-border hover:text-gray-200 hover:bg-matrix-bg transition-colors"
                          >
                            {t('lock', language)}
                          </button>
                        </>
                      ) : (
                        <div className="flex gap-2 flex-1">
                          <input
                            type="password"
                            value={unlockPwd}
                            onChange={(e) => {
                              setUnlockPwd(e.target.value);
                              setUnlockError('');
                            }}
                            placeholder={t('masterPassword', language)}
                            className="flex-1 bg-matrix-bg border border-matrix-border rounded-md px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-matrix-accent/50"
                            onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                          />
                          <button
                            onClick={handleUnlock}
                            disabled={!unlockPwd || unlockVault.isPending}
                            className="px-4 py-1.5 rounded-md text-sm bg-matrix-accent pilled-active hover:bg-matrix-accent-hover transition-colors disabled:opacity-40"
                          >
                            {t('unlock', language)}
                          </button>
                        </div>
                      )}
                    </div>
                    {unlockError && <p className="text-xs text-matrix-danger mt-2">{unlockError}</p>}
                    {isDemo && (
                      <p className="text-xs text-matrix-muted mt-2">🔑 {t('demoVaultHint' as LangKey, language)}</p>
                    )}

                    {/* Auto-lock */}
                    {passwordStatus.isUnlocked && (
                      <div className="border-t border-matrix-border/30 flex items-center justify-between mt-3 pt-3">
                        <span className="text-sm text-gray-400">{t('autoLock' as LangKey, language)}</span>
                        <div className="flex bg-matrix-bg rounded-lg p-0.5">
                          {(['5', '30', 'never'] as const).map((val) => (
                            <button
                              key={val}
                              onClick={() => {
                                updateSetting.mutate({ key: 'vault_auto_lock', value: val });
                                apiFetch('/passwords/apply-auto-lock', { method: 'POST' });
                              }}
                              className={pilledButton((settings?.['vault_auto_lock'] ?? '5') === val)}
                            >
                              {val === '5' ? '5 min' : val === '30' ? '30 min' : language === 'es' ? 'Nunca' : 'Never'}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </SectionCard>
              )}

              {/* Logs */}
              <SectionCard>
                <SectionHeader
                  title="Logs"
                  right={
                    <button
                      onClick={async () => {
                        await apiFetch('/logs/clear', { method: 'POST' });
                        setLogContent('');
                      }}
                      className="text-xs text-matrix-muted hover:text-gray-300 transition-colors"
                    >
                      {language === 'es' ? 'Limpiar' : 'Clear'}
                    </button>
                  }
                />
                <div className="p-3">
                  <ResizableTextarea
                    readOnly
                    rows={5}
                    value={formatLogTimestamps(logContent) || (language === 'es' ? 'Sin logs' : 'No logs')}
                    className="text-xs text-matrix-muted bg-matrix-bg font-mono leading-relaxed"
                  />
                  <p className="text-xs text-matrix-muted/60 mt-2 font-mono">{logPath}</p>
                </div>
              </SectionCard>

              {/* Demo Reset */}
              {isDemo && (
                <SectionCard className="border-matrix-accent/20">
                  <SectionHeader title={language === 'es' ? 'Datos de demostración' : 'Demo Data'} />
                  <div className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">
                        {language === 'es' ? 'Restaurar datos de ejemplo' : 'Restore sample data'}
                      </p>
                      <p className="text-xs text-matrix-muted mt-0.5">
                        {language === 'es'
                          ? 'Restablece todos los datos a su estado original.'
                          : 'Resets all data back to its original state.'}
                      </p>
                    </div>
                    <button
                      onClick={async () => {
                        const ok = await confirm({
                          title: language === 'es' ? 'Restaurar datos de demo' : 'Restore demo data',
                          description:
                            language === 'es'
                              ? 'Se borrarán todos los cambios y se restaurarán los datos originales.'
                              : 'All changes will be lost and original sample data will be restored.',
                          confirmLabel: language === 'es' ? 'Restaurar' : 'Restore',
                        });
                        if (!ok) return;
                        setDemoRestoring(true);
                        await apiFetch('/demo/reset', { method: 'POST', body: JSON.stringify({ language }) });
                        toast.ok('toastDemoRestored');
                        await new Promise((r) => setTimeout(r, 1500));
                        window.location.reload();
                      }}
                      disabled={demoRestoring}
                      className="px-4 py-1.5 rounded-md text-sm text-matrix-accent border border-matrix-accent/30 hover:bg-matrix-accent/10 transition-colors whitespace-nowrap disabled:opacity-50"
                    >
                      {demoRestoring ? (
                        <span className="inline-flex items-center gap-2">
                          <span className="w-3.5 h-3.5 border-2 border-matrix-accent/30 border-t-matrix-accent rounded-full animate-spin" />
                          {language === 'es' ? 'Restaurando...' : 'Restoring...'}
                        </span>
                      ) : language === 'es' ? (
                        'Restaurar'
                      ) : (
                        'Restore'
                      )}
                    </button>
                  </div>
                </SectionCard>
              )}

              {/* Danger Zone */}
              {!isDemo && (
                <SectionCard className="border-matrix-danger/20">
                  <SectionHeader title={language === 'es' ? 'Zona peligrosa' : 'Danger Zone'} />

                  {mission && (
                    <div className="px-4 py-3 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-matrix-border/30">
                      <div>
                        <p className="text-sm text-gray-400">{t('deleteMission' as LangKey, language)}</p>
                        <p className="text-xs text-matrix-muted mt-0.5">
                          {t('deleteMissionDesc' as LangKey, language)}
                        </p>
                      </div>
                      <button
                        onClick={async () => {
                          setShowDeleteMission(true);
                        }}
                        className="px-4 py-1.5 rounded-md text-sm text-matrix-danger border border-matrix-danger/30 hover:bg-matrix-danger/10 transition-colors whitespace-nowrap"
                      >
                        {t('deleteMission' as LangKey, language)}
                      </button>
                    </div>
                  )}

                  <div className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">
                        {language === 'es' ? 'Borrar base de datos' : 'Reset Database'}
                      </p>
                      <p className="text-xs text-matrix-muted mt-0.5">
                        {language === 'es' ? 'Elimina todos los datos permanentemente' : 'Permanently deletes all data'}
                      </p>
                    </div>
                    <button
                      onClick={async () => {
                        const first = await confirm({
                          title: language === 'es' ? '¿Borrar toda la base de datos?' : 'Delete entire database?',
                          description:
                            language === 'es' ? 'Esta acción no se puede deshacer.' : 'This cannot be undone.',
                          danger: true,
                          confirmLabel: language === 'es' ? 'Continuar' : 'Continue',
                        });
                        if (!first) return;
                        const second = await confirm({
                          title: language === 'es' ? '¿Estás seguro?' : 'Are you sure?',
                          description: language === 'es' ? 'Todos los datos se perderán.' : 'All data will be lost.',
                          danger: true,
                          confirmLabel: language === 'es' ? 'Borrar todo' : 'Delete everything',
                        });
                        if (second) {
                          await apiFetch('/db/reset', { method: 'POST' });
                          window.location.reload();
                        }
                      }}
                      className="px-4 py-1.5 rounded-md text-sm text-matrix-danger border border-matrix-danger/30 hover:bg-matrix-danger/10 transition-colors whitespace-nowrap"
                    >
                      {language === 'es' ? 'Borrar' : 'Reset'}
                    </button>
                  </div>
                </SectionCard>
              )}
            </div>

            {/* ── Right column ── */}
            <div className="flex flex-col gap-3">
              {/* GitHub */}
              <SectionCard>
                <SectionHeader title={t('githubIntegration', language)} />
                <div className="px-4 py-3 space-y-2">
                  <div className="text-xs text-matrix-muted">{t('githubToken', language)}</div>
                  <div className="flex gap-2 items-center">
                    <input
                      type="password"
                      value={githubToken}
                      onChange={(e) => setGithubToken(e.target.value)}
                      placeholder="ghp_xxx"
                      className="flex-1 px-3 py-2 bg-matrix-bg border border-matrix-border rounded text-sm text-gray-200 placeholder-matrix-muted focus:border-matrix-accent focus:outline-none"
                    />
                    <button
                      onClick={async () => {
                        await updateSetting.mutateAsync({ key: 'github_token', value: githubToken.trim() });
                        refetchGitHubStatus();
                      }}
                      className="px-3 py-2 bg-matrix-accent/20 text-matrix-accent rounded hover:bg-matrix-accent/30 transition-colors text-sm shrink-0"
                    >
                      {t('githubSave', language)}
                    </button>
                  </div>
                  <div className="text-xs text-gray-300">
                    {t('githubStatus', language)}:{' '}
                    {githubStatus?.connected ? (
                      <span className="text-matrix-success">
                        {t('githubConnected', language)} {githubStatus.username ? `(${githubStatus.username})` : ''}
                      </span>
                    ) : (
                      <span className="text-matrix-muted">{t('githubNotConfigured', language)}</span>
                    )}
                  </div>
                </div>
              </SectionCard>

              {/* External Services */}
              {passwordStatus?.isSetup && (
                <SectionCard>
                  <button
                    onClick={() => setServicesOpen(!servicesOpen)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left"
                  >
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                        {t('externalServices', language)}
                      </h3>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setServicesInfoOpen(true);
                        }}
                        className="text-matrix-muted hover:text-gray-300 transition-colors"
                        aria-label="Info"
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z"
                          />
                        </svg>
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-matrix-muted">
                        {localServices.render.length + localServices.databases.length}
                      </span>
                      <svg
                        className={`w-4 h-4 text-matrix-muted transition-transform duration-200 ${servicesOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </div>
                  </button>

                  {servicesInfoOpen && (
                    <Modal
                      title={t('externalServicesInfoTitle', language)}
                      onClose={() => setServicesInfoOpen(false)}
                      maxWidth="max-w-sm"
                    >
                      <div className="space-y-3 text-xs text-gray-400">
                        <p>{t('externalServicesInfoDesc', language)}</p>
                        <div className="border-l-2 border-matrix-accent/40 pl-3 space-y-2">
                          <p>
                            <span className="text-gray-300 font-medium">
                              {t('renderBackends' as LangKey, language)}:
                            </span>{' '}
                            {t('externalServicesRenderDesc', language)}
                          </p>
                          <p>
                            <span className="text-gray-300 font-medium">
                              {t('aivenDatabases' as LangKey, language)}:
                            </span>{' '}
                            {t('externalServicesDbDesc', language)}
                          </p>
                        </div>
                        <p className="text-matrix-muted italic">{t('externalServicesHowTo', language)}</p>
                      </div>
                    </Modal>
                  )}
                  {servicesOpen && (
                    <div className="border-t border-matrix-border/60">
                      {!passwordStatus.isUnlocked ? (
                        <div className="px-4 py-3">
                          <p className="text-xs text-matrix-muted">
                            {t('vaultRequiredForServices' as LangKey, language)}
                          </p>
                        </div>
                      ) : (
                        <div className="px-4 py-3 space-y-4">
                          {/* Render Backends */}
                          <div>
                            <p className="text-xs font-medium text-gray-400 mb-2">
                              {t('renderBackends' as LangKey, language)}
                            </p>
                            <div className="space-y-2">
                              {localServices.render.map((svc, i) => (
                                <div key={i} className="flex gap-2 items-center">
                                  <input
                                    type="text"
                                    value={svc.name}
                                    onChange={(e) => {
                                      const render = [...localServices.render];
                                      render[i] = { ...render[i], name: e.target.value };
                                      setLocalServices((prev) => ({ ...prev, render }));
                                      setServicesModified(true);
                                    }}
                                    placeholder={t('serviceName' as LangKey, language)}
                                    className="w-28 text-xs bg-matrix-bg border border-matrix-border rounded px-2 py-1.5 text-gray-300 focus:outline-none focus:border-matrix-accent/50"
                                  />
                                  <input
                                    type="text"
                                    value={svc.url}
                                    onChange={(e) => {
                                      const render = [...localServices.render];
                                      render[i] = { ...render[i], url: e.target.value };
                                      setLocalServices((prev) => ({ ...prev, render }));
                                      setServicesModified(true);
                                    }}
                                    placeholder="https://..."
                                    className="flex-1 text-xs font-mono bg-matrix-bg border border-matrix-border rounded px-2 py-1.5 text-gray-300 focus:outline-none focus:border-matrix-accent/50"
                                  />
                                  <button
                                    onClick={() => {
                                      setLocalServices((prev) => ({
                                        ...prev,
                                        render: prev.render.filter((_, idx) => idx !== i),
                                      }));
                                      setServicesModified(true);
                                    }}
                                    className="text-xs text-matrix-danger hover:bg-matrix-danger/10 rounded px-2 py-1.5 transition-colors shrink-0"
                                  >
                                    {t('removeService' as LangKey, language)}
                                  </button>
                                </div>
                              ))}
                              <button
                                onClick={() => {
                                  setLocalServices((prev) => ({
                                    ...prev,
                                    render: [...prev.render, { name: '', url: '' }],
                                  }));
                                  setServicesModified(true);
                                }}
                                className="text-xs text-matrix-accent hover:underline"
                              >
                                + {t('addService' as LangKey, language)}
                              </button>
                            </div>
                          </div>

                          {/* Databases */}
                          <div>
                            <p className="text-xs font-medium text-gray-400 mb-2">
                              {t('aivenDatabases' as LangKey, language)}
                            </p>
                            <div className="space-y-2">
                              {localServices.databases.map((db, i) => (
                                <div key={i} className="space-y-1">
                                  <div className="flex gap-2 items-center">
                                    <input
                                      type="text"
                                      value={db.name}
                                      onChange={(e) => {
                                        const databases = [...localServices.databases];
                                        databases[i] = { ...databases[i], name: e.target.value };
                                        setLocalServices((prev) => ({ ...prev, databases }));
                                        setServicesModified(true);
                                      }}
                                      placeholder={t('serviceName' as LangKey, language)}
                                      className="w-28 text-xs bg-matrix-bg border border-matrix-border rounded px-2 py-1.5 text-gray-300 focus:outline-none focus:border-matrix-accent/50"
                                    />
                                    <select
                                      value={db.type}
                                      onChange={(e) => {
                                        const databases = [...localServices.databases];
                                        databases[i] = { ...databases[i], type: e.target.value };
                                        setLocalServices((prev) => ({ ...prev, databases }));
                                        setServicesModified(true);
                                      }}
                                      className="text-xs bg-matrix-bg border border-matrix-border rounded px-2 py-1.5 text-gray-300 focus:outline-none focus:border-matrix-accent/50"
                                    >
                                      <option value="mysql">MySQL</option>
                                      <option value="postgres">PostgreSQL</option>
                                    </select>
                                    <button
                                      onClick={() => {
                                        setLocalServices((prev) => ({
                                          ...prev,
                                          databases: prev.databases.filter((_, idx) => idx !== i),
                                        }));
                                        setServicesModified(true);
                                      }}
                                      className="text-xs text-matrix-danger hover:bg-matrix-danger/10 rounded px-2 py-1.5 transition-colors shrink-0"
                                    >
                                      {t('removeService' as LangKey, language)}
                                    </button>
                                  </div>
                                  <div className="flex gap-1 items-center">
                                    <input
                                      type={visibleConnStrings.has(i) ? 'text' : 'password'}
                                      value={db.connectionString}
                                      onChange={(e) => {
                                        const databases = [...localServices.databases];
                                        databases[i] = { ...databases[i], connectionString: e.target.value };
                                        setLocalServices((prev) => ({ ...prev, databases }));
                                        setServicesModified(true);
                                      }}
                                      placeholder="mysql://user:pass@host:port/db"
                                      className="flex-1 text-xs font-mono bg-matrix-bg border border-matrix-border rounded px-2 py-1.5 text-gray-300 focus:outline-none focus:border-matrix-accent/50"
                                    />
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setVisibleConnStrings((prev) => {
                                          const next = new Set(prev);
                                          next.has(i) ? next.delete(i) : next.add(i);
                                          return next;
                                        })
                                      }
                                      className="text-xs text-matrix-muted hover:text-gray-300 transition-colors px-1.5 py-1.5 shrink-0"
                                      title={
                                        visibleConnStrings.has(i)
                                          ? t('hidePassword', language)
                                          : t('showPassword', language)
                                      }
                                    >
                                      {visibleConnStrings.has(i) ? '🙈' : '👁'}
                                    </button>
                                  </div>
                                </div>
                              ))}
                              <button
                                onClick={() => {
                                  setLocalServices((prev) => ({
                                    ...prev,
                                    databases: [...prev.databases, { name: '', type: 'mysql', connectionString: '' }],
                                  }));
                                  setServicesModified(true);
                                }}
                                className="text-xs text-matrix-accent hover:underline"
                              >
                                + {t('addDatabase' as LangKey, language)}
                              </button>
                            </div>
                          </div>

                          <button
                            onClick={() =>
                              setServicesApi.mutate(localServices, {
                                onSuccess: () => {
                                  setServicesModified(false);
                                  toast.ok('saved' as LangKey);
                                },
                                onError: (err) => {
                                  toast.error(err.message || 'Error');
                                },
                              })
                            }
                            disabled={setServicesApi.isPending || !servicesModified}
                            className="px-4 py-1.5 rounded-md text-xs font-semibold bg-matrix-accent pilled-active hover:bg-matrix-accent-hover transition-colors disabled:opacity-40"
                          >
                            {setServicesApi.isPending ? '...' : t('saveServices' as LangKey, language)}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </SectionCard>
              )}

              {/* Keyboard Shortcuts */}
              <SectionCard>
                <button
                  onClick={() => setShortcutsOpen(!shortcutsOpen)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left"
                >
                  <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    {t('keyboardShortcuts', language)}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-matrix-muted">{localShortcuts.length}</span>
                    <svg
                      className={`w-4 h-4 text-matrix-muted transition-transform duration-200 ${shortcutsOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </div>
                </button>
                {shortcutsOpen && (
                  <>
                    <div className="border-t border-matrix-border/60">
                      {localShortcuts.map((shortcut: Shortcut, i: number) => {
                        const isRecording = recordingAction === shortcut.action;
                        const conflict = localShortcuts.find(
                          (s) => s.action !== shortcut.action && s.key === shortcut.key && shortcut.key !== '',
                        );
                        const isLast = i === localShortcuts.length - 1;
                        return (
                          <div
                            key={shortcut.action}
                            className={`flex items-center justify-between px-4 py-2.5 hover:bg-matrix-bg/50 ${!isLast ? 'border-b border-matrix-border/30' : ''}`}
                          >
                            <span className="text-sm text-gray-400">{shortcut.label}</span>
                            <div className="flex items-center gap-2">
                              {conflict && (
                                <span
                                  className="w-5 h-5 flex items-center justify-center rounded-full bg-amber-500/10 text-amber-400 text-xs"
                                  title={t('shortcutConflict', language)}
                                >
                                  !
                                </span>
                              )}
                              <button
                                data-shortcut-recorder
                                onClick={() => setRecordingAction(isRecording ? null : shortcut.action)}
                                className={`min-w-[130px] px-3 py-1.5 rounded-md text-xs font-mono text-center transition-all ${
                                  isRecording
                                    ? 'bg-matrix-accent/10 border-2 border-matrix-accent/60 text-matrix-accent'
                                    : 'bg-matrix-bg border border-matrix-border text-gray-300 hover:border-matrix-muted/50'
                                }`}
                              >
                                {isRecording
                                  ? language === 'es'
                                    ? 'Presiona teclas...'
                                    : 'Press keys...'
                                  : shortcut.key || '—'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex items-center justify-between px-4 py-3 border-t border-matrix-border/60 bg-matrix-bg/30">
                      <button
                        onClick={() => {
                          resetToDefaults.mutate();
                          setHasChanges(false);
                          setRecordingAction(null);
                        }}
                        disabled={resetToDefaults.isPending}
                        className="text-xs text-matrix-muted hover:text-gray-300 transition-colors"
                      >
                        {t('resetToDefaults', language)}
                      </button>
                      <button
                        onClick={() => {
                          updateShortcuts.mutate(localShortcuts);
                          setHasChanges(false);
                        }}
                        disabled={!hasChanges || updateShortcuts.isPending}
                        className={`px-5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                          hasChanges
                            ? 'bg-matrix-accent pilled-active shadow-sm hover:bg-matrix-accent-hover'
                            : 'bg-matrix-bg text-matrix-muted border border-matrix-border cursor-not-allowed'
                        }`}
                      >
                        {updateShortcuts.isPending ? '...' : language === 'es' ? 'Guardar' : 'Save'}
                      </button>
                    </div>
                  </>
                )}
              </SectionCard>

              {/* Backup & Cloud */}
              <SectionCard>
                <SectionHeader title={t('backupCloud' as LangKey, language)} />
                <div className="px-4 py-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">{t('downloadDatabase' as LangKey, language)}</p>
                      <p className="text-xs text-matrix-muted mt-0.5">
                        {t('downloadDatabaseDesc' as LangKey, language)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setShowBackupInfo(true)}
                        className="w-6 h-6 flex items-center justify-center rounded-full border border-matrix-border text-matrix-muted hover:text-gray-300 hover:border-matrix-muted/50 transition-colors text-xs font-semibold"
                        title={language === 'es' ? '¿Qué se descarga?' : 'What gets downloaded?'}
                      >
                        ?
                      </button>
                      {isDemo ? (
                        <span className="px-4 py-1.5 rounded-md text-sm text-matrix-muted border border-matrix-border cursor-not-allowed whitespace-nowrap">
                          {language === 'es' ? 'No disponible' : 'Not available'}
                        </span>
                      ) : (
                        <a
                          href="/api/db/download"
                          target="_blank"
                          rel="noreferrer"
                          className="px-4 py-1.5 rounded-md text-sm text-matrix-accent border border-matrix-accent/30 hover:bg-matrix-accent/10 transition-colors whitespace-nowrap"
                        >
                          {t('downloadDatabase' as LangKey, language)}
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-matrix-border/30 pt-3">
                    <div>
                      <p className="text-sm text-gray-400">{t('downloadMockData' as LangKey, language)}</p>
                      <p className="text-xs text-matrix-muted mt-0.5">
                        {t('downloadMockDataDesc' as LangKey, language)}
                      </p>
                    </div>
                    <span className="px-4 py-1.5 rounded-md text-sm text-matrix-muted border border-matrix-border cursor-not-allowed whitespace-nowrap">
                      {language === 'es' ? 'Próximamente' : 'Coming soon'}
                    </span>
                  </div>
                </div>
              </SectionCard>
            </div>
          </div>
        </div>
      </div>

      {/* ── Delete Mission Modal ── */}
      {showDeleteMission && mission && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-matrix-surface border border-matrix-danger/30 rounded-xl p-5 sm:p-6 w-full max-w-md shadow-xl max-h-[calc(100vh-2rem)] overflow-y-auto">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-matrix-danger text-lg">⚠</span>
              <h3 className="text-sm font-semibold text-matrix-danger">{t('deleteMission' as LangKey, language)}</h3>
            </div>
            <div className="space-y-3">
              <div className="bg-matrix-danger/5 border border-matrix-danger/20 rounded-lg p-3">
                <p className="text-xs text-gray-300 leading-relaxed">
                  {t('deleteMissionWarning' as LangKey, language)}
                </p>
                <p className="text-xs text-matrix-muted mt-2">
                  <span className="text-gray-400 font-medium">{language === 'es' ? 'Misión' : 'Mission'}:</span>{' '}
                  {mission.title}
                </p>
              </div>
              <input
                type="password"
                value={deleteMissionPwd}
                onChange={(e) => {
                  setDeleteMissionPwd(e.target.value);
                  setDeleteMissionError('');
                }}
                placeholder={t('masterPassword' as LangKey, language)}
                className="w-full bg-matrix-bg border border-matrix-border rounded-md px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-matrix-danger/50"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && deleteMissionPwd) handleDeleteMission();
                }}
                autoFocus
              />
              {deleteMissionError && <p className="text-xs text-matrix-danger">{deleteMissionError}</p>}
              {deleteMissionSuccess && (
                <p className="text-xs text-matrix-success">{t('missionDeleted' as LangKey, language)}</p>
              )}
              <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row">
                <button
                  onClick={handleDeleteMission}
                  disabled={!deleteMissionPwd || deleteMission.isPending}
                  className="flex-1 px-4 py-2 text-sm bg-matrix-danger/90 text-white rounded-md hover:bg-matrix-danger transition-colors disabled:opacity-40"
                >
                  {deleteMission.isPending ? '...' : t('deleteMission' as LangKey, language)}
                </button>
                <button
                  onClick={() => {
                    setShowDeleteMission(false);
                    setDeleteMissionPwd('');
                    setDeleteMissionError('');
                  }}
                  className="px-4 py-2 text-sm text-gray-400 border border-matrix-border rounded-md hover:bg-matrix-bg transition-colors"
                >
                  {t('cancel' as LangKey, language)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Backup Info Modal ── */}
      {showBackupInfo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-matrix-surface border border-matrix-border rounded-xl p-5 sm:p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <svg
                className="w-4 h-4 text-matrix-accent shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 2.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125m16.5 2.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125"
                />
              </svg>
              <h3 className="text-sm font-semibold text-gray-200">{t('backupInfoTitle' as LangKey, language)}</h3>
            </div>
            <div className="space-y-3">
              <p className="text-xs text-gray-400 leading-relaxed">{t('backupInfoBody' as LangKey, language)}</p>
              <div className="bg-matrix-bg border border-matrix-border/50 rounded-lg px-3 py-2.5 flex gap-2">
                <svg
                  className="w-3.5 h-3.5 text-matrix-success shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                  />
                </svg>
                <p className="text-xs text-gray-400 leading-relaxed">{t('backupInfoVault' as LangKey, language)}</p>
              </div>
              {isDemo && (
                <div className="bg-matrix-accent/5 border border-matrix-accent/20 rounded-lg px-3 py-2.5">
                  <p className="text-xs text-matrix-muted leading-relaxed">
                    {t('backupInfoDemo' as LangKey, language)}
                  </p>
                </div>
              )}
            </div>
            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setShowBackupInfo(false)}
                className="px-5 py-2 text-sm bg-matrix-accent pilled-active rounded-md hover:bg-matrix-accent-hover transition-colors"
              >
                {t('gotIt' as LangKey, language)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Demo Vault Notice Modal ── */}
      {showDemoVaultNotice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-matrix-surface border border-matrix-accent/20 rounded-xl p-5 sm:p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🔑</span>
              <h3 className="text-sm font-semibold text-gray-200">{t('changeMasterPassword', language)}</h3>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed mb-5">{t('demoVaultCannotChange', language)}</p>
            <button
              onClick={() => setShowDemoVaultNotice(false)}
              className="w-full px-4 py-2 text-sm bg-matrix-accent pilled-active rounded-md hover:bg-matrix-accent-hover transition-colors"
            >
              {t('gotIt' as LangKey, language)}
            </button>
          </div>
        </div>
      )}

      {/* ── Change Password Modal ── */}
      {showChangePassword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-matrix-surface border border-matrix-border rounded-xl p-5 sm:p-6 w-full max-w-md shadow-xl max-h-[calc(100vh-2rem)] overflow-y-auto">
            <h3 className="text-sm font-semibold text-gray-200 mb-4">{t('changeMasterPassword', language)}</h3>
            <div className="space-y-3">
              <input
                type="password"
                value={currentPwd}
                onChange={(e) => setCurrentPwd(e.target.value)}
                placeholder={t('currentPassword', language)}
                className="w-full bg-matrix-bg border border-matrix-border rounded-md px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-matrix-accent/50"
              />
              <input
                type="password"
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
                placeholder={t('newPassword', language)}
                className="w-full bg-matrix-bg border border-matrix-border rounded-md px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-matrix-accent/50"
              />
              <input
                type="password"
                value={confirmPwd}
                onChange={(e) => setConfirmPwd(e.target.value)}
                placeholder={t('newPasswordAgain', language)}
                className="w-full bg-matrix-bg border border-matrix-border rounded-md px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-matrix-accent/50"
              />
              {pwdError && <p className="text-xs text-matrix-danger">{pwdError}</p>}
              {pwdSuccess && <p className="text-xs text-matrix-success">{t('passwordChanged', language)}</p>}
              <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row">
                <button
                  onClick={handleChangePassword}
                  disabled={changeMasterPwd.isPending || !currentPwd || !newPwd || !confirmPwd}
                  className="flex-1 px-4 py-2 text-sm bg-matrix-accent pilled-active rounded-md hover:bg-matrix-accent-hover transition-colors disabled:opacity-40"
                >
                  {t('save', language)}
                </button>
                <button
                  onClick={() => {
                    setShowChangePassword(false);
                    setPwdError('');
                    setCurrentPwd('');
                    setNewPwd('');
                    setConfirmPwd('');
                  }}
                  className="px-4 py-2 text-sm text-gray-400 border border-matrix-border rounded-md hover:bg-matrix-bg transition-colors"
                >
                  {t('cancel', language)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
