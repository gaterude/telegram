const { add } = require("../lib/math");

test("add(2, 3) = 5", () => {
  expect(add(2, 3)).toBe(5);
});