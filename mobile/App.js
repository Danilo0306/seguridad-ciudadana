import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

import { ThemeProvider } from './src/theme/ThemeContext.js';
import { UserProvider } from './src/theme/UserContext.js'; // Context de usuario

import Login from './src/screens/Login.jsx';
import Register from './src/screens/Register.jsx';

import DashboardAdmin from './src/screens/Vista_Admin/DashboardAdmin.jsx';
import HomeUsuario from './src/screens/Vista_Usuario/HomeUsuario.jsx';
import EditarPerfil from './src/screens/Vista_Usuario/EditarPerfil.jsx';

const Stack = createNativeStackNavigator();

export default function App() {
  const [userType, setUserType] = useState(null);

  /*
    userType:
      "admin" → DashboardAdmin
      "user" → HomeUsuario
      null → Login/Register
  */

  const AuthStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login">
        {(props) => <Login {...props} onLogin={(type) => setUserType(type)} />}
      </Stack.Screen>

      <Stack.Screen name="Register">
        {(props) => <Register {...props} onRegister={(type) => setUserType(type)} />}
      </Stack.Screen>
    </Stack.Navigator>
  );

  const AdminStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DashboardAdmin">
        {(props) => <DashboardAdmin {...props} onLogout={() => setUserType(null)} />}
      </Stack.Screen>
    </Stack.Navigator>
  );

  const UserStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeUsuario">
        {(props) => <HomeUsuario {...props} onLogout={() => setUserType(null)} />}
      </Stack.Screen>
      <Stack.Screen name="EditarPerfil" component={EditarPerfil} />
    </Stack.Navigator>
  );

  return (
    <ThemeProvider>
      <UserProvider> {/* 👈 Context disponible en toda la app */}
        <NavigationContainer>
          <StatusBar style="auto" />
          {userType === "admin" && <AdminStack />}
          {userType === "user" && <UserStack />}
          {userType === null && <AuthStack />}
        </NavigationContainer>
      </UserProvider>
    </ThemeProvider>
  );
}
