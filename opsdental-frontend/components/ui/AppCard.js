export default function AppCard({ title, subtitle, children, footer, className = '' }) {
  return (
    <div className={`card shadow-sm h-100 ${className}`}>
      {(title || subtitle) && (
        <div className="card-header">
          {title && <h5 className="card-title mb-0">{title}</h5>}
          {subtitle && <small className="text-muted">{subtitle}</small>}
        </div>
      )}
      <div className="card-body">{children}</div>
      {footer && <div className="card-footer text-muted small">{footer}</div>}
    </div>
  );
}
