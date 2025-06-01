// import React from 'react';
// import { Text, SafeAreaView, StyleSheet } from 'react-native';
// import { NavigationContainer } from '@react-navigation/native';
// import { createStackNavigator } from '@react-navigation/stack';
// import Login from './Screens/Login.js'
// import HomeScreen from './Screens/Home.js'
// import Bisc from './Screens/Bisc.js'
// import PrevisaoTempo from './Screens/Clim.js'
// import Detalhes from './Screens/Detalhes.js'

// const Drawer = createStackNavigator();

// export default function App() {
//   return (
//     <NavigationContainer >
//       <Drawer.Navigator initialRouteName='Home'>
//         <Drawer.Screen name='Login' component={Login}/>
//         <Drawer.Screen name='Home' component={HomeScreen}/>
//         <Drawer.Screen name='Biscoito' component={Bisc}/>
//         <Drawer.Screen name='PrevisaoTempo' component={PrevisaoTempo}/>
//         <Drawer.Screen name='Detalhes' component={Detalhes}/>
//       </Drawer.Navigator>
//     </NavigationContainer>
//   );
// }

import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Login from './Screens/Login.js';
import HomeScreen from './Screens/Home.js';
import Bisc from './Screens/Bisc.js';
import PrevisaoTempo from './Screens/Clim.js';
import Detalhes from './Screens/Detalhes.js';

const Stack = createStackNavigator();

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isLoggedIn ? (
          <Stack.Screen name="Login">
            {props => <Login {...props} onLogin={() => setIsLoggedIn(true)} />}
          </Stack.Screen>
        ) : (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Biscoito" component={Bisc} />
            <Stack.Screen name="PrevisaoTempo" component={PrevisaoTempo} />
            <Stack.Screen name="Detalhes" component={Detalhes} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

