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
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../supabaseClient';
import DateTimePicker from '@react-native-community/datetimepicker';

import { Dimensions } from 'react-native';
const { width: screenWidth } = Dimensions.get('window');

export default function EstabelecimentoDetalhes({ route, navigation }) {
  const { estabelecimento, usuarioAtual } = route.params;

  const [deletando, setDeletando] = useState(false);

  // Estados para reserva
  const [horariosReservados, setHorariosReservados] = useState([]);
  const [horariosDisponiveis, setHorariosDisponiveis] = useState([]);
  const [horariosSelecionados, setHorariosSelecionados] = useState([]);
  const [modalReservaVisivel, setModalReservaVisivel] = useState(false);
  const [carregandoHorarios, setCarregandoHorarios] = useState(false);

  // Estado para data da reserva
  const [dataReserva, setDataReserva] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [showDatePicker, setShowDatePicker] = useState(false);

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

    const ordem = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];

    const lista = dias
      .toLowerCase()
      .split(',')
      .map((d) => d.trim());
    const traduzidos = lista.map((d) => mapa[d] || d);

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

    if (traduzidos.length > 1) {
      return traduzidos.slice(0, -1).join(', ') + ' e ' + traduzidos.slice(-1);
    }

    return traduzidos[0];
  };

  const gerarHoras = (inicio, fim) => {
    const horas = [];
    let [hInicio, mInicio] = inicio.split(':').map(Number);
    let [hFim, mFim] = fim.split(':').map(Number);

    if (hFim === 0 && mFim === 0) {
      hFim = 24;
    }

    const intervalo =
      estabelecimento.tempo_reserva && estabelecimento.tempo_reserva > 0
        ? estabelecimento.tempo_reserva
        : 60; // padrão 60 min

    let current = hInicio * 60 + mInicio;
    const end = hFim * 60 + mFim;

    while (current < end) {
      const h = Math.floor(current / 60);
      const m = current % 60;
      horas.push(
        `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
      );
      current += intervalo;
    }

    return horas;
  };

  const formatTime = (time) => {
    if (!time) return null;
    return time.toString().slice(0, 5);
  };

  // Atualiza horários sempre que dataReserva mudar e modal estiver aberto
  useEffect(() => {
    if (modalReservaVisivel) {
      carregarHorarios(dataReserva);
    }
  }, [dataReserva]);

  const carregarHorarios = async (dataSelecionada) => {
    setCarregandoHorarios(true);
    setHorariosSelecionados([]);

    const dataParaConsulta = dataSelecionada || dataReserva;
    setDataReserva(dataParaConsulta);

    const { data: horarios, error } = await supabase
      .from('horarios_disponiveis')
      .select('id, horario, status')
      .eq('estabelecimento_id', estabelecimento.id)
      .eq('data', dataParaConsulta)
      .order('horario', { ascending: true })
      .limit(1000);

    if (error) {
      Alert.alert('Erro', 'Não foi possível carregar os horários disponíveis.');
      setCarregandoHorarios(false);
      return;
    }

    const horasGeradas = gerarHoras(
      estabelecimento.horario_abertura,
      estabelecimento.horario_fechamento
    );

    const horariosMapeados = horasGeradas.map((h) => {
      const horarioBanco = horarios?.find((hr) => formatTime(hr.horario) === h);
      return {
        id: horarioBanco ? horarioBanco.id : null,
        horario: h,
        status: horarioBanco ? horarioBanco.status : 'livre',
      };
    });

    setHorariosDisponiveis(horariosMapeados);
    setHorariosReservados(
      horariosMapeados
        .filter((h) => h.status === 'reservado')
        .map((h) => h.horario)
    );
    setCarregandoHorarios(false);
  };

  const abrirModalReserva = () => {
    setModalReservaVisivel(true);
    carregarHorarios(dataReserva);
  };

  const toggleHorario = (horarioObj) => {
    if (horariosReservados.includes(horarioObj.horario)) return;

    const selecionado = horariosSelecionados.some(
      (h) => h.horario === horarioObj.horario
    );
    if (selecionado) {
      setHorariosSelecionados(
        horariosSelecionados.filter((h) => h.horario !== horarioObj.horario)
      );
    } else {
      setHorariosSelecionados([...horariosSelecionados, horarioObj]);
    }
  };

  const handleCompra = async () => {
    if (horariosSelecionados.length === 0) {
      alert('Selecione pelo menos um horário para continuar.');
      return;
    }

    try {
      const hoje = dataReserva;

      for (let horarioObj of horariosSelecionados) {
        let horarioId = horarioObj.id;

        if (!horarioId) {
          const { data: novoHorario, error: erroHorario } = await supabase
            .from('horarios_disponiveis')
            .insert([
              {
                estabelecimento_id: estabelecimento.id,
                data: hoje,
                horario: horarioObj.horario,
                status: 'reservado',
              },
            ])
            .select('id')
            .single();

          if (erroHorario) throw erroHorario;
          horarioId = novoHorario.id;
        }

        const { error: reservaError } = await supabase.from('reservas').insert([
          {
            usuario_id: usuarioAtual?.id,
            estabelecimento_id: estabelecimento.id,
            horario_id: horarioId,
          },
        ]);
        if (reservaError) throw reservaError;

        const { error: updError } = await supabase
          .from('horarios_disponiveis')
          .update({ status: 'reservado' })
          .eq('id', horarioId);
        if (updError) throw updError;
      }

      alert('Reserva(s) efetuada(s) com sucesso!');

      // Atualiza horários após reserva
      await carregarHorarios(hoje);

      setHorariosSelecionados([]);
      setModalReservaVisivel(false);
    } catch (err) {
      alert('Erro ao efetuar a reserva: ' + err.message);
    }
  };

  const isDono = usuarioAtual && estabelecimento.usuario_id === usuarioAtual.id;

  // Manipulador do DatePicker
  const onChangeDate = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      const isoDate = selectedDate.toISOString().split('T')[0];
      setDataReserva(isoDate);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
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
                onPress={async () => {
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
                            const { error } = await supabase
                              .from('estabelecimentos')
                              .delete()
                              .eq('id', estabelecimento.id);
                            if (error) throw error;
                            setDeletando(false);
                            Alert.alert('Sucesso', 'Estabelecimento excluído.');
                            navigation.goBack();
                          } catch (error) {
                            setDeletando(false);
                            Alert.alert(
                              'Erro',
                              `Não foi possível excluir: ${error.message}`
                            );
                          }
                        },
                      },
                    ]
                  );
                }}
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

        {usuarioAtual ? (
          <TouchableOpacity
            style={styles.botaoReserva}
            onPress={abrirModalReserva}>
            <Text style={styles.textoBotaoReserva}>Reservar Horários</Text>
          </TouchableOpacity>
        ) : (
          <Text style={{ color: 'red', textAlign: 'center', marginTop: 10 }}>
            Faça login para reservar horários.
          </Text>
        )}
      </ScrollView>

      <Modal
        visible={modalReservaVisivel}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalReservaVisivel(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Horários Disponíveis</Text>
              <TouchableOpacity onPress={() => setModalReservaVisivel(false)}>
                <Ionicons name="close-circle-outline" size={30} color="#999" />
              </TouchableOpacity>
            </View>

            {/* Seletor de data */}
            <TouchableOpacity
              style={styles.dateSelectorButton}
              onPress={() => setShowDatePicker(true)}>
              <Text style={styles.dateSelectorText}>{dataReserva}</Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={new Date(dataReserva)}
                mode="date"
                display="default"
                onChange={onChangeDate}
                minimumDate={new Date()}
              />
            )}

            <Text style={styles.subtitle}>{estabelecimento.nome}</Text>

            {carregandoHorarios ? (
              <ActivityIndicator
                size="large"
                color="#4B0082"
                style={{ marginVertical: 20 }}
              />
            ) : (
              <>
                <ScrollView contentContainerStyle={styles.horariosScroll}>
                  {horariosDisponiveis.map((horaObj) => {
                    const ocupado = horariosReservados.includes(
                      horaObj.horario
                    );
                    const selecionado = horariosSelecionados.some(
                      (h) => h.horario === horaObj.horario
                    );
                    return (
                      <TouchableOpacity
                        key={horaObj.id ?? horaObj.horario}
                        disabled={ocupado}
                        onPress={() => toggleHorario(horaObj)}
                        style={[
                          styles.horarioButton,
                          ocupado && styles.horarioOcupado,
                          selecionado && styles.horarioSelecionado,
                        ]}>
                        <Text
                          style={[
                            styles.horarioText,
                            ocupado && styles.horarioTextOcupado,
                            selecionado && styles.horarioTextSelecionado,
                          ]}>
                          {horaObj.horario}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                <View style={styles.modalInfoGroup}>
                  <Text style={styles.modalInfoLabel}>Valor por hora:</Text>
                  <Text style={styles.modalInfoValue}>
                    R$ {parseFloat(estabelecimento.valor_reserva).toFixed(2)}
                  </Text>
                </View>

                <View style={styles.modalInfoGroup}>
                  <Text style={styles.modalInfoLabel}>Total da Reserva:</Text>
                  <Text style={styles.modalInfoTotal}>
                    R${' '}
                    {(
                      horariosSelecionados.length *
                      parseFloat(estabelecimento.valor_reserva)
                    ).toFixed(2)}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.modalActionButton,
                    styles.modalActionButtonPrimary,
                    horariosSelecionados.length === 0 &&
                      styles.modalActionButtonDisabled,
                  ]}
                  onPress={handleCompra}
                  disabled={horariosSelecionados.length === 0}>
                  <Text style={styles.modalActionText}>Efetuar Compra</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modalActionButton,
                    styles.modalActionButtonSecondary,
                  ]}
                  onPress={() => setModalReservaVisivel(false)}>
                  <Text style={styles.modalActionTextSecondary}>Fechar</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
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
    width: screenWidth * 0.85,
    height: screenWidth * 0.5,
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
  botaoReserva: {
    backgroundColor: '#4B0082',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 10,
    alignItems: 'center',
  },
  textoBotaoReserva: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  // NOVOS ESTILOS DO MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    maxHeight: '80%',
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4B0082',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  horariosScroll: {
    flexDirection: 'row', // remova esta linha
    flexWrap: 'wrap', // remova esta linha
    justifyContent: 'flex-start',
    maxHeight: 400, // aumente para mostrar mais itens
    marginBottom: 15,
  },

  horarioButton: {
    margin: 5,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#f9f9f9',
  },
  horarioSelecionado: {
    backgroundColor: '#4B0082',
    borderColor: '#4B0082',
  },
  horarioOcupado: {
    backgroundColor: '#ef5350', // Vermelho mais suave
    borderColor: '#d32f2f',
    opacity: 0.8,
  },
  horarioText: {
    color: '#4B0082',
    fontWeight: '600',
  },
  horarioTextSelecionado: {
    color: '#fff',
  },
  horarioTextOcupado: {
    color: '#fff',
  },
  modalInfoGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalInfoLabel: {
    fontSize: 16,
    color: '#555',
  },
  modalInfoValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4B0082',
  },
  modalInfoTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'green',
  },
  modalActionButton: {
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 15,
    alignItems: 'center',
  },
  modalActionButtonPrimary: {
    backgroundColor: '#4CAF50', // Verde vibrante para o botão principal
  },
  modalActionButtonDisabled: {
    backgroundColor: '#ccc',
  },
  modalActionButtonSecondary: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#4B0082',
  },
  modalActionText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalActionTextSecondary: {
    color: '#4B0082',
    fontWeight: 'bold',
    fontSize: 16,
  },
  dateSelectorButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4B0082',
    marginBottom: 15,
    alignItems: 'center',
  },
  dateSelectorText: {
    color: '#4B0082',
    fontWeight: '600',
    fontSize: 16,
  },
});
