import { 
  Camera, 
  Image as ImageIcon, 
  Video, 
  Calendar, 
  MoreHorizontal, 
  ThumbsUp, 
  MessageSquare, 
  Share2, 
  Plus 
} from "lucide-react";

export default function Home() {
  // Mock data for "People you may know"
  const suggestions = [
    { id: 1, name: "Prabin Thapa", role: "Frontend Developer", mutual: 12 },
    { id: 2, name: "Shreeya Sharma", role: "UI/UX Designer", mutual: 5 },
    { id: 3, name: "Anish Gupta", role: "Software Engineer", mutual: 8 },
  ];

  // Mock data for Feed
  const posts = [
    {
      id: 1,
      author: "Cevin Gurung",
      role: "AI Engineer | Web Developer",
      content: "Just finished major UI updates for ICP Connect! Using Dark Developer UI theme for a premium look and feel. #webdev #coding #uiux",
      time: "2h",
      likes: 42,
      comments: 12
    },
    {
      id: 2,
      author: "ICP Connect",
      role: "The Decentralized Talent Network",
      content: "Welcome to the future of professional networking. Join the community and connect with developers worldwide on the Internet Computer Protocol.",
      time: "5h",
      likes: 128,
      comments: 34
    }
  ];

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
        <div className="card create-post">
          <div className="post-input-container">
            <div className="avatar-small">CG</div>
            <button className="post-trigger-btn">Start a post</button>
          </div>
          <div className="post-actions">
            <button className="post-action-btn"><ImageIcon size={20} color="#378fe9" /> Photo</button>
            <button className="post-action-btn"><Video size={20} color="#5f9b41" /> Video</button>
            <button className="post-action-btn"><Calendar size={20} color="#c37d16" /> Event</button>
          </div>
        </div>

        {/* Feed Posts */}
        <div className="feed-list">
          {posts.map(post => (
            <div key={post.id} className="card post-card">
              <div className="post-header">
                <div className="post-author-avatar">{post.author[0]}</div>
                <div className="post-author-info">
                  <h4 className="author-name">{post.author}</h4>
                  <p className="author-role">{post.role}</p>
                  <p className="post-time">{post.time} • 🌐</p>
                </div>
                <button className="btn-more"><MoreHorizontal size={20} /></button>
              </div>
              <div className="post-content">
                <p>{post.content}</p>
              </div>
              <div className="post-stats">
                <span className="likes-count"><ThumbsUp size={14} className="like-icon-mini" /> {post.likes}</span>
                <span className="comments-count">{post.comments} comments</span>
              </div>
              <div className="post-footer-actions">
                <button className="action-btn"><ThumbsUp size={20} /> Like</button>
                <button className="action-btn"><MessageSquare size={20} /> Comment</button>
                <button className="action-btn"><Share2 size={20} /> Share</button>
              </div>
            </div>
          ))}
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
        .profile-card {
          padding: 0;
          position: sticky;
          top: 88px;
        }
        .profile-banner {
          height: 56px;
          background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
        }
        .profile-info {
          text-align: center;
          padding: 0 12px 16px;
          border-bottom: 1px solid var(--border);
        }
        .profile-avatar-container {
          margin-top: -32px;
          margin-bottom: 12px;
          display: flex;
          justify-content: center;
        }
        .profile-avatar {
          width: 72px;
          height: 72px;
          background: #38434F;
          border: 4px solid var(--card);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 24px;
          color: var(--text-primary);
        }
        .profile-name {
          font-size: 16px;
          margin: 0;
          color: var(--text-primary);
        }
        .profile-role {
          font-size: 12px;
          color: var(--text-secondary);
          margin: 4px 0 0;
        }
        .profile-stats {
          padding: 12px;
          border-bottom: 1px solid var(--border);
        }
        .stat-item {
          display: flex;
          justify-content: space-between;
          padding: 4px 0;
          font-size: 12px;
        }
        .stat-label {
          color: var(--text-secondary);
        }
        .stat-value {
          color: var(--primary);
          font-weight: 600;
        }
        .profile-footer {
          padding: 12px;
          font-size: 12px;
        }
        .profile-footer a {
          color: var(--text-primary);
          font-weight: 600;
        }

        .create-post {
          margin-bottom: 16px;
        }
        .post-input-container {
          display: flex;
          gap: 12px;
          margin-bottom: 12px;
        }
        .avatar-small {
          width: 48px;
          height: 48px;
          background: #38434F;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
        }
        .post-trigger-btn {
          flex: 1;
          background: transparent;
          border: 1px solid var(--border);
          border-radius: 35px;
          text-align: left;
          padding: 0 16px;
          color: var(--text-secondary);
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }
        .post-trigger-btn:hover {
          background: rgba(255, 255, 255, 0.05);
        }
        .post-actions {
          display: flex;
          justify-content: space-between;
        }
        .post-action-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: transparent;
          border: none;
          color: var(--text-secondary);
          font-size: 14px;
          font-weight: 600;
          padding: 8px 12px;
          border-radius: 4px;
          cursor: pointer;
        }
        .post-action-btn:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .post-card {
          margin-bottom: 12px;
          padding: 0;
        }
        .post-header {
          padding: 12px 16px;
          display: flex;
          gap: 12px;
          position: relative;
        }
        .post-author-avatar {
          width: 48px;
          height: 48px;
          background: var(--primary);
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
        }
        .post-author-info {
          flex: 1;
        }
        .author-name {
          margin: 0;
          font-size: 14px;
          color: var(--text-primary);
        }
        .author-role {
          margin: 0;
          font-size: 12px;
          color: var(--text-secondary);
        }
        .post-time {
          margin: 0;
          font-size: 12px;
          color: var(--text-muted);
        }
        .btn-more {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 4px;
        }
        .post-content {
          padding: 4px 16px 12px;
          font-size: 14px;
          color: var(--text-primary);
        }
        .post-stats {
          padding: 8px 16px;
          border-bottom: 1px solid var(--border);
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: var(--text-secondary);
        }
        .like-icon-mini {
          color: var(--primary);
          background: rgba(88, 166, 255, 0.1);
          border-radius: 50%;
          padding: 2px;
        }
        .post-footer-actions {
          display: flex;
          padding: 4px;
        }
        .action-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: transparent;
          border: none;
          color: var(--text-secondary);
          font-size: 14px;
          font-weight: 600;
          padding: 12px;
          border-radius: 4px;
          cursor: pointer;
        }
        .action-btn:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .suggestions-card {
           padding: 12px;
           position: sticky;
           top: 88px;
        }
        .card-title {
          font-size: 16px;
          margin: 0 0 16px;
          font-weight: 600;
        }
        .suggestion-item {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
        }
        .suggestion-avatar {
          width: 48px;
          height: 48px;
          background: #38434F;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .suggestion-name {
          margin: 0;
          font-size: 14px;
          color: var(--text-primary);
        }
        .suggestion-role {
          margin: 0;
          font-size: 12px;
          color: var(--text-secondary);
          margin-bottom: 8px;
        }
        .btn-follow {
          display: flex;
          align-items: center;
          gap: 4px;
          background: transparent;
          border: 1px solid var(--success);
          color: var(--success);
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-follow:hover {
          background: rgba(63, 185, 80, 0.1);
          border-width: 2px;
        }
        .btn-view-all {
          width: 100%;
          background: transparent;
          border: none;
          color: var(--text-secondary);
          font-weight: 600;
          padding: 8px;
          margin-top: 8px;
          cursor: pointer;
          border-radius: 4px;
        }
        .btn-view-all:hover {
          background: rgba(255, 255, 255, 0.05);
        }
      `}</style>
    </div>
  );
}
