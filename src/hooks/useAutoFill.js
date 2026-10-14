import { useEffect, useRef } from 'react';
import { fillFormFromCitizen } from '../utils/autofillMap';

/**
 * Auto-fill a form from the logged-in citizen's profile.
 *
 * Usage:
 *   const [form, setForm] = useState({ ... });
 *   useAutoFill(profile, form, setForm);
 *
 * Options:
 *   useAutoFill(profile, form, setForm, { overwrite: false });
 *
 * Behaviour:
 *   - Runs ONCE per component mount
 *   - Fills only fields that exist in the current form (keys in `form`)
 *   - Only overwrites existing values if `overwrite: true`
 *   - Never runs when `profile` is null/undefined
 */
export function useAutoFill(profile, form, setForm, opts = {}) {
  const didRun = useRef(false);

  useEffect(() => {
    if (!profile) return;
    if (didRun.current) return;

    setForm((prev) => fillFormFromCitizen(prev, profile, opts));
    didRun.current = true;

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);
}

export default useAutoFill;