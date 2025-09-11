import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import SplashScreen from "./screens/SplashScreen";
import LoginScreen from "./screens/loginScreen";
import RegisterScreen from "./screens/registerScreen";
import RememberScreen from "./screens/rememberPasswordScreen";
import DetailsScreen from "./screens/detailsScreen";
import MenuScreen from "./screens/menu"
import CadastroEstabelecimento from "./screens/CadastroEstabelecimento"
import EstabelecimentoDetalhes from './screens/EstabelecimentoDetalhes';



const Stack = createNativeStackNavigator();

export default function Routes() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Menu" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Remember" component={RememberScreen} />
        <Stack.Screen name="CadastroEstabelecimento" component={CadastroEstabelecimento} />
        <Stack.Screen name="EstabelecimentoDetalhes" component={EstabelecimentoDetalhes} />
        <Stack.Screen
          name="Details"
          component={DetailsScreen}
          options={{ title: "Detalhes da Arena" }}
        />
        <Stack.Screen name="Menu" component={MenuScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}