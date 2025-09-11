import React, { useState } from "react";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    if (email === "admin@example.com" && password === "123456") {
      alert("Registro realizado com sucesso!");
      setError("");
    } else {
      setError("Email ou senha incorretos");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.triangle}></div>

      <form style={styles.form} onSubmit={handleLogin}>
        <div style={styles.titleContainer}>
          <h2 style={styles.title}>
            Insira seu email senha
          </h2>
        </div>

        {error && <p style={styles.error}>{error}</p>}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
          required
        />
        
        <button type="submit" style={styles.button}>
          Receber código
        </button>
        <p style={styles.loginText}>
          <span style={styles.link}> Voltar </span>
        </p>
      </form>
    </div>
  );
}

const styles = {
  container: {
    position: "relative",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    backgroundColor: "#2F294B",
    overflow: "hidden",
  },
  triangle: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 0,
    height: 0,
    borderLeft: "100vw solid #665B99",
    borderBottom: "200px solid transparent",
    zIndex: 0,
  },
  form: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "300px",
    backgroundColor: "transparent",
    gap: "15px",
  },
  titleContainer: {
    display: "flex",
    justifyContent: "center",
    width: "100%",
  },
  title: {
    textAlign: "center",
    marginBottom: "25px",
    color: "#fff",
    fontFamily: "'Inter', sans-serif",
    fontSize: "24px",
    lineHeight: "1.4",
  },
  input: {
    padding: "10px",
    marginBottom: "15px",
    borderRadius: "4px",
    border: "1px solid #fff",
    backgroundColor: "#fff",
    color: "#fff",
    fontSize: "16px",
    outline: "none",
  },
  button: {
    padding: "8px 20px",
    borderRadius: "6px",
    border: "none",
    backgroundColor: "#6C63FF",
    color: "#fff",
    fontSize: "14px",
    cursor: "pointer",
    marginTop: "25px",
    alignSelf: "center",
  },
  loginText: {
    color: "#fff",
    fontSize: "14px",
    marginTop: "15px",
    fontFamily: "'Inter', sans-serif",
    textAlign: "center",
  },
  link: {
    color: "#6C63FF",
    cursor: "pointer",
    textDecoration: "underline",
  },
  error: {
    color: "#FF6B6B",
    marginBottom: "10px",
    textAlign: "center",
  },
};

export default Login;