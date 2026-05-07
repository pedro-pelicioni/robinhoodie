import {
  DefaultTheme as NavigationDefaultTheme,
  NavigationContainer,
  Theme as NavigationTheme,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";

import { theme } from "../theme/tokens";
import * as Screens from "../screens";
import { HomeNavigator } from "./HomeNavigator";

type RootStackParamList = {
  Home: undefined;
  Settings: undefined;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

const Stack = createNativeStackNavigator();

const navTheme: NavigationTheme = {
  ...NavigationDefaultTheme,
  dark: true,
  colors: {
    ...NavigationDefaultTheme.colors,
    background: theme.bg,
    card: theme.bgDeep,
    text: theme.textPrimary,
    primary: theme.accent,
    border: theme.border,
    notification: theme.accent,
  },
};

const AppStack = () => {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        contentStyle: { backgroundColor: theme.bg },
        headerStyle: { backgroundColor: theme.bgDeep },
        headerTitleStyle: {
          color: theme.textPrimary,
          fontFamily: theme.fonts.sans.semibold,
          fontSize: 18,
        },
        headerTintColor: theme.textPrimary,
      }}
    >
      <Stack.Screen
        name="HomeStack"
        component={HomeNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Settings"
        component={Screens.SettingsScreen}
        options={{ title: "Settings" }}
      />
    </Stack.Navigator>
  );
};

export interface NavigationProps
  extends Partial<React.ComponentProps<typeof NavigationContainer>> {}

export const AppNavigator = (props: NavigationProps) => {
  return (
    <NavigationContainer theme={navTheme} {...props}>
      <AppStack />
    </NavigationContainer>
  );
};
