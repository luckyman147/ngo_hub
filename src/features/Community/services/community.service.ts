import supabase from "../../../utils/supabase";

export interface ClubPost {
    id: string;
    club_id: string | null;
    author_id: string;
    title: string | null;
    content: string;
    image_url: string | null;
    is_pinned: boolean;
    created_at: string;
    updated_at: string;
    author?: {
        fullname: string;
        avatar_url: string | null;
    };
    club?: {
        name: string;
        logo_url: string | null;
    };
    comments?: ClubComment[];
}

export interface ClubComment {
    id: string;
    post_id: string;
    author_id: string;
    content: string;
    created_at: string;
    author?: {
        fullname: string;
        avatar_url: string | null;
    };
}

export async function getGlobalNewsFeed(): Promise<ClubPost[]> {
    const { data, error } = await supabase
        .from("club_posts")
        .select(`
            *,
            author:profiles(fullname, avatar_url),
            club:clubs(name, logo_url),
            comments:club_comments(
                id, content, created_at, author_id,
                author:profiles(fullname, avatar_url)
            )
        `)
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(50);

    if (error) throw error;
    return data as unknown as ClubPost[];
}

export async function getClubNewsFeed(clubId: string): Promise<ClubPost[]> {
    const { data, error } = await supabase
        .from("club_posts")
        .select(`
            *,
            author:profiles(fullname, avatar_url),
            club:clubs(name, logo_url),
            comments:club_comments(
                id, content, created_at, author_id,
                author:profiles(fullname, avatar_url)
            )
        `)
        .eq("club_id", clubId)
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });

    if (error) throw error;
    return data as unknown as ClubPost[];
}

export async function createPost(payload: {
    club_id: string | null;
    author_id: string;
    title?: string;
    content: string;
    image_url?: string;
}) {
    const { data, error } = await supabase
        .from("club_posts")
        .insert([payload])
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function addComment(payload: {
    post_id: string;
    author_id: string;
    content: string;
}) {
    const { data, error } = await supabase
        .from("club_comments")
        .insert([payload])
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function deletePost(postId: string) {
    const { error } = await supabase.from("club_posts").delete().eq("id", postId);
    if (error) throw error;
}

export async function deleteComment(commentId: string) {
    const { error } = await supabase.from("club_comments").delete().eq("id", commentId);
    if (error) throw error;
}
