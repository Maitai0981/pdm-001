import React from "react";
import { View, Text, Image } from "react-native";

export default function DetailsScreen({ route }) {
  const { nome, dono, endereco, imagem } = route.params || {};

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 20 }}>
      <Text style={{ fontSize: 20, fontWeight: "bold" }}>📌 Tela de Detalhes</Text>

      {imagem && (
        <Image
          source={{ uri: imagem }}
          style={{ width: "100%", height: 200, borderRadius: 12, marginTop: 20 }}
          resizeMode="cover"
        />
      )}

      <Text style={{ marginTop: 20, fontSize: 18, fontWeight: "bold" }}>{nome}</Text>
      <Text style={{ marginTop: 5, fontSize: 16, color: "#555" }}>Dono: {dono}</Text>
      <Text style={{ marginTop: 5, fontSize: 14, color: "#777" }}>Endereço: {endereco}</Text>
    </View>
  );
}
