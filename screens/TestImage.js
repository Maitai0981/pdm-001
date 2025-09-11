import React, { useEffect, useState } from 'react';
import { View, Text, Image, ActivityIndicator, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { supabase } from '../supabaseClient';
import { Buffer } from 'buffer';

export default function TestImage() {
  const [imageUri, setImageUri] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  // Função para limpar string base64 com escapes \xHH
  function cleanBase64String(str) {
    if (!str) return '';
    return str.replace(/\\x([0-9A-Fa-f]{2})/g, (match, p1) => {
      return String.fromCharCode(parseInt(p1, 16));
    });
  }

  async function fetchImagens(estabelecimentoId) {
    try {
      const { data, error } = await supabase
        .from('imagens_estabelecimento')
        .select('tipo, imagem, mime_type')
        .eq('estabelecimento_id', estabelecimentoId);

      if (error) {
        setErrorMsg('Erro ao buscar imagens: ' + error.message);
        setLoading(false);
        return;
      }

      if (!data || data.length === 0) {
        setErrorMsg('Nenhuma imagem encontrada para o estabelecimento.');
        setLoading(false);
        return;
      }

      // Vamos pegar a imagem do tipo 'dia' se existir, senão a primeira
      const img = data.find(i => i.tipo === 'dia') || data[0];

      if (!img.imagem) {
        setErrorMsg('Imagem vazia.');
        setLoading(false);
        return;
      }

      let base64String = '';

      if (typeof img.imagem === 'string') {
        base64String = img.imagem;
      } else if (img.imagem instanceof Array || img.imagem instanceof Uint8Array) {
        base64String = Buffer.from(img.imagem).toString('base64');
      } else {
        base64String = Buffer.from(img.imagem).toString('base64');
      }

      base64String = cleanBase64String(base64String);
      base64String = base64String.replace(/[^A-Za-z0-9+/=]/g, '');

      if (!base64String || base64String.length < 10) {
        setErrorMsg('Base64 inválido.');
        setLoading(false);
        return;
      }

      const mimeType = img.mime_type || 'image/jpeg';
      const imageUri = `data:${mimeType};base64,${base64String}`;

      setImageUri(imageUri);
      setLoading(false);
    } catch (e) {
      setErrorMsg('Erro inesperado: ' + e.message);
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchImagens(3);
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#4B0082" />
        <Text style={{ marginTop: 10, color: '#4B0082' }}>Carregando imagem...</Text>
      </SafeAreaView>
    );
  }

  if (errorMsg) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{ color: 'red', fontWeight: 'bold' }}>{errorMsg}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ alignItems: 'center', padding: 20 }}>
        <Text style={{ marginBottom: 10, fontWeight: 'bold', fontSize: 18, color: '#4B0082' }}>
          Imagem do Estabelecimento ID 3
        </Text>
        <Image
          source={{ uri: imageUri }}
          style={{ width: 300, height: 200, borderRadius: 12, backgroundColor: '#eee' }}
          resizeMode="cover"
          onError={(e) => {
            console.log('Erro ao carregar imagem:', e.nativeEvent.error);
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },
});
