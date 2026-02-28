export interface Club {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  region?: string;
  president_id: string;
  created_at: string;
  updated_at?: string;
  member_count?: number;
  is_member?: boolean;
  my_status?: 'pending' | 'accepted';
  my_role?: ClubRole;
}

export interface ClubRole {
  id: string;
  club_id: string;
  name: string;
  is_president: boolean;
  sort_order: number;
}

export interface ClubMember {
  id: string;
  club_id: string;
  member_id: string;
  club_role_id?: string;
  status: 'pending' | 'accepted';
  is_board_member?: boolean;
  message?: string;
  joined_at?: string;
  created_at: string;
  club_role?: ClubRole;
  member?: { id: string; fullname?: string; email?: string; avatar_url?: string };
}

export interface ClubEvent {
  id: string;
  club_id: string;
  title: string;
  description?: string;
  image_url?: string;
  location?: string;
  start_at: string;
  end_at?: string;
  created_by: string;
  created_at: string;
  club?: { name: string };
}
