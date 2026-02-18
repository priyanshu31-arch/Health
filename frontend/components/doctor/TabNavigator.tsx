
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import DoctorFilterScreen from './doctor-filter-screen';
import DoctorInfoScreen from './doctor-info';
import PaymentScreen from './payment-screen';
import BookingConfirmScreen from './booking-confirm-screen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const BookingStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="DoctorFilter" component={DoctorFilterScreen} />
    <Stack.Screen name="DoctorInfo" component={DoctorInfoScreen} />
    <Stack.Screen name="Payment" component={PaymentScreen} />
    <Stack.Screen name="BookingConfirm" component={BookingConfirmScreen} />
  </Stack.Navigator>
);

const ProfileScreen = () => null; // Placeholder for profile screen

const TabNavigator = () => (
  <Tab.Navigator>
    <Tab.Screen
      name="Home"
      component={BookingStack}
      options={{
        tabBarIcon: ({ color, size }) => (
          <MaterialCommunityIcons name="home" color={color} size={size} />
        ),
      }}
    />
    <Tab.Screen
      name="Profile"
      component={ProfileScreen} // Replace with your Profile screen component
      options={{
        tabBarIcon: ({ color, size }) => (
          <MaterialCommunityIcons name="account" color={color} size={size} />
        ),
      }}
    />
  </Tab.Navigator>
);

export default TabNavigator;
