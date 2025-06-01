import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function Creators() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Criadores do App</Text>
      
      <View style={styles.card}>
        <Text style={styles.name}>👤 Gabriel da Silva Pimentel</Text>
        <Text style={styles.desc}>Aluno do 3º ano de Informatica do IFAM - campus Parintins</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.name}>👤 Matheus Saragoça de Lima</Text>
        <Text style={styles.desc}>Aluno do 3º ano de Informatica do IFAM - campus Parintins</Text>
      </View>

      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.modz}>
        <Text style={styles.backText}>Voltar</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',  
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  card: {
    backgroundColor: '#f0f0f0',
    padding: 16,
    width: '90%',
    borderRadius: 10,
    marginBottom: 20,
    elevation: 2,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  desc: {
    fontSize: 14,
    color: '#444',
    marginTop: 4,
  },
  modz: {
    padding: 18,
    borderRadius: 10,
    margin: 20,
    width: '20%',
    
  },   
  backText: {
    fontWeight: 'bold',
    color: '#000',
  },
});
