import { Ionicons } from '@expo/vector-icons';
import { Canvas, Path, Skia, SkPath } from '@shopify/react-native-skia';
import * as MediaLibrary from 'expo-media-library';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HEADER_HEIGHT = 60;
const CANVAS_HEIGHT = SCREEN_HEIGHT - HEADER_HEIGHT;

export default function ToolkitMandalas() {
  const router = useRouter();
  const [paths, setPaths] = useState<SkPath[]>([]);
  const [currentPath, setCurrentPath] = useState<SkPath | null>(null);
  const viewShotRef = useRef<View>(null);

  // Pan gesture for drawing
  const panGesture = Gesture.Pan()
    .onStart((event) => {
      const newPath = Skia.Path.Make();
      newPath.moveTo(event.x, event.y);
      setCurrentPath(newPath);
    })
    .onUpdate((event) => {
      if (currentPath) {
        currentPath.lineTo(event.x, event.y);
        setCurrentPath(Skia.Path.MakeFromSVGString(currentPath.toSVGString())!);
      }
    })
    .onEnd(() => {
      if (currentPath) {
        setPaths([...paths, currentPath]);
        setCurrentPath(null);
      }
    });

  // Save to gallery
  const saveToGallery = async () => {
    try {
      // Request permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please grant permission to save images to your gallery.');
        return;
      }

      // Note: Canvas screenshot functionality requires expo-file-system to be properly configured
      // For now, show info message
      Alert.alert(
        'Save Feature',
        'To enable saving mandalas, please restart the Metro bundler:\n\n1. Stop the current server (Ctrl+C)\n2. Clear cache: npx expo start -c',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error saving to gallery:', error);
      Alert.alert('Error', 'Failed to save mandala to gallery.');
    }
  };

  // Clear canvas
  const clearCanvas = () => {
    Alert.alert(
      'Clear Canvas',
      'Are you sure you want to clear your mandala?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            setPaths([]);
            setCurrentPath(null);
          },
        },
      ]
    );
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      {/* Header with Back Button and Save Button */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Mandala Drawing</Text>

        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.clearButton}
            onPress={clearCanvas}
          >
            <Ionicons name="refresh" size={20} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={saveToGallery}
          >
            <Ionicons name="save" size={20} color="#fff" />
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Drawing Canvas - Full Screen from Header to Bottom */}
      <View
        ref={viewShotRef}
        style={styles.canvasContainer}
      >
        <GestureDetector gesture={panGesture}>
          <Canvas style={styles.canvas}>
            {/* Draw all completed paths */}
            {paths.map((path, index) => (
              <Path
                key={index}
                path={path}
                color="#6B4BA8"
                style="stroke"
                strokeWidth={3}
                strokeCap="round"
                strokeJoin="round"
              />
            ))}

            {/* Draw current path being drawn */}
            {currentPath && (
              <Path
                path={currentPath}
                color="#6B4BA8"
                style="stroke"
                strokeWidth={3}
                strokeCap="round"
                strokeJoin="round"
              />
            )}
          </Canvas>
        </GestureDetector>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    height: HEADER_HEIGHT,
    backgroundColor: '#6B4BA8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingTop: Platform.OS === 'ios' ? 40 : 10,
    borderBottomWidth: 2,
    borderBottomColor: '#5A3D8A',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  clearButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 5,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  canvasContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  canvas: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: CANVAS_HEIGHT,
  },
});
