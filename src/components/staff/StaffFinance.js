import StaffQueue from './StaffQueue';
import { DEPARTMENTS } from '../../firebase/db';

const StaffFinance = () => <StaffQueue departmentId={DEPARTMENTS.FINANCE} />;
export default StaffFinance;