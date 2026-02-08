import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { useKeepAwake } from 'expo-keep-awake';
import { useAudioPlayer } from 'expo-audio';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../src/components/shared/ScreenContainer';
import { useTimer } from '../src/hooks/useTimer';
import { formatTime } from '../src/utils/formatTime';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../src/constants/theme';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const audioSource = require('../assets/sounds/meditation_audio.mp3');

const DURATION_MINUTES = 10;

export default function MeditationScreen() {
  const { remaining, status, start, pause, resume, stop } = useTimer();
  const player = useAudioPlayer(audioSource);
  const [infoVisible, setInfoVisible] = useState(false);

  useKeepAwake(status === 'running' ? 'meditation' : undefined);

  // Sync audio with timer completion
  useEffect(() => {
    if (status === 'completed') {
      player.pause();
    }
  }, [status, player]);

  const handleStart = useCallback(() => {
    start(DURATION_MINUTES);
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

        {(status === 'running' || status === 'paused') && (
          <>
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
  timer: {
    fontSize: FONT_SIZES.timer,
    fontWeight: '300',
    color: COLORS.textPrimary,
    fontVariant: ['tabular-nums'],
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
