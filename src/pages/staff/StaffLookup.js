import StaffLayout from '../../components/common/StaffLayout';
import Card from '../../components/common/Card';
import Alert from '../../components/common/Alert';
import CitizenLookup from '../../components/staff/CitizenLookup';

const StaffLookup = () => {
  return (
    <StaffLayout title="Citizen Search">
      <Alert type="info">
        Search by National ID, Full Name, TIN, Phone number, or Passport number. Every field auto-fills.
      </Alert>

      <Card>
        <CitizenLookup autoFocus />
      </Card>
    </StaffLayout>
  );
};

export default StaffLookup;