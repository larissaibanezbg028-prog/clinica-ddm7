import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';

import type { MainDrawerParamList } from '../App';
import Clinica from './Clinica';
import MainTabs from './MainTabs';
import { clinicColors as colors } from './clinicTheme';

const Drawer = createDrawerNavigator<MainDrawerParamList>();

export default function MainDrawer() {
    return (
        <Drawer.Navigator
            initialRouteName="Atendimento"
            screenOptions={{
                headerShown: false,
                drawerPosition: 'left',
                drawerType: 'front',
                drawerActiveTintColor: colors.green,
                drawerInactiveTintColor: colors.muted,
                drawerActiveBackgroundColor: colors.pale,
                drawerLabelStyle: { fontSize: 14, fontWeight: '600' },
                drawerItemStyle: { borderRadius: 6, marginHorizontal: 10, width: 'auto' },
                drawerStyle: { width: 286, backgroundColor: colors.background },
                overlayColor: 'rgba(48, 35, 63, 0.38)',
            }}
        >
            <Drawer.Screen name="Atendimento" component={MainTabs} options={{ title: 'Atendimento' }} />
            <Drawer.Screen name="Clinica" component={Clinica} options={{ title: 'Sobre a clínica' }} />
        </Drawer.Navigator>
    );
}