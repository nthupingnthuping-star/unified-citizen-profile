import StaffQueue from './StaffQueue';
import { DEPARTMENTS } from '../../firebase/db';

const StaffPassport = () => <StaffQueue departmentId={DEPARTMENTS.PASSPORT} />;
export default StaffPassport;