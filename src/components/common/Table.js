const Table = ({ headers = [], rows = [], emptyMessage = 'No data available' }) => {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#003366', color: 'white' }}>
            {headers.map((h, i) => (
              <th key={i} style={{
                padding: 12, textAlign: 'left', fontSize: 13,
              }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={headers.length} style={{
                padding: 20, textAlign: 'center', color: '#666',
              }}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                {row.map((cell, j) => (
                  <td key={j} style={{ padding: 12, fontSize: 13 }}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;