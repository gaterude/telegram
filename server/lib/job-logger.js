function logJob(name, event, extra = {}) {
  console.log(
    JSON.stringify({
      ts: new Date().toISOString(),
      job: name,
      event,
      ...extra,
    })
  );
}

module.exports = { logJob };