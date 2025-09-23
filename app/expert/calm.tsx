import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ExpertCalm() {
  const router = useRouter();
  const [isPlaying, setIsPlaying] = useState(false);
  const breathingAnimation = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isPlaying) {
      startBreathingAnimation();
    } else {
      stopBreathingAnimation();
    }
  }, [isPlaying]);

  const startBreathingAnimation = () => {
    const breatheIn = () => {
      Animated.timing(breathingAnimation, {
        toValue: 1.3,
        duration: 4000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start(breatheOut);
    };

    const breatheOut = () => {
      Animated.timing(breathingAnimation, {
        toValue: 1,
        duration: 4000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start(breatheIn);
    };

    breatheIn();
  };

  const stopBreathingAnimation = () => {
    breathingAnimation.stopAnimation();
    Animated.timing(breathingAnimation, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={styles.container}>
      <View style={styles.gradientBackground} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🧘‍♀️ Expert Calm Companion</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Breathing Exercise */}
        <View style={styles.exerciseCard}>
          <Text style={styles.cardTitle}>🫁 Guided Breathing</Text>
          <Text style={styles.cardSubtitle}>For mental health professionals</Text>
          
          <View style={styles.breathingContainer}>
            <Animated.View 
              style={[
                styles.breathingCircle,
                {
                  transform: [{ scale: breathingAnimation }]
                }
              ]}
            >
              <Text style={styles.breathingText}>
                {isPlaying ? 'Breathe' : 'Start'}
              </Text>
            </Animated.View>
          </View>

          <TouchableOpacity
            style={[styles.controlButton, { backgroundColor: isPlaying ? '#e74c3c' : '#27ae60' }]}
            onPress={() => setIsPlaying(!isPlaying)}
          >
            <Text style={styles.controlButtonText}>
              {isPlaying ? 'Stop' : 'Start Breathing'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.instructionText}>
            {isPlaying 
              ? "Follow the circle - breathe in as it expands, out as it contracts" 
              : "Take a moment to center yourself before helping others"
            }
          </Text>
        </View>

        {/* Meditation Techniques */}
        <View style={styles.exerciseCard}>
          <Text style={styles.cardTitle}>🧠 Mindfulness for Experts</Text>
          <Text style={styles.cardDescription}>
            As a mental health professional, your well-being is crucial. 
            These techniques help you maintain emotional balance while supporting others.
          </Text>
          
          <View style={styles.techniquesList}>
            <View style={styles.techniqueItem}>
              <Text style={styles.techniqueIcon}>🌸</Text>
              <View style={styles.techniqueContent}>
                <Text style={styles.techniqueName}>Professional Grounding</Text>
                <Text style={styles.techniqueDesc}>5-4-3-2-1 technique for session transitions</Text>
              </View>
            </View>

            <View style={styles.techniqueItem}>
              <Text style={styles.techniqueIcon}>💙</Text>
              <View style={styles.techniqueContent}>
                <Text style={styles.techniqueName}>Compassion Reset</Text>
                <Text style={styles.techniqueDesc}>Self-compassion practice between clients</Text>
              </View>
            </View>

            <View style={styles.techniqueItem}>
              <Text style={styles.techniqueIcon}>🌿</Text>
              <View style={styles.techniqueContent}>
                <Text style={styles.techniqueName}>Energy Cleansing</Text>
                <Text style={styles.techniqueDesc}>Release absorbed emotions from sessions</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Expert Wellness Tips */}
        <View style={styles.exerciseCard}>
          <Text style={styles.cardTitle}>💡 Expert Wellness Tips</Text>
          
          <View style={styles.tipsList}>
            <Text style={styles.tip}>• Practice boundary setting between professional and personal time</Text>
            <Text style={styles.tip}>• Use micro-meditations between client sessions</Text>
            <Text style={styles.tip}>• Remember: You cannot pour from an empty cup</Text>
            <Text style={styles.tip}>• Schedule regular supervision and peer support</Text>
            <Text style={styles.tip}>• Engage in activities that bring you joy outside of work</Text>
          </View>
        </View>

        {/* Quick Tools */}
        <View style={styles.toolsContainer}>
          <Text style={styles.cardTitle}>⚡ Quick Tools</Text>
          
          <View style={styles.toolsGrid}>
            <TouchableOpacity style={styles.toolButton}>
              <Text style={styles.toolIcon}>⏰</Text>
              <Text style={styles.toolName}>2-Min Break</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.toolButton}>
              <Text style={styles.toolIcon}>🎵</Text>
              <Text style={styles.toolName}>Calming Sounds</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.toolButton}>
              <Text style={styles.toolIcon}>📝</Text>
              <Text style={styles.toolName}>Reflection Journal</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.toolButton}>
              <Text style={styles.toolIcon}>🌅</Text>
              <Text style={styles.toolName}>Energy Reset</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#7965AF',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignSelf: 'flex-start',
    marginBottom: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  backButtonText: {
    color: '#7965AF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  exerciseCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 25,
    marginBottom: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  cardDescription: {
    fontSize: 16,
    color: '#2C3E50',
    lineHeight: 24,
    marginBottom: 20,
  },
  breathingContainer: {
    alignItems: 'center',
    marginVertical: 30,
  },
  breathingCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#7965AF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#7965AF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  breathingText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  controlButton: {
    borderRadius: 25,
    paddingVertical: 15,
    paddingHorizontal: 30,
    alignSelf: 'center',
    marginBottom: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  controlButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  instructionText: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  techniquesList: {
    marginTop: 10,
  },
  techniqueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    padding: 15,
    backgroundColor: 'rgba(121, 101, 175, 0.1)',
    borderRadius: 15,
  },
  techniqueIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  techniqueContent: {
    flex: 1,
  },
  techniqueName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 3,
  },
  techniqueDesc: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  tipsList: {
    marginTop: 10,
  },
  tip: {
    fontSize: 14,
    color: '#2C3E50',
    lineHeight: 22,
    marginBottom: 8,
  },
  toolsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 25,
    marginBottom: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  toolButton: {
    width: '48%',
    backgroundColor: '#7965AF',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    marginBottom: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  toolIcon: {
    fontSize: 30,
    marginBottom: 8,
  },
  toolName: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
