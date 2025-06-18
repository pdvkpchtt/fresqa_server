const axios = require("axios");
const {
  createWebElement,
  createWebElement_Env,
} = require("../services/webElementService");

// мы будем вызывать aiCreateTest

const dotenv = require("dotenv");

dotenv.config();

// Конфигурация API эндпоинтов
const API_ENDPOINTS = {
  ai: {
    url: `${process.env.API_PARSER}/api/ai/url`,
    file: `${process.env.API_PARSER}/api/ai/file`,
  },
  custom: {
    url: `${process.env.API_PARSER}/api/custom/url`,
    file: `${process.env.API_PARSER}/api/custom/file`,
  },
};

/**
 * Отправляет запрос к API парсера
 * @param {string} endpoint - URL эндпоинта
 * @param {Object} data - Данные для отправки
 * @param {string} type - Тип запроса (url/file)
 * @returns {Promise<Array>} - Результат парсинга
 */
async function callParserAPI(endpoint, data, type, viewport) {
  try {
    const formData = new FormData();

    if (type === "file") {
      formData.append("htmlFile", data.file.buffer);
    } else {
      formData.append("url", data.url);
      formData.append("deviceType", viewport);
    }

    const response = await axios.post(endpoint, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      withCredentials: true,
    });

    return response.data;
  } catch (error) {
    console.log(`API request failed to ${endpoint}:`, error.message);
    throw error;
  }
}

/**
 * Парсер интерактивных веб-элементов через API с fallback
 * @param {string} pageUrl - URL страницы для парсинга
 * @param {string} pageId - ID страницы
 * @param {number} width - Ширина viewport
 * @param {number} height - Высота viewport
 */
async function parseWebElements(pageUrl, pageId, viewport, isAi, file) {
  let elements = [];

  try {
    // если с фронта пришло isAi = true
    if (isAi) {
      try {
        elements = await callParserAPI(
          !file ? API_ENDPOINTS.ai.url : API_ENDPOINTS.ai.file,
          !file ? { url: pageUrl } : { file: file },
          !file ? "url" : "file",
          viewport
        );
        console.log(`AI parser success for URL: ${pageUrl}`);
      } catch (aiError) {
        throw new Error("AI parser failed, lets switch it");
      }
    }
    // если с фронта пришло isAi = false
    else {
      try {
        elements = await callParserAPI(
          !file ? API_ENDPOINTS.custom.url : API_ENDPOINTS.custom.file,
          !file ? { url: pageUrl } : { file: file },
          !file ? "url" : "file",
          viewport
        );
      } catch (aiError) {
        throw new Error(aiError);
      }
    }
  } catch (error) {
    console.log("Both parsers failed for URL:", pageUrl, error);
    throw new Error("Failed to parse page: " + error.message);
  }

  console.log(elements);

  try {
    // Сохраняем элементы в базу данных
    await createWebElement_Env(pageId, elements, false);
    console.log(`Saved ${elements.length} elements for page ${pageId}`);
  } catch (dbError) {
    console.log("Failed to save elements to DB:", dbError);
    throw dbError;
  }
}

async function parseWebElementsAndDontSave(
  pageUrl,
  pageId,
  viewport,
  isAi,
  file
) {
  let elements = [];

  try {
    // если с фронта пришло isAi = true
    if (isAi) {
      try {
        elements = await callParserAPI(
          !file ? API_ENDPOINTS.ai.url : API_ENDPOINTS.ai.file,
          !file ? { url: pageUrl } : { file: file },
          !file ? "url" : "file",
          viewport
        );
        console.log(`AI parser success for URL: ${pageUrl}`);
      } catch (aiError) {
        throw new Error("AI parser failed, lets switch it");
      }
    }
    // если с фронта пришло isAi = false
    else {
      try {
        elements = await callParserAPI(
          !file ? API_ENDPOINTS.custom.url : API_ENDPOINTS.custom.file,
          !file ? { url: pageUrl } : { file: file },
          !file ? "url" : "file",
          viewport
        );
      } catch (aiError) {
        throw new Error(aiError);
      }
    }

    return elements;
  } catch (error) {
    console.log("Both parsers failed for URL:", pageUrl, error);
    throw new Error("Failed to parse page: " + error.message);
  }
}

/**
 * Парсер HTML файла через API с fallback
 * @param {Object} file - HTML файл
 * @param {string} pageId - ID страницы
 */
async function parseWebElementsFromFile(file, pageId) {
  let elements = [];

  try {
    // Сначала пробуем AI парсер
    try {
      elements = await callParserAPI(API_ENDPOINTS.ai.file, { file }, "file");
      console.log("AI parser success for file");
    } catch (aiError) {
      console.log("AI parser failed, trying custom parser...");
      elements = await callParserAPI(
        API_ENDPOINTS.custom.file,
        { file },
        "file"
      );
    }
  } catch (error) {
    console.log("Both parsers failed for file:", error);
    throw new Error("Failed to parse file: " + error.message);
  }

  try {
    // Сохраняем элементы в базу данных
    await createWebElement_Env(pageId, elements, false);
    console.log(
      `Saved ${elements.length} elements from file for page ${pageId}`
    );
  } catch (dbError) {
    console.log("Failed to save elements to DB:", dbError);
    throw dbError;
  }
}

module.exports = {
  parseWebElements,
  parseWebElementsFromFile,
  parseWebElementsAndDontSave,
};
