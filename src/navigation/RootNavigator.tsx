import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Platform, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SearchScreen } from '../screens/SearchScreen';
import { RestaurantDetailScreen } from '../screens/RestaurantDetailScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { SavedScreen } from '../screens/SavedScreen';
import { AboutScreen } from '../screens/AboutScreen';
import type { RootTabParamList, SearchStackParamList } from './types';
import { colors } from './theme';

const Tab = createBottomTabNavigator<RootTabParamList>();
const SearchStack = createNativeStackNavigator<SearchStackParamList>();
const ProfileStack = createNativeStackNavigator();
const SavedStack = createNativeStackNavigator();

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

function SavedStackNavigator() {
  return (
    <SavedStack.Navigator screenOptions={stackHeaderOptions}>
      <SavedStack.Screen name="SavedHome" component={SavedScreen} options={{ title: 'Saved Restaurants' }} />
    </SavedStack.Navigator>
  );
}

function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={stackHeaderOptions}>
      <ProfileStack.Screen name="ProfileHome" component={ProfileScreen} options={{ title: 'Your Profile' }} />
      <ProfileStack.Screen name="About" component={AboutScreen} options={{ title: 'About & privacy' }} />
    </ProfileStack.Navigator>
  );
}

// Web only: keep the address bar in step with the active tab, so refreshing
// (or opening a shared link to) /profile or /saved lands on that tab. Deliberately
// tab-level only -- a restaurant page's data comes from the search that
// opened it, so it can't be rebuilt from a URL.
const isWeb = Platform.OS === 'web' && typeof window !== 'undefined';
// GitHub Pages serves the app under /safe-bites (app.config.js).
const webBase = isWeb && window.location.pathname.startsWith('/safe-bites') ? '/safe-bites' : '';
const TAB_PATHS: Record<string, string> = { Profile: '/profile', Saved: '/saved' };
const initialTab: keyof RootTabParamList =
  (isWeb &&
    (Object.keys(TAB_PATHS).find((tab) =>
      new RegExp(`${TAB_PATHS[tab]}/?$`, 'i').test(window.location.pathname)
    ) as keyof RootTabParamList | undefined)) ||
  'SearchStack';

function syncUrlToTab(state: { index: number; routes: { name: string }[] } | undefined) {
  if (!isWeb || !state) return;
  const path = webBase + (TAB_PATHS[state.routes[state.index]?.name] ?? '/');
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
            // A little taller on the web: desktop fonts and display scaling render
            // the labels taller than on a phone, and they were being clipped.
            paddingBottom: insets.bottom + (isWeb ? 8 : 4),
            height: (isWeb ? 66 : 60) + insets.bottom,
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
          name="Saved"
          component={SavedStackNavigator}
          options={{
            title: 'Saved',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? 'bookmark' : 'bookmark-outline'} size={size} color={color} />
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
