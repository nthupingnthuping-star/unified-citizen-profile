import Layout from '../components/common/Layout';

const HelpCenterPage = () => {
  return (
    <Layout title="Help Center">
      <div style={{ maxWidth: 800, margin: '0 auto', paddingTop: 20 }}>
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 32, marginBottom: 24 }}>
          <h2 style={{ margin: '0 0 8px 0', fontSize: 24, color: '#0f172a' }}>How can we help you?</h2>
          <p style={{ color: '#475569', marginBottom: 24 }}>Find answers to common questions or contact our support team.</p>
          
          <div style={{ background: '#f0f9ff', padding: 24, borderRadius: 12, border: '1px solid #e0f2fe' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: 18, color: '#0f172a' }}>Contact Support</h3>
            <p style={{ margin: '0 0 8px 0', fontSize: 14, color: '#334155' }}><strong>Phone:</strong> +266 2222 0000 (Mon-Fri, 8am - 4pm)</p>
            <p style={{ margin: '0 0 8px 0', fontSize: 14, color: '#334155' }}><strong>Email:</strong> support@ucps.gov.ls</p>
            <p style={{ margin: 0, fontSize: 14, color: '#334155' }}><strong>WhatsApp:</strong> +266 5800 0000</p>
          </div>
        </div>

        <h3 style={{ fontSize: 20, color: '#0f172a', marginBottom: 16 }}>Frequently Asked Questions</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Faq title="How do I verify my identity?" answer="You must visit a Home Affairs office with your National ID. Once they verify you, you can access all digital services." />
          <Faq title="I forgot my password. What do I do?" answer="Click 'Logout', then 'Login' and use the 'Forgot Password' link to reset it via email." />
          <Faq title="Can I change my profile photo?" answer="For security reasons, photos can only be uploaded once. If you need it changed, please visit Home Affairs." />
          <Faq title="How do I pay for a service?" answer="After submitting an application, you will get a Payment Reference. Take this to any listed bank or use M-Pesa/EcoCash." />
        </div>
      </div>
    </Layout>
  );
};

const Faq = ({ title, answer }) => (
  <details style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16, cursor: 'pointer' }}>
    <summary style={{ fontWeight: 700, color: '#0f172a', fontSize: 15 }}>{title}</summary>
    <p style={{ margin: '12px 0 0 0', color: '#475569', fontSize: 14, lineHeight: 1.6 }}>{answer}</p>
  </details>
);

export default HelpCenterPage;