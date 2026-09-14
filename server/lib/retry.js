async function retry(fn, { attempts = 3, baseMs = 500 } = {}) {
  let lastErr;

  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;

      console.error(
        `[retry] attempt ${i + 1}/${attempts} failed:`,
        err.message
      );

      if (i < attempts - 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, baseMs * 2 ** i)
        );
      }
    }
  }

  throw lastErr;
}

module.exports = { retry };