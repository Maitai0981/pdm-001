import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../supabaseClient'; // importe supabase para usar delete

export default function EstabelecimentoDetalhes({ route, navigation }) {
  const { estabelecimento, usuarioAtual } = route.params; // usuarioAtual: objeto do usuário logado

  const [deletando, setDeletando] = useState(false);

  // Função para editar - navega para tela de edição (CadastroEstabelecimento) passando o estabelecimento
  const handleEditar = () => {
    navigation.navigate('CadastroEstabelecimento', {
      estabelecimento,
      usuario: usuarioAtual,
    });
  };

  useEffect(() => {
    console.log('Usuário atual na tela de detalhes:', usuarioAtual);
  }, [usuarioAtual]);

  const formatDias = (dias) => {
    if (!dias) return 'Não informado';

    const mapa = {
      dom: 'Domingo',
      seg: 'Segunda-feira',
      ter: 'Terça-feira',
      qua: 'Quarta-feira',
      qui: 'Quinta-feira',
      sex: 'Sexta-feira',
      sab: 'Sábado',

    };

    const ordem = ['dom','seg', 'ter', 'qua', 'qui', 'sex', 'sab'];

    const lista = dias.toLowerCase().split(',').map((d) => d.trim());
    const traduzidos = lista.map((d) => mapa[d] || d);

    // Detecta se são dias consecutivos
    const indices = lista.map((d) => ordem.indexOf(d)).sort((a, b) => a - b);
    let consecutivos = true;
    for (let i = 1; i < indices.length; i++) {
      if (indices[i] !== indices[i - 1] + 1) {
        consecutivos = false;
        break;
      }
    }

    if (consecutivos && indices.length > 1) {
      return `${mapa[ordem[indices[0]]]} a ${
        mapa[ordem[indices[indices.length - 1]]]
      }`;
    }

    // Caso não seja consecutivo, lista normalmente
    if (traduzidos.length > 1) {
      return traduzidos.slice(0, -1).join(', ') + ' e ' + traduzidos.slice(-1);
    }

    return traduzidos[0];
  };

  // Função para excluir com confirmação e exclusão real no Supabase
  const handleExcluir = () => {
    Alert.alert(
      'Confirmar exclusão',
      'Tem certeza que deseja excluir este estabelecimento? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletando(true);

              // Deleta o estabelecimento no Supabase
              const { error } = await supabase
                .from('estabelecimentos')
                .delete()
                .eq('id', estabelecimento.id);

              if (error) {
                throw error;
              }

              setDeletando(false);
              Alert.alert('Sucesso', 'Estabelecimento excluído.');
              navigation.goBack();
            } catch (error) {
              setDeletando(false);
              Alert.alert(
                'Erro',
                `Não foi possível excluir o estabelecimento: ${error.message}`
              );
            }
          },
        },
      ]
    );
  };

  // Verifica se o usuário atual é o dono do estabelecimento
  const isDono = usuarioAtual && estabelecimento.usuario_id === usuarioAtual.id;

  return (
    <SafeAreaView style={styles.container}>
      {/* Cabeçalho fixo */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {estabelecimento.nome}
        </Text>
        <View style={styles.headerActions}>
          {isDono && (
            <>
              <TouchableOpacity
                onPress={handleEditar}
                style={styles.actionButton}>
                <Ionicons name="create-outline" size={24} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleExcluir}
                style={[styles.actionButton, { marginLeft: 12 }]}>
                {deletando ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Ionicons name="trash-outline" size={24} color="#fff" />
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.tipo}>{estabelecimento.tipo}</Text>

        {/* Imagens */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.imagesScroll}>
          {estabelecimento.imagem_dia && (
            <View style={styles.imageWrapper}>
              <Text style={styles.imageLabel}>Imagem Dia</Text>
              <Image
                source={{ uri: estabelecimento.imagem_dia }}
                style={styles.image}
                resizeMode="cover"
              />
            </View>
          )}
          {estabelecimento.imagem_noite && (
            <View style={styles.imageWrapper}>
              <Text style={styles.imageLabel}>Imagem Noite</Text>
              <Image
                source={{ uri: estabelecimento.imagem_noite }}
                style={styles.image}
                resizeMode="cover"
              />
            </View>
          )}
          {!estabelecimento.imagem_dia && !estabelecimento.imagem_noite && (
            <View style={[styles.imageWrapper, styles.placeholderImage]}>
              <Ionicons name="image-outline" size={60} color="#ccc" />
              <Text style={styles.placeholderText}>
                Sem imagens disponíveis
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Informações */}
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Funcionamento</Text>
          <Text style={styles.infoText}>
            {formatDias(estabelecimento.dias_funcionamento)}
          </Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Horário</Text>
          <Text style={styles.infoText}>
            {estabelecimento.horario_abertura} -{' '}
            {estabelecimento.horario_fechamento}
          </Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Cidade</Text>
          <Text style={styles.infoText}>{estabelecimento.cidade}</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Valor Reserva</Text>
          <Text style={styles.infoText}>
            R$ {parseFloat(estabelecimento.valor_reserva).toFixed(2)}
          </Text>
        </View>

        {/* Infraestrutura */}
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Infraestrutura</Text>
          <View style={styles.tagsContainer}>
            {estabelecimento.infraestrutura?.banheiro && (
              <View style={styles.tag}>
                <Ionicons name="water" size={16} color="#fff" />
                <Text style={styles.tagText}>Banheiro</Text>
              </View>
            )}
            {estabelecimento.infraestrutura?.bebedouro && (
              <View style={styles.tag}>
                <Ionicons name="water-outline" size={16} color="#fff" />
                <Text style={styles.tagText}>Bebedouro</Text>
              </View>
            )}
            {estabelecimento.infraestrutura?.lanchonete && (
              <View style={styles.tag}>
                <Ionicons name="fast-food" size={16} color="#fff" />
                <Text style={styles.tagText}>Lanchonete</Text>
              </View>
            )}
            {estabelecimento.infraestrutura?.vestiario && (
              <View style={styles.tag}>
                <Ionicons name="shirt" size={16} color="#fff" />
                <Text style={styles.tagText}>Vestiário</Text>
              </View>
            )}
            {estabelecimento.infraestrutura?.estacionamento && (
              <View style={styles.tag}>
                <Ionicons name="car" size={16} color="#fff" />
                <Text style={styles.tagText}>Estacionamento</Text>
              </View>
            )}
            {estabelecimento.infraestrutura?.playground && (
              <View style={styles.tag}>
                <Ionicons name="game-controller" size={16} color="#fff" />
                <Text style={styles.tagText}>Playground</Text>
              </View>
            )}
            {!Object.values(estabelecimento.infraestrutura || {}).some(
              Boolean
            ) && (
              <Text style={{ color: '#666', fontStyle: 'italic' }}>
                Nenhuma infraestrutura disponível
              </Text>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    height: 60,
    backgroundColor: '#4B0082',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 6,
  },
  headerTitle: {
    flex: 1,
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 6,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  tipo: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
  },
  imagesScroll: {
    marginBottom: 24,
  },
  imageWrapper: {
    marginRight: 16,
    borderRadius: 12,
    overflow: 'hidden',
    width: 320,
    height: 200,
    backgroundColor: '#ddd',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
  },
  placeholderText: {
    marginTop: 8,
    color: '#999',
    fontSize: 14,
  },
  imageLabel: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(75,0,130,0.8)',
    color: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    fontSize: 12,
    zIndex: 10,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  infoLabel: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#4B0082',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 16,
    color: '#333',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tag: {
    flexDirection: 'row',
    backgroundColor: '#4B0082',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  tagText: {
    color: '#fff',
    marginLeft: 6,
    fontSize: 14,
  },
});
