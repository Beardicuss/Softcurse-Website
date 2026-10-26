export default function DataTable({ columns, rows, rowKey = 'id', onRowClick, emptyTitle, emptyText }) {
  if (!rows.length) return <div className="empty-state"><strong>{emptyTitle}</strong><span>{emptyText}</span></div>
  return <div className="data-table-wrap">
    <table className="data-table">
      <thead><tr>{columns.map(column => <th key={column.key} scope="col">{column.label}</th>)}</tr></thead>
      <tbody>{rows.map(row => <tr key={row[rowKey]} tabIndex={onRowClick ? 0 : undefined} onClick={() => onRowClick?.(row)} onKeyDown={event => { if (onRowClick && (event.key === 'Enter' || event.key === ' ')) onRowClick(row) }}>
        {columns.map(column => <td key={column.key} data-label={column.label}>{column.render ? column.render(row) : row[column.key]}</td>)}
      </tr>)}</tbody>
    </table>
  </div>
}

