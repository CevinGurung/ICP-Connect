import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  Users, 
  MapPin, 
  Link as LinkIcon, 
  Calendar, 
  Edit3, 
  UserPlus, 
  UserCheck,
  MessageSquare,
  ThumbsUp,
  Share2,
  Clock,
  MoreVertical,
  ChevronLeft,
  X,
  Send,
  Plus,
  ImageIcon,
  Video,
  Edit,
  Trash2,
  AlertCircle,
  BarChart3,
  TrendingUp,
  PieChart
} from "lucide-react";
import { useNotification } from "../context/NotificationContext.jsx";
import { getUserProfile, toggleFollow, updateProfile, getUserPosts, getFollowers, getFollowing } from "../services/userService";
import { toggleLike, getComments, addComment, updateComment, deleteComment, sharePost } from "../services/postService";
import { getUserInfo } from "../auth/auth";
import FollowButton from "../components/FollowButton";
import postService from "../services/postService";
import PeopleListModal from "../components/PeopleListModal";




export default function Profile() {
  const { userId: paramId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useNotification();
  const [currentUserData, setCurrentUserData] = useState(null);
  const currentUser = getUserInfo();
  
  // Use paramId if present, otherwise current user ID
  const targetUserId = paramId || currentUser?.userId;

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: "",
    bio: "",
    program: "",
    year: "",
    section: "",
    subject: "",
    specialty: ""
  });
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [profilePicPreview, setProfilePicPreview] = useState(null);
  const [shouldRemovePic, setShouldRemovePic] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Social List Modal State
  const [showListModal, setShowListModal] = useState(false);
  const [listType, setListType] = useState(""); // "Followers" or "Following"
  const [listData, setListData] = useState([]);
  const [listLoading, setListLoading] = useState(false);

  // Post Detail Modal State (reused from Home)
  const [selectedPost, setSelectedPost] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentContent, setEditCommentContent] = useState("");
  const [commentPage, setCommentPage] = useState(0);
  const [commentHasMore, setCommentHasMore] = useState(false);
  const [likingIds, setLikingIds] = useState(new Set());
  
  // Likes List States
  const [isLikesListOpen, setIsLikesListOpen] = useState(false);
  const [likingUsers, setLikingUsers] = useState([]);
  const [likesListPage, setLikesListPage] = useState(0);
  const [likesListHasMore, setLikesListHasMore] = useState(false);
  const [likesListLoading, setLikesListLoading] = useState(false);
  const [likesListPostId, setLikesListPostId] = useState(null);
  
  // Management States
  const [activeDropdownId, setActiveDropdownId] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [editMedia, setEditMedia] = useState([]);
  const [editMediaType, setEditMediaType] = useState(null);
  const [removedMediaIds, setRemovedMediaIds] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const editImageInputRef = useRef(null);
  const editVideoInputRef = useRef(null);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8848";

  useEffect(() => {
    if (targetUserId) {
      fetchProfileData();
    }
    
    // Fetch logged-in user profile info for avatars
    const fetchCurrentUserData = async () => {
      const user = getUserInfo();
      if (user && user.userId) {
        try {
          const data = await getUserProfile(user.userId);
          setCurrentUserData(data);
        } catch (err) {
          console.error("Failed to load current user data", err);
        }
      }
    };
    fetchCurrentUserData();
  }, [targetUserId]);

  useEffect(() => {
    const handleClickOutside = () => setActiveDropdownId(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isDetailOpen || isDeleteConfirmOpen || isEditOpen || showListModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [isDetailOpen, isDeleteConfirmOpen, isEditOpen, showListModal]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const [profileData, userPosts] = await Promise.all([
        getUserProfile(targetUserId),
        getUserPosts(targetUserId)
      ]);
      setProfile(profileData);
      setPosts(userPosts);
      setEditForm({
        fullName: profileData.fullName,
        bio: profileData.bio || "",
        program: profileData.program || "",
        year: profileData.year || "",
        section: profileData.section || "",
        subject: profileData.subject || "",
        specialty: profileData.specialty || ""
      });
    } catch (err) {
      showToast("error", "Failed to load profile");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!profile || followLoading) return;
    
    // Optimistic UI
    const wasFollowing = profile.isFollowing;
    const isMutual = profile.isFollowedBy;
    
    setProfile(prev => ({
      ...prev,
      isFollowing: !wasFollowing,
      followersCount: wasFollowing ? prev.followersCount - 1 : prev.followersCount + 1
    }));
    
    setFollowLoading(true);
    try {
      const result = await toggleFollow(profile.id);
      
      // Update state from source of truth
      setProfile(prev => ({ ...prev, isFollowing: result.isFollowing }));

      if (result.isFollowing) {
        if (isMutual) {
          showToast("success", "You are now connected!");
        } else {
          showToast("success", "Following user");
        }
      } else {
        showToast("info", "Unfollowed user");
      }
    } catch (err) {
      // Revert on error
      setProfile(prev => ({
        ...prev,
        isFollowing: wasFollowing,
        followersCount: wasFollowing ? prev.followersCount + 1 : prev.followersCount - 1
      }));
      showToast("error", "Action failed. Please try again.");
    } finally {
      setFollowLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await updateProfile(editForm, profilePicFile, shouldRemovePic);
      
      // Update local state
      setProfile(prev => ({ 
        ...prev, 
        ...editForm,
        profilePicUrl: shouldRemovePic ? null : (profilePicPreview ? `/uploads/avatars/${profilePicFile.name}` : prev.profilePicUrl) 
      }));
      
      // Full refresh to ensure clean state (especially URLs)
      fetchProfileData();
      
      setIsEditing(false);
      setProfilePicFile(null);
      setProfilePicPreview(null);
      setShouldRemovePic(false);
      showToast("success", "Profile updated successfully");
    } catch (err) {
      showToast("error", "Failed to update profile");
    } finally {
      setUpdating(false);
    }
  };

  const handleOpenList = async (type) => {
    setListType(type);
    setShowListModal(true);
    setListLoading(true);
    try {
      const data = type === "Followers" 
        ? await getFollowers(targetUserId) 
        : await getFollowing(targetUserId);
      setListData(data);
    } catch (err) {
      showToast("error", `Failed to load ${type}`);
    } finally {
      setListLoading(false);
    }
  };

  const handleListFollowToggle = async (user) => {
    const wasFollowing = user.isFollowing;
    const isMutual = user.isFollowedBy;

    // Optimistic UI for list
    setListData(prev => prev.map(u => 
      u.id === user.id ? { ...u, isFollowing: !wasFollowing } : u
    ));
    
    // Sync main profile stats if the current profile is the one being affected
    if (user.id === profile.id) {
        setProfile(prev => ({
            ...prev,
            isFollowing: !wasFollowing,
            followersCount: wasFollowing ? prev.followersCount - 1 : prev.followersCount + 1
        }));
    }

    try {
      const result = await toggleFollow(user.id);
      
      setListData(prev => prev.map(u => 
        u.id === user.id ? { ...u, isFollowing: result.isFollowing } : u
      ));

      if (result.isFollowing) {
        if (isMutual) {
          showToast("success", "You are now connected!");
        } else {
          showToast("success", "Following user");
        }
      } else {
        showToast("info", "Unfollowed user");
      }
    } catch (err) {
      // Revert on error
      setListData(prev => prev.map(u => 
        u.id === user.id ? { ...u, isFollowing: wasFollowing } : u
      ));
      if (user.id === profile.id) {
        setProfile(prev => ({
            ...prev,
            isFollowing: wasFollowing,
            followersCount: wasFollowing ? prev.followersCount + 1 : prev.followersCount - 1
        }));
      }
      showToast("error", "Action failed");
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast("error", "File is too large (max 5MB)");
        return;
      }
      setProfilePicFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const openDetail = async (post) => {
    setSelectedPost(post);
    setIsDetailOpen(true);
    fetchComments(post.id);
  };

  const fetchComments = async (postId, page = 0) => {
    try {
      setCommentLoading(true);
      const data = await getComments(postId, page, 50);
      setComments(prev => page === 0 ? data.content : [...prev, ...data.content]);
      setCommentHasMore(!data.last);
      setCommentPage(page);
    } catch (err) {
      console.error("Failed to fetch comments", err);
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
    
    setCommentLoading(true);
    try {
      const added = await addComment(selectedPost.id, newComment);
      setComments(prev => [...prev, added]);
      setNewComment("");
      
      // Update counts
      setPosts(prev => prev.map(p => p.id === selectedPost.id ? { ...p, commentCount: p.commentCount + 1 } : p));
      setSelectedPost(prev => ({ ...prev, commentCount: prev.commentCount + 1 }));
    } catch (err) {
      showToast("error", "Failed to add comment");
    } finally {
      setCommentLoading(false);
    }
  };

  const handleCommentDelete = async (commentId) => {
    try {
      await deleteComment(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
      
      // Update counts
      setPosts(prev => prev.map(p => p.id === selectedPost.id ? { ...p, commentCount: Math.max(0, p.commentCount - 1) } : p));
      setSelectedPost(prev => ({ ...prev, commentCount: Math.max(0, prev.commentCount - 1) }));
      showToast("success", "Comment deleted");
    } catch (err) {
      showToast("error", "Failed to delete comment");
    }
  };

  const handleCommentEdit = async (commentId, content) => {
    if (!content.trim()) return;
    try {
      const updated = await updateComment(commentId, content);
      setComments(prev => prev.map(c => c.id === commentId ? updated : c));
      setEditingCommentId(null);
    } catch (err) {
      showToast("error", "Failed to edit comment");
    }
  };

  const handleLike = async (e, post) => {
    e.stopPropagation();
    setLikingIds(prev => new Set(prev).add(post.id));
    try {
      const updatedPost = await toggleLike(post.id);
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, isLiked: updatedPost.isLiked, likeCount: updatedPost.likeCount } : p));
      if (selectedPost && selectedPost.id === post.id) {
        setSelectedPost(prev => ({ ...prev, isLiked: updatedPost.isLiked, likeCount: updatedPost.likeCount }));
      }
    } catch (err) {
      showToast("error", "Like failed");
    } finally {
      setLikingIds(prev => {
        const next = new Set(prev);
        next.delete(post.id);
        return next;
      });
    }
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

  // Post Management Handlers
  const toggleDropdown = (e, postId) => {
    e.stopPropagation();
    setActiveDropdownId(activeDropdownId === postId ? null : postId);
  };

  const openEditModal = (e, post) => {
    if (e) e.stopPropagation();
    setSelectedPost(post);
    setEditContent(post.content);
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

  const handleDeletePost = async () => {
    if (!selectedPost) return;
    try {
      await postService.deletePost(selectedPost.id);
      showToast("success", "Post deleted");
      setPosts(prev => prev.filter(p => p.id !== selectedPost.id));
      setIsDeleteConfirmOpen(false);
      setSelectedPost(null);
    } catch (error) {
      if (!error.isHandled) showToast("error", "Failed to delete post");
    }
  };

  const handleUpdatePost = async () => {
    if (!selectedPost || (!editContent.trim() && editMedia.length === 0)) return;
    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append("content", editContent);
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
      if (!error.isHandled) showToast("error", "Failed to update post");
    } finally {
      setIsSubmitting(false);
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
    if (item.isExisting) setRemovedMediaIds(prev => [...prev, item.id]);
    const newMedia = editMedia.filter((_, i) => i !== index);
    setEditMedia(newMedia);
    if (newMedia.length === 0) setEditMediaType(null);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " at " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatCommentDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + " at " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-error">
        <AlertCircle size={48} />
        <h2>Profile not found</h2>
        <button className="btn btn-primary" onClick={() => navigate("/")}>Go Home</button>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="container">
        {/* Profile Header Section */}
        <section className="profile-header-card card">
          <div className="profile-main-info">
            <div className="profile-left">
              <div className="profile-pfp">
                {profile.profilePicUrl ? (
                  <img src={`${API_BASE}${profile.profilePicUrl}`} alt={profile.fullName} />
                ) : (
                  <div className="pfp-placeholder">{profile.fullName[0]}</div>
                )}
              </div>
              <div className="profile-meta">
                <h1 className="profile-fullname">{profile.fullName}</h1>
                <p className="profile-username">@{profile.userName}</p>
                {profile.bio && <p className="profile-bio">{profile.bio}</p>}
                <div className="profile-academic">
                  {profile.role === 'TEACHER' ? (
                    <>
                      <span style={{ color: 'var(--success)', fontWeight: '600' }}>{profile.subject || "Faculty Member"}</span>
                      {profile.specialty && <span className="dot">•</span>}
                      {profile.specialty && <span>{profile.specialty}</span>}
                      <span className="dot">•</span>
                      <span>Faculty of {profile.program}</span>
                    </>
                  ) : (
                    <>
                      <span>{profile.program}</span>
                      <span className="dot">•</span>
                      <span>Year {profile.year}</span>
                      {profile.section && (
                        <>
                          <span className="dot">•</span>
                          <span>Section {profile.section}</span>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="profile-center">
              <div className="profile-stats">
                <div className="stat-box clickable" onClick={() => handleOpenList("Following")}>
                  <span className="stat-count">{profile.followingCount}</span>
                  <span className="stat-label">Following</span>
                </div>
                <div className="stat-box clickable" onClick={() => handleOpenList("Followers")}>
                  <span className="stat-count">{profile.followersCount}</span>
                  <span className="stat-label">Followers</span>
                </div>
                <div className="stat-box">
                  <span className="stat-count">{profile.postCount}</span>
                  <span className="stat-label">Posts</span>
                </div>
              </div>
              
              <div className="profile-actions">
                {profile.isOwnProfile ? (
                  <button className="btn btn-ghost edit-btn" onClick={() => setIsEditing(true)}>
                    <Edit3 size={16} /> Edit Profile
                  </button>
                ) : (
                  <FollowButton
                    isFollowing={profile.isFollowing}
                    isFollowedBy={profile.isFollowedBy}
                    onToggle={handleFollowToggle}
                  />
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Posts Section */}
        <section className="profile-posts-section">
          <h2 className="section-title">Latest Posts</h2>
          <div className="posts-list">
            {posts.length > 0 ? (
              posts.map(post => (
                <div key={post.id} className="card post-card" onClick={() => openDetail(post)}>
                  <div className="post-header">
                    <div 
                      className="post-author-avatar clickable"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/profile/${profile.id}`);
                      }}
                    >
                      {profile.profilePicUrl ? (
                         <img src={`${API_BASE}${profile.profilePicUrl}`} alt={profile.fullName} className="avatar-img" />
                      ) : (
                         profile.fullName[0]
                      )}
                    </div>
                    <div className="post-author-info">
                      <h4 
                        className="author-name clickable"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/profile/${profile.id}`);
                        }}
                      >
                        {profile.fullName}
                      </h4>
                      <p className="author-role" style={{ fontSize: '12px', color: '#8B949E', margin: '2px 0' }}>
                        {profile.role === 'TEACHER' 
                          ? <span style={{ color: 'var(--success)', fontWeight: '500' }}>{profile.subject || "Faculty"} • {profile.program || "ICP"}</span>
                          : `${profile.program} ${profile.year} Year`}
                      </p>
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
                          {profile.isOwnProfile ? (
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
                      className="post-media-display" 
                      onClick={(e) => {
                        e.stopPropagation();
                        openDetail(post);
                      }}
                    >
                      {post.media[0].mediaType === 'IMAGE' ? (
                        <img src={`${API_BASE}${post.media[0].mediaUrl}`} alt="post" />
                      ) : (
                        <video src={`${API_BASE}${post.media[0].mediaUrl}`} controls muted />
                      )}
                    </div>
                  )}

                  <div className="post-stats">
                    <span className="stat-pill"><ThumbsUp size={14} /> {post.likeCount || 0}</span>
                    <span className="stat-pill"><MessageSquare size={14} /> {post.commentCount || 0}</span>
                  </div>

                  <div className="post-footer">
                    <button 
                      className={`footer-btn ${post.isLiked ? 'active' : ''}`} 
                      onClick={(e) => handleLike(e, post)}
                    >
                      <ThumbsUp size={20} fill={post.isLiked ? "currentColor" : "none"} /> {post.isLiked ? "Liked" : "Like"}
                    </button>
                    <button className="footer-btn" onClick={(e) => {
                      e.stopPropagation();
                      openDetail(post);
                    }}><MessageSquare size={20} /> Comment</button>
                    <button className="footer-btn" onClick={(e) => handleShare(e, post)}>
                      <Share2 size={20} /> Share
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <MessageSquare size={48} className="empty-icon" />
                <h3>No posts yet</h3>
                <p>This user hasn't shared anything with the community yet.</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="modal-overlay" onClick={() => setIsEditing(false)}>
          <div className="modal-content edit-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Profile</h3>
              <button className="close-btn" onClick={() => setIsEditing(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleUpdateProfile}>
              <div className="modal-body">
                <div className="form-group profile-upload-group">
                  <label>Profile Picture</label>
                  <div className="upload-preview-container">
                    <div className="preview-circle bigger">
                      {shouldRemovePic ? (
                         <div className="pfp-placeholder">{profile.fullName[0]}</div>
                      ) : profilePicPreview ? (
                        <img src={profilePicPreview} alt="Preview" />
                      ) : profile.profilePicUrl ? (
                        <img src={`${API_BASE}${profile.profilePicUrl}`} alt="Current" />
                      ) : (
                        <div className="pfp-placeholder">{profile.fullName[0]}</div>
                      )}
                    </div>
                    <div className="upload-actions">
                      <label className="upload-btn-label">
                        <ImageIcon size={18} />
                        Choose New Image
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleFileChange} 
                          onClick={() => setShouldRemovePic(false)}
                          hidden 
                        />
                      </label>
                      {(profile.profilePicUrl || profilePicPreview) && !shouldRemovePic && (
                        <button 
                          type="button" 
                          className="btn btn-danger-soft btn-sm" 
                          onClick={() => {
                            setShouldRemovePic(true);
                            setProfilePicFile(null);
                            setProfilePicPreview(null);
                          }}
                        >
                          Remove Picture
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="form-group">
                  <label>Full Name</label>
                  <input 
                    value={editForm.fullName} 
                    onChange={e => setEditForm({...editForm, fullName: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Bio</label>
                  <textarea 
                    value={editForm.bio} 
                    onChange={e => setEditForm({...editForm, bio: e.target.value})}
                    placeholder="Tell us about yourself..."
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Program</label>
                    <select 
                      className="form-select"
                      value={editForm.program} 
                      onChange={e => setEditForm({...editForm, program: e.target.value})} 
                    >
                      <option value="">Select Program</option>
                      <option value="BIT">BIT</option>
                      <option value="BBA">BBA</option>
                    </select>
                  </div>
                  
                  {profile.role === 'TEACHER' ? (
                    <>
                      <div className="form-group">
                        <label>Teaching Subject</label>
                        <input 
                          value={editForm.subject} 
                          placeholder="e.g., Database Systems"
                          onChange={e => setEditForm({...editForm, subject: e.target.value})} 
                        />
                      </div>
                      <div className="form-group">
                        <label>Specialty</label>
                        <input 
                          value={editForm.specialty} 
                          placeholder="e.g., Software Engineering"
                          onChange={e => setEditForm({...editForm, specialty: e.target.value})} 
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="form-group">
                        <label>Year</label>
                        <select 
                          className="form-select"
                          value={editForm.year} 
                          onChange={e => setEditForm({...editForm, year: e.target.value})}
                          disabled={!editForm.program}
                        >
                          <option value="">Select Year</option>
                          {editForm.program === "BIT" && (
                            <>
                              <option value="1">Year 1</option>
                              <option value="2">Year 2</option>
                              <option value="3">Year 3</option>
                            </>
                          )}
                          {editForm.program === "BBA" && (
                            <>
                              <option value="1">Year 1</option>
                              <option value="2">Year 2</option>
                              <option value="3">Year 3</option>
                              <option value="3.5">Year 3.5</option>
                            </>
                          )}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Section</label>
                        <input 
                          value={editForm.section} 
                          placeholder="e.g., C1"
                          onChange={e => setEditForm({...editForm, section: e.target.value})} 
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => {
                  setIsEditing(false);
                  setProfilePicPreview(null);
                  setProfilePicFile(null);
                }} disabled={updating}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={updating}>
                  {updating ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

        {/* Social List Modal */}
        <PeopleListModal 
          isOpen={showListModal}
          onClose={() => setShowListModal(false)}
          title={listType}
          data={listData}
          loading={listLoading}
          onToggleFollow={handleListFollowToggle}
          API_BASE={API_BASE}
        />

        {/* Detail Modal placeholder removed, now moved to the bottom */}

      <style>{`
        .profile-page { background-color: #0D1117; min-height: calc(100vh - var(--nav-height)); color: #E6EDF3; padding-bottom: 50px; }
        .profile-header-card { background: #161B22; border: 1px solid #30363D; border-radius: 12px; margin-top: 24px; padding: 32px; }
        
        .profile-main-info { display: flex; justify-content: space-between; align-items: flex-start; gap: 40px; }
        .profile-left { display: flex; gap: 24px; flex: 1; }
        
        .profile-pfp { width: 120px; height: 120px; flex-shrink: 0; border-radius: 50%; overflow: hidden; border: 1px solid #30363D; background: #0D1117; }
        .profile-pfp img, .pfp-placeholder { 
          width: 100%; height: 100%; object-fit: cover; 
          display: flex; align-items: center; justify-content: center; font-size: 48px; font-weight: bold; color: #58A6FF;
        }

        .profile-fullname { font-size: 26px; font-weight: 700; margin: 0; }
        .profile-username { font-size: 18px; color: #8B949E; margin: 4px 0 12px; }
        .profile-bio { font-size: 16px; line-height: 1.5; margin-bottom: 16px; max-width: 500px; }
        .profile-academic { display: flex; align-items: center; gap: 8px; color: #8B949E; font-size: 14px; }
        .dot { opacity: 0.5; }

        .profile-center { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 24px; }
        .profile-stats { display: flex; gap: 40px; }
        .stat-box { 
          display: flex; flex-direction: column; align-items: center; 
          padding: 8px 16px; border-radius: 8px; min-width: 100px;
          transition: all 0.2s;
        }
        .stat-box.clickable { cursor: pointer; }
        .stat-box.clickable:hover { background: #21262d; }
        .stat-count { font-size: 22px; font-weight: 700; color: #E6EDF3; line-height: 1.2; }
        .stat-label { font-size: 14px; color: #8B949E; margin-top: 4px; }
        
        .profile-actions { width: 100%; display: flex; justify-content: center; }
        .btn { padding: 10px 24px; border-radius: 6px; font-size: 15px; font-weight: 600; display: flex; align-items: center; gap: 8px; transition: all 0.2s; cursor: pointer; }
        .btn-primary { background: #58A6FF; color: #ffffff; border: none; }
        .btn-primary:hover { background: #4a94e8; }
        .btn-ghost { background: transparent; border: 1px solid #30363D; color: #E6EDF3; }
        .btn-ghost:hover { background: #21262d; border-color: #8B949E; }
        
        .follow-btn.following { background: #21262d; color: #E6EDF3; border: 1px solid #30363D; position: relative; }
        .follow-btn.following:hover { background: #f851491a; color: #f85149; border-color: #f85149; }
        .follow-btn.following:hover .following-text { visibility: hidden; }
        .follow-btn.following:hover::after { 
            content: "Unfollow"; 
            position: absolute; 
            left: 50%; top: 50%; 
            transform: translate(-50%, -50%);
            visibility: visible;
        }

        .section-title { font-size: 20px; font-weight: 600; margin: 40px 0 20px; padding-bottom: 12px; border-bottom: 1px solid #30363D; }
        .posts-list { display: flex; flex-direction: column; gap: 16px; max-width: 800px; margin: 0 auto; }
        
        .post-card { background: #161B22; border: 1px solid #30363D; border-radius: 8px; padding: 0; cursor: pointer; transition: transform 0.2s; }
        .post-card:hover { transform: translateY(-2px); }
        .post-header { padding: 12px 16px; display: flex; align-items: center; gap: 12px; position: relative; }
        .post-author-avatar { width: 44px; height: 44px; border-radius: 50%; background: #38434F; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #58A6FF; }
        .author-name { margin: 0; font-size: 14px; font-weight: 600; }
        .post-time { margin: 2px 0 0; font-size: 12px; color: #8B949E; display: flex; align-items: center; gap: 4px; }
        .post-content { padding: 0 16px 16px; font-size: 15px; line-height: 1.5; white-space: pre-wrap; word-break: break-word; }
        .post-media-display { width: 100%; border-top: 1px solid #30363D; border-bottom: 1px solid #30363D; background: #000; display: flex; justify-content: center; }
        .post-media-display img, .post-media-display video { max-width: 100%; max-height: 500px; }
        .post-stats { padding: 12px 16px; display: flex; gap: 16px; border-bottom: 1px solid #30363D; }
        .stat-pill { font-size: 13px; color: #8B949E; display: flex; align-items: center; gap: 6px; }
        .post-footer { display: flex; padding: 4px; }
        .footer-btn { flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px; background: transparent; border: none; color: #8B949E; font-size: 14px; font-weight: 600; padding: 12px; border-radius: 4px; cursor: pointer; transition: all 0.2s; }
        .footer-btn:hover:not(:disabled) { background: rgba(255, 255, 255, 0.05); color: #58A6FF; }
        .footer-btn.active { color: #58A6FF; }
        .footer-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .spinner { width: 40px; height: 40px; border: 4px solid rgba(88, 166, 255, 0.1); border-top-color: #58A6FF; border-radius: 50%; animation: spin 1s linear infinite; margin: 100px auto; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Modal Styles */
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 2000; backdrop-filter: blur(4px); }
        .modal-content { background: #161B22; border: 1px solid #30363D; border-radius: 12px; width: 90%; max-width: 600px; max-height: 90vh; display: flex; flex-direction: column; overflow: hidden; }
        
        .modal-header { padding: 16px 20px; border-bottom: 1px solid #30363D; display: flex; justify-content: space-between; align-items: center; }
        .modal-header h3 { margin: 0; font-size: 18px; }
        .close-btn { background: none; border: none; color: #8B949E; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 6px; border-radius: 50%; transition: all 0.2s; }
        .close-btn:hover { background: #30363D; color: #E6EDF3; }

        .post-author-avatar, .avatar-large, .comment-avatar, .comment-avatar-small { 
          overflow: hidden; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          background: #38434F; 
          border-radius: 50% !important;
        }
        .avatar-img { width: 100%; height: 100%; object-fit: cover; }
        .clickable { cursor: pointer; transition: opacity 0.2s; }
        .clickable:hover { opacity: 0.85; }
        .author-name.clickable:hover, .comment-author.clickable:hover { text-decoration: underline; color: #58A6FF; }

        .modal-body { padding: 20px; flex: 1; overflow-y: auto; max-height: calc(100vh - 200px); }

        /* Detail Modal Styles */
        .detail-modal { 
          display: flex; width: 90%; max-width: 1100px; height: 90vh; 
          background: #161B22; border-radius: 12px; overflow: hidden; 
        }
        .detail-media-side { flex: 7; background: #000; display: flex; align-items: center; justify-content: center; position: relative; }
        .detail-media-container { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
        .detail-media-container img, .detail-media-container video { max-width: 100%; max-height: 100%; object-fit: contain; }
        
        .detail-info-side { flex: 3; display: flex; flex-direction: column; background: #161B22; border-left: 1px solid #30363D; }
        .info-header { padding: 16px; display: flex; justify-content: space-between; align-items: center; background: #1C2128; }
        .author-info-large { display: flex; align-items: center; gap: 12px; }
        .avatar-large { width: 44px; height: 44px; }
        .name-large { font-size: 16px; font-weight: 600; margin: 0; }
        .time-large { font-size: 12px; color: #8B949E; margin: 2px 0 0; }
        .modal-close-btn { background: transparent; border: none; color: #8B949E; cursor: pointer; }

        .info-body { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; }
        .detail-text { font-size: 15px; line-height: 1.6; margin-bottom: 20px; white-space: pre-wrap; }
        .detail-stats { display: flex; gap: 16px; padding: 12px 0; border-top: 1px solid #30363D; border-bottom: 1px solid #30363D; margin-bottom: 20px; }
        .stat-pill { font-size: 13px; color: #8B949E; display: flex; align-items: center; gap: 6px; }

        .comments-section { flex: 1; display: flex; flex-direction: column; }
        .comments-title { margin: 0 0 16px; font-size: 14px; color: #8B949E; }
        .comment-item { display: flex; gap: 10px; margin-bottom: 16px; }
        .comment-avatar { width: 32px; height: 32px; flex-shrink: 0; }
        .comment-bubble { background: #0D1117; padding: 10px 12px; border-radius: 0 12px 12px 12px; border: 1px solid #30363D; flex: 1; }
        .comment-header { display: flex; justify-content: space-between; margin-bottom: 4px; }
        .comment-author { font-size: 13px; font-weight: 600; }
        .comment-time { font-size: 11px; color: #8B949E; display: flex; align-items: center; gap: 4px; }
        .comment-text { font-size: 14px; margin: 0; line-height: 1.5; color: #C9D1D9; }
        .comment-actions { display: flex; gap: 12px; margin-top: 4px; }
        .comment-actions button { background: none; border: none; font-size: 11px; color: #8B949E; cursor: pointer; }
        .comment-actions button:hover { color: #58A6FF; }

        .detail-fixed-footer { padding: 16px; background: #1C2128; border-top: 1px solid #30363D; }
        .comment-input-form { display: flex; gap: 10px; align-items: center; margin-bottom: 16px; }
        .comment-avatar-small { width: 32px; height: 32px; }
        .comment-input-wrap { flex: 1; display: flex; background: #0D1117; border: 1px solid #30363D; border-radius: 20px; padding: 4px 12px; }
        .comment-input-wrap input { flex: 1; background: transparent; border: none; color: #E6EDF3; padding: 8px 0; font-size: 14px; outline: none; }
        .comment-input-wrap button { background: transparent; border: none; color: #58A6FF; cursor: pointer; }
        
        .post-actions { display: flex; gap: 8px; }
        .footer-btn { flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px; background: transparent; border: none; color: #8B949E; font-size: 14px; font-weight: 600; padding: 12px; border-radius: 4px; cursor: pointer; transition: all 0.2s; }
        .footer-btn.active { color: #58A6FF; }
        .empty-comments { text-align: center; padding: 30px 0; color: #8B949E; }
        .load-more-comments { margin: 8px auto; display: block; font-size: 13px; }
        .scrollable-list { padding: 12px 20px; }

        .form-group { margin-bottom: 20px; }
        .form-group label { display: block; font-size: 14px; color: #8B949E; margin-bottom: 8px; }
        .form-group input, .form-group textarea, .form-group select { width: 100%; background: #0D1117; border: 1px solid #30363D; border-radius: 6px; color: #E6EDF3; padding: 10px; font-size: 15px; outline: none; }
        .form-group input:focus, .form-group textarea:focus, .form-group select:focus { border-color: #58A6FF; }
        .form-select { cursor: pointer; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%238B949E' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14 2.451 5.658C2.185 5.355 2.401 5 2.753 5h9.494c.353 0 .568.354.302.658l-4.796 5.482a.5.5 0 0 1-.706 0z'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; background-size: 12px; padding-right: 32px !important; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
        .modal-actions { padding: 16px 20px; border-top: 1px solid #30363D; display: flex; justify-content: flex-end; gap: 12px; }

        /* Profile Upload Styles */
        .profile-upload-group { display: flex; flex-direction: column; align-items: center; margin-bottom: 32px; }
        .upload-preview-container { display: flex; flex-direction: column; align-items: center; gap: 12px; }
        .preview-circle { 
          width: 80px; height: 80px; border-radius: 50%; overflow: hidden; 
          border: 2px solid #58A6FF; background: #0D1117;
          display: flex; align-items: center; justify-content: center;
        }
        .preview-circle.bigger { width: 140px; height: 140px; border-width: 3px; flex-shrink: 0; }
        .preview-circle img { width: 100%; height: 100%; object-fit: cover; }
        
        .upload-actions { display: flex; flex-direction: column; align-items: center; gap: 10px; }
        .upload-btn-label { 
          display: flex; align-items: center; gap: 8px; 
          background: #21262d; border: 1px solid #30363D; padding: 8px 16px; 
          border-radius: 6px; font-size: 14px; cursor: pointer; color: #E6EDF3;
          transition: all 0.2s;
        }
        .upload-btn-label:hover { background: #30363d; border-color: #8B949E; }
        .btn-danger-soft { background: #f851491a; color: #f85149; border: 1px solid #f851494d; padding: 6px 12px; font-size: 13px; }
        .btn-danger-soft:hover { background: #f8514933; border-color: #f85149; }

        .empty-list { text-align: center; color: #8B949E; padding: 40px 0; font-style: italic; }
        .list-loading { display: flex; justify-content: center; padding: 40px 0; }
        .pfp-placeholder { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; background: #21262d; border-radius: 50%; }

        @media (max-width: 768px) {
          .profile-main-info { flex-direction: column; align-items: center; text-align: center; }
          .profile-left { flex-direction: column; align-items: center; }
          .profile-stats { gap: 20px; }
          .profile-academic { justify-content: center; }
          .form-row { grid-template-columns: 1fr; }
          .modal-content { width: 95%; max-height: 85vh; }
        }

        .post-options { position: absolute; top: 12px; right: 12px; z-index: 10; }
        .dropdown-menu {
          position: absolute; top: 100%; right: 0; background: #1C2128;
          border: 1px solid #30363D; border-radius: 8px; width: 180px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.5); padding: 4px; margin-top: 4px;
        }
        .dropdown-item {
          display: flex; align-items: center; gap: 12px; width: 100%;
          padding: 10px 16px; border: none; background: transparent;
          color: #E6EDF3; font-size: 14px; cursor: pointer;
          border-radius: 6px; transition: all 0.2s;
        }
        .dropdown-item:hover { background: rgba(255, 255, 255, 0.05); }

        /* Cinematic Detail View Styles */
        .detail-modal { 
          max-width: 1400px; width: 95vw; height: 85vh; 
          flex-direction: row !important; border: none; background: #000 !important;
          display: flex; overflow: hidden;
        }
        .detail-media-side {
          flex: 7; background: #000; display: flex; align-items: center; justify-content: center;
          position: relative; overflow: hidden; height: 100%;
        }
        .detail-info-side {
          flex: 3; background: #1C2128; border-left: 1px solid #30363D;
          display: flex; flex-direction: column; height: 100%; min-width: 350px;
        }
        .detail-media-container { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .detail-media-container img, .detail-media-container video { 
          max-width: 100%; max-height: 100%; object-fit: contain; 
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }
        .info-header { padding: 16px 20px; border-bottom: 1px solid #30363D; display: flex; justify-content: space-between; align-items: center; }
        .info-body { padding: 20px; overflow-y: auto; flex: 1; display: flex; flex-direction: column; }
        .info-footer { padding: 0; border-top: none; }
        .author-info-large { display: flex; gap: 12px; align-items: center; }
        .avatar-large {
          width: 48px; height: 48px; background: #38434F; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-weight: bold; font-size: 20px; color: #58A6FF; overflow: hidden;
          flex-shrink: 0;
        }
        .avatar-large img { width: 100%; height: 100%; object-fit: cover; }
        .name-large { font-size: 16px; font-weight: 600; color: #E6EDF3; margin: 0; }
        .time-large { font-size: 12px; color: #8B949E; margin: 2px 0 0; }
        .detail-text { font-size: 16px; line-height: 1.6; color: #E6EDF3; margin-bottom: 20px; white-space: pre-wrap; }
        .modal-close-btn { background: transparent; border: none; color: #8B949E; cursor: pointer; padding: 8px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        .modal-close-btn:hover { background: rgba(255,255,255,0.1); color: #E6EDF3; }
        .dropdown-item.delete { color: #F85149; }
        .dropdown-item.delete:hover { background: rgba(248, 81, 73, 0.1); }

        .btn-icon { background: transparent; border: none; color: #8B949E; cursor: pointer; padding: 4px; border-radius: 4px; }
        .btn-icon:hover { background: rgba(255, 255, 255, 0.05); color: #F85149; }
        .btn-icon.active { background: rgba(255, 255, 255, 0.1); color: #58A6FF; }

        .detail-modal { 
          max-width: 1400px !important; width: 95vw !important; height: 85vh !important; 
          flex-direction: row !important; border: none !important; background: #000 !important;
        }
        .detail-media-side { flex: 7; background: #000; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; height: 100%; }
        .detail-info-side { flex: 3; background: #1C2128; border-left: 1px solid #30363D; display: flex; flex-direction: column; height: 100%; min-width: 350px; }
      `}</style>

        {/* Social List Modal */}
        <PeopleListModal 
          isOpen={showListModal}
          onClose={() => setShowListModal(false)}
          title={listType}
          data={listData}
          loading={listLoading}
          onToggleFollow={handleListFollowToggle}
          API_BASE={API_BASE}
        />

        {/* Likers List Modal (optional, but keep for consistency if needed) */}
        {/* Modals are ordered by stack priority (bottom to top) */}
        
        {/* Post Detail Modal */}
        {isDetailOpen && selectedPost && (
          <div className="modal-overlay" onClick={() => setIsDetailOpen(false)}>
            <div className="modal-content detail-modal" onClick={(e) => e.stopPropagation()}>
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

              <div className="detail-info-side">
                <div className="info-header">
                  <div className="author-info-large">
                    <div 
                      className="avatar-large clickable" 
                      onClick={() => navigate(`/profile/${profile.id}`)}
                    >
                      {profile.profilePicUrl ? (
                         <img src={`${API_BASE}${profile.profilePicUrl}`} alt={profile.fullName} className="avatar-img" />
                      ) : (
                         profile.fullName[0]
                      )}
                    </div>
                    <div>
                      <h4 
                        className="name-large clickable" 
                        onClick={() => navigate(`/profile/${profile.id}`)}
                      >
                        {profile.fullName}
                      </h4>
                      <p className="time-large">{formatDate(selectedPost.createdAt)}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {profile.isOwnProfile && (
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
                    <button className="modal-close-btn" onClick={() => setIsDetailOpen(false)}>
                      <X size={24} />
                    </button>
                  </div>
                </div>

                <div className="info-body">
                  <div className="detail-text">{selectedPost.content}</div>
                  
                  <div className="comments-section">
                    <h5 className="comments-title">Comments</h5>
                    <div className="comments-list">
                      {comments.length > 0 ? (
                        <>
                          {comments.map((comment) => (
                            <div key={comment.id} className="comment-item">
                              <div className="comment-avatar clickable" onClick={() => navigate(`/profile/${comment.userId}`)}>
                                {comment.profileImageUrl ? (
                                  <img src={`${API_BASE}${comment.profileImageUrl}`} alt={comment.fullName} className="avatar-img" />
                                ) : (
                                  comment.fullName[0]
                                )}
                              </div>
                              <div className="comment-content-wrap">
                                <div className="comment-bubble">
                                  <div className="comment-header">
                                    <span className="comment-author clickable" onClick={() => navigate(`/profile/${comment.userId}`)}>
                                      {comment.fullName}
                                    </span>
                                    <span className="comment-time">
                                      <Clock size={10} /> {formatCommentDate(comment.createdAt)}
                                    </span>
                                  </div>
                                  
                                  {editingCommentId === comment.id ? (
                                    <div className="edit-comment-form">
                                      <textarea 
                                        value={editCommentContent} 
                                        onChange={(e) => setEditCommentContent(e.target.value)}
                                        style={{ width: '100%', background: '#0D1117', border: '1px solid #30363D', borderRadius: '4px', color: '#E6EDF3', padding: '8px', fontSize: '13px' }}
                                      />
                                      <div className="edit-actions" style={{ display: 'flex', gap: '8px', marginTop: '8px', justifyContent: 'flex-end' }}>
                                        <button onClick={() => setEditingCommentId(null)}>Cancel</button>
                                        <button onClick={() => handleCommentEdit(comment.id, editCommentContent)}>Save</button>
                                      </div>
                                    </div>
                                  ) : (
                                    <p className="comment-text" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{comment.content}</p>
                                  )}
                                </div>
                                
                                {!editingCommentId && currentUser && 
                                 (String(comment.userId) === String(currentUser.id || currentUser.userId)) && (
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
                        <div className="empty-comments">
                          <MessageSquare size={32} style={{ opacity: 0.2, marginBottom: '12px' }} />
                          <p>No comments yet.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="detail-fixed-footer">
                  <form className="comment-input-form" onSubmit={handleCommentSubmit}>
                    <div className="comment-avatar-small">
                      {currentUserData && currentUserData.profilePicUrl ? (
                        <img src={`${API_BASE}${currentUserData.profilePicUrl}`} alt={currentUserData.fullName} className="avatar-img" />
                      ) : (
                        currentUserData?.fullName ? currentUserData.fullName[0] : (currentUser?.fullName ? currentUser.fullName[0] : "U")
                      )}
                    </div>
                    <div className="comment-input-wrap">
                      <input 
                        placeholder="Add a comment..." 
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        disabled={commentLoading}
                      />
                      <button type="submit" disabled={!newComment.trim() || commentLoading}>
                        <Send size={16} />
                      </button>
                    </div>
                  </form>
                  <div className="info-footer">
                    <div className="post-actions">
                      <button 
                        className={`footer-btn ${selectedPost.isLiked ? 'active' : ''}`} 
                        onClick={(e) => handleLike(e, selectedPost)}
                        disabled={likingIds.has(selectedPost.id)}
                      >
                        <ThumbsUp size={18} fill={selectedPost.isLiked ? "currentColor" : "none"} /> {selectedPost.isLiked ? "Liked" : "Like"}
                      </button>
                      <button className="footer-btn"><MessageSquare size={18} /> Comment</button>
                      <button className="footer-btn" onClick={(e) => handleShare(e, selectedPost)}><Share2 size={18} /> Share</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Likers List Modal */}
        {isLikesListOpen && (
          <div className="modal-overlay" onClick={() => setIsLikesListOpen(false)}>
            <div className="modal-content people-list-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
              <div className="modal-header">
                <h3>People who liked</h3>
                <button className="close-btn" onClick={() => setIsLikesListOpen(false)}><X size={20} /></button>
              </div>
              <div className="modal-body">
                <p style={{ textAlign: 'center', padding: '20px', color: '#8B949E' }}>Liking details available in post detail view.</p>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {isEditOpen && selectedPost && (
          <div className="modal-overlay">
            <div className="modal-content edit-modal" style={{ maxWidth: '700px' }}>
              <div className="modal-header">
                <h3>Edit Post</h3>
                <button className="close-btn" onClick={() => setIsEditOpen(false)}><X size={20} /></button>
              </div>
              <div className="modal-body">
                <textarea 
                  className="form-group"
                  style={{ width: '100%', minHeight: '120px', background: '#0D1117', border: '1px solid #30363D', borderRadius: '8px', padding: '16px', color: '#E6EDF3', fontSize: '16px', resize: 'none', outline: 'none' }}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="What's on your mind?"
                />
                
                {editMedia.length > 0 && (
                  <div className="media-preview-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '8px', marginTop: '16px' }}>
                    {editMedia.map((m, i) => (
                      <div key={i} className="preview-item" style={{ position: 'relative', aspectRatio: '1', background: '#000', borderRadius: '8px', overflow: 'hidden' }}>
                        {m.type === 'image' ? (
                          <img src={m.url} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <video src={m.url} controls style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        )}
                        <button 
                          className="remove-media-btn" 
                          onClick={() => removeEditMedia(i)}
                          style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer' }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="modal-actions" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button className="btn btn-ghost" onClick={() => editImageInputRef.current.click()} title="Add Photos">
                    <ImageIcon size={20} />
                  </button>
                  <button className="btn btn-ghost" onClick={() => editVideoInputRef.current.click()} title="Add Video">
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
            <div className="modal-content people-list-modal" style={{ maxWidth: '450px' }}>
              <div className="modal-header">
                <h3>Delete Post?</h3>
                <button className="close-btn" onClick={() => setIsDeleteConfirmOpen(false)}><X size={20} /></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete this post? This action cannot be undone.</p>
              </div>
              <div className="modal-actions">
                <button className="btn btn-ghost" onClick={() => setIsDeleteConfirmOpen(false)}>No, Keep it</button>
                <button className="btn btn-danger-soft" onClick={handleDeletePost}>Yes, Delete Post</button>
              </div>
            </div>
          </div>
        )}

        {/* Social List Modal */}
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

