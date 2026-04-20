import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Send, Image as ImageIcon, Users, MessageSquare, Search, ArrowLeft, Plus, X } from "lucide-react";
import {
  getConversations, getMessages, sendMessageREST, uploadChatImage,
  connectWebSocket, subscribeToConversation, sendMessageWS, disconnectWebSocket,
  getOrCreateDM, createGroup
} from "../services/chatService";
import { getMutualConnections } from "../services/userService";
import { getUserInfo } from "../auth/auth";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8848";

export default function Messages() {
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobile, setShowMobile] = useState(false); // mobile: show chat panel
  const [showNewChat, setShowNewChat] = useState(false);
  const [connections, setConnections] = useState([]);
  const [connectionsLoading, setConnectionsLoading] = useState(false);
  const [connSearch, setConnSearch] = useState("");
  const [modalTab, setModalTab] = useState("dm"); // "dm" or "group"
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [msgPage, setMsgPage] = useState(0);
  const [hasMoreMsgs, setHasMoreMsgs] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const subscriptionRef = useRef(null);
  const isInitialLoad = useRef(true);

  const currentUser = getUserInfo();
  const currentUserId = currentUser?.userId;

  // Load conversations
  useEffect(() => {
    loadConversations();
  }, []);

  // Connect WebSocket
  useEffect(() => {
    connectWebSocket(
      () => setWsConnected(true),
      (err) => console.error("WS error:", err)
    );
    return () => disconnectWebSocket();
  }, []);

  // Auto-select conversation from URL param
  useEffect(() => {
    const convId = searchParams.get("conv");
    if (convId && conversations.length > 0) {
      const found = conversations.find(c => c.id === parseInt(convId));
      if (found) selectConversation(found);
    }
  }, [conversations, searchParams]);

  // Subscribe to active conversation via WebSocket
  useEffect(() => {
    if (!wsConnected || !activeConv) return;

    // Unsubscribe previous
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
    }

    subscriptionRef.current = subscribeToConversation(activeConv.id, (newMsg) => {
      setMessages(prev => {
        // Deduplicate by ID (use == for type-safe comparison)
        if (prev.some(m => String(m.id) === String(newMsg.id))) return prev;
        
        // If from current user, replace optimistic message (temp ID > 1 trillion)
        if (String(newMsg.senderId) === String(currentUserId)) {
          const optIdx = prev.findIndex(m => m.id > 1e12 && String(m.senderId) === String(currentUserId));
          if (optIdx !== -1) {
            const updated = [...prev];
            updated[optIdx] = newMsg;
            return updated;
          }
        }
        return [...prev, newMsg];
      });
    });

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [wsConnected, activeConv, currentUserId]);

  // Auto-scroll only on new messages (not when loading older ones)
  useEffect(() => {
    if (isInitialLoad.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
      isInitialLoad.current = false;
    } else if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      // Only auto-scroll if the latest message is from the current user or it's a new incoming message
      if (lastMsg.senderId === currentUserId || !loadingMore) {
        const container = chatContainerRef.current;
        if (container) {
          const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
          if (isNearBottom || lastMsg.senderId === currentUserId) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
          }
        }
      }
    }
  }, [messages]);

  const loadConversations = async () => {
    try {
      const data = await getConversations();
      setConversations(data);
    } catch (err) {
      console.error("Failed to load conversations:", err);
    } finally {
      setLoading(false);
    }
  };

  const openNewChatModal = async () => {
    setShowNewChat(true);
    setConnectionsLoading(true);
    try {
      const data = await getMutualConnections();
      setConnections(data);
    } catch (err) {
      console.error("Failed to load connections:", err);
    } finally {
      setConnectionsLoading(false);
    }
  };

  const startDMWith = async (userId) => {
    try {
      const conv = await getOrCreateDM(userId);
      setShowNewChat(false);
      setConnSearch("");
      await loadConversations();
      selectConversation(conv);
    } catch (err) {
      console.error("Failed to create DM:", err);
    }
  };

  const toggleMember = (userId) => {
    setSelectedMembers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedMembers.length < 1) return;
    try {
      const conv = await createGroup(groupName.trim(), selectedMembers);
      setShowNewChat(false);
      setGroupName("");
      setSelectedMembers([]);
      setModalTab("dm");
      setConnSearch("");
      await loadConversations();
      selectConversation(conv);
    } catch (err) {
      console.error("Failed to create group:", err);
    }
  };

  const selectConversation = async (conv) => {
    setActiveConv(conv);
    setShowMobile(true);
    setMsgLoading(true);
    setMsgPage(0);
    setHasMoreMsgs(true);
    isInitialLoad.current = true;
    try {
      const msgs = await getMessages(conv.id, 0, 20);
      setMessages(msgs);
      setHasMoreMsgs(msgs.length === 20);
    } catch (err) {
      console.error("Failed to load messages:", err);
    } finally {
      setMsgLoading(false);
    }
  };

  const loadMoreMessages = async () => {
    if (!activeConv || loadingMore || !hasMoreMsgs) return;
    const nextPage = msgPage + 1;
    setLoadingMore(true);
    try {
      const container = chatContainerRef.current;
      const prevScrollHeight = container?.scrollHeight || 0;

      const olderMsgs = await getMessages(activeConv.id, nextPage, 20);
      if (olderMsgs.length < 20) setHasMoreMsgs(false);
      if (olderMsgs.length > 0) {
        setMsgPage(nextPage);
        setMessages(prev => [...olderMsgs, ...prev]);

        // Restore scroll position after prepending
        requestAnimationFrame(() => {
          if (container) {
            container.scrollTop = container.scrollHeight - prevScrollHeight;
          }
        });
      }
    } catch (err) {
      console.error("Failed to load more messages:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleChatScroll = (e) => {
    const { scrollTop } = e.target;
    if (scrollTop < 100 && hasMoreMsgs && !loadingMore) {
      loadMoreMessages();
    }
  };

  const handleSend = useCallback(() => {
    if (!input.trim() || !activeConv) return;

    const text = input.trim();
    setInput("");

    // Optimistic add
    const optimistic = {
      id: Date.now(),
      conversationId: activeConv.id,
      senderId: currentUserId,
      senderName: currentUser?.fullName || "You",
      senderAvatar: null,
      content: text,
      messageType: "TEXT",
      mediaUrl: null,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);

    // Send via WebSocket if connected, else fallback to REST
    if (wsConnected) {
      sendMessageWS(activeConv.id, text);
    } else {
      sendMessageREST(activeConv.id, text).catch(console.error);
    }
  }, [input, activeConv, wsConnected, currentUserId, currentUser]);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeConv) return;

    try {
      const msg = await uploadChatImage(activeConv.id, file);
      // Add only if not already added by WebSocket broadcast
      setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
    } catch (err) {
      console.error("Image upload failed:", err);
    }
    e.target.value = "";
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getConvName = (conv) => {
    if (conv.isGroup) return conv.name || "Group";
    const other = conv.members?.find(m => m.userId !== currentUserId);
    return other?.fullName || "Chat";
  };

  const getConvAvatar = (conv) => {
    if (conv.isGroup) return null;
    const other = conv.members?.find(m => m.userId !== currentUserId);
    return other?.profileImageUrl;
  };

  const getConvInitial = (conv) => {
    const name = getConvName(conv);
    return name.charAt(0).toUpperCase();
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "now";
    if (diffMins < 60) return `${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d`;
  };

  const filteredConvs = conversations.filter(c =>
    getConvName(c).toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="messages-page container">
      <div className="messenger-layout">
        {/* Left Sidebar */}
        <div className={`conv-sidebar ${showMobile ? "hide-mobile" : ""}`}>
          <div className="sidebar-header">
            <h2>Messages</h2>
            <button className="new-chat-btn" onClick={openNewChatModal} title="New conversation">
              <Plus size={20} />
            </button>
          </div>

          <div className="sidebar-search">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="conv-list">
            {loading ? (
              <div className="conv-loading"><div className="spinner"></div></div>
            ) : filteredConvs.length === 0 ? (
              <div className="conv-empty">
                <MessageSquare size={40} />
                <p>No conversations yet</p>
                <span>Message a connection to start chatting</span>
              </div>
            ) : (
              filteredConvs.map(conv => (
                <div
                  key={conv.id}
                  className={`conv-item ${activeConv?.id === conv.id ? "active" : ""}`}
                  onClick={() => selectConversation(conv)}
                >
                  <div className="conv-avatar">
                    {getConvAvatar(conv) ? (
                      <img src={`${API_BASE}${getConvAvatar(conv)}`} alt="" />
                    ) : (
                      <span className="conv-avatar-placeholder">
                        {conv.isGroup ? <Users size={20} /> : getConvInitial(conv)}
                      </span>
                    )}
                  </div>
                  <div className="conv-info">
                    <div className="conv-name-row">
                      <span className="conv-name">{getConvName(conv)}</span>
                      <span className="conv-time">{formatTime(conv.lastMessageAt)}</span>
                    </div>
                    <p className="conv-preview">
                      {conv.lastMessage?.content || (conv.lastMessage?.messageType === "IMAGE" ? "📷 Image" : "Start chatting...")}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Chat Panel */}
        <div className={`chat-panel ${!showMobile ? "hide-mobile" : ""}`}>
          {activeConv ? (
            <>
              <div className="chat-header">
                <button className="back-btn-mobile" onClick={() => setShowMobile(false)}>
                  <ArrowLeft size={20} />
                </button>
                <div className="chat-header-avatar">
                  {getConvAvatar(activeConv) ? (
                    <img src={`${API_BASE}${getConvAvatar(activeConv)}`} alt="" />
                  ) : (
                    <span className="conv-avatar-placeholder small">
                      {activeConv.isGroup ? <Users size={16} /> : getConvInitial(activeConv)}
                    </span>
                  )}
                </div>
                <div className="chat-header-info">
                  <h3>{getConvName(activeConv)}</h3>
                  <span className="ws-status">{wsConnected ? "● Online" : "○ Connecting..."}</span>
                </div>
              </div>

              <div className="chat-messages" ref={chatContainerRef} onScroll={handleChatScroll}>
                {loadingMore && (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '12px' }}>
                    <div className="spinner"></div>
                  </div>
                )}
                {msgLoading ? (
                  <div className="conv-loading"><div className="spinner"></div></div>
                ) : messages.length === 0 ? (
                  <div className="chat-empty">
                    <MessageSquare size={48} />
                    <p>No messages yet. Say hello! 👋</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.senderId === currentUserId;
                    return (
                      <div key={msg.id} className={`msg-row ${isMe ? "me" : "them"}`}>
                        {!isMe && (
                          <div className="msg-avatar">
                            {msg.senderAvatar ? (
                              <img src={`${API_BASE}${msg.senderAvatar}`} alt="" />
                            ) : (
                              <span>{msg.senderName?.charAt(0)}</span>
                            )}
                          </div>
                        )}
                        <div className={`msg-bubble ${isMe ? "bubble-me" : "bubble-them"}`}>
                          {!isMe && activeConv.isGroup && (
                            <span className="msg-sender-name">{msg.senderName}</span>
                          )}
                          {msg.messageType === "IMAGE" && msg.mediaUrl ? (
                            <img src={`${API_BASE}${msg.mediaUrl}`} alt="shared" className="msg-image" />
                          ) : (
                            <p>{msg.content}</p>
                          )}
                          <span className="msg-time">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="chat-input-bar">
                <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleImageUpload} />
                <button className="input-action" onClick={() => fileInputRef.current?.click()} title="Send image">
                  <ImageIcon size={20} />
                </button>
                <input
                  type="text"
                  className="chat-input"
                  placeholder="Type a message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <button className="input-send" onClick={handleSend} disabled={!input.trim()}>
                  <Send size={20} />
                </button>
              </div>
            </>
          ) : (
            <div className="chat-placeholder">
              <MessageSquare size={64} />
              <h2>Welcome to Messages</h2>
              <p>Select a conversation or message a connection to start chatting.</p>
            </div>
          )}
        </div>
      </div>

      {/* New Chat Modal */}
      {showNewChat && (
        <div className="modal-overlay" onClick={() => setShowNewChat(false)}>
          <div className="modal-content people-list-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{modalTab === 'dm' ? 'New Message' : 'New Group'}</h3>
              <button className="toast-close" onClick={() => { setShowNewChat(false); setModalTab('dm'); setSelectedMembers([]); setGroupName(''); }}><X size={20} /></button>
            </div>

            {/* Tabs */}
            <div className="modal-tabs">
              <button className={`modal-tab ${modalTab === 'dm' ? 'active' : ''}`} onClick={() => { setModalTab('dm'); setSelectedMembers([]); setGroupName(''); }}>
                <MessageSquare size={14} /> Direct
              </button>
              <button className={`modal-tab ${modalTab === 'group' ? 'active' : ''}`} onClick={() => setModalTab('group')}>
                <Users size={14} /> Group
              </button>
            </div>

            {/* Group Name Input */}
            {modalTab === 'group' && (
              <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>
                <input
                  type="text"
                  className="chat-input"
                  placeholder="Group name..."
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  style={{ width: '100%', borderRadius: '8px' }}
                />
              </div>
            )}

            {/* Search */}
            <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>
              <div className="sidebar-search" style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 12px' }}>
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search connections..."
                  value={connSearch}
                  onChange={(e) => setConnSearch(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            {/* Selected members pills (group mode) */}
            {modalTab === 'group' && selectedMembers.length > 0 && (
              <div className="selected-pills">
                {selectedMembers.map(id => {
                  const u = connections.find(c => c.id === id);
                  return u ? (
                    <span key={id} className="member-pill" onClick={() => toggleMember(id)}>
                      {u.fullName} <X size={12} />
                    </span>
                  ) : null;
                })}
              </div>
            )}

            <div className="modal-body">
              <div className="scrollable-list">
                {connectionsLoading ? (
                  <div className="list-loading"><div className="spinner"></div></div>
                ) : connections.filter(c => c.fullName.toLowerCase().includes(connSearch.toLowerCase())).length === 0 ? (
                  <div className="empty-list">No mutual connections found</div>
                ) : (
                  connections
                    .filter(c => c.fullName.toLowerCase().includes(connSearch.toLowerCase()))
                    .map(user => (
                      <div
                        key={user.id}
                        className={`person-row ${modalTab === 'group' && selectedMembers.includes(user.id) ? 'selected' : ''}`}
                        onClick={() => modalTab === 'dm' ? startDMWith(user.id) : toggleMember(user.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        {modalTab === 'group' && (
                          <div className={`member-check ${selectedMembers.includes(user.id) ? 'checked' : ''}`}>
                            {selectedMembers.includes(user.id) && '✓'}
                          </div>
                        )}
                        <div className="person-info">
                          <div className="person-pfp">
                            {user.profileImageUrl ? (
                              <img src={`${API_BASE}${user.profileImageUrl}`} alt="" className="avatar-img" />
                            ) : (
                              <span className="pfp-placeholder-sm">{user.fullName.charAt(0)}</span>
                            )}
                          </div>
                          <div className="person-meta">
                            <span className="person-name">{user.fullName}</span>
                            <span className="person-username">@{user.userName}</span>
                          </div>
                        </div>
                        {modalTab === 'dm' && (
                          <span style={{ fontSize: '12px', color: 'var(--primary)' }}>Message</span>
                        )}
                      </div>
                    ))
                )}
              </div>
            </div>

            {/* Create Group Button */}
            {modalTab === 'group' && (
              <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)' }}>
                <button
                  className="btn btn-primary"
                  style={{ width: '100%', borderRadius: '8px', padding: '10px', fontSize: '14px' }}
                  onClick={handleCreateGroup}
                  disabled={!groupName.trim() || selectedMembers.length < 1}
                >
                  <Users size={16} /> Create Group ({selectedMembers.length} members)
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        .messages-page { padding-top: 16px; height: calc(100vh - var(--nav-height) - 16px); }
        .messenger-layout {
          display: flex; height: 100%; border-radius: 12px; overflow: hidden;
          border: 1px solid var(--border); background: var(--card);
        }

        /* Sidebar */
        .conv-sidebar {
          width: 340px; min-width: 340px; border-right: 1px solid var(--border);
          display: flex; flex-direction: column; background: #161B22;
        }
        .sidebar-header {
          padding: 20px; border-bottom: 1px solid var(--border);
          display: flex; align-items: center; justify-content: space-between;
        }
        .sidebar-header h2 { margin: 0; font-size: 1.25rem; font-weight: 700; }
        .new-chat-btn {
          background: rgba(88, 166, 255, 0.1); border: 1px solid rgba(88, 166, 255, 0.3);
          color: var(--primary); width: 36px; height: 36px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center; cursor: pointer;
          transition: all 0.2s;
        }
        .new-chat-btn:hover { background: rgba(88, 166, 255, 0.2); transform: scale(1.1); }
        .sidebar-search {
          padding: 12px 16px; display: flex; align-items: center; gap: 8px;
          border-bottom: 1px solid var(--border);
        }
        .sidebar-search input {
          flex: 1; background: transparent; border: none; color: var(--text-primary);
          outline: none; font-size: 14px;
        }
        .sidebar-search svg { color: var(--text-muted); }

        .conv-list { flex: 1; overflow-y: auto; }
        .conv-item {
          display: flex; align-items: center; gap: 12px; padding: 14px 16px;
          cursor: pointer; transition: background 0.15s; border-left: 3px solid transparent;
        }
        .conv-item:hover { background: rgba(88, 166, 255, 0.05); }
        .conv-item.active {
          background: rgba(88, 166, 255, 0.1); border-left-color: var(--primary);
        }
        .conv-avatar {
          width: 48px; height: 48px; border-radius: 50%; overflow: hidden;
          background: #38434F; border: 1px solid var(--border); flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
        }
        .conv-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .conv-avatar-placeholder {
          font-size: 18px; font-weight: 700; color: var(--primary);
          display: flex; align-items: center; justify-content: center;
          width: 100%; height: 100%;
        }
        .conv-avatar-placeholder.small { font-size: 14px; }
        .conv-info { flex: 1; min-width: 0; }
        .conv-name-row { display: flex; justify-content: space-between; align-items: center; }
        .conv-name { font-weight: 600; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .conv-time { font-size: 12px; color: var(--text-muted); flex-shrink: 0; }
        .conv-preview {
          margin: 4px 0 0; font-size: 13px; color: var(--text-secondary);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .conv-loading { display: flex; justify-content: center; padding: 40px; }
        .conv-empty {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: 60px 20px; color: var(--text-muted); text-align: center; gap: 8px;
        }
        .conv-empty p { font-weight: 600; margin: 8px 0 0; }
        .conv-empty span { font-size: 13px; }

        /* Chat Panel */
        .chat-panel {
          flex: 1; display: flex; flex-direction: column; background: #0D1117;
        }
        .chat-header {
          padding: 16px 20px; border-bottom: 1px solid var(--border);
          display: flex; align-items: center; gap: 12px; background: #161B22;
        }
        .back-btn-mobile { display: none; background: none; border: none; color: var(--text-primary); cursor: pointer; }
        .chat-header-avatar {
          width: 40px; height: 40px; border-radius: 50%; overflow: hidden;
          background: #38434F; border: 1px solid var(--border); flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
        }
        .chat-header-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .chat-header-info h3 { margin: 0; font-size: 15px; font-weight: 700; }
        .ws-status { font-size: 12px; color: var(--success); }

        .chat-messages {
          flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 8px;
        }
        .chat-empty {
          flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
          color: var(--text-muted); gap: 12px;
        }
        .chat-empty p { font-size: 15px; }

        .msg-row { display: flex; gap: 8px; max-width: 75%; }
        .msg-row.me { margin-left: auto; flex-direction: row-reverse; }
        .msg-row.them { margin-right: auto; }
        .msg-avatar {
          width: 32px; height: 32px; border-radius: 50%; overflow: hidden;
          background: #38434F; flex-shrink: 0; display: flex; align-items: center;
          justify-content: center; font-size: 13px; color: var(--primary); font-weight: 600;
        }
        .msg-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .msg-bubble {
          padding: 10px 14px; border-radius: 16px; position: relative;
          max-width: 100%; word-wrap: break-word;
        }
        .msg-bubble p { margin: 0; font-size: 14px; line-height: 1.5; }
        .bubble-me {
          background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white;
          border-bottom-right-radius: 4px;
        }
        .bubble-them {
          background: #1C2128; border: 1px solid var(--border); color: var(--text-primary);
          border-bottom-left-radius: 4px;
        }
        .msg-sender-name { font-size: 11px; color: var(--primary); font-weight: 700; display: block; margin-bottom: 4px; }
        .msg-time { font-size: 11px; opacity: 0.6; display: block; text-align: right; margin-top: 4px; }
        .msg-image { max-width: 260px; border-radius: 12px; cursor: pointer; display: block; }

        /* Input Bar */
        .chat-input-bar {
          padding: 16px 20px; border-top: 1px solid var(--border); display: flex;
          align-items: center; gap: 10px; background: #161B22;
        }
        .chat-input {
          flex: 1; background: #38434F; border: 1px solid var(--border); border-radius: 24px;
          padding: 10px 16px; color: var(--text-primary); outline: none; font-size: 14px;
          transition: border-color 0.2s;
        }
        .chat-input:focus { border-color: var(--primary); }
        .input-action {
          background: none; border: none; color: var(--text-secondary); cursor: pointer;
          padding: 8px; border-radius: 50%; transition: all 0.2s;
        }
        .input-action:hover { background: rgba(88, 166, 255, 0.1); color: var(--primary); }
        .input-send {
          background: var(--primary); border: none; color: white; padding: 10px;
          border-radius: 50%; cursor: pointer; transition: all 0.2s;
          display: flex; align-items: center; justify-content: center;
        }
        .input-send:hover { background: #4a94e8; transform: scale(1.05); }
        .input-send:disabled { opacity: 0.4; cursor: default; transform: none; }

        /* Placeholder */
        .chat-placeholder {
          flex: 1; display: flex; flex-direction: column; align-items: center;
          justify-content: center; color: var(--text-muted); gap: 16px; text-align: center;
        }
        .chat-placeholder h2 { margin: 0; font-size: 1.5rem; color: var(--text-primary); }
        .chat-placeholder p { font-size: 15px; max-width: 300px; }

        /* Modal Tabs */
        .modal-tabs {
          display: flex; border-bottom: 1px solid var(--border);
        }
        .modal-tab {
          flex: 1; padding: 10px; background: none; border: none; color: var(--text-secondary);
          cursor: pointer; font-size: 13px; font-weight: 600; display: flex; align-items: center;
          justify-content: center; gap: 6px; transition: all 0.2s;
          border-bottom: 2px solid transparent;
        }
        .modal-tab:hover { color: var(--text-primary); background: rgba(88, 166, 255, 0.05); }
        .modal-tab.active { color: var(--primary); border-bottom-color: var(--primary); }

        /* Selected Pills */
        .selected-pills {
          padding: 8px 16px; display: flex; flex-wrap: wrap; gap: 6px;
          border-bottom: 1px solid var(--border);
        }
        .member-pill {
          background: rgba(88, 166, 255, 0.15); color: var(--primary); padding: 4px 10px;
          border-radius: 16px; font-size: 12px; font-weight: 600; cursor: pointer;
          display: flex; align-items: center; gap: 4px; transition: all 0.2s;
        }
        .member-pill:hover { background: rgba(248, 81, 73, 0.15); color: var(--error); }

        /* Member Checkboxes */
        .member-check {
          width: 20px; height: 20px; border-radius: 50%; border: 2px solid var(--border);
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
          font-size: 12px; color: white; transition: all 0.2s;
        }
        .member-check.checked {
          background: var(--primary); border-color: var(--primary);
        }
        .person-row.selected { background: rgba(88, 166, 255, 0.05); }

        /* Mobile */
        @media (max-width: 768px) {
          .conv-sidebar { width: 100%; min-width: 0; }
          .hide-mobile { display: none !important; }
          .back-btn-mobile { display: block; }
        }
      `}</style>
    </div>
  );
}
