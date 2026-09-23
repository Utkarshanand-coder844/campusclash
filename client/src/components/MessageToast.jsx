import React, { useEffect } from 'react';

export const MessageToast = ({ toast, onClose, onOpenChat }) => {
  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => {
      onClose();
    }, 7000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        position: 'fixed',
        top: '75px',
        right: '20px',
        zIndex: 9999,
        maxWidth: '380px',
        width: 'calc(100vw - 40px)',
        background: 'linear-gradient(135deg, rgba(16, 26, 42, 0.96), rgba(8, 14, 24, 0.98))',
        border: '1px solid rgba(0, 242, 254, 0.45)',
        boxShadow: '0 16px 40px rgba(0, 0, 0, 0.55), 0 0 25px rgba(0, 242, 254, 0.2)',
        backdropFilter: 'blur(16px)',
        borderRadius: '16px',
        padding: '1rem 1.15rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.6rem',
        color: '#fff'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
          <span style={{ fontSize: '1.3rem', display: 'flex', alignItems: 'center' }}>💬</span>
          <div>
            <strong style={{ color: '#fff', fontSize: '0.94rem', display: 'block' }}>
              {toast.sender_name || 'A player'} messaged you
            </strong>
            <span style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)' }}>Just now</span>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '1.3rem',
            lineHeight: 1,
            padding: '0.2rem 0.4rem',
            borderRadius: '4px'
          }}
          aria-label="Dismiss message notification"
        >
          ×
        </button>
      </div>

      <div
        style={{
          background: 'rgba(255, 255, 255, 0.04)',
          borderRadius: '8px',
          padding: '0.55rem 0.75rem',
          fontSize: '0.86rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.45,
          maxHeight: '65px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          borderLeft: '3px solid var(--accent-cyan)'
        }}
      >
        "{toast.body}"
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.1rem' }}>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          style={{ fontSize: '0.78rem', padding: '0.3rem 0.65rem' }}
          onClick={onClose}
        >
          Dismiss
        </button>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          style={{ fontSize: '0.78rem', padding: '0.3rem 0.85rem' }}
          onClick={() => {
            onOpenChat(toast.sender_id);
            onClose();
          }}
        >
          Open Chat →
        </button>
      </div>
    </div>
  );
};
