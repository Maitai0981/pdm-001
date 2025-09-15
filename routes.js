import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as Linking from "expo-linking";

import SplashScreen from "./screens/SplashScreen";
import LoginScreen from "./screens/loginScreen";
import RegisterScreen from "./screens/registerScreen";
import MenuScreen from "./screens/menu";
import CadastroEstabelecimento from "./screens/CadastroEstabelecimento";
import EstabelecimentoDetalhes from "./screens/EstabelecimentoDetalhes";

const Stack = createNativeStackNavigator();
const prefix = Linking.createURL("/");

export default function Routes() {
    const linking = {
      prefixes: [Linking.createURL('/'), "supasport://"],
      config: {
        screens: {
          Splash: "splash",
          Register: "register",
          Login: "login",
          Menu: "menu",
          CadastroEstabelecimento: "cadastro-estabelecimento",
          EstabelecimentoDetalhes: "estabelecimento-detalhes",
        },
      },
    };


  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="CadastroEstabelecimento" component={CadastroEstabelecimento}/>
        <Stack.Screen name="EstabelecimentoDetalhes" component={EstabelecimentoDetalhes} />
        <Stack.Screen name="Menu" component={MenuScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
