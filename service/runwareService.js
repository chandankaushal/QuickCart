const Runware = require("../models/runwareModel");
async function handleRunwareWebhook(payload, log) {
  // Runware sends errors under `errors`, successes under `data`
  if (Array.isArray(payload?.errors) && payload.errors.length > 0) {
    payload.errors.forEach((e) => {
      log.error(
        { task_id: e.taskUUID, code: e.code, message: e.message },
        "Runware reported an error for task",
      );
    });
    return;
  }

  if (!Array.isArray(payload?.data) || payload.data.length === 0) {
    log.warn({ payload }, "Webhook received with no data to process");
    return;
  }

  await Promise.all(
    payload.data.map(async (item) => {
      const response = await Runware.addResult(
        item.taskUUID,
        item.imageURL,
        item.imageUUID,
        item.seed,
        item.cost,
      );
      // TO-DO This might be an issue if the DB does not have that task
      if (response.rowCount === 0) {
        log.warn(
          { task_id: item.taskUUID },
          "Nothing updated in the db for this task",
        );
      }
    }),
  );
}

module.exports = { handleRunwareWebhook };
