import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
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

export function RootNavigator() {
  // Grow the tab bar by the bottom inset so it clears Android's gesture/button
  // bar (and the iPhone home indicator) instead of sitting underneath it.
  const insets = useSafeAreaInsets();
  return (
    <NavigationContainer>
      <Tab.Navigator
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
