import type { ReactNode } from 'react';

interface Feature {
  icon: ReactNode;
  title: string;
  description: string;
  highlight?: string;
}

const features: Feature[] = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 2L4 6V12C4 16.42 7.56 20.57 12 22C16.44 20.57 20 16.42 20 12V6L12 2Z" fill="currentColor" className="text-brand-500/20" />
        <path d="M9 12L11 14L15 10" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: 'Protected payments',
    description: 'Funds lock in a smart contract the moment a project starts. Neither party can touch the money until milestones are approved.',
    highlight: 'Funds held securely',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3" y="4" width="18" height="3" rx="1.5" fill="#4f46e5" fillOpacity="0.3" />
        <rect x="3" y="10.5" width="12" height="3" rx="1.5" fill="#4f46e5" fillOpacity="0.5" />
        <rect x="3" y="17" width="15" height="3" rx="1.5" fill="#6366f1" fillOpacity="0.7" />
        <circle cx="19" cy="12" r="2.5" fill="#818cf8" />
        <path d="M18 12L19 13L21 11" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: 'Milestone tracking',
    description: "Break any project into clear milestones. Freelancers get paid as they deliver; clients only release funds for reviewed work.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="9" fill="#4f46e5" fillOpacity="0.15" />
        <path d="M13 5L6 13H12L11 19L18 11H12L13 5Z" fill="#818cf8" />
      </svg>
    ),
    title: 'Instant settlements',
    description: "Once you approve a milestone, payment hits the freelancer's wallet in seconds — no waiting 3–5 business days.",
    highlight: 'Avg. 4 seconds',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="9" fill="#4f46e5" fillOpacity="0.15" />
        <path d="M8 10.5C8 8.57 9.79 7 12 7s4 1.57 4 3.5c0 1.58-1.06 2.92-2.56 3.35L13 15h-2l-.44-1.15C8.96 13.42 8 12.08 8 10.5Z" fill="#818cf8" />
        <circle cx="12" cy="17.5" r="1" fill="#818cf8" />
      </svg>
    ),
    title: 'Dispute resolution',
    description: 'Raise a dispute any time. A neutral review process evaluates the evidence and releases funds to the rightful party.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="9" fill="#4f46e5" fillOpacity="0.15" />
        <text x="12" y="16" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#818cf8">0%</text>
      </svg>
    ),
    title: 'Zero platform fees',
    description: 'We charge absolutely nothing. No percentage cuts, no subscriptions. 100% of the agreed payment goes to the freelancer.',
    highlight: 'Always free',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="5" y="11" width="14" height="10" rx="2" fill="#4f46e5" fillOpacity="0.15" />
        <path d="M8 11V7a4 4 0 118 0v4" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" />
        <circle cx="12" cy="16" r="1.5" fill="#818cf8" />
      </svg>
    ),
    title: 'Privacy first',
    description: 'Your payment details and project information stay between you and your counterpart — never sold or shared.',
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-20 md:py-28 bg-[#09090f]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="section-label">Why EscrowHub</div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-50">
            Everything you need to work with confidence
          </h2>
          <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
            Built for freelancers and clients who deserve better than paper contracts and PayPal disputes.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => (
            <div key={f.title} className="feature-card group cursor-default">
              <div className="absolute inset-0 bg-card-gradient opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none" />

              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mb-4">
                  {f.icon}
                </div>
                <h3 className="text-sm font-semibold text-gray-100 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{f.description}</p>
                {f.highlight && (
                  <span className="inline-block mt-3 text-xs font-semibold text-brand-400 bg-brand-500/10 border border-brand-500/20 px-2.5 py-1 rounded-full">
                    {f.highlight}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
