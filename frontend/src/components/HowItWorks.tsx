const steps = [
  {
    number: '1',
    title: 'Create your contract',
    description: 'Define the project scope, set milestones with payment amounts, and share with your counterpart. Takes 2 minutes.',
    cta: 'Post in minutes',
  },
  {
    number: '2',
    title: 'Funds are held securely',
    description: 'The client deposits the agreed amount. Funds are locked in the smart contract — untouchable until milestones are approved.',
    cta: 'Zero risk',
  },
  {
    number: '3',
    title: 'Work and get paid',
    description: 'Freelancers submit completed milestones. Clients review and approve. Payment transfers instantly — no delays, no fees.',
    cta: 'Paid in seconds',
  },
];

const ConnectorLine = () => (
  <div className="hidden lg:flex items-center justify-center flex-1 px-6">
    <div className="h-px w-full border-t border-dashed border-white/10" />
  </div>
);

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 md:py-28 bg-surface-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="section-label">Simple process</div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-50">
            Up and running in minutes
          </h2>
          <p className="mt-4 text-lg text-gray-400 max-w-xl mx-auto">
            No complicated onboarding. Just sign in and start protecting your payments today.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row items-start gap-8 lg:gap-0">
          {steps.map((step, index) => (
            <div key={step.number} className="contents">
              <div className="flex flex-col items-center text-center lg:flex-1 group">
                {/* Step badge */}
                <div className="relative mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-surface-50 border border-white/[0.08] shadow-card
                                  flex items-center justify-center text-2xl font-extrabold text-brand-400
                                  group-hover:border-brand-500/40 group-hover:-translate-y-1 transition-all duration-200">
                    {step.number}
                  </div>
                  <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-brand-600 flex items-center justify-center">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                      <path d="M2.5 5L4.5 7L7.5 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>

                <h3 className="text-base font-bold text-gray-100 mb-3">{step.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed max-w-xs">{step.description}</p>
                <span className="inline-block mt-4 text-xs font-semibold text-brand-400 bg-brand-500/10 border border-brand-500/20 px-3 py-1 rounded-full">
                  {step.cta}
                </span>
              </div>

              {index < steps.length - 1 && <ConnectorLine />}
            </div>
          ))}
        </div>

        {/* Testimonial */}
        <div className="mt-20 max-w-2xl mx-auto">
          <div className="feature-card p-8 text-center">
            <div className="flex justify-center mb-4 gap-0.5">
              {[...Array(5)].map((_, i) => (
                <svg key={i} width="18" height="18" viewBox="0 0 20 20" fill="#f59e0b" aria-hidden="true">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <blockquote className="text-base font-medium text-gray-200 italic leading-relaxed">
              "I've been freelancing for 6 years and EscrowHub is the first platform where I actually feel protected.
              Got paid within seconds of my client approving my last milestone."
            </blockquote>
            <div className="mt-6 flex items-center justify-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-500 to-orange-400 flex items-center justify-center text-white font-bold text-sm">
                A
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-200">Alex Rivera</p>
                <p className="text-xs text-gray-500">Full-stack developer · 6 yrs freelancing</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
