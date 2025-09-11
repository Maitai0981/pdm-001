import React, { useEffect } from "react";
import { View, Text, Image, StyleSheet } from "react-native";

export default function SplashScreen({ navigation }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace("Login");
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/Logo.png")}
        style={styles.logo}
      />
      <Text style={styles.text}>Carregando...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2F294B",
    margin: 0,
    padding: 0,
  },
  logo: {
    width: 370,
    height: 370,
    resizeMode: "contain",
    borderRadius: 360,
    overflow: "hidden",
  },
  text: {
    fontSize: 18,
    fontWeight: "bold",
    color: 'white',
    margin: 0,
  },
});
