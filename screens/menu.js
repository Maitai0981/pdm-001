import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '../supabaseClient';

export default function Menu() {
  const navigation = useNavigation();
  const route = useRoute();

  const userFromParams = route.params?.user || null;
  const [user, setUser] = useState(userFromParams);
  const [modalType, setModalType] = useState(null);
  const [arenas, setArenas] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const [modalTitle, setModalTitle] = useState('');

  useEffect(() => {
    if (!userFromParams) {
      async function fetchUser() {
        const {
          data: { user: authUser },
          error,
        } = await supabase.auth.getUser();
        if (!error) setUser(authUser);
      }
      fetchUser();
    }
  }, [userFromParams]);

  // Componente de imagem com melhor tratamento de erro
  const ImageWithFallback = ({ source, style, resizeMode = 'cover' }) => {
    const [imageError, setImageError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [timeoutError, setTimeoutError] = useState(false);

    useEffect(() => {
      // Timeout para evitar loading infinito
      const timer = setTimeout(() => {
        if (isLoading) {
          console.log('⏱️ Timeout no carregamento da imagem');
          setTimeoutError(true);
          setIsLoading(false);
        }
      }, 10000); // 10 segundos

      return () => clearTimeout(timer);
    }, [isLoading]);

    if (timeoutError || imageError) {
      return (
        <View style={[style, styles.placeholderImage]}>
          <Ionicons name="image-outline" size={40} color="#ccc" />
          <Text style={styles.placeholderText}>
            {timeoutError ? 'Timeout' : 'Erro ao carregar'}
          </Text>
        </View>
      );
    }
    return (
      <View style={style}>
        {isLoading && (
          <View style={[style, styles.placeholderImage]}>
            <ActivityIndicator size="small" color="#4B0082" />
            <Text style={styles.placeholderText}>Carregando...</Text>
          </View>
        )}
        <Image
          source={source}
          style={[style, isLoading && { position: 'absolute', opacity: 0 }]}
          resizeMode={resizeMode}
          onLoad={() => {
            console.log('✅ Imagem carregada com sucesso');
            setIsLoading(false);
          }}
          onLoadStart={() => {
            console.log('🔄 Iniciando carregamento da imagem');
          }}
          onError={(error) => {
            console.log('❌ Erro ao carregar imagem:', error.nativeEvent.error);
            console.log(
              '🔗 URI da imagem:',
              source.uri?.substring(0, 100) + '...'
            );
            setImageError(true);
            setIsLoading(false);
          }}
          onLoadEnd={() => {
            console.log('🏁 Carregamento finalizado');
          }}
        />
      </View>
    );
  };

  async function fetchImagens(estabelecimentoId) {
    const tipos = ['dia', 'noite'];
    const imagens = {};

    for (let tipo of tipos) {
      const path = `estabelecimentos/${estabelecimentoId}_${tipo}.jpg`;
      const { data, error } = await supabase.storage
        .from('imagens-estabelecimentos')
        .createSignedUrl(path, 60); // 60 segundos de validade

      if (error) {
        console.log(
          `❌ Erro ao gerar URL assinada para ${path}:`,
          error.message
        );
        imagens[tipo] = null;
      } else {
        imagens[tipo] = data.signedUrl;
      }
    }

    console.log('🎯 URLs assinadas das imagens:', imagens);
    return imagens;
  }

  // Função para montar infraestrutura a partir do relacionamento
  function getInfraestruturaFromRelation(estabelecimento) {
    const infra = {
      banheiro: false,
      bebedouro: false,
      lanchonete: false,
      vestiario: false,
      estacionamento: false,
      playground: false,
    };

    if (estabelecimento.estabelecimento_infraestrutura) {
      estabelecimento.estabelecimento_infraestrutura.forEach((item) => {
        if (item.disponivel) {
          const nome = item.tipos_infraestrutura.nome;
          infra[nome] = true;
        }
      });
    }

    return infra;
  }

  // Função para buscar dias de funcionamento (usa campo direto)
  function getDiasFuncionamentoFromData(estabelecimento) {
    return estabelecimento.dias_funcionamento || 'Não informado';
  }

  useEffect(() => {
    async function fetchArenas() {
      setLoading(true);

      const { data, error } = await supabase
        .from('estabelecimentos')
        .select(
          `
        id,
        nome,
        tipo,
        usuario_id,
        dias_funcionamento,
        horario_abertura,
        horario_fechamento,
        valor_reserva,
        cidade,
        cep,
        estabelecimento_infraestrutura (
          disponivel,
          tipos_infraestrutura (nome)
        )
      `
        )
        .ilike('nome', `%${search}%`)
        .limit(20);

      if (error) {
        console.log('Erro ao buscar estabelecimentos:', error.message);
        setArenas([]);
        setLoading(false);
        return;
      }

      const arenasCompletas = await Promise.all(
        data.map(async (estab) => {
          const imagens = await fetchImagens(estab.id);
          const infraestrutura = getInfraestruturaFromRelation(estab);
          const diasFuncionamento = getDiasFuncionamentoFromData(estab);

          return {
            ...estab,
            imagem_dia: imagens.dia || null,
            imagem_noite: imagens.noite || null,
            infraestrutura,
            dias_funcionamento: diasFuncionamento,
          };
        })
      );

      setArenas(arenasCompletas);
      setLoading(false);
    }

    fetchArenas();
  }, [search]);

  // Modal corrigido para mostrar ambas as imagens
  const openModal = (arena) => {
    setModalTitle(arena.nome);
    setModalContent(
      <View>
        {(arena.imagem_dia || arena.imagem_noite) && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 12 }}>
            {arena.imagem_dia && (
              <View style={{ marginRight: 10 }}>
                <Text style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
                  Imagem Dia
                </Text>
                <ImageWithFallback
                  source={{ uri: arena.imagem_dia }}
                  style={{
                    width: 250,
                    height: 150,
                    borderRadius: 12,
                  }}
                  resizeMode="cover"
                />
              </View>
            )}

            {arena.imagem_noite && (
              <View>
                <Text style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
                  Imagem Noite
                </Text>
                <ImageWithFallback
                  source={{ uri: arena.imagem_noite }}
                  style={{
                    width: 250,
                    height: 150,
                    borderRadius: 12,
                  }}
                  resizeMode="cover"
                />
              </View>
            )}
          </ScrollView>
        )}

        <Text style={styles.modalText}>Tipo: {arena.tipo}</Text>
        <Text style={styles.modalText}>
          Funcionamento: {arena.dias_funcionamento || 'Não informado'}
        </Text>
        <Text style={styles.modalText}>
          Horário: {arena.horario_abertura} - {arena.horario_fechamento}
        </Text>
        <Text style={styles.modalText}>Cidade: {arena.cidade}</Text>
        <Text style={styles.modalText}>
          Valor Reserva: R$ {parseFloat(arena.valor_reserva).toFixed(2)}
        </Text>
        <Text style={styles.modalText}>Infraestrutura:</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {arena.infraestrutura?.banheiro && (
            <View style={styles.tag}>
              <Ionicons name="water" size={16} color="#fff" />
              <Text style={styles.tagText}>Banheiro</Text>
            </View>
          )}
          {arena.infraestrutura?.bebedouro && (
            <View style={styles.tag}>
              <Ionicons name="water-outline" size={16} color="#fff" />
              <Text style={styles.tagText}>Bebedouro</Text>
            </View>
          )}
          {arena.infraestrutura?.lanchonete && (
            <View style={styles.tag}>
              <Ionicons name="fast-food" size={16} color="#fff" />
              <Text style={styles.tagText}>Lanchonete</Text>
            </View>
          )}
          {arena.infraestrutura?.vestiario && (
            <View style={styles.tag}>
              <Ionicons name="shirt" size={16} color="#fff" />
              <Text style={styles.tagText}>Vestiário</Text>
            </View>
          )}
          {arena.infraestrutura?.estacionamento && (
            <View style={styles.tag}>
              <Ionicons name="car" size={16} color="#fff" />
              <Text style={styles.tagText}>Estacionamento</Text>
            </View>
          )}
          {arena.infraestrutura?.playground && (
            <View style={styles.tag}>
              <Ionicons name="game-controller" size={16} color="#fff" />
              <Text style={styles.tagText}>Playground</Text>
            </View>
          )}
        </View>
      </View>
    );
    setModalVisible(true);
  };

  // Função renderCard corrigida com melhor tratamento de imagens
  const renderCard = (arena) => (
    <TouchableOpacity
      key={arena.id}
      style={styles.card}
      onPress={() =>
        navigation.navigate('EstabelecimentoDetalhes', {
          estabelecimento: arena,
          usuarioAtual: user,
        })
      }>
      {arena.imagem_dia ? (
        <ImageWithFallback
          source={{ uri: arena.imagem_dia }}
          style={styles.cardImage}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.cardImage, styles.placeholderImage]}>
          <Ionicons name="image-outline" size={40} color="#ccc" />
          <Text style={styles.placeholderText}>Sem imagem</Text>
        </View>
      )}

      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {arena.nome}
        </Text>
        <Text style={styles.cardSubtitle} numberOfLines={1}>
          {arena.tipo}
        </Text>
        <Text style={styles.cardCity} numberOfLines={1}>
          {arena.cidade}
        </Text>

        <View style={styles.priceContainer}>
          <Text style={styles.priceText}>
            R$ {parseFloat(arena.valor_reserva).toFixed(2)}
          </Text>
        </View>

        <View style={styles.amenitiesContainer}>
          {arena.infraestrutura?.banheiro && (
            <Ionicons
              name="water"
              size={14}
              color="#4B0082"
              style={styles.amenityIcon}
            />
          )}
          {arena.infraestrutura?.estacionamento && (
            <Ionicons
              name="car"
              size={14}
              color="#4B0082"
              style={styles.amenityIcon}
            />
          )}
          {arena.infraestrutura?.lanchonete && (
            <Ionicons
              name="fast-food"
              size={14}
              color="#4B0082"
              style={styles.amenityIcon}
            />
          )}
          {arena.infraestrutura?.vestiario && (
            <Ionicons
              name="shirt"
              size={14}
              color="#4B0082"
              style={styles.amenityIcon}
            />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const [notifications, setNotifications] = useState([
    { id: 1, text: 'Sua reserva foi confirmada!' },
    { id: 2, text: 'Nova promoção disponível.' },
  ]);
  const [reservas, setReservas] = useState([
    { id: 1, nome: 'Arena 15', data: '2024-06-10', horario: '18:00' },
  ]);


   const [novoNome, setNovoNome] = useState(user?.nome);

   async function atualizarUsuario() {
     if (!novoNome.trim()) {
       alert("O nome não pode ser vazio.");
       return;
     }
     if (!user?.id) {
       alert("Usuário não está definido.");
       return;
     }

     try {
       console.log("Tentando atualizar nome para:", novoNome);
       const { data, error } = await supabase
         .from("usuarios")
         .update({ nome: novoNome.trim() })
         .eq("id", user.id);

       console.log("Resposta do Supabase:", data, error);

       if (error) {
         alert("Erro ao atualizar: " + error.message);
       } else if (data && data.length > 0) {
         setUser ((prev) => ({
           ...prev,
           nome: data[0].nome,
         }));
         alert("Nome atualizado com sucesso!");
         setModalVisible(false);
       } else {
         alert("Nenhum registro foi atualizado. Verifique o id e a tabela.");
       }
     } catch (err) {
       console.log("Erro inesperado:", err);
       alert("Erro inesperado ao atualizar nome.");
     }
   }


    const openInfoModal = (type) => {
      setModalType(type);

      if (type === "perfil") {
        setNovoNome(user?.nome || "");
        setModalTitle("Perfil");
        setModalContent(null); // limpa conteúdo fixo para perfil
      } else if (type === "reservas") {
        setModalTitle("Reservas");
        setModalContent(
          reservas.length > 0 ? (
            reservas.map((r) => (
              <Text key={r.id} style={styles.modalText}>
                • {r.nome} - {r.data} às {r.horario}
              </Text>
            ))
          ) : (
            <Text style={styles.modalText}>Nenhuma reserva.</Text>
          )
        );
      } else if (type === "notifications") {
        setModalTitle("Notificações");
        setModalContent(
          notifications.length > 0 ? (
            notifications.map((n) => (
              <Text key={n.id} style={styles.modalText}>
                • {n.text}
              </Text>
            ))
          ) : (
            <Text style={styles.modalText}>Nenhuma notificação.</Text>
          )
        );
      }
      setModalVisible(true);
    };


  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.log('Erro ao deslogar:', error.message);
    } else {
      setUser(null);
      navigation.navigate('Login');
    }
  };

  const perfil = () => {
    if(user?.nome){
        return(
            openInfoModal("perfil")
        );
    }else{
        return(
            navigation.navigate("Login")
        );
    }
  }
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity >
            <Ionicons name="person-circle" size={40} color="#4B0082" onPress={perfil}/>
          </TouchableOpacity>
          <Text style={styles.headerText}>
            Olá, {user?.nome || 'Visitante'}
          </Text>
        </View>
        {user ? (
          <TouchableOpacity onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={28} color="red" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Ionicons name="log-in-outline" size={28} color="#4B0082" />
          </TouchableOpacity>
        )}
      </View>

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#555" />
        <TextInput
          placeholder="Pesquisar estabelecimentos..."
          style={{ flex: 1, marginLeft: 8 }}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Conteúdo */}
      {loading ? (
        <ActivityIndicator size="large" color="#4B0082" style={{ flex: 1 }} />
      ) : (
        <ScrollView style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>Estabelecimentos</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ paddingLeft: 16 }}>
            {arenas.length > 0 ? (
              arenas.map(renderCard)
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={50} color="#ccc" />
                <Text style={styles.emptyStateText}>
                  Nenhum estabelecimento encontrado
                </Text>
                <Text style={styles.emptyStateSubtext}>
                  Tente uma busca diferente
                </Text>
              </View>
            )}
          </ScrollView>
        </ScrollView>
      )}

      {/* Navegação inferior */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => openInfoModal('notifications')}>
          <Ionicons name="notifications" size={28} color="#4B0082" />
          <Text style={styles.navText}>Notificações</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => openInfoModal('reservas')}>
          <Ionicons name="calendar" size={28} color="#4B0082" />
          <Text style={styles.navText}>Reservas</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => {
            if (user) {
              navigation.navigate('CadastroEstabelecimento', { usuario: user });
            } else {
              navigation.navigate('Login', {
                redirectTo: 'CadastroEstabelecimento',
              });
            }
          }}>
          <Ionicons name="add-circle" size={28} color="#4B0082" />
          <Text style={styles.navText}>Novo Local</Text>
        </TouchableOpacity>
      </View>

      {/* Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{modalTitle}</Text>
            <ScrollView>
              {modalType === "perfil" ? (
                <View style={{ padding: 20 }}>
                  <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>
                    Informações do Usuário
                  </Text>
                  <Text>Nome:</Text>
                  <TextInput
                    value={novoNome}
                    onChangeText={setNovoNome}
                    placeholder="Digite seu nome"
                    style={{
                      borderWidth: 1,
                      borderColor: "#ccc",
                      borderRadius: 8,
                      padding: 8,
                      marginBottom: 15,
                    }}
                  />
                  <Text>Email: {user?.email}</Text>
                  <TouchableOpacity
                    style={{
                      backgroundColor: "#4B0082",
                      padding: 10,
                      marginTop: 20,
                      borderRadius: 8,
                    }}
                    onPress={atualizarUsuario}
                  >
                    <Text style={{ color: "#fff", textAlign: "center", fontWeight: "bold" }}>
                      Confirmar
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                modalContent
              )}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={{ color: "#fff", fontWeight: "bold" }}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    elevation: 3,
  },
  headerText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4B0082',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    backgroundColor: '#eee',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  sectionTitle: {
    marginLeft: 16,
    marginBottom: 8,
    fontWeight: 'bold',
    fontSize: 18,
    color: '#4B0082',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginRight: 12,
    marginBottom: 10,
    width: 220,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardImage: {
    width: '100%',
    height: 140,
  },
  placeholderImage: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    marginTop: 5,
    fontSize: 12,
    color: '#999',
  },
  cardContent: {
    padding: 12,
  },
  cardTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  cardCity: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  priceContainer: {
    marginBottom: 8,
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4B0082',
  },
  amenitiesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amenityIcon: {
    marginRight: 6,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    width: 300,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    elevation: 5,
  },
  navButton: { alignItems: 'center' },
  navText: { fontSize: 12, color: '#4B0082', marginTop: 4 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#4B0082',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  modalCloseButton: {
    marginTop: 12,
    backgroundColor: '#4B0082',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  tag: {
    flexDirection: 'row',
    backgroundColor: '#4B0082',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 6,
    alignItems: 'center',
  },
  tagText: {
    color: '#fff',
    marginLeft: 4,
    fontSize: 12,
  },
});
