const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Создает новый отчет.
 * @param {string} testId - ID теста.
 * @param {boolean} status - Статус выполнения теста (true/false).
 * @returns {Promise<Object>} - Созданный отчет.
 */
const createReport = async (testId, status, executionTime) => {
  try {
    const report = await prisma.report.create({
      data: {
        testId,
        status,
        executionTime,
      },
    });
    return report;
  } catch (error) {
    console.error("Error creating report:", error);
    throw error;
  }
};

/**
 * Получает отчет по ID, включая шаги и скриншоты.
 * @param {string} reportId - ID отчета.
 * @returns {Promise<Object>} - Найденный отчет с шагами и скриншотами.
 */
const getReportById = async (reportId) => {
  try {
    const report = await prisma.report.findUnique({
      where: {
        id: reportId,
      },
      include: {
        ReportStep: {
          include: {
            Screenshot: true,
          },
        },
      },
    });
    return report;
  } catch (error) {
    console.error("Error fetching report:", error);
    throw error;
  }
};

/**
 * Получает все отчеты для указанного теста, включая шаги и скриншоты.
 * @param {string} testId - ID теста.
 * @returns {Promise<Array>} - Список отчетов с шагами и скриншотами.
 */
const getReportsByTestId = async (id) => {
  try {
    const reports = await prisma.report.findUnique({
      where: {
        id,
      },
      include: {
        ReportStep: {
          include: {
            Screenshot: true,
            report: {
              include: {
                test: {
                  include: {
                    page: {
                      include: {
                        viewport: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        test: true,
      },
    });
    return reports;
  } catch (error) {
    console.error("Error fetching reports:", error);
    throw error;
  }
};

/**
 * Получает все отчеты для указанного воркспейса, группиря по дате.
 * @param {string} workspaceId - ID воркспейса.
 * @returns {Promise<Array>} - Список отчетов с шагами и скриншотами.
 */
const getReportsGroupedBy = async (workspaceId) => {
  try {
    const data = await prisma.$queryRaw`
      SELECT 
      DATE(r."createdAt") AS day,
      json_agg(
        json_build_object(
          'id', p.id,
          'title', p.title,
          'viewport', json_build_object(
            'id', v.id,
            'title', v.title
          ),
          'reports', (
            SELECT json_agg(
              json_build_object(
                'id', r.id,
                'createdAt', r."createdAt",
                'status', r.status,
                'test', json_build_object(
                  'id', t.id,
                  'title', t.title
                )
              )
            )
            FROM "reports" r
            JOIN "tests" t ON r."testId" = t.id
            WHERE t."pageId" = p.id
          )
        )
      ) AS pages
      FROM "reports" r
      JOIN "tests" t ON r."testId" = t.id
      JOIN "pages" p ON t."pageId" = p.id
      JOIN "ViewPort" v ON p."viewportId" = v.id
      WHERE p."projectId" = ${workspaceId}
      GROUP BY DATE(r."createdAt")
      ORDER BY day DESC;
    `;

    const groupedPages = data.map((i) => ({
      day: i?.day,
      pages: Object.values(
        i.pages.reduce((acc, page) => {
          // Если страница с таким title уже есть в аккумуляторе
          if (acc[page.title]) {
            // Объединяем массивы reports и убираем дубликаты по id
            const uniqueReports = [...acc[page.title].reports, ...page.reports]
              .filter(
                (report, index, self) =>
                  self.findIndex((r) => r.id === report.id) === index
              )
              .filter(
                (l) =>
                  new Date(l.createdAt).getDate() == new Date(i?.day).getDate()
              )
              .sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime()
              );
            acc[page.title].reports = uniqueReports;
          } else {
            // Иначе добавляем новую страницу
            acc[page.title] = { ...page };
          }
          return acc;
        }, {})
      ).reverse(),
    }));

    return groupedPages;
  } catch (error) {
    console.error("Error fetching reports:", error);
    throw error;
  }
};

module.exports = {
  createReport,
  getReportById,
  getReportsByTestId,
  getReportsGroupedBy,
};
