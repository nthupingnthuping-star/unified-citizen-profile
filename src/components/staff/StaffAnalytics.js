import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { getDepartmentAnalytics, DEPARTMENT_NAMES } from '../../firebase/db';
import StaffLayout from '../common/StaffLayout';
import Card from '../common/Card';
import Alert from '../common/Alert';
import Table from '../common/Table';

const StaffAnalytics = () => {
  const { profile } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!profile?.department_id) return;
      try {
        const result = await getDepartmentAnalytics(profile.department_id);
        setData(result);
      } catch (err) {
        console.error(err);
        setMessage(`Failed to load analytics: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [profile]);

  const formatHours = (hours) => {
    if (!hours || hours === 0) return '—';
    if (hours < 1) return `${Math.round(hours * 60)} min`;
    if (hours < 24) return `${hours.toFixed(1)} hrs`;
    const days = hours / 24;
    return `${days.toFixed(1)} days`;
  };

  const kpiCard = (label, value, color) => (
    <div
      style={{
        background: 'white',
        border: `1px solid #ddd`,
        borderLeft: `4px solid ${color}`,
        borderRadius: 8,
        padding: 20,
      }}
    >
      <div style={{ fontSize: 12, color: '#888', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 'bold' }}>
        {label}
      </div>
      <div style={{ fontSize: 32, color: color, fontWeight: 'bold', marginTop: 8 }}>
        {value}
      </div>
    </div>
  );

  return (
    <StaffLayout title="Analytics">
      <Alert type="info">
        Real-time analytics for <strong>{DEPARTMENT_NAMES[profile?.department_id]}</strong>.
        Data updates automatically as citizens submit applications.
      </Alert>

      {message && <Alert type="error" onClose={() => setMessage('')}>{message}</Alert>}

      {loading ? (
        <Card>
          <p>Loading analytics...</p>
        </Card>
      ) : !data ? (
        <Card>
          <p style={{ color: '#666' }}>No data available.</p>
        </Card>
      ) : (
        <>
          {/* KPI CARDS */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 15,
              marginTop: 20,
              marginBottom: 30,
            }}
          >
            {kpiCard('Total Applications', data.total, '#003366')}
            {kpiCard('Pending', data.statusCounts.pending, '#ffcc00')}
            {kpiCard('Approved', data.statusCounts.approved, '#006600')}
            {kpiCard('Rejected', data.statusCounts.rejected, '#cc0000')}
          </div>

          {/* PERFORMANCE KPIs */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 15,
              marginBottom: 30,
            }}
          >
            {kpiCard('Approval Rate', `${data.approvalRate.toFixed(0)}%`, '#006600')}
            {kpiCard('Avg Processing Time', formatHours(data.avgProcessingHours), '#003366')}
            {kpiCard('Processed', data.processedCount, '#1a1a5e')}
          </div>

          {/* BAR CHART */}
          <Card title="Applications per Day (Last 14 Days)" style={{ marginBottom: 25 }}>
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer>
                <BarChart data={data.dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="label" fontSize={11} stroke="#666" />
                  <YAxis fontSize={11} stroke="#666" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: 'white',
                      border: '1px solid #ddd',
                      borderRadius: 4,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="count" fill="#003366" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* TWO-COLUMN: Pie + Service table */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 20,
              marginBottom: 25,
            }}
          >
            <Card title="Status Breakdown">
              {data.statusData.length === 0 ? (
                <p style={{ color: '#666', textAlign: 'center', padding: 30 }}>
                  No applications yet.
                </p>
              ) : (
                <div style={{ width: '100%', height: 280 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={data.statusData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        label={({ name, value }) => `${name}: ${value}`}
                        labelLine={true}
                      >
                        {data.statusData.map((entry, index) => (
                          <Cell key={index} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: 'white',
                          border: '1px solid #ddd',
                          borderRadius: 4,
                          fontSize: 12,
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            <Card title="Top Services">
              {data.topServices.length === 0 ? (
                <p style={{ color: '#666', textAlign: 'center', padding: 30 }}>
                  No applications yet.
                </p>
              ) : (
                <Table
                  headers={['Service', 'Applications']}
                  rows={data.topServices.map((s) => [
                    s.name,
                    <strong style={{ color: '#003366' }}>{s.count}</strong>,
                  ])}
                />
              )}
            </Card>
          </div>

          {/* SUMMARY */}
          <div
            style={{
              background: '#e6f0fa',
              padding: 20,
              borderRadius: 8,
              border: '1px solid #b3d4f0',
              marginTop: 25,
            }}
          >
            <strong style={{ color: '#1a1a5e' }}>Insights</strong>
            <ul style={{ margin: '10px 0 0 0', paddingLeft: 20, color: '#333', fontSize: 14, lineHeight: 1.7 }}>
              <li>
                <strong>{data.total}</strong> application{data.total !== 1 ? 's' : ''} received in your department
              </li>
              {data.statusCounts.pending > 0 && (
                <li>
                  <strong>{data.statusCounts.pending}</strong> pending — needs your review
                </li>
              )}
              {data.approvalRate > 0 && (
                <li>
                  Approval rate: <strong>{data.approvalRate.toFixed(1)}%</strong>
                </li>
              )}
              {data.avgProcessingHours > 0 && (
                <li>
                  Average processing time: <strong>{formatHours(data.avgProcessingHours)}</strong>
                </li>
              )}
            </ul>
          </div>
        </>
      )}
    </StaffLayout>
  );
};

export default StaffAnalytics;