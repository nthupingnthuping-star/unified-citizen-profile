import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebase'; // Adjust path if needed
import Layout from '../components/common/Layout';

const AnnouncementsPage = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const snap = await getDocs(collection(db, 'announcements'));
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAnnouncements(data.sort((a, b) => b.date - a.date));
      } catch (err) {
        console.error("Using fallback data:", err);
        // Fallback data if Firestore fails or is empty
        setAnnouncements([
          { id: 1, title: 'Tax Filing Deadline Extended', desc: 'The deadline for individual tax returns has been extended to 31 October 2025.', date: '12 Oct 2025', type: 'green' },
          { id: 2, title: 'New Passport Application Process', desc: 'Updated requirements for passport applications. Please bring your birth certificate.', date: '10 Oct 2025', type: 'green' },
          { id: 3, title: 'Public Holiday Notice', desc: 'Government offices will be closed on 25 Oct 2025 for Lesotho Independence Day.', date: '08 Oct 2025', type: 'red' },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchAnnouncements();
  }, []);

  return (
    <Layout title="Announcements">
      <div style={{ maxWidth: 800, margin: '0 auto', paddingTop: 20 }}>
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 32 }}>
          <h2 style={{ margin: '0 0 24px 0', fontSize: 24, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 10 }}>
            📢 Latest Government Announcements
          </h2>
          
          {loading ? (
            <p>Loading announcements...</p>
          ) : announcements.length === 0 ? (
            <p>No announcements right now.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {announcements.map((item) => (
                <div key={item.id} style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: 20 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.type === 'red' ? '#ef4444' : '#10b981', marginTop: 6 }}></div>
                    <div>
                      <h3 style={{ margin: '0 0 6px 0', fontSize: 16, color: '#0f172a' }}>{item.title}</h3>
                      <p style={{ margin: '0 0 8px 0', fontSize: 14, color: '#475569', lineHeight: 1.5 }}>{item.desc}</p>
                      <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>{item.date}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AnnouncementsPage;