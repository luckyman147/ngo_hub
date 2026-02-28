import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Navbar from '../../../Global_Components/navBar';
import OrgCreateForm from '../components/OrgCreateForm';
import type { OrganizationType } from '../../../types/organization';

export default function OrgCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const type = (searchParams.get('type') as OrganizationType) || 'club';

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="md:ms-64 pt-16 md:pt-6 pb-24 md:pb-0">
        <div className="max-w-xl mx-auto px-4 sm:px-6 py-8">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 text-sm font-medium transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h1 className="text-xl font-bold text-gray-900 mb-1">
              Create {type === 'club' ? 'a Club' : 'an NGO'}
            </h1>
            <p className="text-gray-500 text-sm mb-6">
              Establish your {type} and start building your community.
            </p>

            <OrgCreateForm 
              type={type} 
              onSuccess={(org) => navigate(`/orgs/${org.id}`)} 
            />
          </div>
        </div>
      </main>
    </div>
  );
}
