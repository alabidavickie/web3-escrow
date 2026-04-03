const Logo = () => (
  <div className="flex items-center gap-2.5">
    <div className="w-7 h-7 rounded-lg bg-hero-gradient flex items-center justify-center">
      <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <path d="M9 1.5L2 5.25V9C2 12.45 5.08 15.67 9 16.5C12.92 15.67 16 12.45 16 9V5.25L9 1.5Z" fill="white" fillOpacity="0.9" />
        <path d="M6.5 9L8.25 10.75L11.75 7.25" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
    <span className="font-bold text-gray-200 text-base">
      Escrow<span className="text-brand-400">Hub</span>
    </span>
  </div>
);

const links = {
  Product:  ['Features', 'Pricing', 'Security', 'Changelog'],
  Company:  ['About', 'Blog', 'Careers', 'Press'],
  Legal:    ['Privacy Policy', 'Terms of Service', 'Cookie Policy'],
  Support:  ['Help Center', 'Contact us', 'Status', 'API Docs'],
};

export default function Footer() {
  return (
    <footer className="bg-surface-200 border-t border-white/[0.06]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Logo />
            <p className="mt-4 text-sm text-gray-500 leading-relaxed max-w-xs">
              Secure milestone-based payments for freelancers and clients worldwide.
            </p>
            <div className="mt-5 flex items-center gap-2">
              {/* Twitter/X */}
              <a href="#" aria-label="Follow us on X"
                className="w-8 h-8 rounded-lg bg-white/5 border border-white/[0.08] flex items-center justify-center text-gray-500 hover:text-gray-200 hover:border-white/20 transition-colors">
                <svg width="13" height="13" viewBox="0 0 14 14" fill="currentColor">
                  <path d="M10.97.25h2.09L8.55 5.91 14 13.75H9.69L6.36 9.3l-3.8 4.45H.47l4.78-5.6L0 .25h4.42l3 3.97L10.97.25Zm-.74 12.1h1.16L3.82 1.43H2.57l7.66 10.92Z" />
                </svg>
              </a>
              {/* LinkedIn */}
              <a href="#" aria-label="Follow us on LinkedIn"
                className="w-8 h-8 rounded-lg bg-white/5 border border-white/[0.08] flex items-center justify-center text-gray-500 hover:text-gray-200 hover:border-white/20 transition-colors">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2zm2-5a2 2 0 110 4 2 2 0 010-4z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(links).map(([section, items]) => (
            <div key={section}>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">{section}</h3>
              <ul className="space-y-3">
                {items.map((item) => (
                  <li key={item}>
                    <a href="#" className="text-sm text-gray-600 hover:text-gray-300 transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-600">&copy; {new Date().getFullYear()} EscrowHub. All rights reserved.</p>
          <p className="text-xs text-gray-600">Trusted by freelancers in 60+ countries · Built on Starknet</p>
        </div>
      </div>
    </footer>
  );
}
