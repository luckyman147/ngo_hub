import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Building2, Users, Plus } from 'lucide-react';
import Navbar from '../../../Global_Components/navBar';
import { getClubs } from '../services/clubs.service';
import { useAuth } from '../../Authentication/auth.context';

export default function ClubsPage() {
  const { user } = useAuth();
  const { data: clubs = [], isLoading } = useQuery({
    queryKey: ['clubs'],
    queryFn: getClubs,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="md:ms-64 pt-16 md:pt-6 pb-24 md:pb-0">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Clubs</h1>
              <p className="text-gray-500 mt-1">Browse and join clubs</p>
            </div>
            {user && (
              <Link
                to="/clubs/new"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--color-myPrimary)] text-white font-semibold text-sm hover:opacity-90 transition"
              >
                <Plus className="w-4 h-4" />
                Create Club
              </Link>
            )}
          </div>

          {isLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-40 rounded-2xl bg-gray-200 animate-pulse" />
              ))}
            </div>
          ) : clubs.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center">
              <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">No clubs yet</p>
              <p className="text-sm text-gray-500 mt-1">Be the first to create one</p>
              {user && (
                <Link
                  to="/clubs/new"
                  className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl bg-[var(--color-myPrimary)] text-white font-semibold text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Create Club
                </Link>
              )}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {clubs.map((club) => (
                <Link
                  key={club.id}
                  to={`/clubs/${club.id}`}
                  className="block rounded-2xl border border-gray-200 bg-white p-6 hover:shadow-lg hover:border-gray-300 transition"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                      <Building2 className="w-6 h-6 text-[var(--color-myPrimary)]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="font-bold text-gray-900 truncate">{club.name}</h2>
                      {club.description && (
                        <p className="text-sm text-gray-500 line-clamp-2 mt-0.5">{club.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-3">
                        <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                          <Users className="w-3.5 h-3.5" />
                          {club.member_count ?? 0} members
                        </span>
                        {club.my_status === 'accepted' && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-xs font-medium">
                            Member
                          </span>
                        )}
                        {club.my_status === 'pending' && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-xs font-medium">
                            Pending
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
