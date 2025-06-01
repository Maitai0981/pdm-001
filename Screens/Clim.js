import React, { useState } from 'react'
import { View, Text, TextInput, Button, ScrollView,TouchableOpacity } from 'react-native'
import {useNavigation} from '@react-navigation/native'

export default function PrevisaoTempo() {
  const nav = useNavigation();
  const [cidade, setCidade] = useState('')
  const [chuvas, setChuvas] = useState(Array(7).fill(''))
  const [mensagem, setMensagem] = useState('')

  const calcularMensagem = () => {
    const a = chuvas.map(c => parseFloat(c)).filter(c => !isNaN(c))
    const t = a.reduce((acc, curr) => acc + curr, 0)

    let msg = ''
    if (t <= 5) {
      msg = 'Parabéns, aproveite o calor e vá tomar banho de piscina!'
    } else if (t <= 30) {
      msg = 'Tá tranquilo, só uma chuvinha para refrescar.'
    } else if (t <= 70) {
      msg = 'Nada de sol para você, mas nada preocupante.'
    } else if (t <= 200) {
      msg = 'Poxa, vai ser complicado sair com essa chuva toda.'
    } else if (t <= 400) {
      msg = `Opa, é bom que não tenha nenhum rio em ${cidade}.`
    } else if (t <= 600) {
      msg = 'Parabéns, você já pode comprar um jet sky para ir a aula.'
    } else if (t <= 1000) {
      msg = `Diga adeus a ${cidade}.`
    } else {
      msg = 'Fuja para as montanhas, ainda dá tempo.'
    }

    setMensagem(`Total de chuva: ${t.toFixed(2)} mm.\n${msg}`)
  }

  const  limpar = () => {
    setCidade('')
    setChuvas(Array(7).fill(''))
    setMensagem('')
  }


  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <Text style={{ fontSize: 18, marginBottom: 10 }}>
        Nesta página você pode realizar uma análise da previsão do tempo para sua cidade e saber se irá ter problemas com as chuvas ou se ficará tudo bem.
      </Text>

      <Text>Informe o nome da sua cidade:</Text>
      <TextInput
        style={{ borderWidth: 1, marginVertical: 10, padding: 8 }}
        placeholder="Nome da cidade"
        value={cidade}
        onChangeText={setCidade}
      />

      <Text>Quantia de chuva em milímetros para:</Text>
      {chuvas.map((c, index) => (
        <TextInput
          key={index}
          style={{ borderWidth: 1, marginVertical: 5, padding: 8 }}
          placeholder={`${index + 1}º dia`}
          keyboardType="numeric"
          value={c}
          onChangeText={(text) => {
            const novaChuvas = [...chuvas]
            novaChuvas[index] = text
            setChuvas(novaChuvas)
          }}
        />
      ))}

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
        <Button title="Enviar" onPress={calcularMensagem} />
        <Button title="Limpar" onPress={limpar} color="red" />
      </View>

      {mensagem !== '' && (
        <Text style={{ marginTop: 20, fontSize: 16, fontWeight: 'bold' }}>
          {mensagem}
        </Text>
      )}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
        <Button title="Voltar" onPress={() => {nav.goBack()}}  />
      </View>
      
    </ScrollView>
  )
}
