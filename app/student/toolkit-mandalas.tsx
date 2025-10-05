import { Ionicons } from '@expo/vector-icons';
import { Canvas, Path, Skia, SkPath } from '@shopify/react-native-skia';
import * as MediaLibrary from 'expo-media-library';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HEADER_HEIGHT = 60;
const TOOLBAR_HEIGHT = 70;
const OPTIONS_BAR_HEIGHT = 100;
const CANVAS_HEIGHT = SCREEN_HEIGHT - HEADER_HEIGHT - TOOLBAR_HEIGHT;

type Tool = 'pencil' | 'eraser' | 'shapes';
type PenStyle = 'normal' | 'smooth' | 'marker' | 'calligraphy' | 'brush';

// Color palette
const COLORS = [
  '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
  '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080',
  '#FFC0CB', '#A52A2A', '#808080', '#FFD700', '#6B4BA8',
];

// Stroke widths
const STROKE_WIDTHS = [1, 2, 3, 5, 8, 12, 16, 20];

export default function ToolkitMandalas() {
  const router = useRouter();
  const [paths, setPaths] = useState<{ path: SkPath; color: string; width: number; style: PenStyle }[]>([]);
  const [currentPath, setCurrentPath] = useState<SkPath | null>(null);
  const [history, setHistory] = useState<any[][]>([]);
  const [redoStack, setRedoStack] = useState<any[][]>([]);
  const [selectedTool, setSelectedTool] = useState<Tool>('pencil');
  const [showOptionsBar, setShowOptionsBar] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#6B4BA8');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [penStyle, setPenStyle] = useState<PenStyle>('normal');
  const viewShotRef = useRef<View>(null);

  // Zoom and Pan values
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  // Drawing gesture - only for single finger
  const drawGesture = Gesture.Pan()
    .minPointers(1)
    .maxPointers(1)
    .onStart((event) => {
      try {
        const newPath = Skia.Path.Make();
        const adjustedX = (event.x - translateX.value) / scale.value;
        const adjustedY = (event.y - translateY.value) / scale.value;
        newPath.moveTo(adjustedX, adjustedY);
        setCurrentPath(newPath);
      } catch (error) {
        console.error('Error starting path:', error);
      }
    })
    .onUpdate((event) => {
      try {
        if (currentPath) {
          const adjustedX = (event.x - translateX.value) / scale.value;
          const adjustedY = (event.y - translateY.value) / scale.value;
          currentPath.lineTo(adjustedX, adjustedY);
          const pathString = currentPath.toSVGString();
          if (pathString) {
            const updatedPath = Skia.Path.MakeFromSVGString(pathString);
            if (updatedPath) {
              setCurrentPath(updatedPath);
            }
          }
        }
      } catch (error) {
        console.error('Error updating path:', error);
      }
    })
    .onEnd(() => {
      try {
        if (currentPath) {
          const newPathObj = {
            path: currentPath,
            color: selectedColor,
            width: strokeWidth,
            style: penStyle,
          };
          const newPaths = [...paths, newPathObj];
          setPaths(newPaths);
          setHistory([...history, paths]);
          setRedoStack([]);
          setCurrentPath(null);
        }
      } catch (error) {
        console.error('Error ending path:', error);
      }
    });

  // Pinch gesture for zooming
  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = Math.max(0.5, Math.min(savedScale.value * event.scale, 5));
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  // Pan gesture for canvas movement (two fingers)
  const panCanvasGesture = Gesture.Pan()
    .minPointers(2)
    .onUpdate((event) => {
      translateX.value = savedTranslateX.value + event.translationX;
      translateY.value = savedTranslateY.value + event.translationY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  // Combine gestures
  const composedGesture = Gesture.Race(
    drawGesture,
    Gesture.Simultaneous(pinchGesture, panCanvasGesture)
  );

  // Animated style for canvas transformation
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  // Undo function
  const handleUndo = () => {
    if (history.length > 0) {
      const previousState = history[history.length - 1];
      const newHistory = history.slice(0, -1);
      setRedoStack([...redoStack, paths]);
      setPaths(previousState);
      setHistory(newHistory);
    }
  };

  // Redo function
  const handleRedo = () => {
    if (redoStack.length > 0) {
      const nextState = redoStack[redoStack.length - 1];
      const newRedoStack = redoStack.slice(0, -1);
      setHistory([...history, paths]);
      setPaths(nextState);
      setRedoStack(newRedoStack);
    }
  };

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
        <GestureDetector gesture={composedGesture}>
          <Animated.View style={[styles.canvas, animatedStyle]}>
            <Canvas style={{ width: SCREEN_WIDTH, height: CANVAS_HEIGHT }}>
              {/* Draw all completed paths */}
              {paths.map((pathObj, index) => (
                <Path
                  key={index}
                  path={pathObj.path}
                  color={pathObj.color}
                  style="stroke"
                  strokeWidth={pathObj.width}
                  strokeCap="round"
                  strokeJoin="round"
                />
              ))}

              {/* Draw current path being drawn */}
              {currentPath && (
                <Path
                  path={currentPath}
                  color={selectedColor}
                  style="stroke"
                  strokeWidth={strokeWidth}
                  strokeCap="round"
                  strokeJoin="round"
                />
              )}
            </Canvas>
          </Animated.View>
        </GestureDetector>
      </View>

      {/* Bottom Toolbar with Blur Effect */}
      <View style={styles.toolbarContainer}>
        <View style={styles.toolbar}>
          {/* Pencil Tool */}
          <TouchableOpacity
            style={[styles.toolButton, selectedTool === 'pencil' && styles.toolButtonActive]}
            onPress={() => {
              setSelectedTool('pencil');
              setShowOptionsBar(!showOptionsBar);
            }}
          >
            <Ionicons
              name="pencil"
              size={24}
              color={selectedTool === 'pencil' ? '#6B4BA8' : '#666'}
            />
            <Text style={[styles.toolLabel, selectedTool === 'pencil' && styles.toolLabelActive]}>
              Pencil
            </Text>
          </TouchableOpacity>

          {/* Eraser Tool */}
          <TouchableOpacity
            style={[styles.toolButton, selectedTool === 'eraser' && styles.toolButtonActive]}
            onPress={() => {
              setSelectedTool('eraser');
              setShowOptionsBar(false);
            }}
          >
            <Ionicons
              name="color-wand"
              size={24}
              color={selectedTool === 'eraser' ? '#6B4BA8' : '#666'}
            />
            <Text style={[styles.toolLabel, selectedTool === 'eraser' && styles.toolLabelActive]}>
              Eraser
            </Text>
          </TouchableOpacity>

          {/* Shapes Tool */}
          <TouchableOpacity
            style={[styles.toolButton, selectedTool === 'shapes' && styles.toolButtonActive]}
            onPress={() => setSelectedTool('shapes')}
          >
            <Ionicons
              name="shapes"
              size={24}
              color={selectedTool === 'shapes' ? '#6B4BA8' : '#666'}
            />
            <Text style={[styles.toolLabel, selectedTool === 'shapes' && styles.toolLabelActive]}>
              Shapes
            </Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Undo Button */}
          <TouchableOpacity
            style={[styles.toolButton, history.length === 0 && styles.toolButtonDisabled]}
            onPress={handleUndo}
            disabled={history.length === 0}
          >
            <Ionicons
              name="arrow-undo"
              size={24}
              color={history.length === 0 ? '#ccc' : '#666'}
            />
            <Text style={[styles.toolLabel, history.length === 0 && styles.toolLabelDisabled]}>
              Undo
            </Text>
          </TouchableOpacity>

          {/* Redo Button */}
          <TouchableOpacity
            style={[styles.toolButton, redoStack.length === 0 && styles.toolButtonDisabled]}
            onPress={handleRedo}
            disabled={redoStack.length === 0}
          >
            <Ionicons
              name="arrow-redo"
              size={24}
              color={redoStack.length === 0 ? '#ccc' : '#666'}
            />
            <Text style={[styles.toolLabel, redoStack.length === 0 && styles.toolLabelDisabled]}>
              Redo
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Expandable Options Bar */}
      {showOptionsBar && (
        <View style={styles.optionsBarContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsBar}>
            {/* Color Picker Section */}
            <View style={styles.optionSection}>
              <Text style={styles.optionTitle}>Colors</Text>
              <View style={styles.colorRow}>
                {COLORS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorButton,
                      { backgroundColor: color },
                      selectedColor === color && styles.colorButtonSelected,
                    ]}
                    onPress={() => setSelectedColor(color)}
                  >
                    {selectedColor === color && (
                      <Ionicons name="checkmark" size={16} color={color === '#FFFFFF' ? '#000' : '#FFF'} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Stroke Width Section */}
            <View style={styles.optionSection}>
              <Text style={styles.optionTitle}>Stroke Width</Text>
              <View style={styles.strokeRow}>
                {STROKE_WIDTHS.map((width) => (
                  <TouchableOpacity
                    key={width}
                    style={[
                      styles.strokeButton,
                      strokeWidth === width && styles.strokeButtonSelected,
                    ]}
                    onPress={() => setStrokeWidth(width)}
                  >
                    <View
                      style={[
                        styles.strokePreview,
                        { width: width * 2, height: width * 2, borderRadius: width },
                      ]}
                    />
                    <Text style={styles.strokeLabel}>{width}px</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Pen Style Section */}
            <View style={styles.optionSection}>
              <Text style={styles.optionTitle}>Pen Style</Text>
              <View style={styles.penStyleRow}>
                <TouchableOpacity
                  style={[styles.penStyleButton, penStyle === 'normal' && styles.penStyleButtonSelected]}
                  onPress={() => setPenStyle('normal')}
                >
                  <Ionicons name="pencil" size={20} color="#666" />
                  <Text style={styles.penStyleLabel}>Normal</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.penStyleButton, penStyle === 'smooth' && styles.penStyleButtonSelected]}
                  onPress={() => setPenStyle('smooth')}
                >
                  <Ionicons name="create" size={20} color="#666" />
                  <Text style={styles.penStyleLabel}>Smooth</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.penStyleButton, penStyle === 'marker' && styles.penStyleButtonSelected]}
                  onPress={() => setPenStyle('marker')}
                >
                  <Ionicons name="color-fill" size={20} color="#666" />
                  <Text style={styles.penStyleLabel}>Marker</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.penStyleButton, penStyle === 'brush' && styles.penStyleButtonSelected]}
                  onPress={() => setPenStyle('brush')}
                >
                  <Ionicons name="brush" size={20} color="#666" />
                  <Text style={styles.penStyleLabel}>Brush</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.penStyleButton, penStyle === 'calligraphy' && styles.penStyleButtonSelected]}
                  onPress={() => setPenStyle('calligraphy')}
                >
                  <Ionicons name="text" size={20} color="#666" />
                  <Text style={styles.penStyleLabel}>Calligraphy</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      )}
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
  toolbarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: TOOLBAR_HEIGHT,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  toolbar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  toolButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    minWidth: 60,
  },
  toolButtonActive: {
    backgroundColor: '#E8E0F5',
  },
  toolButtonDisabled: {
    opacity: 0.4,
  },
  toolLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
    fontWeight: '500',
  },
  toolLabelActive: {
    color: '#6B4BA8',
    fontWeight: 'bold',
  },
  toolLabelDisabled: {
    color: '#ccc',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 5,
  },
  optionsBarContainer: {
    position: 'absolute',
    bottom: TOOLBAR_HEIGHT,
    left: 0,
    right: 0,
    height: OPTIONS_BAR_HEIGHT,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  optionsBar: {
    flex: 1,
    paddingVertical: 10,
  },
  optionSection: {
    paddingHorizontal: 15,
    marginRight: 10,
  },
  optionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorButtonSelected: {
    borderColor: '#6B4BA8',
    borderWidth: 3,
  },
  strokeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  strokeButton: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    minWidth: 50,
  },
  strokeButtonSelected: {
    backgroundColor: '#E8E0F5',
    borderWidth: 2,
    borderColor: '#6B4BA8',
  },
  strokePreview: {
    backgroundColor: '#6B4BA8',
    marginBottom: 4,
  },
  strokeLabel: {
    fontSize: 10,
    color: '#666',
  },
  penStyleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  penStyleButton: {
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    minWidth: 70,
  },
  penStyleButtonSelected: {
    backgroundColor: '#E8E0F5',
    borderWidth: 2,
    borderColor: '#6B4BA8',
  },
  penStyleLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
  },
});
