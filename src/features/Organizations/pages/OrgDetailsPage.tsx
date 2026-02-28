import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Building2, Globe, MapPin } from 'lucide-react';
import { getOrganizationById } from '../services/organization.service';
import Navbar from '../../../Global_Components/navBar';

export default function OrgDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: org, isLoading, error } = useQuery({
    queryKey: ['organization', id],
    queryFn: () => getOrganizationById(id!),
    enabled: !!id,
  });

  if (isLoading) return <div className="p-8 text-center">Loading...</div>;
  if (error || !org) return <div className="p-8 text-center text-red-500">Organization not found</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="md:ms-64 pt-16 md:pt-6 pb-24 md:pb-0">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="h-32 bg-linear-to-r from-blue-600 to-indigo-700" />
            <div className="px-6 pb-8">
              <div className="relative -mt-12 mb-6">
                <div className="h-24 w-24 rounded-2xl bg-white p-1 shadow-lg">
                  {org.logo_url ? (
                    <img src={org.logo_url} alt={org.name} className="h-full w-full rounded-xl object-cover" />
                  ) : (
                    <div className="h-full w-full rounded-xl bg-gray-100 flex items-center justify-center">
                      <Building2 className="w-10 h-10 text-gray-400" />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-6 mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{org.name}</h1>
                  <p className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-2 uppercase tracking-wide">
                    {org.type}
                  </p>
                </div>
                <div className="flex gap-3">
                  {org.website && (
                    <a href={org.website} target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition text-gray-600">
                      <Globe className="w-5 h-5" />
                    </a>
                  )}
                  {org.region && (
                    <div className="flex items-center gap-1.5 text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-xl">
                      <MapPin className="w-4 h-4" />
                      {org.region}
                    </div>
                  )}
                </div>
              </div>

              <div className="prose prose-blue max-w-none">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-2">Our Mission</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{org.mission || 'No mission statement provided.'}</p>
                
                {org.description && (
                  <>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mt-6 mb-2">About Us</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{org.description}</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
