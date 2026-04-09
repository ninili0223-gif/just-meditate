import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { useKeepAwake } from 'expo-keep-awake';
import { Audio } from 'expo-av';
import { useFonts } from 'expo-font';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import MaskedView from '@react-native-masked-view/masked-view';
import { ScreenContainer } from '../src/components/shared/ScreenContainer';
import { useTimer } from '../src/hooks/useTimer';
import { formatTime } from '../src/utils/formatTime';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../src/constants/theme';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const audioSource = require('../assets/sounds/meditation_audio.mp3');

// eslint-disable-next-line @typescript-eslint/no-require-imports
const mandalaImage = require('../assets/mandala.png');

// eslint-disable-next-line @typescript-eslint/no-require-imports
const dogImage = require('../assets/dog.png');

// eslint-disable-next-line @typescript-eslint/no-require-imports
const chalkTexture = require('../assets/chalk_texture.png');

// eslint-disable-next-line @typescript-eslint/no-require-imports
const startIcon = require('../assets/start.png');

// eslint-disable-next-line @typescript-eslint/no-require-imports
const pauseIcon = require('../assets/pause.png');

// eslint-disable-next-line @typescript-eslint/no-require-imports
const restartIcon = require('../assets/restart.png');

// ── Dev config ──────────────────────────────
const DEV_MODE = true;          // set to false for production (full 10 min)
const DEV_DURATION_SECONDS = 10; // duration in seconds when DEV_MODE is on
// ─────────────────────────────────────────────

const DURATION_MINUTES = 10;
const ROTATION_DURATION = 60000; // ms for one full rotation

export default function MeditationScreen() {
  const { remaining, status, start, pause, resume, stop } = useTimer();
  const soundRef = useRef<Audio.Sound | null>(null);
  const [infoVisible, setInfoVisible] = useState(false);
  const rotation = useSharedValue(0);

  const [fontsLoaded] = useFonts({
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    'Caveat': require('../assets/fonts/Caveat-Regular.ttf'),
  });

  useKeepAwake(status === 'running' ? 'meditation' : undefined);

  // Configure audio mode and cleanup on unmount
  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
    });
    return () => {
      soundRef.current?.unloadAsync();
    };
  }, []);

  // Start/stop rotation based on timer status
  useEffect(() => {
    if (status === 'running') {
      rotation.value = withRepeat(
        withTiming(360, { duration: ROTATION_DURATION, easing: Easing.linear }),
        -1, // infinite
        false,
      );
    } else if (status === 'paused') {
      cancelAnimation(rotation);
    } else {
      cancelAnimation(rotation);
      rotation.value = 0;
    }
  }, [status, rotation]);

  // Stop audio on timer completion
  useEffect(() => {
    if (status === 'completed' && soundRef.current) {
      soundRef.current.getStatusAsync().then((s) => {
        if (s.isLoaded) soundRef.current?.pauseAsync();
      });
    }
  }, [status]);

  const animatedMandalaStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const handleStart = useCallback(async () => {
    const duration = DEV_MODE ? DEV_DURATION_SECONDS / 60 : DURATION_MINUTES;
    start(duration);

    // Unload previous sound if any
    if (soundRef.current) {
      await soundRef.current.unloadAsync();
    }

    const { sound, status: audioStatus } = await Audio.Sound.createAsync(audioSource);
    soundRef.current = sound;
    console.log('Sound loaded:', audioStatus);
    const playStatus = await sound.playAsync();
    console.log('Play status:', playStatus);
  }, [start]);

  const handlePause = useCallback(async () => {
    pause();
    if (soundRef.current) {
      const s = await soundRef.current.getStatusAsync();
      if (s.isLoaded) await soundRef.current.pauseAsync();
    }
  }, [pause]);

  const handleResume = useCallback(async () => {
    resume();
    if (soundRef.current) {
      const s = await soundRef.current.getStatusAsync();
      if (s.isLoaded) await soundRef.current.playAsync();
    }
  }, [resume]);

  const handleRestart = useCallback(async () => {
    if (soundRef.current) {
      const s = await soundRef.current.getStatusAsync();
      if (s.isLoaded) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      }
    }
    soundRef.current = null;
    stop();
  }, [stop]);

  if (!fontsLoaded) return null;

  const isActive = status === 'running' || status === 'paused';

  return (
    <ScreenContainer>
      {/* Info button - top right */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => setInfoVisible(true)}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons
            name="information-circle-outline"
            size={28}
            color={COLORS.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* Main content */}
      <View style={styles.content}>
        {/* Screen 1: Idle */}
        {status === 'idle' && (
          <View style={styles.idleContainer}>
            <View style={styles.spacer} />
            <TouchableOpacity style={styles.iconWithLabel} onPress={handleStart}>
              <Image source={startIcon} style={styles.iconButton} resizeMode="contain" />
              <Text style={styles.iconLabel}>start</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Screen 2: Playing/Paused */}
        {isActive && (
          <View style={styles.activeContainer}>
            <View style={styles.activeTop}>
              <Animated.Image
                source={mandalaImage}
                style={[styles.mandala, animatedMandalaStyle]}
                resizeMode="contain"
              />
              <Text style={styles.timer}>{formatTime(remaining)}</Text>
            </View>
            <View style={styles.controls}>
              {status === 'running' ? (
                <TouchableOpacity style={styles.iconWithLabel} onPress={handlePause}>
                  <Image source={pauseIcon} style={styles.iconButtonSmall} resizeMode="contain" />
                  <Text style={styles.iconLabel}>pause</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.iconWithLabel} onPress={handleResume}>
                  <Image source={startIcon} style={styles.iconButtonSmall} resizeMode="contain" />
                  <Text style={styles.iconLabel}>resume</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.iconWithLabel} onPress={handleRestart}>
                <Image source={restartIcon} style={styles.iconButtonSmall} resizeMode="contain" />
                <Text style={styles.iconLabel}>restart</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Screen 3: Completed */}
        {status === 'completed' && (
          <View style={styles.completedContainer}>
            <View style={styles.completedCenter}>
              <Image
                source={dogImage}
                style={styles.dogImage}
                resizeMode="contain"
              />
              <MaskedView
                maskElement={
                  <Text style={styles.creditText}>
                    today's session is led by julie dohrman
                  </Text>
                }
              >
                <Image
                  source={chalkTexture}
                  style={styles.chalkFill}
                  resizeMode="repeat"
                />
              </MaskedView>
            </View>
            <TouchableOpacity style={styles.iconWithLabel} onPress={handleRestart}>
              <Image source={restartIcon} style={styles.iconButtonSmall} resizeMode="contain" />
              <Text style={styles.iconLabel}>restart</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Info Modal */}
      <Modal
        visible={infoVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setInfoVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setInfoVisible(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>hi this is just meditate, in the world of clicks and choices , we want to simplify your life and make meditation stress free. You’ll receive a 10 guided meditation from our instructor. It’ll start right away once you </Text>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setInfoVisible(false)}
            >
              <Ionicons name="close" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </ScreenContainer>
  );
}

const MANDALA_SIZE = 280;

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingBottom: SPACING.md,
  },
  content: {
    flex: 1,
  },

  // Screen 1: Idle
  idleContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 120,
  },
  spacer: {
    flex: 1,
  },

  // Screen 2: Active
  activeContainer: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activeTop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Screen 3: Completed
  completedContainer: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: SPACING.xxl,
  },
  completedCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Shared
  iconWithLabel: {
    alignItems: 'center',
    gap: SPACING.xs,
  },
  iconButton: {
    width: 60,
    height: 60,
  },
  iconButtonSmall: {
    width: 48,
    height: 48,
  },
  iconLabel: {
    fontSize: 14,
    color: '#8abbef',
    fontFamily: 'Caveat',
  },

  mandala: {
    width: MANDALA_SIZE,
    height: MANDALA_SIZE,
    marginBottom: SPACING.lg,
  },
  timer: {
    fontSize: 40,
    color: '#B5D2F2',
    fontFamily: Platform.OS === 'ios' ? 'Bradley Hand' : 'serif',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  controls: {
    flexDirection: 'row',
    gap: SPACING.xxl,
    paddingBottom: SPACING.xxl,
  },
  dogImage: {
    width: 140,
    height: 140,
    marginBottom: SPACING.lg,
  },
  creditText: {
    fontSize: 20,
    fontFamily: 'Caveat',
    fontWeight: 'bold',
    color: 'black',
    textAlign: 'center',
  },
  chalkFill: {
    width: 340,
    height: 32,
    tintColor: '#8abbef',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    marginHorizontal: SPACING.xl,
    minWidth: 280,
  },
  modalText: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
    lineHeight: 24,
  },
  modalClose: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    padding: SPACING.xs,
  },
});
