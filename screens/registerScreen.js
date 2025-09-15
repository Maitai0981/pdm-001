import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../supabaseClient';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigation = useNavigation();

  const handleRegister = async () => {
    setError('');

    if (!name || !email || !password) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    setLoading(true);

    try {
      // Verifica se email já existe
      const { data: existingUser, error: fetchError } = await supabase
        .from('usuarios')
        .select('id')
        .eq('email', email)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        setError('Erro ao verificar usuário');
        setLoading(false);
        return;
      }

      if (existingUser) {
        setError('Email já cadastrado');
        setLoading(false);
        return;
      }

      // Insere novo usuário
      const { data, error } = await supabase
        .from('usuarios')
        .insert([{ nome: name, email, senha: password }])
        .select()
        .single();

      if (error) {
        setError('Erro ao registrar usuário');
        console.log(error);
        setLoading(false);
        return;
      }

      setLoading(false);

      // Navega para Menu enviando dados do usuário
      navigation.navigate('Menu', { user: data });
    } catch (err) {
      setError('Erro inesperado. Tente novamente.');
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.triangle} />
      <View style={styles.form}>
        <Text style={styles.title}>
          Bem vindo(a), {'\n'} registre-se para {'\n'} usar SupaSport
        </Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TextInput
          style={styles.input}
          placeholder="Nome Completo"
          placeholderTextColor="#aaa"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#aaa"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Senha"
          placeholderTextColor="#aaa"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.7 }]}
          onPress={handleRegister}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Registrar</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.loginText}>
          Já tem registro?{' '}
          <Text
            style={styles.link}
            onPress={() => navigation.navigate('Login')}>
            Faça login
          </Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2F294B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  triangle: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 0,
    height: 0,
    borderLeftWidth: 500,
    borderBottomWidth: 200,
    borderLeftColor: '#665B99',
    borderBottomColor: 'transparent',
  },
  form: {
    width: '80%',
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 25,
    color: '#fff',
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600',
  },
  input: {
    width: '100%',
    padding: 12,
    marginBottom: 15,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fff',
    backgroundColor: '#fff',
    color: '#000',
    fontSize: 16,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 6,
    backgroundColor: '#6C63FF',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 20,
  },
  link: {
    color: '#6C63FF',
    textDecorationLine: 'underline',
  },
  error: {
    color: '#FF6B6B',
    marginBottom: 10,
    textAlign: 'center',
  },
});