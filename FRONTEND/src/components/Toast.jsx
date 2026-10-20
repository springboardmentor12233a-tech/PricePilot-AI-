import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  Loader2,
  X,
} from 'lucide-react';

/**
 * Toast notifications
 *
 *   toast.success('Price rule saved');
 *   toast.error('Could not publish prices', { title: 'Sync failed', action: { label: 'Retry', onClick: retry } });
 *   toast.promise(saveRules(), { loading: 'Saving…', success: 'Rules saved', error: (e) => e.message });
 *
 * Also: toast.warning, toast.info, toast.loading (returns an id), toast.update(id, patch),
 * toast.dismiss(id?) (no id dismisses everything).
 *
 * The old signature toast.success(message, 'Title') still works.
 */

const ToastContext = createContext(null);

const MAX_VISIBLE = 4;
const EXIT_MS = 220;

const DEFAULT_DURATION = {
  success: 4000,
  info: 4000,
  warning: 5000,
  error: 7000,
  loading: 0, // stays until updated or dismissed
};

const TYPE_STYLES = {
  success: {
    Icon: CheckCircle2,
    icon: 'text-[#16A34A]',
    tint: 'bg-[#F0FDF4]',
    border: 'border-[#BBF7D0]',
    bar: 'bg-[#16A34A]',
  },
  error: {
    Icon: AlertCircle,
    icon: 'text-[#DC2626]',
    tint: 'bg-[#FEF2F2]',
    border: 'border-[#FECACA]',
    bar: 'bg-[#DC2626]',
  },
  warning: {
    Icon: AlertTriangle,
    icon: 'text-[#D97706]',
    tint: 'bg-[#FFFBEB]',
    border: 'border-[#FDE68A]',
    bar: 'bg-[#F59E0B]',
  },
  info: {
    Icon: Info,
    icon: 'text-[#2563EB]',
    tint: 'bg-[#EFF6FF]',
    border: 'border-[#BFDBFE]',
    bar: 'bg-[#2563EB]',
  },
  loading: {
    Icon: Loader2,
    icon: 'text-[#2563EB]',
    tint: 'bg-[#EFF6FF]',
    border: 'border-[#E2E8F0]',
    bar: 'bg-[#2563EB]',
    spin: true,
  },
};

// Self-contained animation CSS, so no Tailwind animation plugin is required.
const STYLES = `
@keyframes pp-toast-in {
  from { opacity: 0; transform: translate3d(0, 12px, 0) scale(0.98); }
  to   { opacity: 1; transform: none; }
}
@keyframes pp-toast-fade {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes pp-toast-progress {
  from { transform: scaleX(1); }
  to   { transform: scaleX(0); }
}
.pp-toast-item {
  display: grid;
  grid-template-rows: 1fr;
  transition:
    grid-template-rows ${EXIT_MS}ms cubic-bezier(0.4, 0, 0.2, 1),
    opacity ${EXIT_MS - 40}ms ease,
    transform ${EXIT_MS}ms cubic-bezier(0.4, 0, 0.2, 1);
}
.pp-toast-item[data-state="open"] {
  animation: pp-toast-in 280ms cubic-bezier(0.16, 1, 0.3, 1) backwards;
}
.pp-toast-item[data-state="closing"] {
  grid-template-rows: 0fr;
  opacity: 0;
  transform: translate3d(24px, 0, 0);
}
.pp-toast-clip { min-height: 0; overflow: hidden; }
.pp-toast-progress {
  transform-origin: left;
  opacity: 0.55;
  animation: pp-toast-progress linear forwards;
}
@media (prefers-reduced-motion: reduce) {
  .pp-toast-item { transition: opacity 120ms linear; }
  .pp-toast-item[data-state="open"] { animation: pp-toast-fade 120ms linear backwards; }
  .pp-toast-item[data-state="closing"] { transform: none; }
  .pp-toast-progress { animation: none; display: none; }
}
`;

let idCounter = 0;
const makeId = () => `toast-${Date.now().toString(36)}-${++idCounter}`;

function usePageHidden() {
  const [hidden, setHidden] = useState(
    () => typeof document !== 'undefined' && document.hidden,
  );
  useEffect(() => {
    const onChange = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', onChange);
    return () => document.removeEventListener('visibilitychange', onChange);
  }, []);
  return hidden;
}

function ToastItem({ toast, onDismiss, pageHidden }) {
  const { id, type, title, message, duration, action, count, revision, leaving } = toast;
  const styles = TYPE_STYLES[type] ?? TYPE_STYLES.info;
  const { Icon } = styles;

  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const paused = hovered || focused || pageHidden;

  const remaining = useRef(duration);
  const startedAt = useRef(0);

  // A new revision (update or repeated message) restarts the countdown.
  // Declared before the timer effect so it runs first.
  useEffect(() => {
    remaining.current = duration;
  }, [duration, revision]);

  // Auto-dismiss that pauses on hover, keyboard focus and when the tab is hidden.
  useEffect(() => {
    if (duration <= 0 || leaving || paused) return undefined;
    startedAt.current = Date.now();
    const timer = setTimeout(() => onDismiss(id), Math.max(remaining.current, 0));
    return () => {
      clearTimeout(timer);
      remaining.current = Math.max(0, remaining.current - (Date.now() - startedAt.current));
    };
  }, [paused, leaving, duration, revision, id, onDismiss]);

  const handleBlur = (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
  };

  return (
    <div
      className="pp-toast-item"
      data-state={leaving ? 'closing' : 'open'}
      style={{ pointerEvents: leaving ? 'none' : 'auto' }}
    >
      <div className="pp-toast-clip px-2 py-2">
        <div
          className={`relative flex items-start gap-3 overflow-hidden rounded-xl border bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.10),0_1px_3px_rgba(15,23,42,0.08)] ${styles.border}`}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onFocus={() => setFocused(true)}
          onBlur={handleBlur}
          onKeyDown={(event) => {
            if (event.key === 'Escape') onDismiss(id);
          }}
        >
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${styles.tint}`}
            aria-hidden="true"
          >
            <Icon
              className={`h-4 w-4 ${styles.icon} ${
                styles.spin ? 'animate-spin motion-reduce:animate-none' : ''
              }`}
            />
          </span>

          <div className="min-w-0 flex-1 pt-0.5">
            {title && (
              <p className="flex items-center gap-2 text-sm font-semibold leading-snug text-[#0F172A]">
                <span className="min-w-0 break-words">{title}</span>
                {count > 1 && (
                  <span className="shrink-0 rounded-full bg-[#F1F5F9] px-1.5 py-px text-[11px] font-medium text-[#475569]">
                    ×{count}
                  </span>
                )}
              </p>
            )}
            <p
              className={`break-words text-[13px] leading-relaxed ${
                title ? 'mt-0.5 text-[#64748B]' : 'font-medium text-[#0F172A]'
              }`}
            >
              {message}
              {!title && count > 1 && (
                <span className="ml-2 rounded-full bg-[#F1F5F9] px-1.5 py-px text-[11px] font-medium text-[#475569]">
                  ×{count}
                </span>
              )}
            </p>

            {action?.label && (
              <button
                type="button"
                onClick={() => {
                  action.onClick?.();
                  onDismiss(id);
                }}
                className="mt-2 cursor-pointer rounded text-[13px] font-semibold text-[#2563EB] transition-colors hover:text-[#1D4ED8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB]"
              >
                {action.label}
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => onDismiss(id)}
            className="-mr-1 -mt-1 shrink-0 cursor-pointer rounded-md p-1 text-[#94A3B8] transition-colors hover:bg-[#F1F5F9] hover:text-[#0F172A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563EB]"
            aria-label="Dismiss notification"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>

          {duration > 0 && !leaving && (
            <span
              key={revision}
              aria-hidden="true"
              className={`pp-toast-progress absolute bottom-0 left-0 h-[3px] w-full ${styles.bar}`}
              style={{
                animationDuration: `${duration}ms`,
                animationPlayState: paused ? 'paused' : 'running',
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

const EMPTY_ANNOUNCEMENT = { text: '', seq: 0 };

export function ToastProvider({ children, maxVisible = MAX_VISIBLE }) {
  const [toasts, setToasts] = useState([]);
  const [polite, setPolite] = useState(EMPTY_ANNOUNCEMENT);
  const [assertive, setAssertive] = useState(EMPTY_ANNOUNCEMENT);

  // The ref is the source of truth so rapid calls in one tick never see stale state.
  const toastsRef = useRef([]);
  const removalTimers = useRef(new Set());
  const pageHidden = usePageHidden();

  const commit = useCallback((next) => {
    toastsRef.current = next;
    setToasts(next);
  }, []);

  useEffect(() => {
    const timers = removalTimers.current;
    return () => timers.forEach(clearTimeout);
  }, []);

  const announce = useCallback((type, title, message) => {
    const text = [title, message].filter(Boolean).join('. ');
    const setter = type === 'error' ? setAssertive : setPolite;
    setter((prev) => ({ text, seq: prev.seq + 1 }));
  }, []);

  const dismissIds = useCallback(
    (ids) => {
      const current = toastsRef.current;
      const targets = new Set(
        ids.filter((id) => current.some((t) => t.id === id && !t.leaving)),
      );
      if (targets.size === 0) return;

      commit(current.map((t) => (targets.has(t.id) ? { ...t, leaving: true } : t)));

      const timer = setTimeout(() => {
        removalTimers.current.delete(timer);
        commit(toastsRef.current.filter((t) => !targets.has(t.id)));
      }, EXIT_MS);
      removalTimers.current.add(timer);
    },
    [commit],
  );

  const dismiss = useCallback(
    (id) => {
      const ids = id == null ? toastsRef.current.map((t) => t.id) : [id];
      dismissIds(ids);
    },
    [dismissIds],
  );

  const add = useCallback(
    (type, message, options = {}) => {
      const opts = typeof options === 'string' ? { title: options } : options;
      const { title, action, id: customId } = opts;
      const duration = opts.duration ?? DEFAULT_DURATION[type];
      const current = toastsRef.current;

      announce(type, title, message);

      // Same id, or an identical toast already on screen: refresh it instead of stacking.
      const existing = current.find(
        (t) =>
          !t.leaving &&
          (customId
            ? t.id === customId
            : t.type === type && t.message === message && t.title === title),
      );
      if (existing) {
        commit(
          current.map((t) =>
            t.id === existing.id
              ? {
                  ...t,
                  type,
                  title,
                  message,
                  duration,
                  action,
                  count: customId ? t.count : t.count + 1,
                  revision: t.revision + 1,
                }
              : t,
          ),
        );
        return existing.id;
      }

      const id = customId ?? makeId();
      const next = [
        ...current,
        { id, type, title, message, duration, action, count: 1, revision: 0, leaving: false },
      ];
      commit(next);

      // Keep the stack short: retire the oldest settled toasts first.
      const active = next.filter((t) => !t.leaving);
      const overflow = active.length - maxVisible;
      if (overflow > 0) {
        const retire = active
          .filter((t) => t.id !== id && t.type !== 'loading')
          .slice(0, overflow)
          .map((t) => t.id);
        dismissIds(retire);
      }
      return id;
    },
    [announce, commit, dismissIds, maxVisible],
  );

  const update = useCallback(
    (id, patch = {}) => {
      const current = toastsRef.current;
      const target = current.find((t) => t.id === id && !t.leaving);
      if (!target) return false;

      const type = patch.type ?? target.type;
      const merged = {
        ...target,
        ...patch,
        type,
        duration: patch.duration ?? DEFAULT_DURATION[type],
        revision: target.revision + 1,
      };
      commit(current.map((t) => (t.id === id ? merged : t)));
      announce(type, merged.title, merged.message);
      return true;
    },
    [announce, commit],
  );

  const promise = useCallback(
    (pending, messages = {}, options = {}) => {
      const resolveText = (value, arg, fallback) =>
        (typeof value === 'function' ? value(arg) : value) ?? fallback;

      const id = add('loading', messages.loading ?? 'Working…', options);

      const settle = (type, text) => {
        // If the person dismissed the loading toast, still report the outcome.
        if (!update(id, { type, message: text })) {
          add(type, text, { title: options.title });
        }
      };

      Promise.resolve(pending).then(
        (result) => settle('success', resolveText(messages.success, result, 'Done')),
        (error) =>
          settle(
            'error',
            resolveText(messages.error, error, error?.message || 'Something went wrong'),
          ),
      );
      return pending;
    },
    [add, update],
  );

  // Stable API object: components that call useToast() never re-render when toasts change.
  const api = useMemo(
    () => ({
      success: (message, options) => add('success', message, options),
      error: (message, options) => add('error', message, options),
      warning: (message, options) => add('warning', message, options),
      info: (message, options) => add('info', message, options),
      loading: (message, options) => add('loading', message, options),
      promise,
      update,
      dismiss,
    }),
    [add, promise, update, dismiss],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      {typeof document !== 'undefined' &&
        createPortal(
          <>
            <style>{STYLES}</style>

            {/* Persistent live regions: reliably announced by screen readers */}
            <div className="sr-only" aria-live="polite" aria-atomic="true">
              <span key={polite.seq}>{polite.text}</span>
            </div>
            <div className="sr-only" aria-live="assertive" aria-atomic="true">
              <span key={assertive.seq}>{assertive.text}</span>
            </div>

            <section
              aria-label="Notifications"
              className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col p-2 sm:left-auto sm:right-0 sm:w-[26rem] sm:max-w-full sm:p-3"
              style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
            >
              {toasts.map((t) => (
                <ToastItem key={t.id} toast={t} onDismiss={dismiss} pageHidden={pageHidden} />
              ))}
            </section>
          </>,
          document.body,
        )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export default ToastProvider;