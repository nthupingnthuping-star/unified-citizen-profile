import StaffQueue from './StaffQueue';
import { DEPARTMENTS } from '../../firebase/db';

const StaffTraffic = () => <StaffQueue departmentId={DEPARTMENTS.TRAFFIC} />;
export default StaffTraffic;