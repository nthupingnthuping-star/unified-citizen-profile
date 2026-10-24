import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getDepartmentAnalytics, DEPARTMENTS } from '../../firebase/db';
import { assetPath } from '../../utils/assetPath';
import StaffLayout from '../common/StaffLayout';
import '../../styles/module.css';

const StaffDashboard = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const departmentId = profile?.department_id || DEPARTMENTS.FINANCE;
  const departmentName = profile?.department_name || 'Ministry of Finance / RSL';

  useEffect(() => {
    const fetchStats = async () => {
      if (!profile) return;
      try {
        const data = await getDepartmentAnalytics(departmentId);
        setStats(data);
      } catch (err) {
        setStats({ pending: 0, approved: 0, total: 0 });
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [profile, departmentId]);

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0].charAt(0);
    return parts[0].charAt(0) + parts[parts.length - 1].charAt(0);
  };

  const recentApps = [
    { id: 'APP-2025-00123', service: 'Tax Clearance Certificate', date: '12 Oct 2025', status: 'Approved', color: '#dcfce7', textColor: '#166534' },
    { id: 'APP-2025-00122', service: 'Passport Application', date: '08 Oct 2025', status: 'In Progress', color: '#dbeafe', textColor: '#1e40af' },
    { id: 'APP-2025-00121', service: 'Business Registration', date: '03 Oct 2025', status: 'Pending', color: '#fef3c7', textColor: '#92400e' },
    { id: 'APP-2025-00120', service: "Driver's License Renewal", date: '28 Sep 2025', status: 'Approved', color: '#dcfce7', textColor: '#166534' },
    { id: 'APP-2025-00119', service: 'Birth Certificate Request', date: '20 Sep 2025', status: 'Completed', color: '#f1f5f9', textColor: '#475569' },
  ];

  return (
    <StaffLayout title="Dashboard">
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        
        {/* LEFT COLUMN */}
        <div style={{ flex: '2 1 750px', minWidth: 0 }}>
          
          {/* Hero Card */}
          <div style={{ position: 'relative', background: '#ffffff', borderRadius: 16, overflow: 'hidden', marginBottom: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', minHeight: 200 }}>
            <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${assetPath('/assets/images/better-lesotho.png')})`, backgroundSize: 'cover', backgroundPosition: 'center right' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0.95) 40%, rgba(255,255,255,0) 100%)' }} />
            
            <div style={{ position: 'relative', padding: 32, display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center' }}>
              <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'linear-gradient(135deg, #0b2545 0%, #3b82f6 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 'bold', flexShrink: 0, boxShadow: '0 4px 12px rgba(11, 37, 69, 0.2)' }}>
                {getInitials(profile?.full_name)}
              </div>
              <div style={{ flex: 1, minWidth: 280 }}>
                <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Welcome Back</div>
                <h2 style={{ margin: 0, fontSize: 28, color: '#0f172a', fontWeight: 800 }}>{profile?.full_name}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#10b981', fontWeight: 600 }}><span style={{ fontSize: 14 }}>👤</span> Staff Portal</span>
                  <span style={{ color: '#cbd5e1' }}>•</span>
                  <span style={{ fontSize: 13, color: '#475569', fontWeight: 600 }}>{departmentName}</span>
                </div>
                <div style={{ display: 'flex', gap: 24, marginTop: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>📅</div>
                    <div>
                      <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Employee ID</div>
                      <div style={{ fontSize: 13, color: '#0f172a', fontWeight: 700 }}>MF-2025-0048</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>✉️</div>
                    <div>
                      <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Email</div>
                      <div style={{ fontSize: 13, color: '#0f172a', fontWeight: 700 }}>{profile?.email}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>📞</div>
                    <div>
                      <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Phone</div>
                      <div style={{ fontSize: 13, color: '#0f172a', fontWeight: 700 }}>{profile?.phone_number || '+266 5800 0000'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Your Services & Stats */}
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 24 }}>
            <div style={{ flex: '2 1 400px', background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 18, color: '#0f172a', fontWeight: 800 }}>Your Services</h3>
                <Link to="/staff/queue" style={{ fontSize: 13, color: '#3b82f6', fontWeight: 600, textDecoration: 'none' }}>View All Services →</Link>
              </div>
              <p style={{ margin: '0 0 20px 0', fontSize: 13, color: '#64748b' }}>Access government services and manage your applications.</p>
              <Link to="/staff/queue" style={{ display: 'flex', alignItems: 'center', gap: 16, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16, textDecoration: 'none', transition: 'all 0.2s ease' }}>
                <div style={{ width: 44, height: 44, borderRadius: 8, background: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📄</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Application Queue</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>View and manage your submitted applications.</div>
                </div>
                <span style={{ color: '#3b82f6', fontSize: 18 }}>→</span>
              </Link>
            </div>

            <div style={{ flex: '3 1 500px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {[
                { label: 'Pending Applications', value: stats?.pending || 0, color: '#3b82f6', bg: '#eff6ff', link: '/staff/queue' },
                { label: 'Approved Applications', value: stats?.approved || 0, color: '#10b981', bg: '#ecfdf5', link: '/staff/queue' },
                { label: 'Upcoming Appointment', value: 1, color: '#8b5cf6', bg: '#f5f3ff', link: '/staff/appointments' },
                { label: 'New Notifications', value: 3, color: '#f59e0b', bg: '#fffbeb', link: '/notifications' },
              ].map((stat, i) => (
                <Link key={i} to={stat.link} style={{ textDecoration: 'none', background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: stat.bg, color: stat.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 16 }}>📄</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>{stat.value}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', flex: 1 }}>{stat.label}</div>
                  <div style={{ fontSize: 11, color: stat.color, fontWeight: 700, marginTop: 16 }}>View →</div>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Applications */}
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24, marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, color: '#0f172a', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ color: '#3b82f6' }}>📄</span> Recent Applications</h3>
              <Link to="/staff/queue" style={{ fontSize: 13, color: '#3b82f6', fontWeight: 600, textDecoration: 'none' }}>View All →</Link>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                  <th style={{ padding: '12px 8px', fontWeight: 600 }}>Application No.</th>
                  <th style={{ padding: '12px 8px', fontWeight: 600 }}>Service</th>
                  <th style={{ padding: '12px 8px', fontWeight: 600 }}>Date Submitted</th>
                  <th style={{ padding: '12px 8px', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '12px 8px' }}></th>
                </tr>
              </thead>
              <tbody>
                {recentApps.map((app, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '16px 8px', fontWeight: 600, color: '#0f172a' }}>{app.id}</td>
                    <td style={{ padding: '16px 8px', color: '#334155' }}>{app.service}</td>
                    <td style={{ padding: '16px 8px', color: '#64748b' }}>{app.date}</td>
                    <td style={{ padding: '16px 8px' }}><span style={{ background: app.color, color: app.textColor, padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{app.status}</span></td>
                    <td style={{ padding: '16px 8px', textAlign: 'right', color: '#3b82f6', fontWeight: 'bold' }}>›</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ flex: '1 1 320px', maxWidth: 400 }}>
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24, marginBottom: 24 }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: 18, color: '#0f172a', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ color: '#3b82f6' }}>⚡</span> Quick Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <QuickAction title="Book Appointment" desc="Schedule a government service" icon="📅" to="/staff/appointments" />
              <QuickAction title="Verify Identity" desc="Manage your identity information" icon="🪪" to="/staff/identity" />
              <QuickAction title="Search Citizen Records" desc="Access public records" icon="🔍" to="/staff/lookup" />
              <QuickAction title="Update My Profile" desc="Keep your information current" icon="👤" to="/staff/profile" />
              <QuickAction title="View Analytics" desc="Track your service usage" icon="📊" to="/staff/analytics" />
              <QuickAction title="Help & Support" desc="Get assistance and FAQs" icon="🎧" to="/help" />
            </div>
          </div>

          <div style={{ background: '#f0f9ff', borderRadius: 16, border: '1px solid #e0f2fe', padding: 20, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>ℹ️</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Stay informed</div>
              <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.5, marginBottom: 8 }}>Check your notifications regularly for updates on your applications, appointments and important announcements.</div>
              <Link to="/notifications" style={{ fontSize: 12, color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>View Notifications →</Link>
            </div>
          </div>
        </div>

      </div>
    </StaffLayout>
  );
};

const QuickAction = ({ title, desc, icon, to }) => (
  <Link to={to} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease', textDecoration: 'none' }}>
    <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{icon}</div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{title}</div>
      <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{desc}</div>
    </div>
    <span style={{ color: '#3b82f6', fontSize: 14 }}>→</span>
  </Link>
);

export default StaffDashboard;