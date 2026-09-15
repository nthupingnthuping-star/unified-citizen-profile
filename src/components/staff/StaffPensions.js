import StaffQueue from './StaffQueue';
import { DEPARTMENTS } from '../../firebase/db';

const StaffPensions = () => <StaffQueue departmentId={DEPARTMENTS.PENSIONS} />;
export default StaffPensions;