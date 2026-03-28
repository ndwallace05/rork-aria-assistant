import { useState, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import { Audio } from 'expo-av';

export function useVoiceInput() {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);

  const startRecording = useCallback(async () => {
    try {
      console.log('Requesting permissions...');
      const permission = await Audio.requestPermissionsAsync();
      
      if (permission.status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant microphone permission to use voice input');
        return;
      }

      if (Platform.OS !== 'web') {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
      }

      console.log('Starting recording...');
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Platform.OS === 'web'
          ? Audio.RecordingOptionsPresets.HIGH_QUALITY
          : {
              android: {
                extension: '.m4a',
                outputFormat: Audio.AndroidOutputFormat.MPEG_4,
                audioEncoder: Audio.AndroidAudioEncoder.AAC,
                sampleRate: 44100,
                numberOfChannels: 2,
                bitRate: 128000,
              },
              ios: {
                extension: '.wav',
                outputFormat: Audio.IOSOutputFormat.LINEARPCM,
                audioQuality: Audio.IOSAudioQuality.HIGH,
                sampleRate: 44100,
                numberOfChannels: 2,
                bitRate: 128000,
                linearPCMBitDepth: 16,
                linearPCMIsBigEndian: false,
                linearPCMIsFloat: false,
              },
              web: {},
            }
      );

      setRecording(newRecording);
      setIsRecording(true);
      console.log('Recording started');
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'Failed to start recording');
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    if (!recording) {
      console.log('No recording to stop');
      return null;
    }

    try {
      console.log('Stopping recording...');
      setIsRecording(false);
      await recording.stopAndUnloadAsync();

      if (Platform.OS !== 'web') {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
        });
      }

      const uri = recording.getURI();
      setRecording(null);

      if (!uri) {
        console.error('No URI from recording');
        return null;
      }

      console.log('Recording stopped, URI:', uri);
      setIsTranscribing(true);

      try {
        const formData = new FormData();

        if (Platform.OS === 'web') {
          const response = await fetch(uri);
          const blob = await response.blob();
          formData.append('audio', blob, 'recording.wav');
        } else {
          const uriParts = uri.split('.');
          const fileType = uriParts[uriParts.length - 1];
          
          formData.append('audio', {
            uri,
            name: `recording.${fileType}`,
            type: `audio/${fileType}`,
          } as any);
        }

        console.log('Sending to transcription API...');
        const response = await fetch('https://toolkit.rork.com/stt/transcribe/', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Transcription result:', data);
        
        return data.text || null;
      } catch (error) {
        console.error('Transcription error:', error);
        Alert.alert('Error', 'Failed to transcribe audio');
        return null;
      } finally {
        setIsTranscribing(false);
      }
    } catch (err) {
      console.error('Failed to stop recording', err);
      setIsTranscribing(false);
      return null;
    }
  }, [recording]);

  const cancelRecording = useCallback(async () => {
    if (!recording) return;

    try {
      console.log('Cancelling recording...');
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      
      if (Platform.OS !== 'web') {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
        });
      }
      
      setRecording(null);
      console.log('Recording cancelled');
    } catch (err) {
      console.error('Failed to cancel recording', err);
    }
  }, [recording]);

  return {
    isRecording,
    isTranscribing,
    startRecording,
    stopRecording,
    cancelRecording,
  };
}
