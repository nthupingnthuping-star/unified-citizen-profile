import StaffQueue from './StaffQueue';
import { DEPARTMENTS } from '../../firebase/db';

const StaffPolice = () => <StaffQueue departmentId={DEPARTMENTS.POLICE} />;
export default StaffPolice;