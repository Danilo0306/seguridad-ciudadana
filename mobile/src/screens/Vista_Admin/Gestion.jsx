import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

const Gestion = () => {
    const { theme } = useTheme();
    return (
        <View style={[styles.container, { backgroundColor: theme.surface }] }>
            <Text style={[styles.hola, { color: theme.textPrimary }]}>Hola Gestión</Text>
        </View>
    );
};

export default Gestion;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        padding: 16,
    },
    hola: {
        fontSize: 24,
        fontWeight: '600',
        color: '#333',
    },
});
