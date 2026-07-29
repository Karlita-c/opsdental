export default function FormField({
  label,
  name,
  type = 'text',
  required = false,
  errors = {},
  value,
  onChange,
  autoComplete,
}) {
  return (
    <div className="mb-3">
      <label className="form-label fw-medium">
        {label}
        {required && <span className="text-danger ms-1">*</span>}
      </label>
      <input
        name={name}
        type={type}
        className={`form-control ${errors[name] ? 'is-invalid' : ''}`}
        value={value}
        onChange={onChange}
        required={required}
        autoComplete={autoComplete}
      />
      {errors[name] && (
        <div className="invalid-feedback">{errors[name][0]}</div>
      )}
    </div>
  );
}
