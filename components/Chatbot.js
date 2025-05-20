import React, { useState, useRef, useEffect } from 'react';
import { BsRobot } from 'react-icons/bs';
import { MdCloudUpload, MdDownload, MdCancel } from 'react-icons/md';
import { FaUser} from 'react-icons/fa';
import { BiSolidHomeSmile } from "react-icons/bi";
import { ToastContainer, toast } from 'react-toastify';
import { TbMessageChatbotFilled } from "react-icons/tb";
import 'react-toastify/dist/ReactToastify.css';
import WatchProductDemoForm from './WatchProductDemoForm';
import ScheduleDiscussionForm from './ScheduleDiscussionForm';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      from: 'bot',
      text: "Hi there! 😊 I'm GenZi, your AI assistant. How can I help you today?",
      timestamp: new Date().toISOString(),
      user_text: "", // Add this property to match backend expectations
      bot_response: "Hi there! 😊 I'm GenZi, your AI assistant. How can I help you today?", 
    }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [formTab, setFormTab] = useState('demo');
  const [suggestions, setSuggestions] = useState([
    "What services do you offer?",
    "Tell me about Techgenzi",
    "Can I see a demo?",
  ]);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const toggleChat = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    document.body.classList.toggle('chatbot-open');
    
    if (newState && messages.length === 0) {
      setMessages([{
        from: 'bot',
        text: "Hi there! 😊 I'm GenZi, your AI assistant. How can I help you today?",
        timestamp: new Date().toISOString()
      }]);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const simulateTyping = async () => {
    setIsTyping(true);
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
  };

  const sendMessage = async (messageText) => {
    if (!messageText.trim() || isTyping) return;

    const userMessage = {
      from: 'user',
      text: messageText,
      timestamp: new Date().toISOString(),
      user_text: messageText,
    };
    setMessages(prev => [...prev, userMessage]);
    setUserInput('');
    
    await simulateTyping();

    try {
      const response = await fetch('http://localhost:5000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText }),
      });

      if (!response.ok) throw new Error('Server error');

      const data = await response.json();

      await new Promise(resolve => setTimeout(resolve, 300));

      const botMessage = {
        from: 'bot',
        text: data.response || "Hmm, I'm not sure I understood that. Could you try again?",
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, botMessage]);
      
      if (data.suggestions) {
        setSuggestions(data.suggestions);
      }
      
      setIsTyping(false);
    } catch (error) {
      console.error('Error:', error);
          const errorMessage = {
        from: 'bot',
        text: "Sorry, I'm having some trouble right now. Could you try again in a moment?",
        timestamp: new Date().toISOString(),
        bot_response: "Sorry, I'm having some trouble right now. Could you try again in a moment?",
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsTyping(false);
    }
  };

  const handleFormSubmit = () => {
    setShowForm(false);
  };

  const handleFormCancel = () => {
    setShowForm(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(userInput);
  };

  const handleSuggestionClick = (suggestion) => {
    if (suggestion.includes('request a demo') || suggestion.includes('Can I see a demo?')) {
      setShowForm(true);
      setFormTab('demo');
    } else if (suggestion.includes('schedule a discussion')) {
      setShowForm(true);
      setFormTab('discussion');
    } else {
      sendMessage(suggestion);
    }
  };

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch('http://localhost:5000/messages');
        const data = await response.json();
        if (data.length > 0) {
          setMessages(data);
        }
      } catch (err) {
        console.error('Error fetching messages:', err);
      }
    };

    fetchMessages();
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || uploading) return;

    const formData = new FormData();
    formData.append('file', file);

    const userMessage = {
      from: 'user',
      text: `Uploaded: ${file.name}`,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);
    
    await simulateTyping();
    setUploading(true);

    try {
      const response = await fetch('http://localhost:5000/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const botMessage = {
          from: 'bot',
          text: 'Got it! I\'m processing your file. This might take a moment...',
          timestamp: new Date().toISOString()
        };
        setUploadedFiles(prev => [...prev, file.name]);
        setMessages(prev => [...prev, botMessage]);
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = {
        from: 'bot',
        text: 'Oops! There was a problem uploading your file. Please try again.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setUploading(false);
      setIsTyping(false);
    }
  };
  // Save chat history
  const saveChatHistory = () => {
    const chatText = messages.map(m =>
      `${m.from.toUpperCase()} [${formatTime(m.timestamp)}]: ${m.text}`
    ).join('\n\n');

    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat_history_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Chat history downloaded!');
  };

  const navigateToHome = () => {
    setActiveTab('home');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="chatbot-wrapper">
      <div className={`chatbot-toggle ${isOpen ? 'open' : ''}`} onClick={toggleChat}>
        <BsRobot size={30} color="#fff" />
        {!isOpen && messages.length > 0 && (
          <span className="notification-badge">{messages.length}</span>
        )}
      </div>

      {isOpen && (
        <div className="chatbot-container">
          <div className="chatbot-header">
            <span>GenZi Assistant</span>
            <div className="chatbot-controls">
              <button onClick={saveChatHistory} className="icon-button" title="Download chat">
                <MdDownload size={20} />
              </button>
              <button onClick={toggleChat} className="icon-button" title="Close chat">
                <MdCancel size={20} />
              </button>
            </div>
          </div>

          <div className="chatbot-tabs">
            <button 
              style={{ padding: '8px 71px' }}
              className={`tab-button ${activeTab === 'home' ? 'active' : ''}`} 
              onClick={() => setActiveTab('home')}
            >
              <BiSolidHomeSmile  size={25} width={49}/>
            </button>
            <button 
              style={{ padding: '8px 75px', justifyContent: 'center', textAlign: 'float' }}
              className={`tab-button ${activeTab === 'messages' ? 'active' : ''}`} 
              onClick={() => setActiveTab('messages')}
            >
              <TbMessageChatbotFilled size={25} />
            </button>
          </div>

          <div className="chatbot-messages">
            {activeTab === 'home' && (
              <>
                {messages.map((msg, i) => (
                  <div key={i} className={`message-row ${msg.from}`}>
                    <div className="avatar">
                      {msg.from === 'bot' ? <BsRobot /> : <FaUser />}
                    </div>
                    <div className={`message-bubble ${msg.from}`}>
                      <div className="message-text">{msg.text}</div>
                      <div className="message-time">{formatTime(msg.timestamp)}</div>
                    </div>
                  </div>
                ))}

                {suggestions.length > 0 && (
                  <div className="suggestions-container">
                    {suggestions.map((text, i) => (
                      <button
                        key={i}
                        className="suggestion-button"
                        onClick={() => handleSuggestionClick(text)}
                        disabled={isTyping}
                      >
                        {text}
                      </button>
                    ))}
                  </div>
                )}

                {showForm && (
                  <div className="form-popup">
                    <div className="tab-buttons">
                      <button 
                        className={`tab-button ${formTab === 'demo' ? 'active' : ''}`} 
                        onClick={() => setFormTab('demo')}
                      >
                        Watch Product Demo
                      </button>
                      <button 
                        className={`tab-button ${formTab === 'discussion' ? 'active' : ''}`} 
                        onClick={() => setFormTab('discussion')}
                      >
                        Schedule a Discussion
                      </button>
                    </div>
                    {formTab === 'demo' ? (
                      <WatchProductDemoForm 
                        onSubmit={handleFormSubmit} 
                        onCancel={handleFormCancel} 
                      />
                    ) : (
                      <ScheduleDiscussionForm 
                        onSubmit={handleFormSubmit} 
                        onCancel={handleFormCancel} 
                      />
                    )}
                  </div>
                )}

                {isTyping && (
                  <div className="message-row bot">
                    <div className="avatar"><BsRobot /></div>
                    <div className="message-bubble bot typing-dots">
                      <span></span><span></span><span></span>
                    </div>
                  </div>
                )}

                {uploadedFiles.length > 0 && (
                  <div className="uploaded-files-section">
                    <div className="section-header">Uploaded Files</div>
                    <div className="files-list">
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="file-item">
                          <span className="file-name">{file}</span>
                          <span className="file-status">✓ Processed</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}

            {activeTab === 'messages' && (
              <div className="chat-history">
                <h2>Chat History</h2>
                {messages.map((msg, i) => (
                  <div key={i} className={`message-row ${msg.from}`}>
                    <div className="avatar">
                      {msg.from === 'bot' ? <BsRobot /> : <FaUser />}
                    </div>
                    <div className={`message-bubble ${msg.from}`}>
                      <div className="message-text">{msg.text}</div>
                      <div className="message-time">{formatTime(msg.timestamp)}</div>
                    </div>
                  </div>
                ))}
                <div className="message-here-container">
                  <button 
                    className="message-here-button"
                    onClick={navigateToHome}
                  >
                    Message Here
                  </button>
                </div>
              </div>
            )}
          </div>

          {activeTab === 'home' && (
            <form className="chatbot-input" onSubmit={handleSubmit}>
              <div className="upload-file">
                <label htmlFor="file-upload" className={`upload-button ${uploading ? 'disabled' : ''}`}>
                  <MdCloudUpload size={25} />
                </label>
                <input
                  id="file-upload"
                  type="file"
                  accept=".txt,.pdf,.doc,.docx"
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
              </div>
              <input
                ref={inputRef}
                type="text"
                placeholder="Type your message..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                disabled={isTyping || uploading}
              />
              <button 
                type="submit" 
                disabled={!userInput.trim() || isTyping || uploading}
                className={!userInput.trim() ? 'disabled' : ''}
              >
                Send
              </button>
            </form>
          )}
        </div>
      )}

      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  );
};

export default Chatbot;