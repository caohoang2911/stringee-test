import {Platform} from 'react-native';
import {request, PERMISSIONS, RESULTS} from 'react-native-permissions';

export const checkPermissions = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'ios') {
      const cameraPermission = await request(PERMISSIONS.IOS.CAMERA);
      const microphonePermission = await request(PERMISSIONS.IOS.MICROPHONE);
      
      return cameraPermission === RESULTS.GRANTED && microphonePermission === RESULTS.GRANTED;
    } else if (Platform.OS === 'android') {
      const cameraPermission = await request(PERMISSIONS.ANDROID.CAMERA);
      const microphonePermission = await request(PERMISSIONS.ANDROID.RECORD_AUDIO);
      
      return cameraPermission === RESULTS.GRANTED && microphonePermission === RESULTS.GRANTED;
    }
    return false;
  } catch (error) {
    console.error('Error checking permissions:', error);
    return false;
  }
};

import {Alert} from 'react-native';

export const requestPermissions = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'ios') {
      const cameraPermission = await request(PERMISSIONS.IOS.CAMERA);
      const microphonePermission = await request(PERMISSIONS.IOS.MICROPHONE);
      
      if (cameraPermission !== RESULTS.GRANTED || microphonePermission !== RESULTS.GRANTED) {
        Alert.alert(
          'Quyền Truy Cập',
          'Ứng dụng cần quyền truy cập camera và microphone để thực hiện cuộc gọi. Vui lòng cấp quyền trong Cài đặt.',
          [
            {text: 'OK', style: 'default'},
          ]
        );
        return false;
      }
      return true;
    } else if (Platform.OS === 'android') {
      const cameraPermission = await request(PERMISSIONS.ANDROID.CAMERA);
      const microphonePermission = await request(PERMISSIONS.ANDROID.RECORD_AUDIO);
      
      if (cameraPermission !== RESULTS.GRANTED || microphonePermission !== RESULTS.GRANTED) {
        Alert.alert(
          'Quyền Truy Cập',
          'Ứng dụng cần quyền truy cập camera và microphone để thực hiện cuộc gọi. Vui lòng cấp quyền trong Cài đặt.',
          [
            {text: 'OK', style: 'default'},
          ]
        );
        return false;
      }
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error requesting permissions:', error);
    return false;
  }
}; 