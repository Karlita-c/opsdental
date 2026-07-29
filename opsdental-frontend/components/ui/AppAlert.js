'use client';
import { useEffect, useState } from 'react';

export default function AppAlert({ type = 'danger', message, onClose }) {
  const [visible, setVisible] = useState(!!message);

  // Cada vez que llega un mensaje nuevo, vuelve a mostrarse
  useEffect(() => {
    if (message) setVisible(true);
  }, [message]);

  if (!visible || !message) return null;

  const dismiss = () => {
    setVisible(false);
    onClose?.();
  };

  return (
    <div className={`alert alert-${type} alert-dismissible fade show`} role="alert">
      {message}
      <button type="button" className="btn-close" onClick={dismiss} aria-label="Cerrar" />
    </div>
  );
}
