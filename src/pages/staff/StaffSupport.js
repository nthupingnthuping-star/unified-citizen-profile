// src/pages/staff/StaffSupport.js
import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { useAuth } from '../../contexts/AuthContext';
import StaffLayout from '../../components/common/StaffLayout';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';

const StaffSupport = () => {
  const { profile } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState('');

  // Load tickets for this staff member's department
  useEffect(() => {
    const fetchTickets = async () => {
      if (!profile || !profile.department_id) return;
      try {
        const q = query(
          collection(db, 'support_tickets'), 
          where('department_id', '==', profile.department_id)
        );
        const snap = await getDocs(q);
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        // Sort newest first
        data.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
        setTickets(data);
      } catch (err) {
        console.error("Failed to load tickets", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, [profile]);

  const handleReply = async () => {
    if (!replyText.trim() || !selectedTicket) return;
    try {
      const ticketRef = doc(db, 'support_tickets', selectedTicket.id);
      await updateDoc(ticketRef, {
        reply: replyText,
        status: 'replied',
        replied_by: profile.full_name,
        replied_at: serverTimestamp()
      });
      
      // Update local state to show the reply immediately
      setTickets(tickets.map(t => 
        t.id === selectedTicket.id 
          ? { ...t, reply: replyText, status: 'replied', replied_by: profile.full_name } 
          : t
      ));
      
      setSelectedTicket(null);
      setReplyText('');
      alert("Reply sent successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to send reply.");
    }
  };

  return (
    <StaffLayout title="Department Support Inbox">
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        
        {selectedTicket ? (
          <Card>
            <button onClick={() => setSelectedTicket(null)} style={{ background: 'transparent', border: 'none', color: '#0055aa', cursor: 'pointer', marginBottom: 16, fontWeight: 'bold' }}>
              ← Back to Inbox
            </button>
            <h3 style={{ color: '#003366', marginTop: 0 }}>Question from {selectedTicket.citizen_name}</h3>
            <p style={{ color: '#666', fontSize: 13 }}>Email: {selectedTicket.citizen_email}</p>
            
            <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 20 }}>
              <strong>Question:</strong>
              <p style={{ margin: '8px 0 0 0' }}>{selectedTicket.message}</p>
            </div>

            {selectedTicket.reply ? (
              <div style={{ background: '#dcfce7', padding: 16, borderRadius: 8, border: '1px solid #bbf7d0' }}>
                <strong>Replied by {selectedTicket.replied_by}:</strong>
                <p style={{ margin: '8px 0 0 0' }}>{selectedTicket.reply}</p>
              </div>
            ) : (
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', fontSize: 13, marginBottom: 8 }}>Your Reply:</label>
                <textarea 
                  rows={4}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  style={{ width: '100%', padding: 12, border: '1px solid #ccc', borderRadius: 6, marginBottom: 12 }}
                  placeholder="Type your response to the citizen..."
                />
                <button onClick={handleReply} style={{ background: '#003366', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold' }}>
                  Send Reply
                </button>
              </div>
            )}
          </Card>
        ) : (
          <Card>
            <h2 style={{ color: '#003366', marginTop: 0 }}>Department Support Inbox</h2>
            <p style={{ color: '#666' }}>Questions sent directly to your department by citizens.</p>

            {loading ? (
              <p>Loading tickets...</p>
            ) : tickets.length === 0 ? (
              <p style={{ color: '#666', fontStyle: 'italic' }}>No questions have been asked yet.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#64748b' }}>
                    <th style={{ padding: 12 }}>Date</th>
                    <th style={{ padding: 12 }}>Citizen</th>
                    <th style={{ padding: 12 }}>Question</th>
                    <th style={{ padding: 12 }}>Status</th>
                    <th style={{ padding: 12 }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map(t => (
                    <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: 12, color: '#666' }}>{t.createdAt?.toDate?.().toLocaleDateString() || 'Just now'}</td>
                      <td style={{ padding: 12, fontWeight: 'bold' }}>{t.citizen_name}</td>
                      <td style={{ padding: 12, color: '#333' }}>{t.message.substring(0, 40)}...</td>
                      <td style={{ padding: 12 }}>
                        <Badge color={t.status === 'open' ? 'yellow' : 'green'}>{t.status}</Badge>
                      </td>
                      <td style={{ padding: 12 }}>
                        <button onClick={() => setSelectedTicket(t)} style={{ background: '#0055aa', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer' }}>
                          Open
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        )}
      </div>
    </StaffLayout>
  );
};

export default StaffSupport;