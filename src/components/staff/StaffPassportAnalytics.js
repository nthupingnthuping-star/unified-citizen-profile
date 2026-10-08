import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db, DEPARTMENTS } from '../../firebase/db';
import StaffLayout from '../common/StaffLayout';
import Card from '../common/Card';
import Alert from '../common/Alert';
import Table from '../common/Table';

const StaffPassportAnalytics = () => {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const q = query(collection(db, 'applications'), where('department_id', '==', DEPARTMENTS.PASSPORT));
        const snap = await getDocs(q);
        setApps(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error(err);
        setMessage(`Failed to load analytics: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const statusCounts = { pending: 0, processing: 0, approved: 0, rejected: 0, completed: 0 };
  apps.forEach((a) => { if (statusCounts[a.status] !== undefined) statusCounts[a.status] += 1; });
  const decided = statusCounts.approved + statusCounts.rejected;
  const approvalRate = decided > 0 ? Math.round((statusCounts.approved / decided) * 100) : 0;

  const times = [];
  apps.forEach((a) => {
    const s = a.submitted_at?.toMillis?.();
    const e = a.completed_at?.toMillis?.();
    if (s && e) times.push((e - s) / (1000 * 60 * 60));
  });
  const avgHours = times.length > 0 ? (times.reduce((x, y) => x + y, 0) / times.length).toFixed(1) : null;

  const byService = {};
  apps.forEach((a) => {
    const k = a.service_type || 'Other';
    byService[k] = (byService[k] || 0) + 1;
  });

  const dailyData = [];
  const byDay = {};
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const k = d.toISOString().split('T')[0];
    byDay[k] = 0;
  }
  apps.forEach((a) => {
    const ms = a.submitted_at?.toMillis?.();
    if (ms) {
      const k = new Date(ms).toISOString().split('T')[0];
      if (byDay[k] !== undefined) byDay[k] += 1;
    }
  });
  Object.entries(byDay).forEach(([date, count]) => {
    dailyData.push({
      date,
      label: new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      count,
    });
  });

  const statusData = [
    { name: 'Pending', value: statusCounts.pending, fill: '#ffcc00' },
    { name: 'Processing', value: statusCounts.processing, fill: '#0066cc' },
    { name: 'Approved', value: statusCounts.approved, fill: '#006600' },
    { name: 'Rejected', value: statusCounts.rejected, fill: '#cc0000' },
    { name: 'Completed', value: statusCounts.completed, fill: '#666' },
  ].filter((s) => s.value > 0);

  const kpi = (label, value, color) => (
    <div style={{ background: 'white', border: '1px solid #ddd', borderLeft: `4px solid ${color}`, borderRadius: 8, padding: 20 }}>
      <div style={{ fontSize: 12, color: '#888', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 'bold' }}>{label}</div>
      <div style={{ fontSize: 32, color, fontWeight: 'bold', marginTop: 8 }}>{value}</div>
    </div>
  );

  return (
    <StaffLayout title="Passport & Citizenship — Analytics">
      <Alert type="info">Passport application and citizenship service metrics</Alert>
      {message && <Alert type="error" onClose={() => setMessage('')}>{message}</Alert>}

      {loading ? <Card><p>Loading...</p></Card> : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 15, marginTop: 20, marginBottom: 20 }}>
            {kpi('Total Applications', apps.length, '#003366')}
            {kpi('Pending', statusCounts.pending, '#ffcc00')}
            {kpi('Approved', statusCounts.approved, '#006600')}
            {kpi('Rejected', statusCounts.rejected, '#cc0000')}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 15, marginBottom: 30 }}>
            {kpi('Approval Rate', `${approvalRate}%`, '#006600')}
            {kpi('Avg Processing', avgHours ? `${avgHours} h` : '—', '#003366')}
            {kpi('Unique Services', Object.keys(byService).length, '#1a1a5e')}
          </div>

          <Card title="Applications per Day (Last 14 Days)" style={{ marginBottom: 25 }}>
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer>
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="label" fontSize={11} stroke="#666" />
                  <YAxis fontSize={11} stroke="#666" allowDecimals={false} />
                  <Tooltip contentStyle={{ background: 'white', border: '1px solid #ddd', borderRadius: 4, fontSize: 12 }} />
                  <Bar dataKey="count" fill="#003366" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 25 }}>
            <Card title="Status Breakdown">
              {statusData.length === 0 ? <p style={{ color: '#666', textAlign: 'center', padding: 30 }}>No applications yet.</p> : (
                <div style={{ width: '100%', height: 280 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, value }) => `${name}: ${value}`}>
                        {statusData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: 'white', border: '1px solid #ddd', borderRadius: 4, fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            <Card title="Top Services">
              {Object.keys(byService).length === 0 ? <p style={{ color: '#666', textAlign: 'center', padding: 30 }}>No services yet.</p> : (
                <Table
                  headers={['Service', 'Total']}
                  rows={Object.entries(byService).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, v]) => [k, <strong style={{ color: '#003366' }}>{v}</strong>])}
                />
              )}
            </Card>
          </div>

          <div style={{ marginTop: 20 }}>
            <Link to="/staff/passport" style={{ color: '#0066cc', fontSize: 14 }}>← Back to Passport Staff</Link>
          </div>
        </>
      )}
    </StaffLayout>
  );
};

export default StaffPassportAnalytics;