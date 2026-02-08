import React, { useEffect, useState, useCallback } from 'react';
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
import { useAudioPlayer } from 'expo-audio';
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
import { ScreenContainer } from '../src/components/shared/ScreenContainer';
import { useTimer } from '../src/hooks/useTimer';
import { formatTime } from '../src/utils/formatTime';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../src/constants/theme';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const audioSource = require('../assets/sounds/meditation_audio.mp3');

// eslint-disable-next-line @typescript-eslint/no-require-imports
const mandalaImage = require('../assets/mandala.png');

// ── Dev config ──────────────────────────────
const DEV_MODE = true;          // set to false for production (full 10 min)
const DEV_DURATION_SECONDS = 15; // duration in seconds when DEV_MODE is on
// ─────────────────────────────────────────────

const DURATION_MINUTES = 10;
const ROTATION_DURATION = 60000; // ms for one full rotation

export default function MeditationScreen() {
  const { remaining, status, start, pause, resume, stop } = useTimer();
  const player = useAudioPlayer(audioSource);
  const [infoVisible, setInfoVisible] = useState(false);
  const rotation = useSharedValue(0);

  useKeepAwake(status === 'running' ? 'meditation' : undefined);

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

  // Sync audio with timer completion
  useEffect(() => {
    if (status === 'completed') {
      player.pause();
    }
  }, [status, player]);

  const animatedMandalaStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const handleStart = useCallback(() => {
    const duration = DEV_MODE ? DEV_DURATION_SECONDS / 60 : DURATION_MINUTES;
    start(duration);
    player.seekTo(0);
    player.play();
  }, [start, player]);

  const handlePause = useCallback(() => {
    pause();
    player.pause();
  }, [pause, player]);

  const handleResume = useCallback(() => {
    resume();
    player.play();
  }, [resume, player]);

  const handleRestart = useCallback(() => {
    stop();
    player.pause();
    player.seekTo(0);
  }, [stop, player]);

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
        {status === 'idle' && (
          <TouchableOpacity style={styles.startButton} onPress={handleStart}>
            <Text style={styles.startButtonText}>Start</Text>
          </TouchableOpacity>
        )}

        {isActive && (
          <>
            <Animated.Image
              source={mandalaImage}
              style={[styles.mandala, animatedMandalaStyle]}
              resizeMode="contain"
            />
            <Text style={styles.timer}>{formatTime(remaining)}</Text>
            <View style={styles.controls}>
              {status === 'running' ? (
                <TouchableOpacity style={styles.controlButton} onPress={handlePause}>
                  <Text style={styles.controlButtonText}>Pause</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.controlButton} onPress={handleResume}>
                  <Text style={styles.controlButtonText}>Resume</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.controlButton, styles.restartButton]}
                onPress={handleRestart}
              >
                <Text style={styles.restartButtonText}>Restart</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {status === 'completed' && (
          <>
            <Text style={styles.creditText}>Session Complete</Text>
            <TouchableOpacity style={styles.startButton} onPress={handleRestart}>
              <Text style={styles.startButtonText}>Restart</Text>
            </TouchableOpacity>
          </>
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
            <Text style={styles.modalText}>abcdefg</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.full,
  },
  startButtonText: {
    fontSize: FONT_SIZES.title,
    fontWeight: '700',
    color: COLORS.background,
  },
  mandala: {
    width: MANDALA_SIZE,
    height: MANDALA_SIZE,
    marginBottom: SPACING.md,
  },
  timer: {
    fontSize: 40,
    color: '#B5D2F2',
    fontFamily: Platform.OS === 'ios' ? 'Bradley Hand' : 'serif',
    textAlign: 'center',
    marginBottom: SPACING.xxl,
  },
  controls: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  controlButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
  },
  controlButtonText: {
    fontSize: FONT_SIZES.subtitle,
    fontWeight: '600',
    color: COLORS.background,
  },
  restartButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.textMuted,
  },
  restartButtonText: {
    fontSize: FONT_SIZES.subtitle,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  creditText: {
    fontSize: FONT_SIZES.title,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: SPACING.xl,
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
