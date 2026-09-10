import { FIELD_LABELS, FIELD_ORDER } from '../constants';
import type { ExtractableField, ScanFieldResult } from '../types';

interface ExtractedRecordReviewProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>;
  editedValues: Record<string, string>;
  onFieldEdit: (fieldKey: string, value: string) => void;
  notes: string;
  onNotesChange: (notes: string) => void;
  disabled?: boolean;
}

function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.9) return 'text-green-600 bg-green-50';
  if (confidence >= 0.7) return 'text-yellow-600 bg-yellow-50';
  return 'text-red-600 bg-red-50';
}

export default function ExtractedRecordReview({
  data,
  editedValues,
  onFieldEdit,
  notes,
  onNotesChange,
  disabled,
}: ExtractedRecordReviewProps) {
  return (
    <div className="space-y-4">
      {FIELD_ORDER.map((key) => {
        const field = data[key] as ScanFieldResult | undefined;
        if (!field) return null;

        const editedValue = editedValues[key] ?? field.value ?? '';
        const translated = field.translated_value;

        return (
          <div key={key} className="card !p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="label !mb-0">{FIELD_LABELS[key as ExtractableField]}</label>
              <span className={`text-xs font-mono px-2 py-0.5 rounded ${getConfidenceColor(field.confidence)}`}>
                {(field.confidence * 100).toFixed(0)}%
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <span className="text-xs text-gray-500 block mb-1">Original (editable)</span>
                <textarea
                  value={editedValue}
                  onChange={(e) => onFieldEdit(key, e.target.value)}
                  disabled={disabled}
                  rows={1}
                  className="input-fo text-sm resize-none"
                />
              </div>
              <div>
                <span className="text-xs text-gray-500 block mb-1">Translated</span>
                <div className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-700 min-h-[2.25rem]">
                  {translated || '—'}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Notes section */}
      <div className="card !p-4">
        <label className="label">Notes</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <span className="text-xs text-gray-500 block mb-1">Original (editable)</span>
            <textarea
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              disabled={disabled}
              rows={3}
              className="input-fo text-sm"
            />
          </div>
          <div>
            <span className="text-xs text-gray-500 block mb-1">Translated</span>
            <div className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-700 min-h-[5rem]">
              {data.notes_translated || '—'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
