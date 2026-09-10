import type { FlowStep } from '../types';

interface StepperProps {
  currentStep: FlowStep;
}

const STEPS = [
  { label: 'Language & Upload', icon: '1' },
  { label: 'Scanning', icon: '2' },
  { label: 'Translation', icon: '3' },
  { label: 'Review & Submit', icon: '4' },
];

function getStepIndex(step: FlowStep): number {
  switch (step) {
    case 'idle': return 0;
    case 'scanning': return 1;
    case 'translating': return 2;
    case 'review':
    case 'submitting': return 3;
    case 'submitted': return 4;
  }
}

export default function Stepper({ currentStep }: StepperProps) {
  const activeIndex = getStepIndex(currentStep);

  return (
    <div className="flex items-center justify-between w-full max-w-2xl mx-auto mb-8">
      {STEPS.map((step, i) => {
        const isComplete = i < activeIndex;
        const isActive = i === activeIndex;
        
        return (
          <div key={step.label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all ${
                  isComplete
                    ? 'bg-fo-accent-500 border-fo-accent-500 text-white'
                    : isActive
                    ? 'border-fo-accent-500 text-fo-accent-600 bg-fo-accent-50 ring-4 ring-fo-accent-100'
                    : 'border-gray-300 text-gray-400 bg-white'
                }`}
              >
                {isComplete ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  step.icon
                )}
              </div>
              <span className={`mt-2 text-xs font-medium text-center whitespace-nowrap ${
                isComplete || isActive ? 'text-fo-accent-700' : 'text-gray-400'
              }`}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-3 mt-[-1.25rem] ${
                i < activeIndex ? 'bg-fo-accent-500' : 'bg-gray-200'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
