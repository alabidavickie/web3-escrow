import SignInButton from './SignInButton';

const stats = [
  { value: '$2.4M+', label: 'Protected payments' },
  { value: '12,000+', label: 'Contracts completed' },
  { value: '0%', label: 'Platform fees' },
];

const AvatarGroup = () => (
  <div className="flex items-center gap-3">
    <div className="flex -space-x-2">
      {[
        { color: 'bg-pink-500',   label: 'A' },
        { color: 'bg-amber-500',  label: 'J' },
        { color: 'bg-teal-500',   label: 'M' },
        { color: 'bg-blue-500',   label: 'S' },
      ].map((a, i) => (
        <div key={i} className={`w-8 h-8 rounded-full ${a.color} border-2 border-[#09090f] flex items-center justify-center text-white text-xs font-bold`}>
          {a.label}
        </div>
      ))}
    </div>
    <p className="text-sm text-gray-400">
      <span className="font-semibold text-gray-200">4,200+</span> freelancers trust us
    </p>
  </div>
);

const PaymentCard = () => (
  <div className="bg-surface-200 border border-white/[0.08] rounded-2xl shadow-card p-5 w-72 animate-slide-up">
    <div className="flex items-center justify-between mb-4">
      <div>
        <p className="text-xs text-gray-500 font-medium">Milestone payment</p>
        <p className="text-2xl font-bold text-gray-100 mt-0.5">$1,200.00</p>
      </div>
      <div className="w-10 h-10 rounded-xl bg-green-500/15 border border-green-500/20 flex items-center justify-center">
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" fill="#22c55e" />
        </svg>
      </div>
    </div>

    <div className="space-y-2.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">Status</span>
        <span className="inline-flex items-center gap-1.5 text-green-400 font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          Approved &amp; paid
        </span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">Transaction fee</span>
        <span className="font-semibold text-gray-200">$0.00</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">You receive</span>
        <span className="font-bold text-brand-400">$1,200.00</span>
      </div>
    </div>

    <div className="mt-4 pt-4 border-t border-white/[0.06] flex items-center gap-2">
      <div className="w-6 h-6 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400 font-bold text-xs">
        J
      </div>
      <p className="text-xs text-gray-500">
        Paid by <span className="font-medium text-gray-300">Jordan K.</span> · just now
      </p>
    </div>
  </div>
);

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-[#09090f] pt-16 pb-24 md:pt-24 md:pb-32">
      {/* Subtle background glow */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-brand-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">

          {/* Left copy */}
          <div className="flex-1 text-center lg:text-left animate-fade-in">
            <div className="section-label">Free for everyone</div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-50 leading-tight text-balance">
              Get paid on time,{' '}
              <span className="bg-clip-text text-transparent bg-hero-gradient">
                every time.
              </span>
            </h1>
            <p className="mt-6 text-lg text-gray-400 leading-relaxed max-w-xl mx-auto lg:mx-0">
              Milestone-based escrow that protects both freelancers and clients.
              Funds lock the moment a project starts — released only when work is approved.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              <SignInButton variant="dark" size="lg" />
              <a href="#how-it-works" className="btn-secondary">
                See how it works
              </a>
            </div>

            <div className="mt-10 flex justify-center lg:justify-start">
              <AvatarGroup />
            </div>
          </div>

          {/* Right card */}
          <div className="flex-shrink-0 hidden md:flex justify-center">
            <PaymentCard />
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-20 grid grid-cols-3 gap-8 max-w-2xl mx-auto lg:mx-0">
          {stats.map((s) => (
            <div key={s.label} className="text-center lg:text-left">
              <p className="text-2xl sm:text-3xl font-extrabold text-gray-50">{s.value}</p>
              <p className="mt-1 text-sm text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
