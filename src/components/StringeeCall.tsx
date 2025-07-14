import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import {
  SignalingState,
  StringeeCall2,
  StringeeCallListener,
  StringeeClient,
  StringeeClientListener,
} from 'stringee-react-native-v2';

interface PhoneCallConfig {
  token: string;
  from: string; // Số điện thoại nguồn
  to: string;   // Số điện thoại đích
}

interface StringeeCallProps {
  phoneConfig: PhoneCallConfig;
}

const StringeeCallComponent: React.FC<StringeeCallProps> = ({ phoneConfig }) => {
  const { token, from, to } = phoneConfig;
  const [isConnected, setIsConnected] = useState(false);
  const [isIncomingCall, setIsIncomingCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [callStatus, setCallStatus] = useState<string>('');
  const [callDuration, setCallDuration] = useState<number>(0);
  const [isCallActive, setIsCallActive] = useState(false);
  const [connectedUserId, setConnectedUserId] = useState<string>('');

  const stringeeClientRef = useRef<StringeeClient | null>(null);
  const stringeeCallRef = useRef<StringeeCall2 | null>(null);
  const callDurationRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    initializeStringeeClient();
    return () => {
      if (stringeeClientRef.current) {
        stringeeClientRef.current.disconnect();
      }
      if (callDurationRef.current) {
        clearInterval(callDurationRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isCallActive) {
      callDurationRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (callDurationRef.current) {
        clearInterval(callDurationRef.current);
        callDurationRef.current = null;
      }
      setCallDuration(0);
    }

    return () => {
      if (callDurationRef.current) {
        clearInterval(callDurationRef.current);
      }
    };
  }, [isCallActive]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const initializeStringeeClient = () => {
    // Initialize StringeeClient
    const stringeeClient = new StringeeClient();
    stringeeClientRef.current = stringeeClient;

    // Register the client's events
    const stringeeClientListener = new StringeeClientListener();

    // Invoked when the StringeeClient is connected
    stringeeClientListener.onConnect = (stringeeClient, userId) => {
      console.log('onConnect: ', userId);
      setIsConnected(true);
      setConnectedUserId(userId);
      setCallStatus('Connected to Stringee server');
      Alert.alert('Success', 'Connected to Stringee server');
    };

    // Invoked when the StringeeClient is disconnected
    stringeeClientListener.onDisConnect = (stringeeClient) => {
      console.log('onDisConnect');
      setIsConnected(false);
      setCallStatus('Disconnected from Stringee server');
    };

    // Invoked when StringeeClient connect false
    stringeeClientListener.onFailWithError = (stringeeClient, code, message) => {
      console.log('onFailWithError: ', message);
      setCallStatus(`Connection failed: ${message}`);
      Alert.alert('Error', `Connection failed: ${message}`);
    };

    // Invoked when your token is expired
    stringeeClientListener.onRequestAccessToken = (stringeeClient) => {
      console.log('onRequestAccessToken');
      setCallStatus('Token expired, please refresh');
      Alert.alert('Token Expired', 'Please refresh your token');
    };

    // Invoked when receive an incoming of StringeeCall2
    stringeeClientListener.onIncomingCall2 = (stringeeClient, stringeeCall2: StringeeCall2) => {
      console.log('onIncomingCall2: ', JSON.stringify(stringeeCall2));
      handleIncomingCall(stringeeCall2);
    };

    stringeeClient.setListener(stringeeClientListener);

    // Connect to Stringee server
    stringeeClient.connect(token);
  };

  const handleIncomingCall = (incomingCall: StringeeCall2) => {
    stringeeCallRef.current = incomingCall;
    setIsIncomingCall(true);
    setCallStatus('Incoming call...');

    // Register the call's events
    const stringeeCallListener = new StringeeCallListener();

    // Invoked when the call's signaling state changes
    stringeeCallListener.onChangeSignalingState = (
      stringeeCall: StringeeCall2,
      signalingState: any,
      reason: any,
      sipCode: any,
      sipReason: any,
    ) => {
      console.log('onChangeSignalingState', signalingState);
      handleSignalingStateChange(signalingState, reason);
    };

    // Invoked when the call's media state changes
    stringeeCallListener.onChangeMediaState = (
      stringeeCall: StringeeCall2,
      mediaState: any,
      description: any,
    ) => {
      console.log('onChangeMediaState', mediaState);
      handleMediaStateChange(mediaState, description);
    };

    // Invoked when an incoming call is handle on another device
    stringeeCallListener.onHandleOnAnotherDevice = (
      stringeeCall: StringeeCall2,
      signalingState: any,
      description: any,
    ) => {
      console.log('onHandleOnAnotherDevice', signalingState);
      setCallStatus('Call handled on another device');
    };

    incomingCall.setListener(stringeeCallListener);
  };

  const handleSignalingStateChange = (signalingState: any, reason: any) => {
    switch (signalingState) {
      case SignalingState.CALLING:
        setCallStatus('Calling...');
        break;
      case SignalingState.INCOMING:
        setCallStatus('Incoming call...');
        break;
      case SignalingState.CONNECTED:
        setCallStatus('Connected');
        setIsCallActive(true);
        setIsIncomingCall(false);
        break;
      case SignalingState.ENDED:
        setCallStatus('Call ended');
        setIsCallActive(false);
        resetCallState();
        break;
      case SignalingState.BUSY:
        setCallStatus('Busy');
        setIsCallActive(false);
        resetCallState();
        break;
      case SignalingState.REJECTED:
        setCallStatus('Call rejected');
        setIsCallActive(false);
        resetCallState();
        break;
      default:
        setCallStatus(`State: ${signalingState}`);
    }
  };

  const handleMediaStateChange = (mediaState: any, description: any) => {
    switch (mediaState) {
      case 'CONNECTED':
        setCallStatus('Media connected');
        break;
      case 'DISCONNECTED':
        setCallStatus('Media disconnected');
        break;
      default:
        console.log('Media state:', mediaState);
    }
  };

  const makeCall = () => {
    if (!isConnected) {
      Alert.alert('Error', 'Not connected to Stringee server');
      return;
    }

    if (!from || !to) {
      Alert.alert('Error', 'Số điện thoại nguồn và đích là bắt buộc');
      return;
    }
    
    const cleanPhoneNumber = to.replace(/\s+/g, '').replace(/[^\d]/g, '');
    if (!cleanPhoneNumber.startsWith('84')) {
      Alert.alert('Lỗi', 'Số điện thoại phải bắt đầu bằng 84');
      return;
    }
    
    const formattedNumber = cleanPhoneNumber;
      
    const call = new StringeeCall2({
      stringeeClient: stringeeClientRef.current!,
      from: from,
      to: formattedNumber,
      isAppToPhone: true,
    });
    call.isVideoCall = false;
    
    // Register event listeners
    const stringeeCallListener = new StringeeCallListener();
    stringeeCallListener.onChangeSignalingState = (call: StringeeCall2, signalingState: any, reason: any, sipCode: any, sipReason: any) => {
      console.log('Signaling state changed:', signalingState, reason);
      handleSignalingStateChange(signalingState, reason);
    };
    stringeeCallListener.onChangeMediaState = (call: StringeeCall2, mediaState: any, description: any) => {
      console.log('Media state changed:', mediaState);
      handleMediaStateChange(mediaState, description);
    };
    call.setListener(stringeeCallListener);
    
    try {
      call.makeCall()
        .then(() => {
          setCallStatus('Calling...');
          setIsCallActive(true);
        })
        .catch((err: any) => {
          console.error('Call error:', err);
          Alert.alert('Lỗi gọi', err?.message || err?.toString() || 'Unknown error');
          setCallStatus('Call failed');
        });
    } catch (err: any) {
      console.error('Call error:', err);
      Alert.alert('Lỗi gọi', err?.message || err?.toString() || 'Unknown error');
      setCallStatus('Call failed');
    }
  };

  const answerCall = () => {
    if (!stringeeCallRef.current) return;

    setCallStatus('Answering...');

    stringeeCallRef.current
      .initAnswer()
      .then(() => {
        console.log('initAnswer success');
        return stringeeCallRef.current!.answer();
      })
      .then(() => {
        console.log('answer success');
        setIsIncomingCall(false);
        setCallStatus('Connected');
        setIsCallActive(true);
      })
      .catch((error) => {
        console.error('answer error:', error);
        setCallStatus('Answer failed');
        Alert.alert('Error', 'Failed to answer call');
      });
  };

  const rejectCall = () => {
    if (!stringeeCallRef.current) return;

    setCallStatus('Rejecting...');

    stringeeCallRef.current
      .reject()
      .then(() => {
        console.log('reject success');
        setCallStatus('Call rejected');
        resetCallState();
      })
      .catch((error) => {
        console.error('reject error:', error);
        setCallStatus('Reject failed');
        Alert.alert('Error', 'Failed to reject call');
      });
  };

  const hangupCall = () => {
    if (!stringeeCallRef.current) return;

    setCallStatus('Hanging up...');

    stringeeCallRef.current
      .hangup()
      .then(() => {
        console.log('hangup success');
        setCallStatus('Call ended');
        setIsCallActive(false);
        resetCallState();
      })
      .catch((error) => {
        console.error('hangup error:', error);
        setCallStatus('Hangup failed');
        Alert.alert('Error', 'Failed to hangup call');
      });
  };

  const toggleMute = () => {
    if (!stringeeCallRef.current) return;

    const newMuteState = !isMuted;
    stringeeCallRef.current
      .mute(newMuteState)
      .then(() => {
        console.log('mute success');
        setIsMuted(newMuteState);
      })
      .catch((error) => {
        console.error('mute error:', error);
        Alert.alert('Error', 'Failed to toggle mute');
      });
  };

  const toggleSpeaker = () => {
    if (!stringeeCallRef.current) return;

    const newSpeakerState = !isSpeakerOn;
    stringeeCallRef.current
      .setSpeakerphoneOn(newSpeakerState)
      .then(() => {
        console.log('setSpeakerphoneOn success');
        setIsSpeakerOn(newSpeakerState);
      })
      .catch((error) => {
        console.error('speaker error:', error);
        Alert.alert('Error', 'Failed to toggle speaker');
      });
  };

  const resetCallState = () => {
    setIsIncomingCall(false);
    setIsMuted(false);
    setIsSpeakerOn(false);
    setIsCallActive(false);
    setCallStatus('');
    stringeeCallRef.current = null;
  };

  const renderCallControls = () => {
    if (isIncomingCall) {
      return (
        <View style={styles.callControls}>
          <Text style={styles.incomingCallText}>Incoming Call</Text>
          <View style={styles.incomingCallButtons}>
            <TouchableOpacity
              style={[styles.callButton, styles.rejectButton]}
              onPress={rejectCall}>
              <Text style={styles.buttonText}>Reject</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.callButton, styles.answerButton]}
              onPress={answerCall}>
              <Text style={styles.buttonText}>Answer</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    if (stringeeCallRef.current && !isIncomingCall) {
      return (
        <View style={styles.callControls}>
          {isCallActive && (
            <Text style={styles.callDuration}>
              {formatDuration(callDuration)}
            </Text>
          )}
          
          <View style={styles.controlButtons}>
            <TouchableOpacity
              style={[styles.controlButton, isMuted && styles.activeButton]}
              onPress={toggleMute}>
              <Text style={styles.controlButtonText}>
                {isMuted ? '🔇' : '🎤'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, isSpeakerOn && styles.activeButton]}
              onPress={toggleSpeaker}>
              <Text style={styles.controlButtonText}>
                {isSpeakerOn ? '🔊' : '📞'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, styles.hangupButton]}
              onPress={hangupCall}>
              <Text style={styles.controlButtonText}>📞❌</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.mainButtons}>
        <TouchableOpacity
          style={[styles.mainButton, styles.audioCallButton]}
          onPress={makeCall}>
          <Text style={styles.mainButtonText}>📞 Audio Call</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Stringee Phone Call</Text>
        
        <View style={styles.statusContainer}>
          <Text style={[styles.status, {color: isConnected ? '#34C759' : '#FF3B30'}]}>
            {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </Text>
          {connectedUserId && (
            <Text style={styles.userIdText}>UserId: {connectedUserId}</Text>
          )}
          <Text style={styles.callType}>
            {from && to ? '📱 Phone Call' : '👤 User Call'}
          </Text>
        </View>

        {from && to && (
          <View style={styles.phoneInfo}>
            <Text style={styles.phoneLabel}>📞 From: {from}</Text>
            <Text style={styles.phoneLabel}>📞 To: {to}</Text>
          </View>
        )}

        {callStatus && (
          <Text style={styles.callStatus}>{callStatus}</Text>
        )}
      </View>

      <View style={styles.content}>
        {renderCallControls()}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    color: '#212529',
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  status: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  callType: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
  },
  phoneInfo: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  phoneLabel: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 3,
    fontWeight: '500',
  },
  callStatus: {
    fontSize: 16,
    textAlign: 'center',
    color: '#007AFF',
    fontWeight: '600',
    marginTop: 10,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  mainButtons: {
    gap: 20,
  },
  mainButton: {
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  mainButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  audioCallButton: {
    backgroundColor: '#34C759',
  },
  callControls: {
    alignItems: 'center',
  },
  incomingCallText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 30,
  },
  incomingCallButtons: {
    flexDirection: 'row',
    gap: 30,
  },
  callButton: {
    padding: 20,
    borderRadius: 50,
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  answerButton: {
    backgroundColor: '#34C759',
  },
  rejectButton: {
    backgroundColor: '#FF3B30',
  },
  callDuration: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 30,
  },
  controlButtons: {
    flexDirection: 'row',
    gap: 20,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  controlButton: {
    padding: 15,
    borderRadius: 50,
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6c757d',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  controlButtonText: {
    fontSize: 20,
  },
  activeButton: {
    backgroundColor: '#007AFF',
  },
  hangupButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  userIdText: {
    fontSize: 13,
    color: '#888',
    marginBottom: 2,
    fontStyle: 'italic',
  },
});

export default StringeeCallComponent;
