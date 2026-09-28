import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import type { MainTabParamList } from '../App';
import Equipe from './Equipe';
import Especialidades from './Especialidades';
import Home from './Home';
import { clinicColors as colors } from './clinicTheme';

const Tab = createBottomTabNavigator<MainTabParamList>();

const tabIcons: Record<keyof MainTabParamList, React.ComponentProps<typeof Ionicons>['name']> = {
    Agenda: 'calendar-outline',
    Especialidades: 'grid-outline',
    Equipe: 'people-outline',
};

export default function MainTabs() {
    return (
        <Tab.Navigator
            initialRouteName="Agenda"
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarActiveTintColor: colors.green,
                tabBarInactiveTintColor: colors.muted,
                tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginBottom: 3 },
                tabBarStyle: {
                    height: 66,
                    paddingTop: 7,
                    paddingBottom: 8,
                    backgroundColor: colors.white,
                    borderTopColor: colors.line,
                    borderTopWidth: 1,
                    elevation: 0,
                },
                tabBarIcon: ({ color, size }) => (
                    <Ionicons name={tabIcons[route.name]} size={size} color={color} />
                ),
            })}
        >
            <Tab.Screen name="Agenda" component={Home} options={{ tabBarLabel: 'Agenda' }} />
            <Tab.Screen name="Especialidades" component={Especialidades} options={{ tabBarLabel: 'Especialidades' }} />
            <Tab.Screen name="Equipe" component={Equipe} options={{ tabBarLabel: 'Equipe' }} />
        </Tab.Navigator>
    );
}