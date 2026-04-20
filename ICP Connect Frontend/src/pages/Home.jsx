import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ImageIcon, 
  Video, 
  Calendar, 
  MoreHorizontal, 
  ThumbsUp, 
  MessageSquare, 
  Share2, 
  Plus, 
  X,
  Send,
  Trash2,
  Clock,
  MoreVertical,
  Edit,
  BarChart3,
  TrendingUp,
  PieChart,
  Target,
  Award,
  Users,
  Heart
} from "lucide-react";
import { useNotification } from "../App.jsx";
import DonationModal from "../components/DonationModal.jsx";
import postService from "../services/postService.js";
import { getUserInfo } from "../auth/auth.js";
import { 
  getUserProfile, 
  getFollowers, 
  getFollowing,
  getUserPosts,
  toggleFollow,
  getRecommendations
} from "../services/userService.js";
import PeopleListModal from "../components/PeopleListModal";
import FollowButton from "../components/FollowButton";

export default function Home() {
  const { showToast } = useNotification();
  const { postId } = useParams();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [content, setContent] = useState("");
  const [selectedMedia, setSelectedMedia] = useState([]); // Array of { url, type, file }
  const [mediaType, setMediaType] = useState(null); // 'image' or 'video'
  const [currentUser, setCurrentUser] = useState(null);
  
  // New States for Management & UI
  const [activeDropdownId, setActiveDropdownId] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [editMedia, setEditMedia] = useState([]); // Array of { id, url, type, file, isExisting }
  const [editMediaType, setEditMediaType] = useState(null);
  const [removedMediaIds, setRemovedMediaIds] = useState([]);
  const [likingIds, setLikingIds] = useState(new Set()); // Track in-flight like requests
  
  // Likes List States
  const [isLikesListOpen, setIsLikesListOpen] = useState(false);
  const [likingUsers, setLikingUsers] = useState([]);
  const [likesListPage, setLikesListPage] = useState(0);
  const [likesListHasMore, setLikesListHasMore] = useState(false);
  const [likesListLoading, setLikesListLoading] = useState(false);
  const [likesListPostId, setLikesListPostId] = useState(null);

  // Comment States
  const [comments, setComments] = useState([]);
  const [commentPage, setCommentPage] = useState(0);
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentHasMore, setCommentHasMore] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentContent, setEditCommentContent] = useState("");
  
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const editImageInputRef = useRef(null);
  const editVideoInputRef = useRef(null);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8848";

  // Suggestions (Dummy)
  const suggestions = [
    { id: 1, name: "Prabin Thapa", role: "Frontend Developer", mutual: 12 },
    { id: 2, name: "Shreeya Sharma", role: "UI/UX Designer", mutual: 5 },
    { id: 3, name: "Anish Gupta", role: "Software Engineer", mutual: 8 },
  ];

  // Analytics State
  const [stats, setStats] = useState({
    postCount: 0,
    totalLikes: 0,
    totalComments: 0,
    totalShares: 0,
    avgInteraction: 0,
    connections: 0,
    loading: true
  });

  // Recommendations state
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);

  // Social Modal State
  const [showListModal, setShowListModal] = useState(false);
  const [listType, setListType] = useState("");
  const [listData, setListData] = useState([]);
  const [listLoading, setListLoading] = useState(false);

  const fetchAnalytics = async (userId) => {
    try {
      const [userPosts, followersData, followingData] = await Promise.all([
        getUserPosts(userId),
        getFollowers(userId),
        getFollowing(userId)
      ]);

      // Calculate simple stats
      let likes = 0, comments = 0, shares = 0;
      userPosts.forEach(p => {
        likes += (p.likeCount || 0);
        comments += (p.commentCount || 0);
        shares += (p.shareCount || 0);
      });

      const totalPosts = userPosts.length;
      const interactions = likes + comments;
      const avg = totalPosts > 0 ? (interactions / totalPosts).toFixed(1) : 0;

      // Calculate connections (mutual follows)
      const followerIds = new Set(followersData.map(f => f.id));
      const connectionsCount = followingData.filter(f => followerIds.has(f.id)).length;

      setStats({
        postCount: totalPosts,
        totalLikes: likes,
        totalComments: comments,
        totalShares: shares,
        avgInteraction: avg,
        connections: connectionsCount,
        loading: false
      });
    } catch (err) {
      console.error("Failed to fetch analytics", err);
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  const handleOpenList = async (type) => {
    if (!currentUser) return;
    setListType(type);
    setShowListModal(true);
    setListData([]);
    setListLoading(true);

    try {
      const data = type === "Following" 
        ? await getFollowing(currentUser.userId || currentUser.id)
        : await getFollowers(currentUser.userId || currentUser.id);
      setListData(data);
    } catch (err) {
      showToast("error", `Failed to load ${type.toLowerCase()}`);
    } finally {
      setListLoading(false);
    }
  };

  const handleListFollowToggle = async (targetUser) => {
    try {
      const updated = await toggleFollow(targetUser.id);
      setListData(prev => prev.map(u => u.id === targetUser.id ? { ...u, isFollowing: updated.isFollowing } : u));
      // Refresh analytics as follow state changed
      const user = getUserInfo();
      if (user) fetchAnalytics(user.userId || user.id);
    } catch (err) {
      showToast("error", "Action failed");
    }
  };

  const fetchRecommendations = async () => {
    setLoadingRecs(true);
    try {
      const data = await getRecommendations(0, 10); // Fetch a few to ensure we have at least 3
      setRecommendations(data.slice(0, 3)); // Show exactly 3
    } catch (err) {
      console.error("Failed to fetch recommendations:", err);
    } finally {
      setLoadingRecs(false);
    }
  };

  const handleRecommendationFollow = async (userId) => {
    try {
      await toggleFollow(userId);
      setRecommendations(prev => prev.filter(u => u.id !== userId));
      showToast("success", "User followed!");
      // Analytics might update if it was a mutual follow
      const user = getUserInfo();
      if (user) fetchAnalytics(user.userId || user.id);
    } catch (err) {
      showToast("error", "Failed to follow user");
    }
  };

  useEffect(() => {
    const init = async () => {
      const user = getUserInfo();
      if (user) {
        const uId = user.userId || user.id;
        try {
          const fullProfile = await getUserProfile(uId);
          setCurrentUser(fullProfile);
          await fetchAnalytics(uId);
        } catch (error) {
          setCurrentUser(user);
        }
      }
      await fetchFeed();
      await fetchRecommendations();
    };
    init();
  }, []);

  useEffect(() => {
    if (isDetailOpen || isLikesListOpen || isDeleteConfirmOpen || isEditOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [isDetailOpen, isLikesListOpen, isDeleteConfirmOpen, isEditOpen]);

  useEffect(() => {
    if (postId && posts.length > 0) {
      handleDeepLink(postId);
    }
  }, [postId, posts]);

  const handleDeepLink = async (id) => {
    const existing = posts.find(p => p.id === parseInt(id));
    if (existing) {
      setSelectedPost(existing);
      setIsDetailOpen(true);
    } else {
      try {
        const post = await postService.getPostById(id);
        setSelectedPost(post);
        setIsDetailOpen(true);
      } catch (err) {
        // If it's a 401, the interceptor will handle the refresh/redirect
        if (!err.isHandled) {
          showToast("error", "Post not found");
          navigate("/");
        }
      }
    }
    // Load comments for the post
    fetchComments(id, 0);
  };

  const fetchComments = async (postId, page) => {
    try {
      setCommentLoading(true);
      const data = await postService.getComments(postId, page);
      setComments(prev => page === 0 ? data.content : [...prev, ...data.content]);
      setCommentHasMore(!data.last);
      setCommentPage(page);
    } catch (err) {
      if (!err.isHandled) showToast("error", "Failed to load comments");
    } finally {
      setCommentLoading(false);
    }
  };

  const loadMoreComments = () => {
    if (!commentLoading && commentHasMore) {
      fetchComments(selectedPost.id, commentPage + 1);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedPost) return;

    try {
      setCommentLoading(true);
      const comment = await postService.addComment(selectedPost.id, newComment);
      setComments(prev => [...prev, comment]);
      setNewComment("");
      
      // Update local counts
      const updatePost = (p) => p.id === selectedPost.id ? { ...p, commentCount: p.commentCount + 1 } : p;
      setPosts(prev => prev.map(updatePost));
      setSelectedPost(prev => updatePost(prev));
    } catch (err) {
      if (!err.isHandled) showToast("error", "Failed to post comment");
    } finally {
      setCommentLoading(false);
    }
  };

  const handleCommentDelete = async (commentId) => {
    try {
      await postService.deleteComment(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
      
      // Update local counts
      const updatePost = (p) => p.id === selectedPost.id ? { ...p, commentCount: Math.max(0, p.commentCount - 1) } : p;
      setPosts(prev => prev.map(updatePost));
      setSelectedPost(prev => updatePost(prev));
      showToast("success", "Comment deleted");
    } catch (err) {
      if (!err.isHandled) showToast("error", "Failed to delete comment");
    }
  };

  const handleCommentEdit = async (commentId, content) => {
    try {
      const updated = await postService.updateComment(commentId, content);
      setComments(prev => prev.map(c => c.id === commentId ? updated : c));
      setEditingCommentId(null);
      setEditCommentContent("");
    } catch (err) {
      if (!err.isHandled) showToast("error", "Failed to edit comment");
    }
  };

  const fetchFeed = async () => {
    try {
      setLoadingFeed(true);
      const data = await postService.getFeed();
      setPosts(data);
    } catch (error) {
      // If it's a 401, the interceptor will handle the refresh/redirect
      if (!error.isHandled) {
        showToast("error", "Failed to load feed");
      }
    } finally {
      setLoadingFeed(false);
    }
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    if (mediaType === "video") {
      showToast("info", "Video removed. Switching to images.");
    }

    const currentCount = mediaType === "image" ? selectedMedia.length : 0;
    const remaining = 10 - currentCount;
    
    if (files.length > remaining) {
      showToast("warning", `You can only add ${remaining} more images (max 10).`);
    }

    const newFiles = files.slice(0, remaining).map(file => ({
      url: URL.createObjectURL(file), // Local preview
      type: "image",
      file // Real binary file
    }));

    setMediaType("image");
    setSelectedMedia(prev => mediaType === "image" ? [...prev, ...newFiles] : newFiles);
    e.target.value = null; 
  };

  const handleVideoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (mediaType === "image") {
      showToast("info", "Images removed. Switching to video.");
    }

    setMediaType("video");
    setSelectedMedia([{
      url: URL.createObjectURL(file),
      type: "video",
      file
    }]);
    e.target.value = null; 
  };

  const removeMedia = (index) => {
    const newMedia = selectedMedia.filter((_, i) => i !== index);
    setSelectedMedia(newMedia);
    if (newMedia.length === 0) setMediaType(null);
  };

  const clearAllMedia = () => {
    setSelectedMedia([]);
    setMediaType(null);
  };

  const handlePostSubmit = async () => {
    if (!content.trim() && selectedMedia.length === 0) return;
    
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("content", content);
    
    selectedMedia.forEach(m => {
      formData.append("files", m.file);
    });

    try {
      await postService.createPost(formData);
      showToast("success", "Post created successfully!");
      
      // Reset state
      setContent("");
      clearAllMedia();
      setIsCreatingPost(false);
      
      // Refresh feed
      fetchFeed();
    } catch (error) {
      if (!error.isHandled) {
        const msg = error?.response?.data?.message || "Failed to create post";
        showToast("error", msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePost = async () => {
    if (!selectedPost) return;
    try {
      await postService.deletePost(selectedPost.id);
      showToast("success", "Post deleted");
      setPosts(prev => prev.filter(p => p.id !== selectedPost.id));
      setIsDeleteConfirmOpen(false);
      setSelectedPost(null);
    } catch (error) {
      if (!error.isHandled) {
        showToast("error", "Failed to delete post");
      }
    }
  };

  const handleUpdatePost = async () => {
    if (!selectedPost || (!editContent.trim() && editMedia.length === 0)) return;
    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append("content", editContent);
      
      // Only append files that are NOT existing (newly selected)
      // or if we want to signal replacement, we can send all new files.
      // My backend implementation currently replaces all media if ANY files are sent.
      editMedia.forEach(m => {
        if (m.file) formData.append("files", m.file);
      });

      removedMediaIds.forEach(id => {
        formData.append("removedMediaIds", id);
      });
      
      const updatedPost = await postService.updatePost(selectedPost.id, formData);
      showToast("success", "Post updated");
      setPosts(prev => prev.map(p => p.id === selectedPost.id ? updatedPost : p));
      setIsEditOpen(false);
      setSelectedPost(null);
    } catch (error) {
      if (!error.isHandled) {
        showToast("error", "Failed to update post");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (e, post) => {
    if (e) e.stopPropagation();
    setSelectedPost(post);
    setEditContent(post.content);
    
    // Initialize edit media with existing post media
    if (post.media && post.media.length > 0) {
      const existing = post.media.map(m => ({
        id: m.id,
        url: `${API_BASE}${m.mediaUrl}`,
        type: m.mediaType.toLowerCase(),
        isExisting: true
      }));
      setEditMedia(existing);
      setEditMediaType(existing[0].type);
    } else {
      setEditMedia([]);
      setEditMediaType(null);
    }
    setRemovedMediaIds([]);
    
    setIsEditOpen(true);
    setActiveDropdownId(null);
  };

  const openDeleteConfirm = (e, post) => {
    if (e) e.stopPropagation();
    setSelectedPost(post);
    setIsDeleteConfirmOpen(true);
    setActiveDropdownId(null);
  };

  const openDetailView = (post) => {
    setSelectedPost(post);
    setIsDetailOpen(true);
    setComments([]);
    setCommentPage(0);
    fetchComments(post.id, 0);
    navigate(`/post/${post.id}`);
  };

  const closeDetailView = () => {
    setIsDetailOpen(false);
    setSelectedPost(null);
    navigate("/");
  };

  const handleShare = async (e, post) => {
    e.stopPropagation();
    const url = `${window.location.origin}/post/${post.id}`;
    try {
      // 1. Copy to clipboard
      await navigator.clipboard.writeText(url);
      
      // 2. Call backend to increment share count
      await postService.sharePost(post.id);
      
      // 3. Update local state
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, shareCount: (p.shareCount || 0) + 1 } : p));
      if (selectedPost && selectedPost.id === post.id) {
        setSelectedPost(prev => ({ ...prev, shareCount: (prev.shareCount || 0) + 1 }));
      }
      
      showToast("success", "Link copied and post shared!");
    } catch (err) {
      showToast("error", "Failed to share post");
    }
  };

  const handleLike = async (e, post) => {
    e.stopPropagation();
    if (likingIds.has(post.id)) return; // Prevent rapid clicking

    // Optimistic UI Update
    const originalPosts = [...posts];
    const originalSelectedPost = selectedPost ? { ...selectedPost } : null;

    const updatePostState = (p) => {
      if (p.id === post.id) {
        const isCurrentlyLiked = p.isLiked;
        return {
          ...p,
          isLiked: !isCurrentlyLiked,
          likeCount: isCurrentlyLiked ? (p.likeCount - 1) : (p.likeCount + 1)
        };
      }
      return p;
    };

    setPosts(prev => prev.map(updatePostState));
    if (selectedPost && selectedPost.id === post.id) {
      setSelectedPost(prev => updatePostState(prev));
    }

    setLikingIds(prev => new Set(prev).add(post.id));

    try {
      const updatedPost = await postService.toggleLike(post.id);
      // Sync with server response
      setPosts(prev => prev.map(p => p.id === post.id ? updatedPost : p));
      if (selectedPost && selectedPost.id === post.id) {
        setSelectedPost(updatedPost);
      }
    } catch (err) {
      // Revert on error
      if (!err.isHandled) {
        setPosts(originalPosts);
        if (originalSelectedPost) setSelectedPost(originalSelectedPost);
        showToast("error", "Failed to update like");
      }
    } finally {
      setLikingIds(prev => {
        const next = new Set(prev);
        next.delete(post.id);
        return next;
      });
    }
  };

  const openLikesList = (e, postId) => {
    e.stopPropagation();
    setLikesListPostId(postId);
    setLikingUsers([]);
    setLikesListPage(0);
    setIsLikesListOpen(true);
    fetchLikes(postId, 0);
  };

  const fetchLikes = async (postId, page) => {
    try {
      setLikesListLoading(true);
      const data = await postService.getPostLikes(postId, page);
      setLikingUsers(prev => page === 0 ? data.content : [...prev, ...data.content]);
      setLikesListHasMore(!data.last);
      setLikesListPage(page);
    } catch (err) {
      if (!err.isHandled) showToast("error", "Failed to load likes");
    } finally {
      setLikesListLoading(false);
    }
  };

  const loadMoreLikes = () => {
    if (!likesListLoading && likesListHasMore) {
      fetchLikes(likesListPostId, likesListPage + 1);
    }
  };

  const handleEditImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    if (editMediaType === "video") setEditMedia([]);
    
    const newFiles = files.map(file => ({
      url: URL.createObjectURL(file),
      type: "image",
      file
    }));
    setEditMediaType("image");
    setEditMedia(prev => editMediaType === "image" ? [...prev, ...newFiles] : newFiles);
    e.target.value = null;
  };

  const handleEditVideoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setEditMediaType("video");
    setEditMedia([{
      url: URL.createObjectURL(file),
      type: "video",
      file
    }]);
    e.target.value = null;
  };

  const removeEditMedia = (index) => {
    const item = editMedia[index];
    if (item.isExisting) {
      setRemovedMediaIds(prev => [...prev, item.id]);
    }
    const newMedia = editMedia.filter((_, i) => i !== index);
    setEditMedia(newMedia);
    if (newMedia.length === 0) setEditMediaType(null);
  };

  const toggleDropdown = (e, postId) => {
    e.stopPropagation();
    setActiveDropdownId(activeDropdownId === postId ? null : postId);
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = () => setActiveDropdownId(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " at " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatCommentDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + " at " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleTextareaInput = (e) => {
    e.target.style.height = "auto";
    e.target.style.height = e.target.scrollHeight + "px";
  };

  return (
    <div className="container feed-grid">
      {/* Left Column: Profile & Analytics */}
      <aside className="left-col">
        <div className="card profile-card developer-sidebar">
          <div className="profile-info-advanced">
            <div className="sidebar-avatar-container">
              {currentUser && (currentUser.profilePicUrl || currentUser.profileImageUrl) ? (
                <img src={`${API_BASE}${currentUser.profilePicUrl || currentUser.profileImageUrl}`} alt={currentUser.fullName} className="sidebar-avatar-img" />
              ) : (
                <div className="sidebar-avatar-placeholder">
                  {currentUser ? (currentUser.fullName ? currentUser.fullName[0] : currentUser.sub[0]) : "U"}
                </div>
              )}
            </div>
            
            <h3 className="sidebar-name">{currentUser ? currentUser.fullName : "User"}</h3>
            <p className="sidebar-bio">{currentUser?.bio || "No bio set"}</p>
            
            <div className="sidebar-academic">
              <span>{currentUser?.program}</span>
              {currentUser?.year && <span className="dot">•</span>}
              {currentUser?.year && <span>{currentUser.year} Year</span>}
            </div>

            <div className="sidebar-social-counts">
              <div className="social-count-item clickable" onClick={() => handleOpenList("Following")}>
                <span className="count">{currentUser?.followingCount || 0}</span>
                <span className="label">Following</span>
              </div>
              <div className="social-count-item clickable" onClick={() => handleOpenList("Followers")}>
                <span className="count">{currentUser?.followersCount || 0}</span>
                <span className="label">Followers</span>
              </div>
            </div>
          </div>

          <div className="sidebar-analytics">
            <h4 className="analytics-title">Personal Analytics</h4>
            <div className="analytics-grid">
              <div className="analytic-box">
                <BarChart3 size={16} />
                <div className="analytic-info">
                  <span className="analytic-val">{stats.postCount}</span>
                  <span className="analytic-label">Posts</span>
                </div>
              </div>
              <div className="analytic-box">
                <ThumbsUp size={16} />
                <div className="analytic-info">
                  <span className="analytic-val">{stats.totalLikes}</span>
                  <span className="analytic-label">Total Likes</span>
                </div>
              </div>
              <div className="analytic-box">
                <MessageSquare size={16} />
                <div className="analytic-info">
                  <span className="analytic-val">{stats.totalComments}</span>
                  <span className="analytic-label">Comments</span>
                </div>
              </div>
              <div className="analytic-box">
                <TrendingUp size={16} />
                <div className="analytic-info">
                  <span className="analytic-val">{stats.avgInteraction}</span>
                  <span className="analytic-label">Engagement</span>
                </div>
              </div>
              <div className="analytic-box">
                <Share2 size={16} />
                <div className="analytic-info">
                  <span className="analytic-val">{stats.totalShares}</span>
                  <span className="analytic-label">Shares</span>
                </div>
              </div>
              <div className="analytic-box">
                <Users size={16} />
                <div className="analytic-info">
                  <span className="analytic-val">{stats.connections}</span>
                  <span className="analytic-label">Connections</span>
                </div>
              </div>
            </div>
          </div>

          <div className="sidebar-footer">
            <button className="view-profile-btn" onClick={() => navigate('/profile')}>
              Visit Profile
            </button>
          </div>
        </div>
      </aside>

      {/* Middle Column: Feed */}
      <main className="middle-col">
        {/* Create Post Card */}
        <div className={`card create-post ${isCreatingPost ? 'expanded' : ''}`}>
          {!isCreatingPost ? (
            <div className="post-input-container">
              <div className="avatar-small">
                {currentUser ? (currentUser.fullName ? currentUser.fullName[0] : currentUser.sub[0]) : "U"}
              </div>
              <button className="post-trigger-btn" onClick={() => setIsCreatingPost(true)}>
                What's on your mind?
              </button>
            </div>
          ) : (
            <div className="post-editor">
              <div className="editor-header">
                <h3>Create a post</h3>
                <button className="close-btn" onClick={() => setIsCreatingPost(false)}><X size={20} /></button>
              </div>
              <textarea 
                className="post-textarea"
                placeholder="Share your thoughts with the community..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onInput={handleTextareaInput}
                rows={1}
                autoFocus
              />
              
              {selectedMedia.length > 0 && (
                <div className={`media-preview-grid ${mediaType === 'image' ? `grid-${Math.min(selectedMedia.length, 3)}` : 'video-preview'}`}>
                  {selectedMedia.map((m, i) => (
                    <div key={i} className="preview-item">
                      {m.type === 'image' ? (
                        <img src={m.url} alt="preview" />
                      ) : (
                        <video src={m.url} controls />
                      )}
                      <button className="remove-media-btn" onClick={() => removeMedia(i)}><X size={14} /></button>
                    </div>
                  ))}
                </div>
              )}

              <div className="editor-footer">
                <div className="editor-tools">
                  <button className="tool-btn" onClick={() => imageInputRef.current.click()} title="Add Photos">
                    <ImageIcon size={24} />
                  </button>
                  <button className="tool-btn" onClick={() => videoInputRef.current.click()} title="Add Video">
                    <Video size={24} />
                  </button>
                </div>
                <button 
                  className="btn btn-primary post-submit-btn" 
                  disabled={(!content.trim() && selectedMedia.length === 0) || isSubmitting}
                  onClick={handlePostSubmit}
                >
                  <Send size={18} /> {isSubmitting ? "Posting..." : "Post"}
                </button>
              </div>
            </div>
          )}

          {/* Hidden Inputs */}
          <input 
            type="file" 
            ref={imageInputRef} 
            onChange={handleImageSelect} 
            accept="image/*" 
            multiple 
            style={{ display: 'none' }} 
          />
          <input 
            type="file" 
            ref={videoInputRef} 
            onChange={handleVideoSelect} 
            accept="video/*" 
            style={{ display: 'none' }} 
          />
        </div>
        
        <style>{`
          .clickable { cursor: pointer; }
          .clickable:hover { opacity: 0.85; }
          .post-author-avatar, .avatar-large, .comment-avatar, .comment-avatar-small, .person-pfp { 
            overflow: hidden; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            background: #38434F; 
            border-radius: 50% !important;
          }
          .avatar-img { width: 100%; height: 100%; object-fit: cover; }
          .author-name.clickable:hover, .name-large.clickable:hover, .comment-author.clickable:hover { text-decoration: underline; color: var(--primary); }
        `}</style>

        {/* Feed Posts */}
        <div className="feed-list">
          {loadingFeed ? (
            <div className="card loading-state">
              <div className="spinner"></div>
              <p>Loading community feed...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="card empty-feed">
               <div className="empty-icon"><MessageSquare size={48} /></div>
               <h3>No posts yet</h3>
               <p className="muted">Be the first to share something with the community!</p>
            </div>
          ) : (
            posts.map((post) => {
              const currentId = currentUser?.userId || currentUser?.id;
              const postUserId = post.userId || post.user?.id;
              const isOwner = currentUser && postUserId && (
                String(postUserId) === String(currentId) || 
                (post.user && post.user.email === currentUser.sub)
              );
              
              return (
                <div key={post.id} className="card post-card" onClick={() => openDetailView(post)}>
                  <div className="post-header">
                    <div 
                      className="post-author-avatar clickable" 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (post.user) navigate(`/profile/${post.user.id}`);
                      }}
                    >
                      {(() => {
                        const picUrl = post.user?.profilePicUrl || post.user?.profileImageUrl;
                        return picUrl ? (
                          <img src={`${API_BASE}${picUrl}`} alt={post.user.fullName} className="avatar-img" />
                        ) : (
                          post.user ? post.user.fullName[0] : "U"
                        );
                      })()}
                    </div>
                    <div className="post-author-info">
                      <h4 
                        className="author-name clickable"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (post.user) navigate(`/profile/${post.user.id}`);
                        }}
                      >
                        {post.user ? post.user.fullName : "Unknown User"}
                      </h4>
                      <p className="author-role">{post.user ? post.user.program + " " + post.user.year + " Year" : "Community Member"}</p>
                      <p className="post-time"><Clock size={12} /> {formatDate(post.createdAt)}</p>
                    </div>
                    <div className="post-options">
                      <button 
                        className={`btn-icon ${activeDropdownId === post.id ? 'active' : ''}`} 
                        onClick={(e) => toggleDropdown(e, post.id)}
                        title="Options"
                      >
                        <MoreVertical size={20} />
                      </button>
                      
                      {activeDropdownId === post.id && (
                        <div className="dropdown-menu" onClick={(e) => e.stopPropagation()}>
                          {isOwner ? (
                            <>
                              <button className="dropdown-item" onClick={(e) => openEditModal(e, post)}>
                                <Edit size={16} /> Edit Post
                              </button>
                              <button className="dropdown-item delete" onClick={(e) => openDeleteConfirm(e, post)}>
                                <Trash2 size={16} /> Delete Post
                              </button>
                            </>
                          ) : (
                            <button className="dropdown-item" onClick={() => showToast("info", "Reporting feature coming soon")}>
                              Report Post
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="post-content">
                    <p>{post.content}</p>
                  </div>

                  {post.media && post.media.length > 0 && (
                    <div 
                      className={`post-media-display ${post.media[0].mediaType === 'IMAGE' ? `grid-${Math.min(post.media.length, 3)}` : 'video-display'}`} 
                      onClick={(e) => {
                        e.stopPropagation();
                        openDetailView(post);
                      }}
                    >
                      {post.media.map((m) => (
                        <div key={m.id} className="media-item">
                          {m.mediaType === 'IMAGE' ? (
                            <img src={`${API_BASE}${m.mediaUrl}`} alt="post" />
                          ) : (
                            <video src={`${API_BASE}${m.mediaUrl}`} controls muted autoPlay loop />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="post-stats">
                    <span 
                      className="stat-pill clickable" 
                      onClick={(e) => openLikesList(e, post.id)}
                      title="View Likers"
                    >
                      <ThumbsUp size={14} /> {post.likeCount || 0}
                    </span>
                    <span className="stat-pill"><MessageSquare size={14} /> {post.commentCount || 0} comments</span>
                  </div>

                  <div className="post-footer">
                    <button 
                      className={`footer-btn ${post.isLiked ? 'active' : ''}`} 
                      onClick={(e) => handleLike(e, post)}
                      disabled={likingIds.has(post.id)}
                    >
                      <ThumbsUp size={20} fill={post.isLiked ? "currentColor" : "none"} /> 
                      {post.isLiked ? "Liked" : "Like"}
                    </button>
                    <button className="footer-btn" onClick={(e) => {
                       e.stopPropagation();
                       openDetailView(post);
                    }}><MessageSquare size={20} /> Comment</button>
                    <button className="footer-btn" onClick={(e) => handleShare(e, post)}><Share2 size={20} /> Share</button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Right Column: Recommendations */}
      <aside className="right-col">
        <div className="card connections-card">
          <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <TrendingUp size={20} className="text-primary" />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '700' }}>Connections</h3>
          </div>
          
          <div className="recommendations-list">
            {loadingRecs ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
                <div className="spinner" style={{ width: '20px', height: '20px' }}></div>
              </div>
            ) : recommendations.length > 0 ? (
              recommendations.map(user => (
                <div key={user.id} className="rec-item" style={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  gap: '8px',
                  padding: '12px 0',
                  borderBottom: '1px solid var(--border)' 
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', cursor: 'pointer' }} onClick={() => navigate(`/profile/${user.id}`)}>
                      <div className="person-pfp" style={{ width: '36px', height: '36px' }}>
                        {user.profileImageUrl ? (
                          <img src={`${API_BASE}${user.profileImageUrl}`} alt={user.fullName} className="avatar-img" />
                        ) : (
                          <span className="pfp-placeholder-sm" style={{ fontSize: '14px' }}>{user.fullName[0]}</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-primary)' }}>{user.fullName}</span>
                        <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: '500' }}>
                          {user.year} Year · {user.program}
                        </span>
                      </div>
                    </div>
                    <FollowButton
                      isFollowing={user.isFollowing}
                      isFollowedBy={user.isFollowedBy}
                      onToggle={() => handleRecommendationFollow(user.id)}
                      size="sm"
                    />
                  </div>
                  
                  <div style={{ paddingLeft: '46px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      <span style={{ background: 'rgba(88, 166, 255, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                        Section {user.section || 'N/A'}
                      </span>
                    </div>
                    {user.bio && (
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {user.bio}
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', fontStyle: 'italic', padding: '20px 0' }}>
                No new connections found.
              </p>
            )}
          </div>
          
          {recommendations.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
              <button 
                className="btn btn-ghost" 
                style={{ width: '100%', fontSize: '13px' }}
                onClick={fetchRecommendations}
              >
                Refresh Suggestions
              </button>
              <button 
                className="btn btn-primary" 
                style={{ width: '100%', fontSize: '13px', background: 'transparent', border: '1px solid var(--primary)', color: 'var(--primary)' }}
                onClick={() => navigate('/connections')}
              >
                View all recommendations
              </button>
            </div>
          )}
        </div>

        <div className="card support-dev-card glass" style={{ marginTop: '16px', padding: '20px', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
            <Heart size={32} fill="var(--primary)" color="var(--primary)" />
          </div>
          <h4 style={{ margin: '0 0 8px', fontSize: '0.95rem', fontWeight: '700' }}>Support the Developer</h4>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Help us maintain and improve ICP Connect for the community.
          </p>
          <button 
            className="btn btn-primary" 
            style={{ width: '100%', borderRadius: '20px' }}
            onClick={() => setIsDonationModalOpen(true)}
          >
            Donate with eSewa
          </button>
        </div>
      </aside>

      <DonationModal 
        isOpen={isDonationModalOpen} 
        onClose={() => setIsDonationModalOpen(false)} 
      />

      <style>{`
        .support-dev-card { border: 1px solid var(--border); transition: all 0.2s; }
        .support-dev-card:hover { border-color: var(--primary); transform: translateY(-2px); box-shadow: 0 8px 25px rgba(88, 166, 255, 0.2); }
          border-radius: 30px;
          background: rgba(88, 166, 255, 0.15);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(88, 166, 255, 0.3);

        .developer-sidebar { padding: 0; position: sticky; top: 88px; background: #161B22; border: 1px solid #30363D; display: flex; flex-direction: column; overflow: hidden; min-height: 600px; }
        .profile-info-advanced { padding: 24px 16px; display: flex; flex-direction: column; align-items: center; border-bottom: 1px solid #30363D; background: linear-gradient(to bottom, #1c2128, #161b22); }
        .sidebar-avatar-container { margin-bottom: 16px; position: relative; }
        .sidebar-avatar-img { 
          width: 90px; height: 90px; border-radius: 50%; border: 3px solid #30363D; 
          object-fit: cover; background: #38434F;
        }
        .sidebar-avatar-placeholder {
          width: 90px; height: 90px; border-radius: 50%; border: 3px solid #30363D;
          background: #38434F; display: flex; align-items: center; justify-content: center;
          font-size: 32px; font-weight: bold; color: var(--primary);
        }
        .sidebar-name { font-size: 18px; font-weight: 700; margin: 0; color: #E6EDF3; }
        .sidebar-bio { font-size: 13px; color: #8B949E; margin: 8px 0; text-align: center; line-height: 1.4; max-width: 100%; }
        .sidebar-academic { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--primary); font-weight: 500; margin-bottom: 16px; }
        .dot { color: #8B949E; }
        
        .sidebar-social-counts { display: flex; gap: 24px; width: 100%; justify-content: center; }
        .social-count-item { display: flex; flex-direction: column; align-items: center; }
        .social-count-item.clickable { cursor: pointer; transition: transform 0.2s; }
        .social-count-item.clickable:hover { transform: translateY(-2px); }
        .social-count-item .count { font-size: 16px; font-weight: 700; color: #E6EDF3; }
        .social-count-item .label { font-size: 11px; color: #8B949E; text-transform: uppercase; letter-spacing: 0.5px; }

        .sidebar-analytics { padding: 20px 16px; flex: 1; }
        .analytics-title { font-size: 11px; color: #8B949E; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
        .analytics-title::after { content: ''; flex: 1; height: 1px; background: #30363D; }
        
        .analytics-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .analytic-box { 
          background: #0D1117; border: 1px solid #30363D; border-radius: 8px; 
          padding: 12px; display: flex; items-center; gap: 10px;
          transition: all 0.2s;
        }
        .analytic-box:hover { border-color: var(--primary); background: #161B22; }
        .analytic-box svg { color: var(--primary); flex-shrink: 0; }
        .analytic-info { display: flex; flex-direction: column; }
        .analytic-val { font-size: 14px; font-weight: 700; color: #E6EDF3; }
        .analytic-label { font-size: 10px; color: #8B949E; }
        
        .sidebar-footer { padding: 16px; background: #0D1117; border-top: 1px solid #30363D; }
        .view-profile-btn { 
          width: 100%; padding: 10px; border-radius: 6px; 
          background: transparent; border: 1px solid #30363D; 
          color: #E6EDF3; font-size: 13px; font-weight: 600;
          cursor: pointer; transition: all 0.2s;
        }
        .view-profile-btn:hover { background: var(--primary); border-color: var(--primary); color: white; }

        .create-post { margin-bottom: 24px; transition: all 0.3s ease; }
        .create-post.expanded { padding: 0; }
        .post-input-container { display: flex; gap: 16px; margin-bottom: 0; padding: 8px 0; }
        .avatar-small {
          width: 52px; height: 52px; background: #38434F; border-radius: 50%;
          display: flex; align-items: center; justify-content: center; font-size: 16px;
        }
        .post-trigger-btn {
          flex: 1; background: transparent; border: 1px solid var(--border);
          border-radius: 35px; text-align: left; padding: 0 24px;
          color: var(--text-secondary); font-weight: 500; cursor: pointer;
          font-size: 16px; min-height: 52px;
        }
        .post-trigger-btn:hover { background: rgba(255, 255, 255, 0.05); border-color: var(--text-muted); }

        .feed-grid { display: grid; grid-template-columns: 280px 1fr 320px; gap: 24px; padding: 24px 0; }

        .post-editor { display: flex; flex-direction: column; }
        .editor-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 16px 20px; border-bottom: 1px solid var(--border);
        }
        .editor-header h3 { font-size: 20px; margin: 0; }
        .close-btn { background: transparent; border: none; color: var(--text-muted); cursor: pointer; padding: 8px; border-radius: 50%; }
        .close-btn:hover { background: rgba(255, 255, 255, 0.1); color: var(--text-primary); }
        .post-textarea {
          width: 100%; min-height: 80px; background: transparent; border: none;
          color: var(--text-primary); padding: 20px; resize: none; outline: none; font-size: 18px;
          line-height: 1.5; overflow-y: hidden;
        }
        
        .media-preview-grid {
          display: grid; gap: 8px; padding: 0 16px 16px;
        }
        .grid-1 { grid-template-columns: 1fr; }
        .grid-2 { grid-template-columns: 1fr 1fr; }
        .grid-3 { grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); }
        
        .preview-item {
          position: relative; border-radius: 8px; overflow: hidden; background: #000;
          aspect-ratio: 1; display: flex; align-items: center; justify-content: center;
        }
        .preview-item img, .preview-item video {
          width: 100%; height: 100%; object-fit: cover;
        }
        .remove-media-btn {
          position: absolute; top: 4px; right: 4px; background: rgba(0,0,0,0.6);
          color: white; border: none; border-radius: 50%; width: 24px; height: 24px;
          display: flex; align-items: center; justify-content: center; cursor: pointer;
        }

        .editor-footer {
          display: flex; justify-content: space-between; align-items: center;
          padding: 12px 16px; border-top: 1px solid var(--border);
        }
        .editor-tools { display: flex; gap: 12px; }
        .tool-btn {
          background: transparent; border: none; color: var(--text-secondary);
          cursor: pointer; padding: 8px; border-radius: 50%; transition: all 0.2s;
        }
        .tool-btn:hover { background: rgba(255, 255, 255, 0.05); color: var(--primary); }
        .post-submit-btn { padding: 8px 24px; border-radius: 20px; }

        .loading-state { text-align: center; padding: 48px; display: flex; flex-direction: column; align-items: center; gap: 16px; }
        .spinner { width: 40px; height: 40px; border: 4px solid var(--border); border-top-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .post-card { padding: 0; margin-bottom: 24px; border-radius: 8px; }
        .post-header { display: flex; padding: 12px 16px; gap: 12px; position: relative; }
        .post-author-avatar { width: 48px; height: 48px; background: #38434F; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; color: var(--primary); }
        .post-author-info { flex: 1; }
        .author-name { margin: 0; font-size: 14px; color: var(--text-primary); }
        .author-role { margin: 0; font-size: 12px; color: var(--text-secondary); }
        .post-time { margin: 4px 0 0; font-size: 11px; color: var(--text-muted); display: flex; align-items: center; gap: 4px; }
        .post-options { position: absolute; top: 12px; right: 12px; }
        .btn-icon { background: transparent; border: none; color: var(--text-muted); cursor: pointer; padding: 4px; border-radius: 4px; }
        .btn-icon:hover { background: rgba(255, 255, 255, 0.05); color: var(--error); }

        .post-content { padding: 0 16px 12px; font-size: 15px; line-height: 1.6; white-space: pre-wrap; word-wrap: break-word; }
        
        .post-media-display { width: 100%; background: #000; display: grid; gap: 2px; border-radius: 4px; overflow: hidden; margin-top: 8px; }
        .post-media-display.grid-1 { 
          grid-template-columns: 1fr; 
          max-width: 400px;
          margin-left: auto;
          margin-right: auto;
          background: transparent;
        }
        .post-media-display.grid-2 { grid-template-columns: 1fr 1fr; height: 300px; }
        .post-media-display.grid-3 { grid-template-columns: 1fr 1fr; grid-template-rows: 200px 200px; }
        .post-media-display.grid-3 .media-item:first-child { grid-row: span 2; }
        
        .media-item { position: relative; overflow: hidden; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #000; }
        .media-item img, .media-item video { width: 100%; height: 100%; object-fit: cover; }
        .grid-1 .media-item { aspect-ratio: auto; min-height: 200px; max-height: 400px; border-radius: 8px; }
        .grid-1 .media-item img { object-fit: contain; background: #161B22; }

        .post-stats { padding: 10px 16px; display: flex; gap: 12px; border-bottom: 1px solid var(--border); }
        .stat-pill { font-size: 12px; color: var(--text-secondary); display: flex; align-items: center; gap: 4px; }

        .post-footer { display: flex; padding: 4px; }
        .footer-btn { flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px; background: transparent; border: none; color: var(--text-secondary); font-size: 14px; font-weight: 600; padding: 12px; border-radius: 4px; cursor: pointer; transition: all 0.2s; }
        .footer-btn:hover:not(:disabled) { background: rgba(255,255,255, 0.05); color: var(--primary); }
        .footer-btn.active { color: var(--primary); }
        .footer-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .empty-feed { text-align: center; padding: 48px 16px; color: var(--text-muted); }
        .empty-icon { margin-bottom: 16px; opacity: 0.5; }

        .suggestions-card { padding: 12px; position: sticky; top: 88px; }
        .card-title { font-size: 16px; margin: 0 0 16px; font-weight: 600; }
        .suggestion-item { display: flex; gap: 12px; margin-bottom: 16px; }
        .suggestion-avatar {
          width: 48px; height: 48px; background: #38434F; border-radius: 50%;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .suggestion-name { margin: 0; font-size: 14px; color: var(--text-primary); }
        .suggestion-role { margin: 0; font-size: 12px; color: var(--text-secondary); margin-bottom: 8px; }
        .btn-follow {
          display: flex; align-items: center; gap: 4px; background: transparent;
          border: 1px solid var(--success); color: var(--success); padding: 4px 12px;
          border-radius: 20px; font-size: 14px; font-weight: 600; cursor: pointer;
        }
        .btn-follow:hover { background: rgba(63, 185, 80, 0.1); }
        .btn-follow:hover { background: rgba(63, 185, 80, 0.1); }

        /* Management & Modal Styles */
        .post-card { cursor: pointer; transition: transform 0.2s; }
        .post-card:hover { transform: translateY(-2px); }
        .post-options { position: absolute; top: 12px; right: 12px; z-index: 10; }
        .btn-icon.active { background: rgba(255, 255, 255, 0.1); color: var(--primary); }
        
        .dropdown-menu {
          position: absolute; top: 100%; right: 0; background: var(--card);
          border: 1px solid var(--border); border-radius: 8px; width: 180px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.5); padding: 4px; margin-top: 4px;
        }
        .dropdown-item {
          display: flex; align-items: center; gap: 12px; width: 100%;
          padding: 10px 16px; border: none; background: transparent;
          color: var(--text-primary); font-size: 14px; cursor: pointer;
          border-radius: 6px; transition: all 0.2s;
        }
        .dropdown-item:hover { background: rgba(255, 255, 255, 0.05); }
        .dropdown-item.delete { color: var(--error); }
        .dropdown-item.delete:hover { background: rgba(248, 81, 73, 0.1); }

        .modal-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.92); backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center; z-index: 1000;
          padding: 20px;
        }
        .modal-content {
          background: var(--card); border: 1px solid var(--border);
          border-radius: 12px; width: 100%; max-height: 90vh; overflow: hidden;
          display: flex; flex-direction: column; box-shadow: 0 20px 50px rgba(0,0,0,0.5);
        }
        .confirm-modal { max-width: 450px; flex-direction: column; }
        .edit-modal { max-width: 700px; flex-direction: column; }
        .detail-modal { 
          max-width: 1400px; width: 95vw; height: 85vh; 
          flex-direction: row; border: none; background: #000;
        }
        
        /* Detail View Split Layout */
        .detail-media-side {
          flex: 7; background: #000; display: flex; align-items: center; justify-content: center;
          position: relative; overflow: hidden; height: 100%;
        }
        .detail-info-side {
          flex: 3; background: var(--card); border-left: 1px solid var(--border);
          display: flex; flex-direction: column; height: 100%; min-width: 350px;
        }
        
        .detail-media-container { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .detail-media-container img, .detail-media-container video { 
          max-width: 100%; max-height: 100%; object-fit: contain; 
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }
        
        .info-header { padding: 16px 20px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
        .info-body { padding: 20px; overflow-y: auto; flex: 1; }
        .info-footer { padding: 12px 20px; border-top: 1px solid var(--border); }
        
        .modal-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 16px 20px; border-bottom: 1px solid var(--border);
        }
        .modal-body { padding: 20px; overflow-y: auto; }
        .modal-actions {
          display: flex; justify-content: flex-end; gap: 12px;
          padding: 16px 20px; border-top: 1px solid var(--border);
        }
        
        .author-info-large { display: flex; gap: 12px; align-items: center; }
        .avatar-large {
          width: 48px; height: 48px; background: #38434F; border-radius: 50%;
          display: flex; align-items: center; justify-content: center; font-weight: bold; color: var(--primary);
          overflow: hidden;
        }
        .name-large { margin: 0; font-size: 16px; font-weight: 600; }
        .time-large { margin: 2px 0 0; font-size: 12px; color: var(--text-muted); }
        
        .detail-text { font-size: 18px; line-height: 1.6; color: var(--text-primary); white-space: pre-wrap; margin-bottom: 24px; }
        .detail-media-list { display: flex; flex-direction: column; gap: 16px; }
        .detail-media-item video, .detail-media-item img { width: 100%; border-radius: 8px; }
        
        .edit-textarea {
          width: 100%; min-height: 120px; background: var(--bg-secondary);
          border: 1px solid var(--border); border-radius: 8px; padding: 16px;
          color: var(--text-primary); font-size: 18px; line-height: 1.6; resize: none; outline: none;
          overflow-y: hidden;
        }
        .edit-textarea:focus { border-color: var(--primary); }
        
        .modal-close-btn { background: transparent; border: none; color: var(--text-muted); cursor: pointer; display: flex; }
        .modal-close-btn:hover { color: var(--text-primary); }

        .stat-pill.clickable { cursor: pointer; }
        .stat-pill.clickable:hover { color: var(--primary); text-decoration: underline; }



        /* Comment Styles */
        .comment-item { display: flex; gap: 10px; margin-bottom: 16px; align-items: flex-start; }
        .comment-avatar { width: 32px; height: 32px; background: var(--border); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; color: var(--primary); font-weight: bold; flex-shrink: 0; }
        .comment-content-wrap { flex: 1; }
        .comment-bubble { background: #1a222a; padding: 10px 12px; border-radius: 0 12px 12px 12px; border: 1px solid var(--border); }
        .comment-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
        .comment-author { font-size: 13px; font-weight: 600; color: var(--text-primary); }
        .comment-time { font-size: 11px; color: var(--text-muted); display: flex; align-items: center; gap: 4px; }
        .comment-text { margin: 0; font-size: 14px; color: var(--text-secondary); line-height: 1.5; white-space: pre-wrap; word-break: break-word; }
        .comment-actions { display: flex; gap: 12px; margin-top: 4px; padding-left: 4px; }
        .comment-actions button { background: none; border: none; font-size: 11px; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; gap: 4px; }
        .comment-actions button:hover { color: var(--primary); }
        
        .comment-input-form { display: flex; gap: 12px; align-items: center; padding: 12px 0; border-top: 1px solid var(--border); }
        .comment-avatar-small { 
          width: 32px; height: 32px; 
          background: #38434F; 
          border-radius: 50% !important; 
          display: flex; align-items: center; justify-content: center; 
          font-size: 12px; font-weight: bold; flex-shrink: 0; 
          overflow: hidden;
          color: var(--primary);
        }
        .comment-input-wrap { flex: 1; display: flex; background: #1a222a; border: 1px solid var(--border); border-radius: 20px; padding: 4px 12px; align-items: center; }
        .comment-input-wrap input { flex: 1; background: transparent; border: none; color: var(--text-primary); padding: 8px 0; font-size: 14px; outline: none; }
        .comment-input-wrap button { background: transparent; border: none; color: var(--primary); cursor: pointer; padding: 4px; display: flex; align-items: center; }
        .comment-input-wrap button:disabled { opacity: 0.3; cursor: not-allowed; }

        .load-more-comments { margin: 8px auto; display: block; font-size: 13px; }
        
        .edit-comment-form textarea { width: 100%; background: #0f151b; border: 1px solid var(--primary); border-radius: 4px; color: var(--text-primary); padding: 8px; font-size: 14px; min-height: 60px; margin-bottom: 8px; resize: none; outline: none; }
        .edit-actions { display: flex; justify-content: flex-end; gap: 8px; }
        .edit-actions button { padding: 4px 12px; border-radius: 4px; font-size: 12px; cursor: pointer; }
        .edit-actions button:first-child { background: transparent; border: 1px solid var(--border); color: var(--text-secondary); }
        .edit-actions button:last-child { background: var(--primary); border: none; color: white; }
      `}</style>
      {/* Detail Modal */}
      {isDetailOpen && selectedPost && (
        <div className="modal-overlay" onClick={closeDetailView}>
          <div className="modal-content detail-modal" onClick={(e) => e.stopPropagation()}>
            {/* Left Side: Media */}
            <div className="detail-media-side">
              <div className="detail-media-container">
                {selectedPost.media && selectedPost.media.length > 0 ? (
                  selectedPost.media[0].mediaType === "VIDEO" ? (
                    <video controls src={`${API_BASE}${selectedPost.media[0].mediaUrl}`} />
                  ) : (
                    <img src={`${API_BASE}${selectedPost.media[0].mediaUrl}`} alt="Post content" />
                  )
                ) : (
                  <div className="empty-media-placeholder">No Media</div>
                )}
              </div>
            </div>

            {/* Right Side: Info & Comments */}
            <div className="detail-info-side">
              <div className="info-header" style={{ background: 'var(--card)' }}>
                <div className="author-info-large">
                  <div 
                    className="avatar-large clickable"
                    onClick={() => {
                      if (selectedPost.user) navigate(`/profile/${selectedPost.user.id}`);
                    }}
                  >
                    {(() => {
                        const picUrl = selectedPost.user?.profilePicUrl || selectedPost.user?.profileImageUrl;
                        return picUrl ? (
                          <img src={`${API_BASE}${picUrl}`} alt={selectedPost.user.fullName} className="avatar-img" />
                        ) : (
                          selectedPost.user ? selectedPost.user.fullName[0] : "U"
                        );
                    })()}
                  </div>
                  <div>
                    <h4 
                      className="name-large clickable"
                      onClick={() => {
                        if (selectedPost.user) navigate(`/profile/${selectedPost.user.id}`);
                      }}
                    >
                      {selectedPost.user ? selectedPost.user.fullName : "Unknown User"}
                    </h4>
                    <p className="time-large">{formatDate(selectedPost.createdAt)}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {(() => {
                    const currentId = currentUser?.userId || currentUser?.id;
                    const postUserId = selectedPost.userId || selectedPost.user?.id;
                    const isOwner = currentUser && postUserId && (
                      String(postUserId) === String(currentId) || 
                      (selectedPost.user && selectedPost.user.email === currentUser.sub)
                    );
                    return isOwner;
                  })() && (
                    <div className="post-options" style={{ position: 'relative', top: 'unset', right: 'unset' }}>
                      <button 
                        className={`btn-icon ${activeDropdownId === selectedPost.id ? 'active' : ''}`} 
                        onClick={(e) => toggleDropdown(e, selectedPost.id)}
                      >
                        <MoreVertical size={20} />
                      </button>
                      {activeDropdownId === selectedPost.id && (
                        <div className="dropdown-menu" style={{ top: '100%', right: 0 }}>
                          <button className="dropdown-item" onClick={(e) => openEditModal(e, selectedPost)}>
                            <Edit size={16} /> Edit Post
                          </button>
                          <button className="dropdown-item delete" onClick={(e) => openDeleteConfirm(e, selectedPost)}>
                            <Trash2 size={16} /> Delete Post
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  <button 
                    className="modal-close-btn" 
                    onClick={closeDetailView}
                    style={{ background: 'transparent', border: 'none', padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              <div className="info-body">
                <div className="detail-text" style={{ fontSize: '16px', marginBottom: '20px' }}>{selectedPost.content}</div>
                
                <div className="detail-stats" style={{ padding: '12px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', display: 'flex', gap: '16px' }}>
                  <span className="stat-pill clickable" onClick={(e) => openLikesList(e, selectedPost.id)}>
                    <ThumbsUp size={14} /> {selectedPost.likeCount || 0} Likes
                  </span>
                  <span className="stat-pill"><MessageSquare size={14} /> {selectedPost.commentCount || 0} Comments</span>
                </div>

                <div className="comments-section" style={{ marginTop: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h5 style={{ margin: '0 0 16px', color: 'var(--text-secondary)' }}>Comments</h5>
                  
                  <div className="comments-list" style={{ flex: 1, overflowY: 'auto', marginBottom: '16px' }}>
                    {comments.length > 0 ? (
                      <>
                        {comments.map((comment) => (
                          <div key={comment.id} className="comment-item">
                            <div 
                              className="comment-avatar clickable"
                              onClick={() => navigate(`/profile/${comment.userId}`)}
                            >
                              {comment.profileImageUrl ? (
                                  <img src={`${API_BASE}${comment.profileImageUrl}`} alt={comment.fullName} className="avatar-img" />
                              ) : (
                                  comment.fullName[0]
                              )}
                            </div>
                            <div className="comment-content-wrap">
                              <div className="comment-bubble">
                                <div className="comment-header">
                                  <span 
                                    className="comment-author clickable"
                                    onClick={() => navigate(`/profile/${comment.userId}`)}
                                  >
                                    {comment.fullName}
                                  </span>
                                  <span className="comment-time">
                                    <Clock size={10} /> {formatCommentDate(comment.createdAt)}
                                    {comment.updatedAt && new Date(comment.updatedAt).getTime() > new Date(comment.createdAt).getTime() + 1000 && (
                                      <span style={{ marginLeft: '4px', fontStyle: 'italic', opacity: 0.7 }}>(updated)</span>
                                    )}
                                  </span>
                                </div>
                                
                                {editingCommentId === comment.id ? (
                                  <div className="edit-comment-form">
                                    <textarea 
                                      value={editCommentContent} 
                                      onChange={(e) => setEditCommentContent(e.target.value)}
                                      autoFocus
                                    />
                                    <div className="edit-actions">
                                      <button onClick={() => setEditingCommentId(null)}>Cancel</button>
                                      <button onClick={() => handleCommentEdit(comment.id, editCommentContent)}>Save</button>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="comment-text">{comment.content}</p>
                                )}
                              </div>
                              
                              {!editingCommentId && currentUser && currentUser.userId === comment.userId && (
                                <div className="comment-actions">
                                  <button onClick={() => {
                                    setEditingCommentId(comment.id);
                                    setEditCommentContent(comment.content);
                                  }}><Edit size={12} /> Edit</button>
                                  <button onClick={() => handleCommentDelete(comment.id)}><Trash2 size={12} /> Delete</button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        {commentHasMore && (
                          <button className="btn btn-ghost load-more-comments" onClick={loadMoreComments} disabled={commentLoading}>
                            {commentLoading ? "Loading..." : "Load more comments"}
                          </button>
                        )}
                      </>
                    ) : (
                      <div className="empty-comments" style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                        <MessageSquare size={32} style={{ opacity: 0.2, marginBottom: '12px' }} />
                        <p>No comments yet. Be the first to start the conversation!</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="detail-fixed-footer" style={{ 
                padding: '16px', 
                background: 'var(--card)', 
                borderTop: '1px solid var(--border)',
                zIndex: 5
              }}>
                {/* Comment Input Sticky above actions */}
                <form className="comment-input-form" onSubmit={handleCommentSubmit} style={{ marginBottom: '12px', borderTop: 'none', padding: 0 }}>
                  <div className="comment-avatar-small">
                    {currentUser && currentUser.profilePicUrl ? (
                      <img src={`${API_BASE}${currentUser.profilePicUrl}`} alt={currentUser.fullName} className="avatar-img" />
                    ) : (
                      currentUser?.fullName ? currentUser.fullName[0] : (currentUser?.sub ? currentUser.sub[0] : "U")
                    )}
                  </div>
                  <div className="comment-input-wrap">
                    <input 
                      placeholder="Write a comment..." 
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      disabled={commentLoading}
                    />
                    <button type="submit" disabled={!newComment.trim() || commentLoading}>
                      <Send size={16} />
                    </button>
                  </div>
                </form>

                <div className="info-footer" style={{ padding: 0 }}>
                <div className="post-actions" style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    className={`footer-btn ${selectedPost.isLiked ? 'active' : ''}`} 
                    style={{ flex: 1 }}
                    onClick={(e) => handleLike(e, selectedPost)}
                    disabled={likingIds.has(selectedPost.id)}
                  >
                    <ThumbsUp size={18} fill={selectedPost.isLiked ? "currentColor" : "none"} /> 
                    {selectedPost.isLiked ? "Liked" : "Like"}
                  </button>
                  <button className="footer-btn" style={{ flex: 1 }}><MessageSquare size={18} /> Comment</button>
                  <button className="footer-btn" style={{ flex: 1 }} onClick={(e) => handleShare(e, selectedPost)}><Share2 size={18} /> Share</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Edit Modal */}
      {isEditOpen && selectedPost && (
        <div className="modal-overlay">
          <div className="modal-content edit-modal">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Edit Post</h3>
              <button className="modal-close-btn" onClick={() => setIsEditOpen(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <textarea 
                className="edit-textarea"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onInput={handleTextareaInput}
                rows={1}
                placeholder="What's on your mind?"
              />
              
              {editMedia.length > 0 && (
                <div className={`media-preview-grid ${editMediaType === 'image' ? `grid-${Math.min(editMedia.length, 3)}` : 'video-preview'}`} style={{ marginTop: '16px', padding: 0 }}>
                  {editMedia.map((m, i) => (
                    <div key={i} className="preview-item">
                      {m.type === 'image' ? (
                        <img src={m.url} alt="preview" />
                      ) : (
                        <video src={m.url} controls />
                      )}
                      <button className="remove-media-btn" onClick={() => removeEditMedia(i)}><X size={14} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-actions" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="editor-tools">
                <button className="tool-btn" onClick={() => editImageInputRef.current.click()} title="Add Photos">
                  <ImageIcon size={20} />
                </button>
                <button className="tool-btn" onClick={() => editVideoInputRef.current.click()} title="Add Video">
                  <Video size={20} />
                </button>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn btn-ghost" onClick={() => setIsEditOpen(false)}>Cancel</button>
                <button 
                  className="btn btn-primary" 
                  onClick={handleUpdatePost} 
                  disabled={isSubmitting || (!editContent.trim() && editMedia.length === 0)}
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>

          <input type="file" ref={editImageInputRef} onChange={handleEditImageSelect} accept="image/*" multiple style={{ display: 'none' }} />
          <input type="file" ref={editVideoInputRef} onChange={handleEditVideoSelect} accept="video/*" style={{ display: 'none' }} />
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && selectedPost && (
        <div className="modal-overlay">
          <div className="modal-content confirm-modal">
            <div className="modal-header">
              <h3>Delete Post?</h3>
              <button className="modal-close-btn" onClick={() => setIsDeleteConfirmOpen(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete this post? This action cannot be undone.</p>
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setIsDeleteConfirmOpen(false)}>No, Keep it</button>
              <button className="btn btn-error" onClick={handleDeletePost}>Yes, Delete Post</button>
            </div>
          </div>
        </div>
      )}

      {/* Likers List Modal (Shared Component) */}
      <PeopleListModal 
        isOpen={isLikesListOpen}
        onClose={() => setIsLikesListOpen(false)}
        title="People who liked"
        data={likingUsers}
        loading={likesListLoading}
        onToggleFollow={handleListFollowToggle}
        API_BASE={API_BASE}
        navigate={navigate}
      />

      {/* Social List Modal (Shared Component) */}
      <PeopleListModal 
        isOpen={showListModal}
        onClose={() => setShowListModal(false)}
        title={listType}
        data={listData}
        loading={listLoading}
        onToggleFollow={handleListFollowToggle}
        API_BASE={API_BASE}
        navigate={navigate}
      />
    </div>
  );
}
