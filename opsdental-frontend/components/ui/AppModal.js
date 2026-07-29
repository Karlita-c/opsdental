'use client';
import { useEffect, useRef } from 'react';

export default function AppModal({ id, title, children, footer, size = '' }) {
  return (
    <div className={`modal fade`} id={id} tabIndex="-1" aria-hidden="true">
      <div className={`modal-dialog ${size ? `modal-${size}` : ''} modal-dialog-centered`}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{title}</h5>
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Cerrar" />
          </div>
          <div className="modal-body">{children}</div>
          {footer && <div className="modal-footer">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
