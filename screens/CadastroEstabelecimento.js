import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Switch,
  Platform,
  Image,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { supabase } from '../supabaseClient';
import { useNavigation, useRoute } from '@react-navigation/native';
import RNPickerSelect from 'react-native-picker-select';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { decode as atob, encode as btoa } from 'base-64';

export default function CadastroEstabelecimento() {
  const navigation = useNavigation();
  const route = useRoute();

  const [carregando, setCarregando] = useState(false);
  const [user, setUser] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [estabelecimentoId, setEstabelecimentoId] = useState(null);
  const [keyPix, setKeyPix] = useState('');
  const [imagemDia, setImagemDia] = useState(null);
  const [imagemNoite, setImagemNoite] = useState(null);
  const [nome, setNome] = useState('');
  const [tipoId, setTipoId] = useState(null);
  const [cidade, setCidade] = useState('');
  const [cep, setCep] = useState('');
  const [horarioAbertura, setHorarioAbertura] = useState('');
  const [horarioFechamento, setHorarioFechamento] = useState('');
  const [valorReserva, setValorReserva] = useState('');
  const [tempoReserva, setTempoReserva] = useState('60');
  const [tiposEstabelecimento, setTiposEstabelecimento] = useState([]);
  const [diasSemana, setDiasSemana] = useState([]);
  const [infraestruturas, setInfraestruturas] = useState([]);
  const [diasSelecionados, setDiasSelecionados] = useState([]);
  const [infraSelecionadas, setInfraSelecionadas] = useState({});

  function logStep(step, data = null, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const emoji = level === 'ERROR' ? '🔴' : level === 'WARN' ? '🟡' : '🟣';

    console.log(
      `${emoji} [${level}][${timestamp}] ${step}`,
      data !== null ? JSON.stringify(data, null, 2) : ''
    );
  }

  async function pickImage(setImage) {
    logStep('Solicitando permissão para acessar galeria');
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      logStep('Permissão para galeria negada', null, 'WARN');
      Alert.alert('Permissão necessária', 'Permita acesso à galeria.');
      return;
    }

    try {
      logStep('Abrindo seletor de imagens');
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.5,
      });

      if (!result.canceled) {
        logStep('Imagem selecionada com sucesso', {
          uri: result.assets[0].uri,
        });
        setImage(result.assets[0].uri);
      } else {
        logStep('Seleção de imagem cancelada pelo usuário');
      }
    } catch (error) {
      logStep(
        'Erro ao selecionar imagem',
        { message: error.message, stack: error.stack },
        'ERROR'
      );
      Alert.alert('Erro', 'Não foi possível selecionar a imagem.');
    }
  }

  async function takePhoto(setImage) {
    logStep('Solicitando permissão para acessar câmera');
    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    if (status !== 'granted') {
      logStep('Permissão para câmera negada', null, 'WARN');
      Alert.alert('Permissão necessária', 'Permita acesso à câmera.');
      return;
    }

    try {
      logStep('Abrindo câmera');
      let result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.5,
      });

      if (!result.canceled) {
        logStep('Foto tirada com sucesso', { uri: result.assets[0].uri });
        setImage(result.assets[0].uri);
      } else {
        logStep('Captura de foto cancelada pelo usuário');
      }
    } catch (error) {
      logStep('Erro ao tirar foto', error, 'ERROR');
      Alert.alert('Erro', 'Não foi possível tirar a foto.');
    }
  }

  function base64ToUint8Array(base64) {
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  async function salvarImagemNoStorage(estabelecimentoId, tipo, uri) {
    try {
      logStep(`Iniciando upload da imagem ${tipo} no Storage`);

      let localUri = uri;

      if (!uri.startsWith('file://')) {
        const fileName = `${estabelecimentoId}_${tipo}.jpg`;
        const path = FileSystem.cacheDirectory + fileName;
        await FileSystem.downloadAsync(uri, path);
        localUri = path;
      }

      const base64 = await FileSystem.readAsStringAsync(localUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const fileBytes = base64ToUint8Array(base64);

      const filePath = `estabelecimentos/${estabelecimentoId}_${tipo}.jpg`;

      const { data, error } = await supabase.storage
        .from('imagens-estabelecimentos')
        .upload(filePath, fileBytes, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (error) {
        logStep(`Erro ao salvar imagem ${tipo}`, error, 'ERROR');
        throw error;
      }

      const { data: publicUrlData } = supabase.storage
        .from('imagens-estabelecimentos')
        .getPublicUrl(filePath);

      logStep(`Imagem ${tipo} salva com sucesso`, publicUrlData);
      return publicUrlData.publicUrl;
    } catch (error) {
      logStep(`Erro inesperado ao salvar imagem ${tipo}`, error, 'ERROR');
      throw error;
    }
  }

  async function fetchTiposEstabelecimento() {
    logStep('Buscando tipos de estabelecimento');
    const { data, error } = await supabase
      .from('tipos_estabelecimento')
      .select('*');

    if (error) {
      logStep('Erro ao carregar tipos de estabelecimento', error, 'ERROR');
      Alert.alert('Erro', 'Erro ao carregar tipos de estabelecimento');
    } else {
      logStep('Tipos de estabelecimento carregados', { count: data.length });
      setTiposEstabelecimento(data);
    }
  }

  async function fetchDiasSemana() {
    logStep('Buscando dias da semana');
    const { data, error } = await supabase.from('dias_semana').select('*');

    if (error) {
      logStep('Erro ao carregar dias da semana', error, 'ERROR');
      Alert.alert('Erro', 'Erro ao carregar dias da semana');
    } else {
      logStep('Dias da semana carregados', { count: data.length });
      setDiasSemana(data);
    }
  }

  async function fetchInfraestruturas() {
    logStep('Buscando infraestruturas');
    const { data, error } = await supabase
      .from('tipos_infraestrutura')
      .select('*');

    if (error) {
      logStep('Erro ao carregar infraestruturas', error, 'ERROR');
      Alert.alert('Erro', 'Erro ao carregar infraestruturas');
    } else {
      logStep('Infraestruturas carregadas', { count: data.length });
      const infraObj = {};
      data.forEach((item) => {
        infraObj[item.nome] = false;
      });
      setInfraestruturas(data);
      setInfraSelecionadas(infraObj);
    }
  }

  // Nova função para carregar dados do estabelecimento existente
  async function carregarDadosEstabelecimento(estabelecimento) {
    try {
      logStep('Carregando dados do estabelecimento para edição', {
        id: estabelecimento.id,
      });

      // Preencher dados básicos
      setKeyPix(estabelecimento.key_pix || '');
      setNome(estabelecimento.nome || '');
      setCidade(estabelecimento.cidade || '');
      setCep(estabelecimento.cep || '');
      setKeyPix(estabelecimento.key_pix || '');

      setHorarioAbertura(
        estabelecimento.horario_abertura?.substring(0, 5) || ''
      );
      setHorarioFechamento(
        estabelecimento.horario_fechamento?.substring(0, 5) || ''
      );
      setValorReserva(estabelecimento.valor_reserva?.toString() || '');
      setTempoReserva(estabelecimento.tempo_reserva?.toString() || '60');

      // Encontrar e definir o tipo do estabelecimento
      if (estabelecimento.tipo && tiposEstabelecimento.length > 0) {
        const tipoEncontrado = tiposEstabelecimento.find(
          (t) => t.nome === estabelecimento.tipo
        );
        if (tipoEncontrado) {
          setTipoId(tipoEncontrado.id);
        }
      }

      // Carregar dias de funcionamento
      if (estabelecimento.dias_funcionamento) {
        const diasNomes = estabelecimento.dias_funcionamento.split(',');
        const diasIds = diasSemana
          .filter((dia) => diasNomes.includes(dia.abreviacao))
          .map((dia) => dia.id);
        setDiasSelecionados(diasIds);
      }

      // Carregar infraestruturas
      if (estabelecimento.estabelecimento_infraestrutura) {
        const infraObj = {};
        estabelecimento.estabelecimento_infraestrutura.forEach((item) => {
          infraObj[item.tipos_infraestrutura.nome] = item.disponivel;
        });
        setInfraSelecionadas(infraObj);
      }

      // Carregar imagens
      if (estabelecimento.imagem_dia) {
        setImagemDia(estabelecimento.imagem_dia);
      }
      if (estabelecimento.imagem_noite) {
        setImagemNoite(estabelecimento.imagem_noite);
      }

      logStep('Dados do estabelecimento carregados com sucesso');
    } catch (error) {
      logStep('Erro ao carregar dados do estabelecimento', error, 'ERROR');
      Alert.alert(
        'Erro',
        'Não foi possível carregar os dados do estabelecimento'
      );
    }
  }

  useEffect(() => {
    async function initialize() {
      try {
        logStep('Inicializando componente');

        // Verificar se é modo de edição
        if (route.params?.estabelecimento) {
          setIsEditMode(true);
          setEstabelecimentoId(route.params.estabelecimento.id);
          logStep('Modo de edição detectado', {
            id: route.params.estabelecimento.id,
          });
        }

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (session && session.user) {
          logStep('Usuário obtido da sessão', { email: session.user.email });
          setUser(session.user);
        } else {
          if (route.params?.usuario) {
            logStep('Usuário recebido via parâmetro', {
              email: route.params.usuario.email,
            });
            setUser(route.params.usuario);
          } else {
            logStep(
              'Usuário não autenticado e não recebido via parâmetro',
              null,
              'WARN'
            );
            Alert.alert(
              'Erro',
              'Usuário não autenticado. Faça login para continuar.'
            );
            navigation.navigate('Menu');
          }
        }
      } catch (error) {
        logStep('Erro na inicialização', error, 'ERROR');
      }
    }

    initialize();
    fetchTiposEstabelecimento();
    fetchDiasSemana();
    fetchInfraestruturas();
  }, []);

  // useEffect para carregar dados quando os dados básicos estiverem prontos
  useEffect(() => {
    if (
      isEditMode &&
      route.params?.estabelecimento &&
      tiposEstabelecimento.length > 0 &&
      diasSemana.length > 0
    ) {
      carregarDadosEstabelecimento(route.params.estabelecimento);
    }
  }, [isEditMode, tiposEstabelecimento, diasSemana]);

  const handleToggleDia = useCallback((id) => {
    logStep('Alternando dia selecionado', { id });
    setDiasSelecionados((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  }, []);

  const handleToggleInfra = useCallback((nome) => {
    logStep('Alternando infraestrutura selecionada', { nome });
    setInfraSelecionadas((prev) => ({
      ...prev,
      [nome]: !prev[nome],
    }));
  }, []);

  async function fetchUsuarioId(email) {
    try {
      logStep('Buscando ID do usuário na tabela usuarios', { email });
      const { data, error } = await supabase
        .from('usuarios')
        .select('id')
        .eq('email', email)
        .single();

      if (error) {
        logStep('Erro ao buscar usuário na tabela usuarios', error, 'ERROR');
        return null;
      }

      logStep('ID do usuário encontrado', { id: data?.id });
      return data?.id || null;
    } catch (error) {
      logStep('Erro inesperado ao buscar ID do usuário', error, 'ERROR');
      return null;
    }
  }

  function validarHorario(horario) {
    const isValid = /^([01]\d|2[0-3]):([0-5]\d)$/.test(horario);
    logStep('Validação de horário', { horario, isValid });
    return isValid;
  }

  const handleSave = async () => {
    setCarregando(true);
    logStep('Iniciando processo de salvamento do estabelecimento');

    try {
      if (!user) {
        logStep('Usuário não autenticado', null, 'ERROR');
        Alert.alert('Erro', 'Usuário não autenticado.');
        return;
      }

      const camposObrigatorios = {
        nome: !!nome,
        tipoId: !!tipoId,
        cidade: !!cidade,
        cep: !!cep,
        horarioAbertura: !!horarioAbertura,
        horarioFechamento: !!horarioFechamento,
        valorReserva: !!valorReserva,
        tempoReserva: !!tempoReserva,
        diasSelecionados: diasSelecionados.length > 0,
        keyPix: !!keyPix, // se obrigatório
      };

      if (Object.values(camposObrigatorios).some((v) => !v)) {
        logStep(
          'Campos obrigatórios não preenchidos',
          camposObrigatorios,
          'ERROR'
        );
        Alert.alert(
          'Erro',
          'Preencha todos os campos obrigatórios e selecione os dias de funcionamento.'
        );
        return;
      }

      if (
        !validarHorario(horarioAbertura) ||
        !validarHorario(horarioFechamento)
      ) {
        logStep(
          'Formato de horário inválido',
          { horarioAbertura, horarioFechamento },
          'ERROR'
        );
        Alert.alert('Erro', 'Horários devem estar no formato HH:MM.');
        return;
      }

      const usuarioId = await fetchUsuarioId(user.email);
      if (!usuarioId) {
        logStep('ID do usuário não encontrado na base de dados', null, 'ERROR');
        Alert.alert('Erro', 'Usuário não encontrado na base de dados.');
        return;
      }

      const diasNomes = diasSemana
        .filter((d) => diasSelecionados.includes(d.id))
        .map((d) => d.abreviacao)
        .join(',');

        const dadosEstabelecimento = {
          nome,
          tipo: tiposEstabelecimento.find((t) => t.id === tipoId)?.nome || '',
          cidade,
          cep,
          horario_abertura: horarioAbertura,
          horario_fechamento: horarioFechamento,
          valor_reserva: parseFloat(valorReserva),
          tempo_reserva: parseInt(tempoReserva, 10),
          dias_funcionamento: diasNomes,
          usuario_id: usuarioId,
          key_pix: keyPix, // adiciona aqui
        };

      logStep('Dados para processamento', dadosEstabelecimento);

      let estabelecimento;

      if (isEditMode) {
        // Modo de edição - atualizar estabelecimento existente
        logStep('Atualizando estabelecimento existente', {
          id: estabelecimentoId,
        });

        const { data, error } = await supabase
          .from('estabelecimentos')
          .update(dadosEstabelecimento)
          .eq('id', estabelecimentoId)
          .select()
          .single();

        if (error) {
          logStep('Erro ao atualizar estabelecimento', error, 'ERROR');
          Alert.alert(
            'Erro',
            `Falha ao atualizar estabelecimento: ${error.message}`
          );
          return;
        }

        estabelecimento = data;
        logStep('Estabelecimento atualizado com sucesso', {
          id: estabelecimento.id,
        });

        // Remover dias de funcionamento existentes e inserir novos
        await supabase
          .from('estabelecimento_dias_funcionamento')
          .delete()
          .eq('estabelecimento_id', estabelecimentoId);

        // Remover infraestruturas existentes e inserir novas
        await supabase
          .from('estabelecimento_infraestrutura')
          .delete()
          .eq('estabelecimento_id', estabelecimentoId);
      } else {
        // Modo de criação - inserir novo estabelecimento
        logStep('Criando novo estabelecimento');

        const { data, error } = await supabase
          .from('estabelecimentos')
          .insert([dadosEstabelecimento])
          .select()
          .single();

        if (error) {
          logStep('Erro ao inserir estabelecimento', error, 'ERROR');
          Alert.alert(
            'Erro',
            `Falha ao salvar estabelecimento: ${error.message}`
          );
          return;
        }

        estabelecimento = data;
        logStep('Estabelecimento inserido com sucesso', {
          id: estabelecimento.id,
        });
      }

      // Salvar imagens na tabela imagens-estabelecimento
      if (imagemDia) {
        await salvarImagemNoStorage(estabelecimento.id, 'dia', imagemDia);
      } else {
        logStep('Nenhuma imagem do dia selecionada');
      }

      if (imagemNoite) {
        await salvarImagemNoStorage(estabelecimento.id, 'noite', imagemNoite);
      } else {
        logStep('Nenhuma imagem da noite selecionada');
      }

      // Inserir dias de funcionamento
      logStep('Inserindo dias de funcionamento');
      for (const diaId of diasSelecionados) {
        const { error: errDia } = await supabase
          .from('estabelecimento_dias_funcionamento')
          .insert([
            {
              estabelecimento_id: estabelecimento.id,
              dia_semana_id: diaId,
            },
          ]);

        if (errDia) {
          logStep('Erro ao salvar dias de funcionamento', errDia, 'ERROR');
          Alert.alert(
            'Erro',
            'Erro ao salvar dias de funcionamento: ' + errDia.message
          );
          return;
        }
      }

      // Inserir infraestruturas
      logStep('Inserindo infraestruturas');
      for (const infra of infraestruturas) {
        const disponivel = infraSelecionadas[infra.nome] || false;
        const { error: errInfra } = await supabase
          .from('estabelecimento_infraestrutura')
          .insert([
            {
              estabelecimento_id: estabelecimento.id,
              infraestrutura_id: infra.id,
              disponivel,
            },
          ]);

        if (errInfra) {
          logStep('Erro ao salvar infraestruturas', errInfra, 'ERROR');
          Alert.alert(
            'Erro',
            'Erro ao salvar infraestruturas: ' + errInfra.message
          );
          return;
        }
      }

      logStep('Processo de salvamento concluído com sucesso');
      Alert.alert(
        'Sucesso',
        isEditMode
          ? 'Estabelecimento atualizado!'
          : 'Estabelecimento cadastrado!'
      );
      navigation.goBack();
    } catch (error) {
      logStep('Erro não tratado no processo de salvamento', error, 'ERROR');
      Alert.alert('Erro', `Ocorreu um erro inesperado: ${error.message}`);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>
        {isEditMode ? 'Editar Estabelecimento' : 'Cadastrar Estabelecimento'}
      </Text>

      <Text style={styles.label}>Nome *</Text>
      <TextInput
        style={styles.input}
        placeholder="Nome do estabelecimento"
        value={nome}
        onChangeText={setNome}
      />

      <Text style={styles.label}>Tipo *</Text>
      <RNPickerSelect
        onValueChange={(value) => setTipoId(value)}
        items={tiposEstabelecimento.map((tipo) => ({
          label: tipo.nome,
          value: tipo.id,
        }))}
        placeholder={{ label: 'Selecione o tipo', value: null }}
        style={pickerSelectStyles}
        value={tipoId}
      />

      <Text style={styles.label}>Cidade *</Text>
      <TextInput
        style={styles.input}
        placeholder="Cidade"
        value={cidade}
        onChangeText={setCidade}
      />

      <Text style={styles.label}>CEP *</Text>
      <TextInput
        style={styles.input}
        placeholder="CEP"
        value={cep}
        onChangeText={setCep}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Chave Pix</Text>
      <TextInput
        style={styles.input}
        placeholder="Digite a chave Pix"
        value={keyPix}
        onChangeText={setKeyPix}
        autoCapitalize="none"
      />

      <View style={styles.row}>
        <View style={{ flex: 1, marginRight: 10 }}>
          <Text style={styles.label}>Horário de abertura *</Text>
          <TextInput
            style={styles.input}
            placeholder="HH:MM"
            value={horarioAbertura}
            onChangeText={setHorarioAbertura}
            maxLength={5}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Horário de fechamento *</Text>
          <TextInput
            style={styles.input}
            placeholder="HH:MM"
            value={horarioFechamento}
            onChangeText={setHorarioFechamento}
            maxLength={5}
          />
        </View>
      </View>

      <Text style={styles.label}>Tempo de reserva (minutos) *</Text>
      <TextInput
        style={styles.input}
        placeholder="Ex: 60"
        value={tempoReserva}
        onChangeText={setTempoReserva}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Valor da reserva (R$) *</Text>
      <TextInput
        style={styles.input}
        placeholder="Ex: 50.00"
        value={valorReserva}
        onChangeText={setValorReserva}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Dias de funcionamento *</Text>
      <View style={styles.diasContainer}>
        {diasSemana.map((dia) => (
          <TouchableOpacity
            key={dia.id}
            style={[
              styles.diaButton,
              diasSelecionados.includes(dia.id) && styles.diaButtonSelected,
            ]}
            onPress={() => handleToggleDia(dia.id)}>
            <Text
              style={[
                styles.diaText,
                diasSelecionados.includes(dia.id) && styles.diaTextSelected,
              ]}>
              {dia.abreviacao}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Infraestrutura disponível</Text>
      {infraestruturas.map((infra) => (
        <View key={infra.id} style={styles.infraRow}>
          <Text style={styles.infraLabel}>
            {infra.nome.charAt(0).toUpperCase() + infra.nome.slice(1)}
          </Text>
          <Switch
            value={infraSelecionadas[infra.nome]}
            onValueChange={() => handleToggleInfra(infra.nome)}
            trackColor={{ false: '#767577', true: '#4B0082' }}
            thumbColor={infraSelecionadas[infra.nome] ? '#fff' : '#f4f3f4'}
            ios_backgroundColor="#3e3e3e"
          />
        </View>
      ))}

      <Text style={styles.label}>Imagem do dia</Text>
      <View style={styles.imageButtonsRow}>
        <TouchableOpacity
          style={styles.imageButton}
          onPress={() => pickImage(setImagemDia)}>
          <Text style={styles.imageButtonText}>Selecionar da galeria</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.imageButton}
          onPress={() => takePhoto(setImagemDia)}>
          <Text style={styles.imageButtonText}>Tirar foto</Text>
        </TouchableOpacity>
      </View>
      {imagemDia ? (
        <Image source={{ uri: imagemDia }} style={styles.previewImage} />
      ) : (
        <Text style={styles.noImageText}>Nenhuma imagem selecionada</Text>
      )}

      <Text style={styles.label}>Imagem da noite</Text>
      <View style={styles.imageButtonsRow}>
        <TouchableOpacity
          style={styles.imageButton}
          onPress={() => pickImage(setImagemNoite)}>
          <Text style={styles.imageButtonText}>Selecionar da galeria</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.imageButton}
          onPress={() => takePhoto(setImagemNoite)}>
          <Text style={styles.imageButtonText}>Tirar foto</Text>
        </TouchableOpacity>
      </View>
      {imagemNoite ? (
        <Image source={{ uri: imagemNoite }} style={styles.previewImage} />
      ) : (
        <Text style={styles.noImageText}>Nenhuma imagem selecionada</Text>
      )}

      <TouchableOpacity style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>
          {isEditMode ? 'Atualizar' : 'Salvar'}
        </Text>
      </TouchableOpacity>
      <Modal transparent visible={carregando} animationType="fade">
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#4B0082" />
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    flexGrow: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4B0082',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontWeight: '600',
    marginBottom: 6,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: Platform.OS === 'ios' ? 15 : 10,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#4B0082',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  diasContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  diaButton: {
    borderWidth: 1,
    borderColor: '#4B0082',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginRight: 8,
    marginBottom: 8,
  },
  diaButtonSelected: {
    backgroundColor: '#4B0082',
  },
  diaText: {
    color: '#4B0082',
    fontWeight: '600',
  },
  diaTextSelected: {
    color: '#fff',
  },
  infraRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infraLabel: {
    fontSize: 16,
    color: '#333',
    textTransform: 'capitalize',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  imageButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  imageButton: {
    flex: 1,
    backgroundColor: '#4B0082',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  imageButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4B0082',
    marginBottom: 15,
    resizeMode: 'cover',
  },
  noImageText: {
    fontStyle: 'italic',
    color: '#999',
    marginBottom: 15,
    textAlign: 'center',
  },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    color: 'black',
    paddingRight: 30,
    marginBottom: 15,
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    color: 'black',
    paddingRight: 30,
    marginBottom: 15,
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
});
