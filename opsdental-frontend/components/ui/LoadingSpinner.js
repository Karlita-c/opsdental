export default function LoadingSpinner({ text = 'Cargando...' }) {
  return (
    <div className="d-flex justify-content-center align-items-center py-5">
      <div className="spinner-border text-primary me-2" role="status" aria-hidden="true" />
      <span className="text-muted">{text}</span>
    </div>
  );
}
