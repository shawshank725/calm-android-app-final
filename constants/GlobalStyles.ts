import { StyleSheet } from 'react-native';
import { Colors } from './Colors'; // Import the new color palette

// Default font family for the entire app
export const defaultFontFamily = 'Tinos';

// Global styles with Tinos font applied and purple theme
export const globalStyles = StyleSheet.create({
  defaultText: {
    fontFamily: defaultFontFamily,
    fontSize: 16,
    color: Colors.text, // Dark purple text
  },
  title: {
    fontFamily: defaultFontFamily,
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary, // Deep purple for titles
  },
  subtitle: {
    fontFamily: defaultFontFamily,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.secondary, // Standard purple for subtitles
  },
  body: {
    fontFamily: defaultFontFamily,
    fontSize: 16,
    color: Colors.text, // Dark purple text
  },
  caption: {
    fontFamily: defaultFontFamily,
    fontSize: 14,
    color: Colors.textSecondary, // Medium purple for captions
  },
  button: {
    fontFamily: defaultFontFamily,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white, // White text on purple buttons
  },
  input: {
    fontFamily: defaultFontFamily,
    fontSize: 16,
    color: Colors.text, // Dark purple text for inputs
  },

  // Container styles with purple theme
  container: {
    backgroundColor: Colors.background,
  },
  card: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    shadowColor: Colors.shadow,
  },
  buttonPrimary: {
    backgroundColor: Colors.buttonPrimary,
  },
  buttonSecondary: {
    backgroundColor: Colors.buttonSecondary,
  },
  buttonDisabled: {
    backgroundColor: Colors.buttonDisabled,
  },
});

// Helper function to apply default font and text color to any style
export const withDefaultFont = (style: any = {}) => ({
  fontFamily: defaultFontFamily,
  color: Colors.text, // Also apply default text color here
  ...style,
});
