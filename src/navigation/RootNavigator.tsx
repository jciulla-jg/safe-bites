import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Platform, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SearchScreen } from '../screens/SearchScreen';
import { RestaurantDetailScreen } from '../screens/RestaurantDetailScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import type { RootTabParamList, SearchStackParamList } from './types';
import { colors } from './theme';

const Tab = createBottomTabNavigator<RootTabParamList>();
const SearchStack = createNativeStackNavigator<SearchStackParamList>();
const ProfileStack = createNativeStackNavigator();

const stackHeaderOptions = {
  headerStyle: { backgroundColor: colors.brand },
  headerTintColor: '#fff',
  headerTitleStyle: { fontWeight: '700' as const },
  headerShadowVisible: false,
};

/** Small app "logo" -- an icon beside the title, on the app's home screen only. */
function BrandedTitle({ title }: { title: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Ionicons name="shield-checkmark" size={20} color={colors.accent} />
      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 18 }}>{title}</Text>
    </View>
  );
}

/**
 * Search + RestaurantDetail live in their own stack so a restaurant can be
 * pushed on top of the search results and popped back, while Profile stays
 * a single screen in its own tab.
 */
function SearchStackNavigator() {
  return (
    <SearchStack.Navigator screenOptions={stackHeaderOptions}>
      <SearchStack.Screen
        name="Search"
        component={SearchScreen}
        options={{ headerTitle: () => <BrandedTitle title="Safe Bites" /> }}
      />
      <SearchStack.Screen
        name="RestaurantDetail"
        component={RestaurantDetailScreen}
        options={{ title: 'Restaurant' }}
      />
    </SearchStack.Navigator>
  );
}

function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={stackHeaderOptions}>
      <ProfileStack.Screen name="ProfileHome" component={ProfileScreen} options={{ title: 'Your Profile' }} />
    </ProfileStack.Navigator>
  );
}

// Web only: keep the address bar in step with the active tab, so refreshing
// (or opening a shared link to) /profile lands on Profile. Deliberately
// tab-level only -- a restaurant page's data comes from the search that
// opened it, so it can't be rebuilt from a URL.
const isWeb = Platform.OS === 'web' && typeof window !== 'undefined';
// GitHub Pages serves the app under /safe-bites (app.config.js).
const webBase = isWeb && window.location.pathname.startsWith('/safe-bites') ? '/safe-bites' : '';
const initialTab: 'Profile' | 'SearchStack' =
  isWeb && /\/profile\/?$/i.test(window.location.pathname) ? 'Profile' : 'SearchStack';

function syncUrlToTab(state: { index: number; routes: { name: string }[] } | undefined) {
  if (!isWeb || !state) return;
  const path = webBase + (state.routes[state.index]?.name === 'Profile' ? '/profile' : '/');
  if (window.location.pathname !== path) window.history.replaceState(null, '', path);
}

export function RootNavigator() {
  // Grow the tab bar by the bottom inset so it clears Android's gesture/button
  // bar (and the iPhone home indicator) instead of sitting underneath it.
  const insets = useSafeAreaInsets();
  return (
    <NavigationContainer onStateChange={syncUrlToTab}>
      <Tab.Navigator
        initialRouteName={initialTab}
        screenOptions={{
          headerShown: false,
          tabBarHideOnKeyboard: true,
          tabBarActiveTintColor: colors.brand,
          tabBarInactiveTintColor: '#9a9a9a',
          tabBarStyle: {
            borderTopColor: '#ececec',
            paddingTop: 6,
            paddingBottom: insets.bottom + 4,
            height: 60 + insets.bottom,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
          },
        }}
      >
        <Tab.Screen
          name="SearchStack"
          component={SearchStackNavigator}
          options={{
            title: 'Search',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? 'search' : 'search-outline'} size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileStackNavigator}
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
