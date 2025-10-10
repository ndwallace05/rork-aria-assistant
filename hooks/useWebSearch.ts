import { useState, useCallback } from 'react';
import { performWebSearch, openUrl, shareText, openEmailClient, dialPhoneNumber, WebSearchOptions } from '@/utils/webSearch';

export function useWebSearch() {
  const [isSearching, setIsSearching] = useState(false);

  const search = useCallback(async (options: WebSearchOptions) => {
    setIsSearching(true);
    try {
      const result = await performWebSearch(options);
      return result;
    } finally {
      setIsSearching(false);
    }
  }, []);

  const openLink = useCallback(async (url: string) => {
    setIsSearching(true);
    try {
      const result = await openUrl(url);
      return result;
    } finally {
      setIsSearching(false);
    }
  }, []);

  const share = useCallback(async (text: string) => {
    const result = await shareText(text);
    return result;
  }, []);

  const sendEmail = useCallback(async (email: string, subject?: string, body?: string) => {
    const result = await openEmailClient(email, subject, body);
    return result;
  }, []);

  const makeCall = useCallback(async (phoneNumber: string) => {
    const result = await dialPhoneNumber(phoneNumber);
    return result;
  }, []);

  return {
    isSearching,
    search,
    openLink,
    share,
    sendEmail,
    makeCall,
  };
}
