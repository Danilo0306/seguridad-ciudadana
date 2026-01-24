import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';

const ThemeToggle = () => {
  const { mode, toggleTheme, theme } = useTheme();
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={mode === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
      onPress={toggleTheme}
      activeOpacity={0.8}
      style={[styles.root, { borderColor: theme.textPrimary }]}
    >
      <View style={[styles.circle, { backgroundColor: theme.textPrimary }]}> 
        <Ionicons
          name={mode === 'light' ? 'moon' : 'sunny'}
          size={18}
          color={theme.mode === 'light' ? '#ffffff' : '#ffffff'}
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  root: {
    width: 56,
    height: 30,
    borderRadius: 20,
    borderWidth: 2,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  circle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ThemeToggle;
