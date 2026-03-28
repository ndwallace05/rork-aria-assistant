import { useCallback } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useCameraPermissions } from 'expo-camera';

export function useImagePicker() {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  const pickImage = useCallback(async (): Promise<string | null> => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permission.status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant photo library permission');
        return null;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (result.canceled) {
        return null;
      }

      const asset = result.assets[0];
      if (asset.base64) {
        return `data:image/jpeg;base64,${asset.base64}`;
      }

      return asset.uri;
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
      return null;
    }
  }, []);

  const takePhoto = useCallback(async (): Promise<string | null> => {
    try {
      if (!cameraPermission) {
        const permission = await requestCameraPermission();
        if (!permission.granted) {
          Alert.alert('Permission Required', 'Please grant camera permission');
          return null;
        }
      }

      if (!cameraPermission?.granted) {
        Alert.alert('Permission Required', 'Please grant camera permission');
        return null;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (result.canceled) {
        return null;
      }

      const asset = result.assets[0];
      if (asset.base64) {
        return `data:image/jpeg;base64,${asset.base64}`;
      }

      return asset.uri;
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
      return null;
    }
  }, [cameraPermission, requestCameraPermission]);

  return {
    pickImage,
    takePhoto,
  };
}
