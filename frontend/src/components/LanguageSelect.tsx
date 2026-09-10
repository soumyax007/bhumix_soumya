import { LANGUAGE_CODES } from '../constants';

interface LanguageSelectProps {
  sourceLang: string;
  targetLang: string;
  onSourceChange: (code: string) => void;
  onTargetChange: (code: string) => void;
  disabled?: boolean;
}

export default function LanguageSelect({ sourceLang, targetLang, onSourceChange, onTargetChange, disabled }: LanguageSelectProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label className="label">Source Language (document)</label>
        <select
          value={sourceLang}
          onChange={(e) => onSourceChange(e.target.value)}
          disabled={disabled}
          className="input-fo"
        >
          {LANGUAGE_CODES.map((lang) => (
            <option key={lang.code} value={lang.code}>{lang.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">Target Language (translation)</label>
        <select
          value={targetLang}
          onChange={(e) => onTargetChange(e.target.value)}
          disabled={disabled}
          className="input-fo"
        >
          {LANGUAGE_CODES.map((lang) => (
            <option key={lang.code} value={lang.code}>{lang.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
