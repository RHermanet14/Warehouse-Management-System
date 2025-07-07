import React from 'react';
import { TextInput, TextInputProps, useColorScheme } from 'react-native';
import { inputStyles } from '../constants/Styles';
import { Colors } from '../constants/Colors';

interface ThemedTextInputProps extends TextInputProps {
  value: string;
  onValueChange: (value: string) => void;
  style?: any;
}

const ThemedTextInput: React.FC<ThemedTextInputProps> = ({
  value, 
  onValueChange, 
  style, 
  ...props 
}) => {
    const colorScheme = useColorScheme()
    const theme = Colors[colorScheme] ?? Colors.light
  return (
    <TextInput
      style={[inputStyles.primary, style]}
      value={value}
      onChangeText={onValueChange}
      placeholderTextColor="#666"
      {...props}
    />
  );
};

export default ThemedTextInput; 