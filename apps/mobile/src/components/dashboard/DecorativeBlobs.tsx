import React from 'react';
import { View, StyleSheet } from 'react-native';
import { DCOLORS } from './constants';

export function DecorativeBlobs() {
  return (
    <View style={styles.container} pointerEvents="none">
      <View style={[styles.blob, styles.blobMint]} />
      <View style={[styles.blob, styles.blobLavender]} />
      <View style={[styles.blob, styles.blobCoral]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    overflow: 'hidden',
    zIndex: 0,
  },
  blob: {
    position: 'absolute',
    borderRadius: 9999,
  },
  blobMint: {
    top: -40,
    right: -30,
    width: 180,
    height: 180,
    backgroundColor: DCOLORS.mint,
    opacity: 0.12,
  },
  blobLavender: {
    top: 60,
    left: -50,
    width: 140,
    height: 140,
    backgroundColor: DCOLORS.lavender,
    opacity: 0.1,
  },
  blobCoral: {
    top: 140,
    right: 40,
    width: 90,
    height: 90,
    backgroundColor: DCOLORS.coral,
    opacity: 0.08,
  },
});
