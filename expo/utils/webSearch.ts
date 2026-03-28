import { Platform, Linking, Alert } from 'react-native';
import * as IntentLauncher from 'expo-intent-launcher';

export interface WebSearchOptions {
  query: string;
  engine?: 'google' | 'bing' | 'duckduckgo' | 'brave';
}

export async function performWebSearch({ query, engine = 'google' }: WebSearchOptions): Promise<boolean> {
  const encodedQuery = encodeURIComponent(query);
  
  const searchUrls: Record<string, string> = {
    google: `https://www.google.com/search?q=${encodedQuery}`,
    bing: `https://www.bing.com/search?q=${encodedQuery}`,
    duckduckgo: `https://duckduckgo.com/?q=${encodedQuery}`,
    brave: `https://search.brave.com/search?q=${encodedQuery}`,
  };

  const searchUrl = searchUrls[engine];

  try {
    if (Platform.OS === 'android') {
      await IntentLauncher.startActivityAsync('android.intent.action.WEB_SEARCH', {
        extra: {
          'android.intent.extra.TEXT': query,
        },
      });
      console.log('Web search launched via Android Intent:', query);
      return true;
    } else {
      const canOpen = await Linking.canOpenURL(searchUrl);
      if (canOpen) {
        await Linking.openURL(searchUrl);
        console.log('Web search launched via Linking:', searchUrl);
        return true;
      } else {
        throw new Error('Cannot open search URL');
      }
    }
  } catch (error) {
    console.error('Failed to perform web search:', error);
    Alert.alert(
      'Search Failed',
      'Unable to open web search. Please check your browser settings.',
      [{ text: 'OK' }]
    );
    return false;
  }
}

export async function openUrl(url: string): Promise<boolean> {
  try {
    if (Platform.OS === 'android') {
      await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
        data: url,
      });
      console.log('URL opened via Android Intent:', url);
      return true;
    } else {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        console.log('URL opened via Linking:', url);
        return true;
      } else {
        throw new Error('Cannot open URL');
      }
    }
  } catch (error) {
    console.error('Failed to open URL:', error);
    Alert.alert(
      'Failed to Open',
      'Unable to open the URL. Please check the link.',
      [{ text: 'OK' }]
    );
    return false;
  }
}

export async function shareText(text: string): Promise<boolean> {
  try {
    if (Platform.OS === 'android') {
      await IntentLauncher.startActivityAsync('android.intent.action.SEND', {
        type: 'text/plain',
        extra: {
          'android.intent.extra.TEXT': text,
        },
      });
      console.log('Text shared via Android Intent');
      return true;
    } else {
      Alert.alert(
        'Share',
        'Sharing is currently only supported on Android via Intents.',
        [{ text: 'OK' }]
      );
      return false;
    }
  } catch (error) {
    console.error('Failed to share text:', error);
    Alert.alert(
      'Share Failed',
      'Unable to share text. Please try again.',
      [{ text: 'OK' }]
    );
    return false;
  }
}

export async function openEmailClient(email: string, subject?: string, body?: string): Promise<boolean> {
  const mailtoUrl = `mailto:${email}${subject ? `?subject=${encodeURIComponent(subject)}` : ''}${body ? `&body=${encodeURIComponent(body)}` : ''}`;
  
  try {
    if (Platform.OS === 'android') {
      await IntentLauncher.startActivityAsync('android.intent.action.SENDTO', {
        data: mailtoUrl,
      });
      console.log('Email client opened via Android Intent');
      return true;
    } else {
      const canOpen = await Linking.canOpenURL(mailtoUrl);
      if (canOpen) {
        await Linking.openURL(mailtoUrl);
        console.log('Email client opened via Linking');
        return true;
      } else {
        throw new Error('Cannot open email client');
      }
    }
  } catch (error) {
    console.error('Failed to open email client:', error);
    Alert.alert(
      'Email Failed',
      'Unable to open email client. Please check your email app.',
      [{ text: 'OK' }]
    );
    return false;
  }
}

export async function dialPhoneNumber(phoneNumber: string): Promise<boolean> {
  const telUrl = `tel:${phoneNumber}`;
  
  try {
    if (Platform.OS === 'android') {
      await IntentLauncher.startActivityAsync('android.intent.action.DIAL', {
        data: telUrl,
      });
      console.log('Phone dialer opened via Android Intent');
      return true;
    } else {
      const canOpen = await Linking.canOpenURL(telUrl);
      if (canOpen) {
        await Linking.openURL(telUrl);
        console.log('Phone dialer opened via Linking');
        return true;
      } else {
        throw new Error('Cannot open phone dialer');
      }
    }
  } catch (error) {
    console.error('Failed to open phone dialer:', error);
    Alert.alert(
      'Call Failed',
      'Unable to open phone dialer. Please check your phone app.',
      [{ text: 'OK' }]
    );
    return false;
  }
}
