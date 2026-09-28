import React from "react";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import Login from './Screens/Login';
import Register from './Screens/Register';
import MainDrawer from './Screens/MainDrawer';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Main: undefined;
}

export type MainDrawerParamList = {
  Atendimento: undefined;
  Clinica: undefined;
}

export type MainTabParamList = {
  Agenda: undefined;
  Especialidades: undefined;
  Equipe: undefined;
}

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="Register" component={Register} />
          <Stack.Screen name="Main" component={MainDrawer} />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  )
}