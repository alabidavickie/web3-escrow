import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CreateContractForm from '../components/CreateContractForm';

export default function CreateContractPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#09090f]">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-200 transition-colors mb-2"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 12L6 8l4-4" />
            </svg>
            Back to dashboard
          </Link>
        </div>
        <CreateContractForm />
      </main>
      <Footer />
    </div>
  );
}
