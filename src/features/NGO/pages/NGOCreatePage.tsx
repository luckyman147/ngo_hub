import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import Navbar from '../../../Global_Components/navBar';
import NGOCreateForm from '../components/NGOCreateForm';

export default function NGOCreatePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="md:ms-64 pt-16 md:pt-6 pb-24 md:pb-0">
      <header className="border-b border-gray-100 bg-white px-4 py-4 md:px-6">
        <div className="mx-auto flex max-w-2xl items-center gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50 focus:ring-2 focus:ring-[var(--color-myPrimary)]/20"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Create NGO Profile</h1>
            <p className="text-sm text-gray-500">Set up your organization on Activist Hub</p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-8 md:px-6">
        <NGOCreateForm
          onSuccess={(ngo) => {
            toast.success('NGO profile created successfully');
            navigate(`/ngos/${ngo.id}`);
          }}
        />
      </div>
      </main>
    </div>
  );
}
