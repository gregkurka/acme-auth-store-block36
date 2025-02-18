import { useState, useEffect } from "react";

const Login = ({ login, loginError }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const submit = (ev) => {
    ev.preventDefault();
    login({ username, password });
  };

  return (
    <form onSubmit={submit}>
      <h2>Login</h2>
      {loginError ? <div style={{ color: "red" }}>{loginError}</div> : null}
      <input
        value={username}
        placeholder="username"
        onChange={(ev) => setUsername(ev.target.value)}
      />
      <input
        value={password}
        placeholder="password"
        onChange={(ev) => setPassword(ev.target.value)}
        type="password"
      />
      <button disabled={!username || !password}>Login</button>
    </form>
  );
};

const Register = ({ registerUser, registerError }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const submit = (ev) => {
    ev.preventDefault();
    registerUser({ username, password });
  };

  return (
    <form onSubmit={submit}>
      <h2>Register</h2>
      {registerError ? (
        <div style={{ color: "red" }}>{registerError}</div>
      ) : null}
      <input
        value={username}
        placeholder="username"
        onChange={(ev) => setUsername(ev.target.value)}
      />
      <input
        value={password}
        placeholder="password"
        onChange={(ev) => setPassword(ev.target.value)}
        type="password"
      />
      <button disabled={!username || !password}>Register</button>
    </form>
  );
};

function App() {
  const [auth, setAuth] = useState({});
  const [products, setProducts] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [showRegister, setShowRegister] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [registerError, setRegisterError] = useState("");

  useEffect(() => {
    attemptLoginWithToken();
  }, []);

  const attemptLoginWithToken = async () => {
    const token = window.localStorage.getItem("token");
    if (token) {
      const response = await fetch("/api/auth/me", {
        headers: {
          authorization: token,
        },
      });
      if (response.ok) {
        const user = await response.json();
        setAuth(user);
      } else {
        window.localStorage.removeItem("token");
      }
    }
  };

  useEffect(() => {
    const fetchProducts = async () => {
      const response = await fetch("/api/products");
      const json = await response.json();
      setProducts(json);
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!auth.id) {
        setFavorites([]);
        return;
      }
      const token = window.localStorage.getItem("token");
      const response = await fetch(`/api/users/${auth.id}/favorites`, {
        headers: {
          authorization: token,
        },
      });
      if (response.ok) {
        const json = await response.json();
        setFavorites(json);
      }
    };
    fetchFavorites();
  }, [auth]);

  const login = async (credentials) => {
    setLoginError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }
      const json = await response.json();
      window.localStorage.setItem("token", json.token);
      attemptLoginWithToken();
    } catch (ex) {
      setLoginError(ex.message);
    }
  };

  const registerUser = async (credentials) => {
    setRegisterError("");
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }
      await login(credentials);
    } catch (ex) {
      setRegisterError(ex.message);
    }
  };

  const addFavorite = async (product_id) => {
    const token = window.localStorage.getItem("token");
    const response = await fetch(`/api/users/${auth.id}/favorites`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: token,
      },
      body: JSON.stringify({ product_id }),
    });
    if (response.ok) {
      const json = await response.json();
      setFavorites([...favorites, json]);
    } else {
      const error = await response.json();
      console.log(error);
    }
  };

  const removeFavorite = async (id) => {
    const token = window.localStorage.getItem("token");
    const response = await fetch(`/api/users/${auth.id}/favorites/${id}`, {
      method: "DELETE",
      headers: {
        authorization: token,
      },
    });
    if (response.ok) {
      setFavorites(favorites.filter((favorite) => favorite.id !== id));
    } else {
      const error = await response.json();
      console.log(error);
    }
  };

  const logout = () => {
    window.localStorage.removeItem("token");
    setAuth({});
  };

  return (
    <>
      {!auth.id ? (
        <>
          <button onClick={() => setShowRegister(!showRegister)}>
            {showRegister ? "Already have an account?" : "Need to register?"}
          </button>
          {showRegister ? (
            <Register
              registerUser={registerUser}
              registerError={registerError}
            />
          ) : (
            <Login login={login} loginError={loginError} />
          )}
        </>
      ) : (
        <button onClick={logout}>Logout {auth.username}</button>
      )}
      <ul>
        {products.map((product) => {
          const isFavorite = favorites.find((f) => f.product_id === product.id);
          return (
            <li key={product.id} className={isFavorite ? "favorite" : ""}>
              {product.name}
              {auth.id && isFavorite && (
                <button onClick={() => removeFavorite(isFavorite.id)}>-</button>
              )}
              {auth.id && !isFavorite && (
                <button onClick={() => addFavorite(product.id)}>+</button>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}

export default App;
