import { useState, useRef, useEffect } from "react";
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
  Edit
} from "lucide-react";
import { useNotification } from "../App.jsx";
import postService from "../services/postService.js";

export default function Home() {
  const { showToast } = useNotification();
  const [posts, setPosts] = useState([]);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [content, setContent] = useState("");
  const [selectedMedia, setSelectedMedia] = useState([]); // Array of { url, type, file }
  const [mediaType, setMediaType] = useState(null); // 'image' or 'video'
  
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

  useEffect(() => {
    fetchFeed();
  }, []);

  const fetchFeed = async () => {
    try {
      setLoadingFeed(true);
      const data = await postService.getFeed();
      setPosts(data);
    } catch (error) {
      showToast("error", "Failed to load feed");
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
      const msg = error?.response?.data?.message || "Failed to create post";
      showToast("error", msg);
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
      showToast("error", "Failed to delete post");
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
      showToast("error", "Failed to update post");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (post) => {
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

  const openDeleteConfirm = (post) => {
    setSelectedPost(post);
    setIsDeleteConfirmOpen(true);
    setActiveDropdownId(null);
  };

  const openDetailView = (post) => {
    setSelectedPost(post);
    setIsDetailOpen(true);
  };

  const handleShare = async (e, post) => {
    e.stopPropagation();
    const url = `${window.location.origin}/post/${post.id}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast("success", "Link copied to clipboard!");
    } catch (err) {
      showToast("error", "Failed to copy link");
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

  const handleTextareaInput = (e) => {
    e.target.style.height = "auto";
    e.target.style.height = e.target.scrollHeight + "px";
  };

  return (
    <div className="container feed-grid">
      {/* Left Column: Profile & Analytics */}
      <aside className="left-col">
        <div className="card profile-card">
          <div className="profile-banner"></div>
          <div className="profile-info">
            <div className="profile-avatar-container">
              <div className="profile-avatar">CG</div>
            </div>
            <h3 className="profile-name">Cevin Gurung</h3>
            <p className="profile-role">Software Developer at ICP</p>
          </div>
          <div className="profile-stats">
            <div className="stat-item">
              <span className="stat-label">Profile viewers</span>
              <span className="stat-value">482</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Post impressions</span>
              <span className="stat-value">1,240</span>
            </div>
          </div>
          <div className="profile-footer">
            <a href="/profile">My items</a>
          </div>
        </div>
      </aside>

      {/* Middle Column: Feed */}
      <main className="middle-col">
        {/* Create Post Card */}
        <div className={`card create-post ${isCreatingPost ? 'expanded' : ''}`}>
          {!isCreatingPost ? (
            <div className="post-input-container">
              <div className="avatar-small">CG</div>
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
              const isOwner = post.user && (post.user.fullName === "Cevin Gurung");
              
              return (
                <div key={post.id} className="card post-card" onClick={() => openDetailView(post)}>
                  <div className="post-header">
                    <div className="post-author-avatar">
                      {post.user ? post.user.fullName[0] : "U"}
                    </div>
                    <div className="post-author-info">
                      <h4 className="author-name">{post.user ? post.user.fullName : "Unknown User"}</h4>
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
                              <button className="dropdown-item" onClick={() => openEditModal(post)}>
                                <Edit size={16} /> Edit Post
                              </button>
                              <button className="dropdown-item delete" onClick={() => openDeleteConfirm(post)}>
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
                    <div className={`post-media-display ${post.media[0].mediaType === 'IMAGE' ? `grid-${Math.min(post.media.length, 3)}` : 'video-display'}`} onClick={(e) => e.stopPropagation()}>
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
                    <span className="stat-pill"><ThumbsUp size={14} /> {post.likeCount || 0}</span>
                    <span className="stat-pill"><MessageSquare size={14} /> {post.commentCount || 0} comments</span>
                  </div>

                  <div className="post-footer">
                    <button className="footer-btn"><ThumbsUp size={20} /> Like</button>
                    <button className="footer-btn"><MessageSquare size={20} /> Comment</button>
                    <button className="footer-btn" onClick={(e) => handleShare(e, post)}><Share2 size={20} /> Share</button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Right Column: People You May Know */}
      <aside className="right-col">
        <div className="card suggestions-card">
          <h3 className="card-title">People you may know</h3>
          <div className="suggestions-list">
            {suggestions.map(person => (
              <div key={person.id} className="suggestion-item">
                <div className="suggestion-avatar">{person.name[0]}</div>
                <div className="suggestion-info">
                  <h4 className="suggestion-name">{person.name}</h4>
                  <p className="suggestion-role">{person.role}</p>
                  <button className="btn-follow">
                    <Plus size={16} /> Follow
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button className="btn-view-all">View all recommendations</button>
        </div>
      </aside>

      <style>{`
        .profile-card { padding: 0; position: sticky; top: 88px; }
        .profile-banner { height: 56px; background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%); }
        .profile-info { text-align: center; padding: 0 12px 16px; border-bottom: 1px solid var(--border); }
        .profile-avatar-container { margin-top: -32px; margin-bottom: 12px; display: flex; justify-content: center; }
        .profile-avatar {
          width: 72px; height: 72px; background: #38434F; border: 4px solid var(--card);
          border-radius: 50%; display: flex; align-items: center; justify-content: center;
          font-weight: bold; font-size: 24px; color: var(--text-primary);
        }
        .profile-name { font-size: 16px; margin: 0; color: var(--text-primary); }
        .profile-role { font-size: 12px; color: var(--text-secondary); margin: 4px 0 0; }
        .profile-stats { padding: 12px; border-bottom: 1px solid var(--border); }
        .stat-item { display: flex; justify-content: space-between; padding: 4px 0; font-size: 12px; }
        .stat-label { color: var(--text-secondary); }
        .stat-value { color: var(--primary); font-weight: 600; }
        .profile-footer { padding: 12px; font-size: 12px; }
        .profile-footer a { color: var(--text-primary); font-weight: 600; }

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
        .post-author-avatar { width: 48px; height: 48px; background: #38434F; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-weight: bold; color: var(--primary); }
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
        .footer-btn { flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px; background: transparent; border: none; color: var(--text-secondary); font-size: 14px; font-weight: 600; padding: 12px; border-radius: 4px; cursor: pointer; }
        .footer-btn:hover { background: rgba(255,255,255, 0.05); color: var(--primary); }

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
          background: rgba(0,0,0,0.8); backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center; z-index: 1000;
          padding: 20px;
        }
        .modal-content {
          background: var(--card); border: 1px solid var(--border);
          border-radius: 12px; width: 100%; max-height: 90vh; overflow: hidden;
          display: flex; flex-direction: column; box-shadow: 0 20px 50px rgba(0,0,0,0.5);
        }
        .confirm-modal { max-width: 450px; }
        .edit-modal { max-width: 700px; }
        .detail-modal { max-width: 800px; }
        
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
          width: 48px; height: 48px; background: #38434F; border-radius: 8px;
          display: flex; align-items: center; justify-content: center; font-weight: bold; color: var(--primary);
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
        
        .btn-error { background: var(--error); color: white; }
        .btn-error:hover { opacity: 0.9; }
        .modal-close-btn { background: transparent; border: none; color: var(--text-muted); cursor: pointer; display: flex; }
        .modal-close-btn:hover { color: var(--text-primary); }
      `}</style>
      {/* Detail Modal */}
      {isDetailOpen && selectedPost && (
        <div className="modal-overlay" onClick={() => setIsDetailOpen(false)}>
          <div className="modal-content detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="author-info-large">
                <div className="avatar-large">{selectedPost.user ? selectedPost.user.fullName[0] : "U"}</div>
                <div>
                  <h4 className="name-large">{selectedPost.user ? selectedPost.user.fullName : "Unknown User"}</h4>
                  <p className="time-large">{formatDate(selectedPost.createdAt)}</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setIsDetailOpen(false)}><X size={24} /></button>
            </div>
            <div className="modal-body">
              <p className="detail-text">{selectedPost.content}</p>
              {selectedPost.media && selectedPost.media.length > 0 && (
                <div className="detail-media-list">
                  {selectedPost.media.map(m => (
                    <div key={m.id} className="detail-media-item">
                      {m.mediaType === 'IMAGE' ? (
                        <img src={`${API_BASE}${m.mediaUrl}`} alt="full preview" />
                      ) : (
                        <video src={`${API_BASE}${m.mediaUrl}`} controls muted autoPlay loop />
                      )}
                    </div>
                  ))}
                </div>
              )}
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
    </div>
  );
}
