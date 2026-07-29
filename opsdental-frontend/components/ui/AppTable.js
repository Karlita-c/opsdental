export default function AppTable({ headers, rows, emptyMessage = 'Sin registros.' }) {
  return (
    <div className="table-responsive">
      <table className="table table-hover align-middle mb-0">
        <thead className="table-light">
          <tr>
            {headers.map((h, i) => <th key={i} scope="col">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={headers.length} className="text-center text-muted py-4">{emptyMessage}</td>
            </tr>
          ) : rows}
        </tbody>
      </table>
    </div>
  );
}
