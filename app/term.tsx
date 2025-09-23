import { useRouter } from 'expo-router';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function TermsPage() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: '#d69ef5ff', padding: 24 }}>
      {/* Back Button - Top Left */}
      <View style={{ position: 'absolute', top: 50, left: 20, zIndex: 10 }}>
        <TouchableOpacity
          style={{
            backgroundColor: '#884adaff',
            paddingVertical: 10,
            paddingHorizontal: 16,
            borderRadius: 20,
            elevation: 4,
            shadowColor: '#e8b4ff',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
          }}
          onPress={() => router.back()}
        >
          <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#884adaff', fontSize: 30, fontWeight: 'bold', marginTop:65 }}>
          Terms and Conditions
        </Text>
        <Text style={{ color: 'white', fontSize: 25, textAlign: 'center', marginTop: 30, fontWeight: '500' }}>
          Welcome to C.A.L.M Space!
          {"\n\n"}
          By using this app, you agree to the following terms and conditions:
          {"\n\n"}
          1. You will use this app for lawful and respectful purposes only.
          {"\n\n"}
          2. Your personal data will be handled according to our privacy policy.
          {"\n\n"}
          3. The app is provided "as is" without warranties of any kind.
          {"\n\n"}
          4. We may update these terms at any time. Continued use means you accept the new terms.
          {"\n\n"}
          5. For questions, contact support@calmspace.com.
          {"\n\n"}
          Thank you for using our app!
        </Text>
      </ScrollView>
    </View>
  );
}
