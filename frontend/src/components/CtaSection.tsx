import SignInButton from './SignInButton';

export default function CtaSection() {
  return (
    <section className="py-20 md:py-28 bg-[#09090f]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-surface-200 px-8 py-16 md:px-16 text-center shadow-card">
          {/* Glow */}
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[200px] bg-brand-600/10 rounded-full blur-[80px]" />
          </div>

          {/* Gradient top border line */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-px bg-hero-gradient opacity-60" />

          <div className="relative">
            <div className="section-label">Start today — it's free</div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-50 text-balance">
              Stop chasing invoices.<br className="hidden sm:block" /> Start getting paid.
            </h2>
            <p className="mt-4 text-gray-400 text-lg max-w-xl mx-auto">
              Join thousands of freelancers and clients who've made payment disputes a thing of the past.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <SignInButton variant="dark" size="lg" />
              <a href="#features"
                className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-200 font-semibold text-sm transition-colors">
                See all features
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </div>

            <p className="mt-6 text-gray-600 text-xs">
              No credit card required · Zero transaction fees · Cancel any time
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
