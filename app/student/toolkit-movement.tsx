import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function ToolkitMovement() {
  const router = useRouter();

  // Shake It Out State
  const [showShakeOut, setShowShakeOut] = useState(false);
  const [shakeStep, setShakeStep] = useState(0);
  const [shakeTimer, setShakeTimer] = useState(10);
  const [isShaking, setIsShaking] = useState(false);

  // Dance and Movement Art State
  const [showDanceArt, setShowDanceArt] = useState(false);
  const [danceStep, setDanceStep] = useState(0);
  const [danceTimer, setDanceTimer] = useState(30);
  const [isDancing, setIsDancing] = useState(false);

  // Shake it out steps
  const shakeSteps = [
    { name: 'Shake Your Hands', duration: 10, instruction: 'Shake your hands vigorously! Let all the tension go!' },
    { name: 'Shake Your Feet', duration: 10, instruction: 'Now shake your feet! Feel the energy moving!' },
    { name: 'Shake Your Whole Body', duration: 30, instruction: 'Shake everything! Jump, wiggle, be silly! Let it all out!' },
    { name: 'Deep Breath & Stillness', duration: 10, instruction: 'Stop and take three deep breaths. Notice how alive you feel!' }
  ];

  // Dance and Movement Art steps
  const danceSteps = [
    { name: 'Feel the Music', duration: 30, instruction: 'Close your eyes and let the music move through you. There\'s no wrong way to dance!' },
    { name: 'Express Yourself', duration: 45, instruction: 'Move your body in ways that feel good. Let your emotions flow through movement.' },
    { name: 'Creative Flow', duration: 60, instruction: 'Imagine you\'re painting with your body. Each movement creates a beautiful stroke of art.' },
    { name: 'Dance Like Nobody\'s Watching', duration: 45, instruction: 'Be completely free! Dance with wild abandon and joy.' },
    { name: 'Peaceful Stillness', duration: 30, instruction: 'Slowly come to stillness. Feel the energy and creativity flowing through you.' }
  ];

  // Shake timer effect
  useEffect(() => {
    let timer: any;
    if (isShaking && shakeTimer > 0) {
      timer = setTimeout(() => {
        setShakeTimer((prev) => prev - 1);
      }, 1000);
    } else if (isShaking && shakeTimer === 0) {
      // Move to next shake step
      if (shakeStep < shakeSteps.length - 1) {
        setShakeStep((prev) => prev + 1);
        setShakeTimer(shakeSteps[shakeStep + 1]?.duration || 10);
      } else {
        setIsShaking(false);
        Alert.alert('Complete!', 'How does your body feel now? More alive? More relaxed?');
      }
    }
    return () => clearTimeout(timer);
  }, [isShaking, shakeTimer, shakeStep]);

  // Dance timer effect
  useEffect(() => {
    let timer: any;
    if (isDancing && danceTimer > 0) {
      timer = setTimeout(() => {
        setDanceTimer((prev) => prev - 1);
      }, 1000);
    } else if (isDancing && danceTimer === 0) {
      // Move to next dance step
      if (danceStep < danceSteps.length - 1) {
        setDanceStep((prev) => prev + 1);
        setDanceTimer(danceSteps[danceStep + 1]?.duration || 30);
      } else {
        setIsDancing(false);
        Alert.alert('Beautiful!', 'You\'ve created a masterpiece of movement! How do you feel?');
      }
    }
    return () => clearTimeout(timer);
  }, [isDancing, danceTimer, danceStep]);

  const resetStates = () => {
    setShakeStep(0);
    setShakeTimer(10);
    setIsShaking(false);
    setDanceStep(0);
    setDanceTimer(30);
    setIsDancing(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#e8f5e8' }}>
      {/* Header */}
      <View style={{ paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20, backgroundColor: '#27ae60' }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 15 }}>
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ color: '#fff', fontSize: 28, fontWeight: 'bold', textAlign: 'center' }}>Movement Exercise</Text>
        <Text style={{ color: '#fff', fontSize: 16, textAlign: 'center', marginTop: 5 }}>Connect with your body through movement</Text>
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={{ paddingVertical: 20 }}>
          {/* Dance and Movement Art */}
          <TouchableOpacity
            style={{ backgroundColor: '#9b59b6', borderRadius: 20, padding: 25, marginBottom: 20, elevation: 5 }}
            onPress={() => setShowDanceArt(true)}
          >
            <Text style={{ color: '#fff', fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 }}>Dance and Movement Art</Text>
            <Text style={{ color: '#fff', fontSize: 14, textAlign: 'center' }}>Express yourself through creative movement</Text>
          </TouchableOpacity>

          {/* Shake It Out */}
          <TouchableOpacity
            style={{ backgroundColor: '#e74c3c', borderRadius: 20, padding: 25, marginBottom: 20, elevation: 5 }}
            onPress={() => setShowShakeOut(true)}
          >
            <Text style={{ color: '#fff', fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 }}>Shake It Out!</Text>
            <Text style={{ color: '#fff', fontSize: 14, textAlign: 'center' }}>60 seconds of energizing movement</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Shake It Out Modal */}
      <Modal visible={showShakeOut} animationType="slide" transparent={true}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 30, width: '90%' }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, color: '#2c3e50' }}>Shake It Out!</Text>

            <Text style={{ fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 15, color: '#e74c3c' }}>
              {shakeSteps[shakeStep]?.name}
            </Text>

            <Text style={{ fontSize: 16, textAlign: 'center', marginBottom: 20, color: '#2c3e50', lineHeight: 24 }}>
              {shakeSteps[shakeStep]?.instruction}
            </Text>

            {isShaking && (
              <View style={{ alignItems: 'center', marginBottom: 20 }}>
                <Text style={{ fontSize: 48, fontWeight: 'bold', color: '#e74c3c' }}>{shakeTimer}</Text>
                <Text style={{ fontSize: 16, color: '#2c3e50' }}>seconds remaining</Text>
              </View>
            )}

            <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
              <TouchableOpacity
                style={{ backgroundColor: '#95a5a6', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10 }}
                onPress={() => {
                  setShowShakeOut(false);
                  setIsShaking(false);
                  resetStates();
                }}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Close</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{ backgroundColor: isShaking ? '#e74c3c' : '#2ecc71', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10 }}
                onPress={() => {
                  if (isShaking) {
                    setIsShaking(false);
                  } else {
                    setIsShaking(true);
                    setShakeStep(0);
                    setShakeTimer(shakeSteps[0].duration);
                  }
                }}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>{isShaking ? 'Stop' : 'Start Shaking!'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Dance and Movement Art Modal */}
      <Modal visible={showDanceArt} animationType="slide" transparent={true}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 30, width: '90%' }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, color: '#2c3e50' }}>Dance and Movement Art</Text>

            <Text style={{ fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 15, color: '#9b59b6' }}>
              {danceSteps[danceStep]?.name}
            </Text>

            <Text style={{ fontSize: 16, textAlign: 'center', marginBottom: 20, color: '#2c3e50', lineHeight: 24 }}>
              {danceSteps[danceStep]?.instruction}
            </Text>

            {isDancing && (
              <View style={{ alignItems: 'center', marginBottom: 20 }}>
                <Text style={{ fontSize: 48, fontWeight: 'bold', color: '#9b59b6' }}>{danceTimer}</Text>
                <Text style={{ fontSize: 16, color: '#2c3e50' }}>seconds remaining</Text>
              </View>
            )}

            <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
              <TouchableOpacity
                style={{ backgroundColor: '#95a5a6', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10 }}
                onPress={() => {
                  setShowDanceArt(false);
                  setIsDancing(false);
                  resetStates();
                }}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Close</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{ backgroundColor: isDancing ? '#e74c3c' : '#2ecc71', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10 }}
                onPress={() => {
                  if (isDancing) {
                    setIsDancing(false);
                  } else {
                    setIsDancing(true);
                    setDanceStep(0);
                    setDanceTimer(danceSteps[0].duration);
                  }
                }}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>{isDancing ? 'Stop' : 'Start Dancing!'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
