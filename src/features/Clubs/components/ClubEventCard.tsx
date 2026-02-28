import { Link } from 'react-router-dom';
import { Calendar, MapPin } from 'lucide-react';
import type { ClubEvent } from '../types';

export default function ClubEventCard({ event }: { event: ClubEvent }) {
  const start = new Date(event.start_at);
  const clubName = (event.club as any)?.name ?? 'Club';

  return (
    <Link
      to={`/clubs/${event.club_id}`}
      className="block rounded-2xl border border-gray-200 bg-white overflow-hidden hover:shadow-lg hover:border-gray-300 transition"
    >
      {event.image_url ? (
        <img
          src={event.image_url}
          alt={event.title}
          className="w-full h-40 object-cover"
        />
      ) : (
        <div className="w-full h-40 bg-gradient-to-br from-[var(--color-myPrimary)]/20 to-[var(--color-mySecondary)]/20 flex items-center justify-center">
          <Calendar className="w-12 h-12 text-gray-400" />
        </div>
      )}
      <div className="p-4">
        <h3 className="font-bold text-gray-900 truncate">{event.title}</h3>
        <p className="text-sm text-gray-500 mt-0.5">{clubName}</p>
        <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 shrink-0" />
          {start.toLocaleDateString()} {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
        {event.location && (
          <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            {event.location}
          </p>
        )}
      </div>
    </Link>
  );
}
