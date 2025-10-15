import React, { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { View } from 'react-native';

export default function Index() {
  const navigation = useNavigation();

  useEffect(() => {
    navigation.navigate('(main)' as any);
  }, [navigation]);

  return <View />;
}
