import React, { useState } from 'react';
import {View,Text,SafeAreaView,StyleSheet,TouchableOpacity,Image,} from 'react-native';
import frases from '../components/Frases';
import {useNavigation} from '@react-navigation/native'

export default function Bisc() {
  const nav = useNavigation();
  const [fdrawn, setfdrown] = useState('');
  const [showGif, setShowGif] = useState(false);
  const withdrawal = () => {
    const i = Math.floor(Math.random() * frases.length);
    setfdrown(frases[i]);
  };

  return (
    <SafeAreaView style={styles.container}>
      {showGif && (<Image source={{ uri: 'https://c.tenor.com/CUkx9GxQbigAAAAd/tenor.gif' }} style={styles.gif}/>)}
      <View>
        <TouchableOpacity onPress={() => { setShowGif(true); withdrawal(); }} style={styles.button}>
          <Text style={styles.text}>Sortear</Text>
        </TouchableOpacity>
      </View>

      {fdrawn != '' && <Text style={styles.text}>{fdrawn}</Text>}
      <TouchableOpacity onPress={() => nav.goBack() } style={styles.modz}>
          <Text style={styles.text}>Voltar</Text>
      </TouchableOpacity>
    </SafeAreaView>
    
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  button: {
    padding: 18,
    borderRadius: 10,
    margin: 20,
    width: '70%',
    alignItems: 'center',
    shadowColor: '#FFC745',
    shadowOpacity: 0.9,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    backgroundColor: '#f6f6f6',
  },
  text: {
    color: '#black',
    fontWeight: "bold",
  },
  gif: {
    width: 300,
    height: 300,
    marginTop: 20,
    borderRadius: 10 ,
  },
  modz: {
    borderTopColor: 'black',
    borderTopWidth: 2,
    padding: 18,
    margin: 20,
    width: '20%',
    
  },   
});
