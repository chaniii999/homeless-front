import React, { useState, useRef, useEffect, useContext } from "react";
import axios from "axios";
import "./ChatRoom.css";
import useWebSocket from '../hooks/useWebSocket.js';
import AuthContext from '../context/AuthContext.js';

const ChatRoom = ({ serverId, channelName, channelId: selectedChannelId }) => {
  const { userName } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messageEndRef = useRef(null);
  const inputRef = useRef(null);
  const messageListRef = useRef(null);

  const handleMessageReceived = (message) => {
    const messageWithTime = {
      id: message.id,
      from: message.writer || "Unknown",
      text: message.content,
      timestamp: new Date().toLocaleTimeString()
    };
    setMessages(prev => [...prev, messageWithTime]);
  };

  const { sendMessage } = useWebSocket(selectedChannelId, handleMessageReceived);

  // 메시지 자동 스크롤
  const scrollToBottom = () => {
    if (messageListRef.current) {
      const element = messageListRef.current;
      element.scrollTo({
        top: element.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  // 새 메시지가 추가될 때마다 스크롤
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  // 채널이 변경될 때도 스크롤
  useEffect(() => {
    if (selectedChannelId && messages.length > 0) {
      scrollToBottom();
    }
  }, [selectedChannelId, messages]);

  // 채널이 변경될 때마다 입력창 포커스
  useEffect(() => {
    inputRef.current?.focus();
  }, [selectedChannelId]);

  // 메시지 전송 핸들러 (백엔드 API를 통한 메시지 전송)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      const message = {
        text: newMessage.trim(),
        from: userName
      };

      try {
        sendMessage(message);
        setNewMessage("");
        inputRef.current?.focus();
      } catch (error) {
        console.error("메시지 전송 오류:", error);
      }
    }
  };

  // 키 입력 핸들러
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="chat-room-container">
      {selectedChannelId ? (
        <>
          <div className="chat-header">
            <h3>{channelName}</h3>
            <div className="header-divider"></div>
            <p className="channel-description">
              {channelName} 채널에 오신 것을 환영합니다
            </p>
          </div>
          <div className="chat-messages-container" ref={messageListRef}>
            {messages.map((message, index) => (
              <div key={message.id || index} className="message-item">
                <div className="message-header">
                  <span className="message-sender">{message.from || "Unknown"}</span>
                  <span className="message-time">
                    {message.timestamp}
                  </span>
                </div>
                <div className="message-content">{message.text}</div>
              </div>
            ))}
          </div>
          <div className="chat-input-container">
            <button className="add-content-button">
              <span className="plus-icon">+</span>
            </button>
            <form onSubmit={handleSubmit} className="chat-form">
              <textarea
                ref={inputRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={`#${channelName}에 메시지 보내기`}
                className="chat-input"
              />
            </form>
          </div>
        </>
      ) : (
        <div className="no-messages">채널을 선택해주세요</div>
      )}
    </div>
  );
};

export default ChatRoom;
