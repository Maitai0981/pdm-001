import React, {useState} from 'react';
import { useFonts, Poppins_400Regular, Poppins_700Bold } from '@expo-google-fonts/poppins';
import AppLoading from 'expo-app-loading';

import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native'

const Login = () => {
  const [user, setUser] = useState('')
  const [password, setPassword] = useState('')
  
  const valid = () => {
    if(user === '' && password === ''){
      alert("Preencha o campo de usuário e senha!")
    }else if(user === ''){
      alert("Preencha o campo de usuário!")
    }else if(password === ''){
      alert("Preencha o campo de senha!")
    }else{
      if(user === 'Admin' && password === 'Admin123'){
        alert("Pronto")
        // Navegação das telas ... 
      }else{
        alert("Usuário ou senha incorretos!")
      }
    }
  }  
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_700Bold,
  });

  if (!fontsLoaded) {
    return <AppLoading />;
  }

  return(
    <View style={style.container}>
      <Text style={style.text1}>LOGIN</Text>
      <View style= {style.box}>
        <Text style={style.text2}>Usuario</Text>
        <TextInput style={style.input} value={user} onChangeText={setUser} placeholder='...'/>
        <Text style={style.text2}>Senha</Text>
        <TextInput style={style.input} value={password} onChangeText={setPassword} placeholder='...' secureTextEntry={true}/>
        <TouchableOpacity style={style.button} onPress={valid}>
          <Text style={style.text3}>Entrar</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const style = StyleSheet.create({
  container: {
    backgroundColor: '#0F172A',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'start',
    flex: 1,
    gap: 40,
  },

  box: {
    padding: 20, 
    gap: 15,
    borderRadius: 10,
    backgroundColor: '#293C7B',
    alignItems: 'center',
    shadowColor: '#5bd5fc',
    shadowOpacity: 0.9,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 3},
    elevaction : 3,
  },

  text1: {
    color: '#1E3A8A',
    fontSize: 22,
    fontFamily: 'Poppins_700Bold'
  },
  text2: {
    color: 'white',
    fontSize: 18,
    fontWeight: 600,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center'
  },
  input: {
    borderRadius: 10,
    padding: 10,
    backgroundColor: '#EFF6FF'
  },
  text3:{
    color: 'white',
    fontFamily: 'Poppins_700Bold',

  },
  button:{
    backgroundColor: '#060270',
    padding: 15,
    borderRadius: 10,
    width: 150,
    alignItems: 'center'
  }
})


export default Login;
