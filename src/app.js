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

const app = express();

app.use(express.json()); // из за этой строки я убил все нервные клетки
app.use(
  cors({
    origin: "http://localhost:5000",
    credentials: true,
  })
);
app.use(bodyParser.json());

// храним экспресс сессию в призме
const store = new (connectPgSimple(session))({ createTableIfMissing: true });
app.use(
  session({
    store: store,
    secret: "myscecret",
    saveUninitialized: false,
    resave: false,
    cookie: {
      secure: false,
      httpOnly: false,
      sameSite: false,
      maxAge: 1000 * 60 * 60 * 24 * 7 * 30,
    },
  })
);
// храним экспресс сессию в призме

// app.get("/", async (req, res) => {
//   req.session.destroy();
//   console.log(req.session?.user);
//   res.send("/ass");
// });

// Роуты
app.use("/api", router);

module.exports = () => {
  return app; // Возвращаем экземпляр приложения
};
