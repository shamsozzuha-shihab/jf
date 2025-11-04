import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSocket } from './SocketContext';
import apiService from '../services/api';

const NewsContext = createContext();

export const useNews = () => {
  const context = useContext(NewsContext);
  if (!context) {
    throw new Error('useNews must be used within a NewsProvider');
  }
  return context;
};

export const NewsProvider = ({ children }) => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    // Load news from API
    const loadNews = async () => {
      try {
        setLoading(true);
        const newsData = await apiService.getNews();
        setNews(newsData);
      } catch (error) {
        console.error('Error loading news:', error);
        setNews([]);
      } finally {
        setLoading(false);
      }
    };

    loadNews();
  }, []);

  // WebSocket event listeners for real-time updates
  useEffect(() => {
    
    if (!socket || !isConnected) {
      return;
    }


    const handleNewsCreated = (newNews) => {
      setNews(prevNews => [newNews, ...prevNews]);
    };

    const handleNewsUpdated = (updatedNews) => {
      setNews(prevNews => 
        prevNews.map(newsItem => 
          newsItem.id === updatedNews.id || newsItem._id === updatedNews.id 
            ? { ...newsItem, ...updatedNews }
            : newsItem
        )
      );
    };

    const handleNewsDeleted = (deletedNews) => {
      setNews(prevNews => 
        prevNews.filter(newsItem => 
          newsItem.id !== deletedNews.id && newsItem._id !== deletedNews.id
        )
      );
    };

    // Register event listeners
    socket.on('news-created', handleNewsCreated);
    socket.on('news-updated', handleNewsUpdated);
    socket.on('news-deleted', handleNewsDeleted);

    // Cleanup event listeners
    return () => {
      socket.off('news-created', handleNewsCreated);
      socket.off('news-updated', handleNewsUpdated);
      socket.off('news-deleted', handleNewsDeleted);
    };
  }, [socket, isConnected]);

  const refreshNews = async () => {
    try {
      setLoading(true);
      const newsData = await apiService.getNews();
      setNews(newsData);
    } catch (error) {
      console.error('❌ NewsContext: Error refreshing news:', error);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    news,
    loading,
    refreshNews
  };

  return (
    <NewsContext.Provider value={value}>
      {children}
    </NewsContext.Provider>
  );
};
