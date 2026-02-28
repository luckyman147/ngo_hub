import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../Authentication/auth.context";
import Navbar from "../../../Global_Components/navBar";
import { getGlobalNewsFeed, createPost, addComment, deletePost } from "../services/community.service";
import { uploadPostImage } from "../../../utils/uploadHelpers";
import {
    MessageSquare, ThumbsUp, Share2, Send, Trash2,
    Image as ImageIcon, X, MoreHorizontal, MapPin,
    Smile, Globe, Pin
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

/* ────────────────────────────────────────────────── */
/*  Facebook-style Community Feed                     */
/* ────────────────────────────────────────────────── */
export default function NewsFeed() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // Post composer state
    const [newPostContent, setNewPostContent] = useState("");
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [composerFocused, setComposerFocused] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Comment state
    const [activeCommentPost, setActiveCommentPost] = useState<string | null>(null);
    const [commentContent, setCommentContent] = useState("");

    // Like state (local only – no DB table yet)
    const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

    // Menu state
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    /* ── Queries & Mutations ──────────────────────── */
    const { data: posts = [], isLoading } = useQuery({
        queryKey: ["global-news-feed"],
        queryFn: getGlobalNewsFeed,
    });

    const createPostMutation = useMutation({
        mutationFn: ({ content, image_url }: { content: string; image_url?: string }) =>
            createPost({ club_id: null, author_id: user!.id, content, image_url }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["global-news-feed"] });
            setNewPostContent("");
            setSelectedImage(null);
            setComposerFocused(false);
            toast.success("Post published!");
        },
        onError: (err: any) => toast.error(err.message),
    });

    const commentMutation = useMutation({
        mutationFn: ({ postId, content }: { postId: string; content: string }) =>
            addComment({ post_id: postId, author_id: user!.id, content }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["global-news-feed"] });
            setCommentContent("");
            setActiveCommentPost(null);
        },
        onError: (err: any) => toast.error(err.message),
    });

    const deletePostMutation = useMutation({
        mutationFn: deletePost,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["global-news-feed"] });
            toast.success("Post deleted");
            setOpenMenuId(null);
        },
    });

    /* ── Handlers ─────────────────────────────────── */
    const handleCreatePost = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPostContent.trim() && !selectedImage) return;

        let image_url = undefined;
        if (selectedImage) {
            setUploadingImage(true);
            const uploadResult = await uploadPostImage(selectedImage);
            setUploadingImage(false);
            if (!uploadResult.success) {
                toast.error(uploadResult.error || "Failed to upload image");
                return;
            }
            image_url = uploadResult.url;
        }
        createPostMutation.mutate({ content: newPostContent, image_url });
    };

    const handleComment = (e: React.FormEvent, postId: string) => {
        e.preventDefault();
        if (!commentContent.trim()) return;
        commentMutation.mutate({ postId, content: commentContent });
    };

    const toggleLike = (postId: string) => {
        setLikedPosts((prev) => {
            const next = new Set(prev);
            if (next.has(postId)) next.delete(postId);
            else next.add(postId);
            return next;
        });
    };

    const avatarUrl = user?.user_metadata?.avatar_url;
    const userName = user?.user_metadata?.fullname || user?.email?.split("@")[0] || "User";
    const userInitial = userName.charAt(0).toUpperCase();

    /* ── Render ────────────────────────────────────── */
    return (
        <div className="min-h-screen bg-[#f0f2f5] flex flex-col md:flex-row">
            <Navbar />

            <main className="flex-1 md:ms-64 pt-20 pb-24 md:py-8 px-4 sm:px-6 flex justify-center">
                <div className="w-full max-w-[680px]">

                    {/* ═══════════════════════════════════ */}
                    {/*  POST COMPOSER                      */}
                    {/* ═══════════════════════════════════ */}
                    {user && (
                        <div className="bg-white rounded-xl shadow-sm mb-4 overflow-hidden">
                            <form onSubmit={handleCreatePost}>
                                <div className="p-4 pb-2">
                                    <div className="flex items-start gap-3">
                                        {/* Avatar */}
                                        <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-br from-[var(--color-myPrimary)] to-[var(--color-myAccent)]">
                                            {avatarUrl ? (
                                                <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm">
                                                    {userInitial}
                                                </div>
                                            )}
                                        </div>

                                        {/* Input area */}
                                        <div className="flex-1">
                                            <div
                                                className={`transition-all ${composerFocused ? "" : "cursor-pointer"}`}
                                                onClick={() => !composerFocused && setComposerFocused(true)}
                                            >
                                                {composerFocused ? (
                                                    <textarea
                                                        autoFocus
                                                        value={newPostContent}
                                                        onChange={(e) => setNewPostContent(e.target.value)}
                                                        placeholder={`What's on your mind, ${userName.split(" ")[0]}?`}
                                                        className="w-full min-h-[120px] bg-transparent text-[15px] text-gray-900 placeholder-gray-500 resize-none outline-none leading-relaxed"
                                                    />
                                                ) : (
                                                    <div className="bg-[#f0f2f5] hover:bg-[#e4e6e9] rounded-full px-4 py-2.5 text-[15px] text-gray-500 transition-colors">
                                                        What's on your mind, {userName.split(" ")[0]}?
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Image preview */}
                                    {selectedImage && (
                                        <div className="relative mt-3 ml-[52px] rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                                            <img
                                                src={URL.createObjectURL(selectedImage)}
                                                alt="Preview"
                                                className="w-full max-h-[300px] object-cover"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setSelectedImage(null)}
                                                className="absolute top-2 right-2 w-8 h-8 bg-gray-900/70 hover:bg-gray-900/90 text-white rounded-full flex items-center justify-center transition-all backdrop-blur-sm"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Composer footer */}
                                {composerFocused && (
                                    <div className="border-t border-gray-100">
                                        <div className="px-4 py-3 flex items-center justify-between">
                                            <div className="flex items-center gap-1">
                                                <span className="text-sm font-medium text-gray-700 mr-2">Add to your post</span>
                                                <input
                                                    type="file"
                                                    ref={fileInputRef}
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={(e) => {
                                                        if (e.target.files?.[0]) setSelectedImage(e.target.files[0]);
                                                    }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                                                    title="Photo"
                                                >
                                                    <ImageIcon className="w-5 h-5 text-green-500" />
                                                </button>
                                                <button
                                                    type="button"
                                                    className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                                                    title="Feeling"
                                                >
                                                    <Smile className="w-5 h-5 text-yellow-500" />
                                                </button>
                                                <button
                                                    type="button"
                                                    className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                                                    title="Location"
                                                >
                                                    <MapPin className="w-5 h-5 text-red-400" />
                                                </button>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => { setComposerFocused(false); setNewPostContent(""); setSelectedImage(null); }}
                                                    className="px-4 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="submit"
                                                    disabled={(!newPostContent.trim() && !selectedImage) || createPostMutation.isPending || uploadingImage}
                                                    className="px-6 py-1.5 bg-[var(--color-myPrimary)] text-white text-sm font-semibold rounded-lg hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                                >
                                                    {(createPostMutation.isPending || uploadingImage) ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full" />
                                                            Posting…
                                                        </div>
                                                    ) : "Post"}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Quick action bar (when not focused) */}
                                {!composerFocused && (
                                    <div className="border-t border-gray-100 px-4 py-2 flex items-center gap-1">
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            className="hidden"
                                            accept="image/*"
                                            onChange={(e) => {
                                                if (e.target.files?.[0]) {
                                                    setSelectedImage(e.target.files[0]);
                                                    setComposerFocused(true);
                                                }
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium text-gray-600"
                                        >
                                            <ImageIcon className="w-5 h-5 text-green-500" />
                                            <span>Photo</span>
                                        </button>
                                        <button
                                            type="button"
                                            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium text-gray-600"
                                        >
                                            <Smile className="w-5 h-5 text-yellow-500" />
                                            <span>Feeling</span>
                                        </button>
                                    </div>
                                )}
                            </form>
                        </div>
                    )}

                    {/* ═══════════════════════════════════ */}
                    {/*  FEED                               */}
                    {/* ═══════════════════════════════════ */}
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3">
                            <div className="w-10 h-10 border-4 border-gray-200 border-t-[var(--color-myPrimary)] rounded-full animate-spin" />
                            <p className="text-sm text-gray-500">Loading feed…</p>
                        </div>
                    ) : posts.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-sm text-center py-16 px-6">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#f0f2f5] flex items-center justify-center">
                                <Globe className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">No Posts Yet</h3>
                            <p className="text-gray-500 max-w-sm mx-auto">
                                Be the first to share something with the community! Write a post above to get started.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {posts.map((post: any) => {
                                const isLiked = likedPosts.has(post.id);
                                const isOwner = user?.id === post.author_id;
                                const commentCount = post.comments?.length || 0;
                                const authorName = post.author?.fullname || "Unknown User";
                                const authorAvatar = post.author?.avatar_url;
                                const authorInitial = authorName.charAt(0).toUpperCase();

                                return (
                                    <div
                                        key={post.id}
                                        className="bg-white rounded-xl shadow-sm overflow-hidden"
                                    >
                                        {/* ── Post Header ───────────────── */}
                                        <div className="px-4 pt-4 pb-2 flex items-start justify-between">
                                            <div className="flex gap-3 items-center">
                                                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-br from-[var(--color-myPrimary)] to-[var(--color-myAccent)] shadow-sm">
                                                    {authorAvatar ? (
                                                        <img src={authorAvatar} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm">
                                                            {authorInitial}
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="font-semibold text-[15px] text-gray-900 hover:underline cursor-pointer">
                                                            {authorName}
                                                        </span>
                                                        {post.club && (
                                                            <>
                                                                <span className="text-gray-400 text-sm">▸</span>
                                                                <span className="font-semibold text-[15px] text-[var(--color-myPrimary)] hover:underline cursor-pointer">
                                                                    {post.club.name}
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <span className="text-xs text-gray-500">
                                                            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                                                        </span>
                                                        <span className="text-gray-300">·</span>
                                                        <Globe className="w-3 h-3 text-gray-400" />
                                                        {post.is_pinned && (
                                                            <>
                                                                <span className="text-gray-300">·</span>
                                                                <Pin className="w-3 h-3 text-[var(--color-mySecondary)]" />
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Dropdown menu */}
                                            {isOwner && (
                                                <div className="relative">
                                                    <button
                                                        onClick={() => setOpenMenuId(openMenuId === post.id ? null : post.id)}
                                                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                                                    >
                                                        <MoreHorizontal className="w-5 h-5 text-gray-500" />
                                                    </button>
                                                    {openMenuId === post.id && (
                                                        <div className="absolute right-0 top-10 bg-white rounded-xl shadow-xl border border-gray-100 py-2 w-56 z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                                                            <button
                                                                onClick={() => deletePostMutation.mutate(post.id)}
                                                                className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                                <span>Delete post</span>
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* ── Post Content ──────────────── */}
                                        <div className="px-4 pb-3">
                                            {post.content && (
                                                <p className={`text-gray-900 whitespace-pre-wrap leading-relaxed ${post.content.length < 100 ? "text-2xl" : "text-[15px]"}`}>
                                                    {post.content}
                                                </p>
                                            )}
                                        </div>

                                        {/* ── Post Image ────────────────── */}
                                        {post.image_url && (
                                            <div className="bg-[#f0f2f5] border-y border-gray-100">
                                                <img
                                                    src={post.image_url}
                                                    alt="Post attachment"
                                                    className="w-full h-auto object-cover max-h-[600px] cursor-pointer hover:opacity-95 transition-opacity"
                                                />
                                            </div>
                                        )}

                                        {/* ── Reactions summary ─────────── */}
                                        {(isLiked || commentCount > 0) && (
                                            <div className="px-4 py-2 flex items-center justify-between border-b border-gray-100">
                                                <div className="flex items-center gap-1.5">
                                                    {isLiked && (
                                                        <>
                                                            <div className="w-5 h-5 bg-[var(--color-myPrimary)] rounded-full flex items-center justify-center">
                                                                <ThumbsUp className="w-3 h-3 text-white fill-white" />
                                                            </div>
                                                            <span className="text-sm text-gray-500">You</span>
                                                        </>
                                                    )}
                                                </div>
                                                {commentCount > 0 && (
                                                    <button
                                                        onClick={() => setActiveCommentPost(activeCommentPost === post.id ? null : post.id)}
                                                        className="text-sm text-gray-500 hover:underline"
                                                    >
                                                        {commentCount} {commentCount === 1 ? "comment" : "comments"}
                                                    </button>
                                                )}
                                            </div>
                                        )}

                                        {/* ── Action buttons ────────────── */}
                                        <div className="px-2 py-1 flex items-center border-b border-gray-100">
                                            <button
                                                onClick={() => toggleLike(post.id)}
                                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-colors font-medium text-sm
                                                    ${isLiked
                                                        ? "text-[var(--color-myPrimary)] hover:bg-blue-50"
                                                        : "text-gray-600 hover:bg-gray-100"
                                                    }`}
                                            >
                                                <ThumbsUp className={`w-5 h-5 ${isLiked ? "fill-[var(--color-myPrimary)]" : ""}`} />
                                                <span>Like</span>
                                            </button>
                                            <button
                                                onClick={() => setActiveCommentPost(activeCommentPost === post.id ? null : post.id)}
                                                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors font-medium text-sm"
                                            >
                                                <MessageSquare className="w-5 h-5" />
                                                <span>Comment</span>
                                            </button>
                                            <button
                                                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors font-medium text-sm"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(window.location.href);
                                                    toast.success("Link copied!");
                                                }}
                                            >
                                                <Share2 className="w-5 h-5" />
                                                <span>Share</span>
                                            </button>
                                        </div>

                                        {/* ── Comments Section ──────────── */}
                                        {(activeCommentPost === post.id || commentCount > 0) && (
                                            <div className="px-4 py-3 space-y-3">
                                                {/* Existing comments */}
                                                {post.comments?.map((comment: any) => {
                                                    const commentAuthor = comment.author?.fullname || "Unknown";
                                                    const commentAvatar = comment.author?.avatar_url;
                                                    const commentInitial = commentAuthor.charAt(0).toUpperCase();

                                                    return (
                                                        <div key={comment.id} className="flex gap-2 group">
                                                            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-br from-gray-300 to-gray-400">
                                                                {commentAvatar ? (
                                                                    <img src={commentAvatar} alt="" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center text-white font-bold text-xs">
                                                                        {commentInitial}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="bg-[#f0f2f5] rounded-2xl px-3 py-2 inline-block max-w-[85%]">
                                                                    <span className="font-semibold text-[13px] text-gray-900 block leading-tight">
                                                                        {commentAuthor}
                                                                    </span>
                                                                    <span className="text-[15px] text-gray-800 break-words">
                                                                        {comment.content}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-3 mt-1 ml-3">
                                                                    <button className="text-xs font-semibold text-gray-500 hover:underline">Like</button>
                                                                    <button className="text-xs font-semibold text-gray-500 hover:underline">Reply</button>
                                                                    <span className="text-xs text-gray-400">
                                                                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}

                                                {/* Comment input */}
                                                {user && activeCommentPost === post.id && (
                                                    <form
                                                        onSubmit={(e) => handleComment(e, post.id)}
                                                        className="flex gap-2 items-start"
                                                    >
                                                        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-br from-[var(--color-myPrimary)] to-[var(--color-myAccent)]">
                                                            {avatarUrl ? (
                                                                <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-white font-bold text-xs">
                                                                    {userInitial}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 relative">
                                                            <input
                                                                type="text"
                                                                value={commentContent}
                                                                onChange={(e) => setCommentContent(e.target.value)}
                                                                placeholder="Write a comment…"
                                                                className="w-full bg-[#f0f2f5] rounded-full px-4 py-2 pr-10 text-sm text-gray-900 placeholder-gray-500 outline-none focus:ring-2 focus:ring-[var(--color-myPrimary)]/20 transition-all"
                                                            />
                                                            <button
                                                                type="submit"
                                                                disabled={!commentContent.trim() || commentMutation.isPending}
                                                                className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full text-[var(--color-myPrimary)] hover:bg-blue-50 disabled:opacity-30 transition-all"
                                                            >
                                                                {commentMutation.isPending ? (
                                                                    <div className="w-4 h-4 border-2 border-[var(--color-myPrimary)] border-t-transparent animate-spin rounded-full" />
                                                                ) : (
                                                                    <Send className="w-4 h-4" />
                                                                )}
                                                            </button>
                                                        </div>
                                                    </form>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>

            {/* Click-away listener for menus */}
            {openMenuId && (
                <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
            )}
        </div>
    );
}
