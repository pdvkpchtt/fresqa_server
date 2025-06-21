const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const connectPgSimple = require("connect-pg-simple");
const session = require("express-session");
const router = require("./api/index");
const {
  initializeWebElementActions,
} = require("./services/webElementActionsService");
const { initializeViewPorts } = require("./services/viewPortService");
const { Pool } = require("pg");
const pgSession = require("connect-pg-simple")(session);

const pool = new Pool({
  connectionString:
    "postgresql://gen_user:LdlM1Zr0cf@46.149.66.179:5432/default_db",
});

const app = express();

app.use(express.json()); // из за этой строки я убил все нервные клетки
app.use(
  cors({
    origin: [
      "http://localhost:5000",
      "https://pdvkpchtt-fresqa-server-3721.twc1.net/",
    ],
    credentials: true,
  })
);
app.use(bodyParser.json());

// храним экспресс сессию в призме
app.use(
  session({
    store: new pgSession({
      pool, // Подключение к Postgres
      tableName: "session", // Можно изменить имя таблицы
    }),
    secret: "secret",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 }, // 30 дней
  })
);
// храним экспресс сессию в призме

app.get("/", async (req, res) => {
  // req.session.destroy();
  console.log(req.session?.user);
  res.send("/ass");
});

// Роуты
app.use("/api", router);

module.exports = () => {
  return app; // Возвращаем экземпляр приложения
};
