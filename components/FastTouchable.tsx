import React from 'react';
import { TouchableOpacity, TouchableOpacityProps } from 'react-native';

interface FastTouchableProps extends TouchableOpacityProps {
  children: React.ReactNode;
  onPress?: () => void;
  instantFeedback?: boolean;
}

// Ultra-fast TouchableOpacity component for instant response
export const FastTouchable: React.FC<FastTouchableProps> = ({
  children,
  onPress,
  instantFeedback = true,
  activeOpacity = 0.3,
  delayPressIn = 0,
  delayPressOut = 0,
  ...props
}) => {
  const handlePress = () => {
    if (instantFeedback && onPress) {
      // Immediate callback execution for instant feedback
      onPress();
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={activeOpacity}
      delayPressIn={delayPressIn}
      delayPressOut={delayPressOut}
      {...props}
    >
      {children}
    </TouchableOpacity>
  );
};

export default FastTouchable;
