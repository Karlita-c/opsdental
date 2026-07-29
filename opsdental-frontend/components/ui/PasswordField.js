'use client';
import { useState } from 'react';

export default function PasswordField({
  label,
  name,
  required = false,
  errors = {},
  value,
  onChange,
  autoComplete = 'new-password',
}) {
  const [show, setShow] = useState(false);

  return (
    <div className="mb-3">
      <label className="form-label fw-medium">
        {label}
        {required && <span className="text-danger ms-1">*</span>}
      </label>
      <div className="input-group">
        <input
          name={name}
          type={show ? 'text' : 'password'}
          className={`form-control ${errors[name] ? 'is-invalid' : ''}`}
          value={value}
          onChange={onChange}
          required={required}
          autoComplete={autoComplete}
        />
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={() => setShow(s => !s)}
          tabIndex={-1}
          title={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
          <i className={`bi bi-${show ? 'eye-slash' : 'eye'}`} />
        </button>
        {errors[name] && (
          <div className="invalid-feedback">{errors[name][0]}</div>
        )}
      </div>
    </div>
  );
}
