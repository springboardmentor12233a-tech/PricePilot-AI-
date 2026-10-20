import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/**
 * Modal
 *
 * <Modal isOpen={open} onClose={() => setOpen(false)} title="Create category"
 *        description="Group products in your catalog." footer={<>...</>}>
 *   ...
 * </Modal>
 *
 * Props beyond the basics:
 *   dismissible      false blocks Escape, backdrop and close button (use while saving)
 *   closeOnBackdrop  false keeps Escape and the close button but ignores backdrop clicks
 *   showCloseButton  false hides the X
 *   initialFocusRef  element to focus on open (otherwise [data-autofocus], then the first field)
 *   maxWidth         Tailwind max-width class, default "max-w-lg"
 */

const EXIT_MS = 200;

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

// Shared across instances so stacked modals behave: only the top one handles
// Escape/Tab, and page scrolling unlocks only when the last one closes.
const modalStack = [];
let scrollLocks = 0;
let savedBodyStyles = null;

function lockScroll() {
  if (scrollLocks++ > 0) return;
  const { body, documentElement } = document;
  const scrollbarWidth = window.innerWidth - documentElement.clientWidth;
  savedBodyStyles = { overflow: body.style.overflow, paddingRight: body.style.paddingRight };
  body.style.overflow = 'hidden';
  // Stops the page from shifting sideways when the scrollbar disappears.
  if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`;
}

function unlockScroll() {
  scrollLocks = Math.max(0, scrollLocks - 1);
  if (scrollLocks === 0 && savedBodyStyles) {
    document.body.style.overflow = savedBodyStyles.overflow;
    document.body.style.paddingRight = savedBodyStyles.paddingRight;
    savedBodyStyles = null;
  }
}

function getFocusable(root) {
  return Array.from(root.querySelectorAll(FOCUSABLE)).filter((el) => {
    if (el.closest('[hidden], [inert]')) return false;
    const style = window.getComputedStyle(el);
    return style.display !== 'none' && style.visibility !== 'hidden';
  });
}

export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = 'max-w-lg',
  id,
  dismissible = true,
  closeOnBackdrop = true,
  showCloseButton = true,
  initialFocusRef,
}) {
  const autoId = useId();
  const baseId = id ?? autoId;

  // `mounted` keeps the dialog in the DOM during the exit animation;
  // `visible` drives the transition classes.
  const [mounted, setMounted] = useState(isOpen);
  const [visible, setVisible] = useState(false);

  const dialogRef = useRef(null);
  const bodyRef = useRef(null);
  const triggerRef = useRef(null);

  // Latest props in refs, so an inline `onClose={() => ...}` from the parent
  // never re-runs the effects below (which used to steal focus on every render).
  const onCloseRef = useRef(onClose);
  const dismissibleRef = useRef(dismissible);
  const initialFocusRefRef = useRef(initialFocusRef);
  onCloseRef.current = onClose;
  dismissibleRef.current = dismissible;
  initialFocusRefRef.current = initialFocusRef;

  const requestClose = useCallback(() => {
    if (dismissibleRef.current) onCloseRef.current?.();
  }, []);

  // Open and close lifecycle.
  useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement;
      setMounted(true);
      return undefined;
    }

    setVisible(false);

    const trigger = triggerRef.current;
    triggerRef.current = null;
    if (trigger && trigger.isConnected && typeof trigger.focus === 'function') {
      trigger.focus({ preventScroll: true });
    }

    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const timer = setTimeout(() => setMounted(false), reduceMotion ? 0 : EXIT_MS);
    return () => clearTimeout(timer);
  }, [isOpen]);

  // Wait for one painted frame in the hidden state so the enter transition actually runs.
  useEffect(() => {
    if (!mounted || !isOpen) return undefined;
    let inner;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setVisible(true));
    });
    return () => {
      cancelAnimationFrame(outer);
      if (inner) cancelAnimationFrame(inner);
    };
  }, [mounted, isOpen]);

  // Scroll lock, stacking, Escape, and the Tab focus trap.
  useEffect(() => {
    if (!mounted) return undefined;

    lockScroll();
    modalStack.push(baseId);

    const handleKeyDown = (event) => {
      if (modalStack[modalStack.length - 1] !== baseId || event.defaultPrevented) return;

      if (event.key === 'Escape' && !event.isComposing) {
        event.stopPropagation();
        requestClose();
        return;
      }

      if (event.key === 'Tab' && dialogRef.current) {
        const dialog = dialogRef.current;
        const nodes = getFocusable(dialog);
        if (nodes.length === 0) {
          event.preventDefault();
          dialog.focus();
          return;
        }
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        const active = document.activeElement;
        if (!dialog.contains(active) || (event.shiftKey && (active === first || active === dialog))) {
          event.preventDefault();
          (event.shiftKey ? last : first).focus();
        } else if (!event.shiftKey && active === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      const index = modalStack.lastIndexOf(baseId);
      if (index !== -1) modalStack.splice(index, 1);
      unlockScroll();
    };
  }, [mounted, baseId, requestClose]);

  // Move focus into the dialog once, when it opens.
  useEffect(() => {
    if (!visible || !dialogRef.current) return;
    const target =
      initialFocusRefRef.current?.current ??
      dialogRef.current.querySelector('[data-autofocus]') ??
      (bodyRef.current ? getFocusable(bodyRef.current)[0] : null) ??
      dialogRef.current;
    target.focus({ preventScroll: true });
  }, [visible]);

  if (!mounted || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={closeOnBackdrop ? requestClose : undefined}
        className={`absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-200 ease-out motion-reduce:transition-none ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Dialog: a bottom sheet on phones, centered card from sm up */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? `${baseId}-title` : undefined}
        aria-describedby={description ? `${baseId}-desc` : undefined}
        tabIndex={-1}
        className={`relative flex w-full ${maxWidth} max-h-[calc(100dvh-1.5rem)] flex-col overflow-hidden rounded-t-2xl border border-[#E2E8F0] bg-white shadow-xl transition duration-200 ease-out focus:outline-none motion-reduce:transition-none sm:max-h-[min(90dvh,48rem)] sm:rounded-2xl ${
          visible
            ? 'translate-y-0 opacity-100 sm:scale-100'
            : 'translate-y-6 opacity-0 sm:translate-y-2 sm:scale-[0.97]'
        }`}
      >
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[#E2E8F0] px-6 py-4.5">
          <div className="min-w-0">
            {title && (
              <h2
                id={`${baseId}-title`}
                className="text-[17px] font-semibold tracking-tight text-[#0F172A]"
              >
                {title}
              </h2>
            )}
            {description && (
              <p id={`${baseId}-desc`} className="mt-0.5 text-[13px] text-[#64748B]">
                {description}
              </p>
            )}
          </div>
          {showCloseButton && (
            <button
              type="button"
              onClick={requestClose}
              disabled={!dismissible}
              aria-label="Close dialog"
              className="-mr-1.5 -mt-1 shrink-0 cursor-pointer rounded-lg p-1.5 text-[#94A3B8] transition-colors hover:bg-[#F1F5F9] hover:text-[#0F172A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563EB] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-[#94A3B8]"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Content: scrolls on its own so the header and footer stay in view */}
        <div ref={bodyRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-6">
          {children}
        </div>

        {/* Footer: primary action on top when stacked on phones */}
        {footer && (
          <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-[#E2E8F0] bg-[#F8FAFC] px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:items-center sm:justify-end sm:pb-4 [&>*]:w-full sm:[&>*]:w-auto">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}