import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from './src/theme';
import { useAuthStore } from './src/stores/authStore';
import { AuthScreen } from './src/screens/AuthScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { SearchScreen } from './src/screens/SearchScreen';
import { CreatePlanScreen } from './src/screens/CreatePlanScreen';
import { PlansHubScreen } from './src/screens/PlansHubScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { EventDetailsScreen } from './src/screens/EventDetailsScreen';
import { CreatePlanFromEventScreen } from './src/screens/CreatePlanFromEventScreen';
import { PlanDetailsScreen } from './src/screens/PlanDetailsScreen';
import { GroupDetailsScreen } from './src/screens/GroupDetailsScreen';
import { NotificationsScreen } from './src/screens/NotificationsScreen';
import { VenueScreen } from './src/screens/VenueScreen';
import type { HomeStackParamList, PlansStackParamList, RootStackParamList } from './src/navigation/types';

const Tab = createBottomTabNavigator();
const HomeStackNav = createNativeStackNavigator<HomeStackParamList>();
const PlansStackNav = createNativeStackNavigator<PlansStackParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();

const HomeStack = () => (
  <HomeStackNav.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
    <HomeStackNav.Screen name="HomeFeed" component={HomeScreen} />
    <HomeStackNav.Screen name="EventDetails" component={EventDetailsScreen} />
    <HomeStackNav.Screen name="CreatePlanFromEvent" component={CreatePlanFromEventScreen} />
    <HomeStackNav.Screen name="VenueDetails" component={VenueScreen} />
  </HomeStackNav.Navigator>
);

const PlansStack = () => (
  <PlansStackNav.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
    <PlansStackNav.Screen name="PlansList" component={PlansHubScreen} />
    <PlansStackNav.Screen name="PlanDetails" component={PlanDetailsScreen} />
    <PlansStackNav.Screen name="GroupDetails" component={GroupDetailsScreen} />
  </PlansStackNav.Navigator>
);

const CreateTabButton = ({ children, onPress }: { children: React.ReactNode; onPress?: (...args: any[]) => void }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.85}
    style={s.createTabBtn}
  >
    <View style={s.createTabCircle}>
      <Ionicons name="add" size={28} color="#fff" />
    </View>
  </TouchableOpacity>
);

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: Platform.select({
        web: {
          height: 56,
          borderTopWidth: 1,
          borderTopColor: theme.colors.borderLight,
          maxWidth: 600,
          alignSelf: 'center',
          width: '100%',
          backgroundColor: 'rgba(255,255,255,0.88)',
          position: 'absolute',
          bottom: 0,
          elevation: 8,
          shadowColor: '#1E1B4B',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
        },
        default: {
          height: 64,
          borderTopWidth: 0,
          backgroundColor: 'rgba(255,255,255,0.92)',
          position: 'absolute',
          bottom: 0,
          elevation: 8,
          shadowColor: '#1E1B4B',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
        },
      }),
      tabBarLabelStyle: { fontSize: 10, fontWeight: '500', marginTop: -4 },
      tabBarActiveTintColor: theme.colors.primary,
      tabBarInactiveTintColor: theme.colors.textTertiary,
    }}
  >
    <Tab.Screen name="HomeTab" component={HomeStack} options={{
      tabBarLabel: 'Главная',
      tabBarIcon: ({ color, size, focused }) => (
        <Ionicons name={focused ? 'home' : 'home-outline'} size={focused ? 24 : 22} color={color} />
      ),
    }} />
    <Tab.Screen name="SearchTab" component={SearchScreen} options={{
      tabBarLabel: 'Поиск',
      tabBarIcon: ({ color, size, focused }) => (
        <Ionicons name={focused ? 'search' : 'search-outline'} size={focused ? 24 : 22} color={color} />
      ),
    }} />
    <Tab.Screen name="CreateTab" component={CreatePlanScreen} options={{
      tabBarLabel: '',
      tabBarButton: (props) => <CreateTabButton {...props} />,
      tabBarIcon: () => null,
    }} />
    <Tab.Screen name="PlansTab" component={PlansStack} options={{
      tabBarLabel: 'Планы',
      tabBarIcon: ({ color, size, focused }) => (
        <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={focused ? 24 : 22} color={color} />
      ),
    }} />
    <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{
      tabBarLabel: 'Профиль',
      tabBarIcon: ({ color, size, focused }) => (
        <Ionicons name={focused ? 'person' : 'person-outline'} size={focused ? 24 : 22} color={color} />
      ),
    }} />
  </Tab.Navigator>
);

const AppNavigator = () => (
  <NavigationContainer>
    <RootStack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <RootStack.Screen name="MainTabs" component={MainTabs} />
      <RootStack.Screen name="Notifications" component={NotificationsScreen} />
    </RootStack.Navigator>
  </NavigationContainer>
);

export default function App() {
  const isAuthenticated = useAuthStore((s: { isAuthenticated: boolean }) => s.isAuthenticated);

  if (!isAuthenticated) return <AuthScreen />;
  return <AppNavigator />;
}

const s = StyleSheet.create({
  createTabBtn: {
    top: -20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createTabCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
});
