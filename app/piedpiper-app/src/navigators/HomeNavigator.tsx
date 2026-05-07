import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React from "react";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

import { TopBar } from "../components/top-bar/top-bar-feature";
import { HomeScreen } from "../screens/HomeScreen";
import BlankScreen from "../screens/BlankScreen";
import { theme } from "../theme/tokens";

const Tab = createBottomTabNavigator();

export function HomeNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        header: () => <TopBar />,
        tabBarStyle: {
          backgroundColor: theme.bgDeep,
          borderTopColor: theme.border,
          borderTopWidth: 1,
          height: 62,
          paddingBottom: 6,
          paddingTop: 6,
        },
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textTertiary,
        tabBarLabelStyle: {
          fontFamily: theme.fonts.sans.medium,
          fontSize: 11,
          letterSpacing: 0.6,
          textTransform: "uppercase",
        },
        tabBarIcon: ({ focused, color, size }) => {
          switch (route.name) {
            case "Verify":
              return (
                <MaterialCommunityIcons
                  name={focused ? "shield-check" : "shield-check-outline"}
                  size={size}
                  color={color}
                />
              );
            case "Markets":
              return (
                <MaterialCommunityIcons
                  name={focused ? "chart-line" : "chart-line-variant"}
                  size={size}
                  color={color}
                />
              );
          }
        },
      })}
    >
      <Tab.Screen name="Verify" component={HomeScreen} />
      <Tab.Screen name="Markets" component={BlankScreen} />
    </Tab.Navigator>
  );
}
