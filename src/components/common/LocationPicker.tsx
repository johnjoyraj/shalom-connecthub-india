import { MapPin } from 'lucide-react';
import { useMemo } from 'react';
import type { LocationNode } from '../../types/domain';

interface LocationPickerProps {
  locations: readonly LocationNode[];
  value: string | null;
  onChange: (locationId: string | null) => void;
  label?: string;
  includeAllIndiaOption?: boolean;
}

export function LocationPicker({
  locations,
  value,
  onChange,
  label = 'Location (All India)',
  includeAllIndiaOption = true,
}: LocationPickerProps) {
  const states = useMemo(
    () =>
      locations
        .filter((l) => l.level === 'STATE' && l.is_active)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [locations]
  );

  const selectedNode = useMemo(
    () => locations.find((l) => l.id === value) ?? null,
    [locations, value]
  );

  const selectedStateCode = selectedNode?.state_code ?? '';

  const subLocations = useMemo(
    () =>
      locations
        .filter(
          (l) =>
            l.is_active &&
            (l.level === 'DISTRICT' || l.level === 'CITY' || l.level === 'PINCODE' || l.level === 'LOCALITY') &&
            (!selectedStateCode || l.state_code === selectedStateCode)
        )
        .sort((a, b) => a.name.localeCompare(b.name)),
    [locations, selectedStateCode]
  );

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      <div>
        <label className="mb-1 flex items-center gap-1 text-xs font-medium text-slate-700">
          <MapPin className="h-3.5 w-3.5 text-brand-600" />
          <span>{label} — State / UT</span>
        </label>
        <select
          aria-label={`${label} State`}
          value={selectedStateCode}
          onChange={(e) => {
            const code = e.target.value;
            if (!code) {
              onChange(null);
              return;
            }
            const stateNode = states.find((s) => s.state_code === code);
            onChange(stateNode ? stateNode.id : null);
          }}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-brand-600 focus:outline-none"
        >
          {includeAllIndiaOption ? <option value="">All India (28 States &amp; 8 UTs)</option> : null}
          {states.map((st) => (
            <option key={st.id} value={st.state_code ?? ''}>
              {st.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-700">District / City / PIN</label>
        <select
          aria-label={`${label} City or District`}
          value={selectedNode && selectedNode.level !== 'STATE' ? selectedNode.id : ''}
          onChange={(e) => {
            const nextId = e.target.value;
            if (!nextId) {
              const fallbackState = states.find((s) => s.state_code === selectedStateCode);
              onChange(fallbackState ? fallbackState.id : null);
              return;
            }
            onChange(nextId);
          }}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-brand-600 focus:outline-none"
        >
          <option value="">
            {selectedStateCode ? 'Entire State / UT' : 'Select District or City'}
          </option>
          {subLocations.map((loc) => (
            <option key={loc.id} value={loc.id}>
              {loc.name}
              {loc.pincode ? ` — ${loc.pincode}` : ''} ({loc.level.toLowerCase()})
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
