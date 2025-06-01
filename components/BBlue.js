import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

const BBlue = (prop) => (
  <TouchableOpacity style={style.button} onPress={prop.onPress}>
    <Text style={style.text}>{prop.label}</Text>
  </TouchableOpacity>
);

const style = StyleSheet.create({
  button: {
    padding: 18,
    borderRadius: 10,
    margin: 20,
    width: '50%',
    alignItems: 'center',
    shadowColor: '#FFC745',
    shadowOpacity: 0.9,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    backgroundColor: '#f7f7f7', 
  },
  text: {
    color: '#black',
    fontWeight: "bold",
  },
})

export default BBlue;
