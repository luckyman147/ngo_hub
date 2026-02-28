import supabase from "../../../utils/supabase";

export interface TeamMeeting {
    id: string;
    team_id: string;
    title: string;
    description: string;
    meeting_date: string;
    meeting_link: string;
    created_by: string;
    created_at: string;
}

export async function getTeamMeetings(teamId: string) {
    const { data, error } = await supabase
        .from("team_meetings")
        .select("*")
        .eq("team_id", teamId)
        .order("meeting_date", { ascending: true });

    // If the backend table does not exist it will fail, so gracefully return empty array or throw
    if (error) {
        if (error.code === '42P01') return []; // undefined table
        throw error;
    }
    return data as TeamMeeting[];
}

export async function createTeamMeeting(payload: {
    team_id: string;
    title: string;
    description?: string;
    meeting_date: string;
    meeting_link?: string;
}) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
        .from("team_meetings")
        .insert([{ ...payload, created_by: user.id }])
        .select()
        .single();

    if (error) throw error;
    return data as TeamMeeting;
}

export async function deleteTeamMeeting(id: string) {
    const { error } = await supabase.from("team_meetings").delete().eq("id", id);
    if (error) throw error;
}
