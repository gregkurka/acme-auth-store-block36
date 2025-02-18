require("dotenv").config();
const {
  client,
  createTables,
  createUser,
  createProduct,
  createFavorite,
  fetchUsers,
  fetchProducts,
  fetchFavorites,
  destroyFavorite,
  authenticate,
  findUserWithToken,
} = require("./db");
const express = require("express");
const app = express();
const path = require("path");

app.use(express.json());

app.get("/", (req, res) =>
  res.sendFile(path.join(__dirname, "../client/dist/index.html"))
);
app.use(
  "/assets",
  express.static(path.join(__dirname, "../client/dist/assets"))
);

app.post("/api/auth/login", async (req, res) => {
  try {
    res.send(await authenticate(req.body));
  } catch (ex) {
    res.status(ex.status || 500).send({ error: ex.message });
  }
});

app.post("/api/auth/register", async (req, res) => {
  try {
    const user = await createUser(req.body);
    res.send(user);
  } catch (ex) {
    if (ex.code === "23505") {
      ex.status = 400;
      ex.message = "User already exists";
    }
    res.status(ex.status || 500).send({ error: ex.message });
  }
});

const requireToken = async (req, res, next) => {
  try {
    req.user = await findUserWithToken(req.headers.authorization);
    next();
  } catch (ex) {
    res.status(ex.status || 500).send({ error: ex.message });
  }
};

app.get("/api/auth/me", requireToken, async (req, res) => {
  try {
    res.send(req.user);
  } catch (ex) {
    res.status(ex.status || 500).send({ error: ex.message });
  }
});

app.get("/api/users", async (req, res) => {
  try {
    res.send(await fetchUsers());
  } catch (ex) {
    res.status(ex.status || 500).send({ error: ex.message });
  }
});

app.get("/api/users/:id/favorites", requireToken, async (req, res) => {
  try {
    if (req.user.id !== req.params.id) {
      const error = Error("Not Authorized");
      error.status = 401;
      throw error;
    }
    res.send(await fetchFavorites(req.params.id));
  } catch (ex) {
    res.status(ex.status || 500).send({ error: ex.message });
  }
});

app.post("/api/users/:id/favorites", requireToken, async (req, res) => {
  try {
    if (req.user.id !== req.params.id) {
      const error = Error("Not Authorized");
      error.status = 401;
      throw error;
    }
    res
      .status(201)
      .send(
        await createFavorite({
          user_id: req.params.id,
          product_id: req.body.product_id,
        })
      );
  } catch (ex) {
    res.status(ex.status || 500).send({ error: ex.message });
  }
});

app.delete(
  "/api/users/:user_id/favorites/:id",
  requireToken,
  async (req, res) => {
    try {
      if (req.user.id !== req.params.user_id) {
        const error = Error("Not Authorized");
        error.status = 401;
        throw error;
      }
      await destroyFavorite({ user_id: req.params.user_id, id: req.params.id });
      res.sendStatus(204);
    } catch (ex) {
      res.status(ex.status || 500).send({ error: ex.message });
    }
  }
);

app.get("/api/products", async (req, res) => {
  try {
    res.send(await fetchProducts());
  } catch (ex) {
    res.status(ex.status || 500).send({ error: ex.message });
  }
});

app.use((err, req, res) => {
  res
    .status(err.status || 500)
    .send({ error: err.message ? err.message : err });
});

const init = async () => {
  const port = process.env.PORT || 3000;
  await client.connect();
  console.log("connected to database");
  await createTables();
  console.log("tables created");
  const [moe, lucy, ethyl, curly, foo, bar, bazz, quq, fip] = await Promise.all(
    [
      createUser({ username: "moe", password: "m_pw" }),
      createUser({ username: "lucy", password: "l_pw" }),
      createUser({ username: "ethyl", password: "e_pw" }),
      createUser({ username: "curly", password: "c_pw" }),
      createProduct({ name: "foo" }),
      createProduct({ name: "bar" }),
      createProduct({ name: "bazz" }),
      createProduct({ name: "quq" }),
      createProduct({ name: "fip" }),
    ]
  );
  console.log(await fetchUsers());
  console.log(await fetchProducts());
  console.log(await fetchFavorites(moe.id));
  const favorite = await createFavorite({
    user_id: moe.id,
    product_id: foo.id,
  });
  console.log(favorite);
  app.listen(port, () => console.log(`listening on port ${port}`));
};

init();
