/**
 * Stringee Call Demo App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {useState, useEffect} from 'react';
import {SafeAreaView, StatusBar, StyleSheet, View, Text, TouchableOpacity, useColorScheme, Alert} from 'react-native';
import StringeeCall from './src/components/StringeeCall';
import {checkPermissions, requestPermissions} from './src/utils/permissions';
import {STRINGEE_CONFIG} from './src/config/stringee';

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [showStringeeCall, setShowStringeeCall] = useState(false);

  const backgroundStyle = {
    backgroundColor: isDarkMode ? '#000' : '#f5f5f5',
  };

  useEffect(() => {
    checkInitialPermissions();
  }, []);

  const checkInitialPermissions = async () => {
    const granted = await checkPermissions();
    setPermissionsGranted(granted);
  };

  const handleGrantPermissions = async () => {
    const granted = await requestPermissions();
    setPermissionsGranted(granted);
  };

  const handleStartStringeeCall = () => {
    if (STRINGEE_CONFIG.TOKEN === 'YOUR_STRINGEE_TOKEN_HERE') {
      Alert.alert('Cấu Hình', 'Vui lòng cấu hình token trong file src/config/stringee.ts');
      return;
    }
    setShowStringeeCall(true);
  };

  if (!permissionsGranted) {
    return (
      <SafeAreaView style={[backgroundStyle, styles.container]}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={backgroundStyle.backgroundColor}
        />
        <View style={styles.permissionContainer}>
          <Text style={[styles.title, {color: isDarkMode ? '#fff' : '#333'}]}>
            Stringee Call Demo
          </Text>
          <Text style={[styles.subtitle, {color: isDarkMode ? '#ccc' : '#666'}]}>
            Ứng dụng cần quyền truy cập camera và microphone để thực hiện cuộc gọi
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={handleGrantPermissions}>
            <Text style={styles.permissionButtonText}>Cấp Quyền</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (showStringeeCall) {
    return (
      <SafeAreaView style={[backgroundStyle, styles.container]}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={backgroundStyle.backgroundColor}
        />
        <StringeeCall
          phoneConfig={{
            token: STRINGEE_CONFIG.TOKEN,
            from: STRINGEE_CONFIG.FROM_PHONE_NUMBER,
            to: STRINGEE_CONFIG.TO_PHONE_NUMBER,
          }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[backgroundStyle, styles.container]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      <View style={styles.welcomeContainer}>
        <Text style={[styles.title, {color: isDarkMode ? '#fff' : '#333'}]}>
          Stringee Call Demo
        </Text>
        <Text style={[styles.subtitle, {color: isDarkMode ? '#ccc' : '#666'}]}>
          Chào mừng bạn đến với ứng dụng demo cuộc gọi Stringee
        </Text>
        <TouchableOpacity
          style={styles.startButton}
          onPress={handleStartStringeeCall}>
          <Text style={styles.startButtonText}>Bắt Đầu Cuộc Gọi</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  startButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
  },
  startButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default App;
