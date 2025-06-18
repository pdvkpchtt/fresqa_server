const startApp = require("./src/app");
const { initializeViewPorts } = require("./src/services/viewPortService");
const {
  initializeWebElementActions,
} = require("./src/services/webElementActionsService");
const PORT = process.env.PORT || 3000;

// Инициализация данных при старте приложения
async function initializeApp() {
  try {
    console.log("Инициализация предопределенных веб-элементов...");
    await initializeWebElementActions(); // Вызов метода инициализации
    await initializeViewPorts();
    console.log("Веб-элементы успешно инициализированы.");
  } catch (error) {
    console.error("Ошибка при инициализации данных:", error.message);
    process.exit(1); // Остановка приложения при ошибке
  }
}

(async () => {
  try {
    const app = await startApp(); // Запускаем инициализацию приложения
    app.listen(PORT, () => {
      console.log(`Сервер запущен на порту ${PORT}`);
    });

    await initializeApp();
  } catch (error) {
    console.error("Ошибка при запуске сервера:", error.message);
    process.exit(1); // Остановка приложения при ошибке
  }
})();
