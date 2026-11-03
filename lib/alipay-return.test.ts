import assert from "node:assert/strict";
import test from "node:test";
import {
  assessAlipayReturn,
  canQueryAlipayReturn,
  cnyAmountsEqual,
  normalizeCnyAmount,
} from "./alipay-return";

test("unsigned return cannot query or confirm a product", () => {
  assert.equal(canQueryAlipayReturn(false, "FQ-real-order", "2024110322001"), false);
  const result = assessAlipayReturn({
    verified: false,
    tradeStatus: "TRADE_SUCCESS",
    signedPassback: "gift-set",
    queryAmount: "0.01",
    catalogAmount: "98.00",
  });
  assert.deepEqual(result, {
    paid: false,
    productId: "",
    amountMatches: false,
  });
});

test("signed paid return confirms the product only when the amount matches", () => {
  const mismatch = assessAlipayReturn({
    verified: true,
    tradeStatus: "TRADE_SUCCESS",
    signedPassback: encodeURIComponent("gift-set"),
    queryAmount: "0.01",
    signedAmount: "0.01",
    catalogAmount: "98.00",
  });
  assert.equal(mismatch.paid, true);
  assert.equal(mismatch.productId, "");
  assert.equal(mismatch.amountMatches, false);

  const match = assessAlipayReturn({
    verified: true,
    tradeStatus: "TRADE_FINISHED",
    signedPassback: "gift-set",
    queryPassback: "gift-set",
    queryAmount: "98.00",
    signedAmount: "98.0",
    catalogAmount: "98.00",
  });
  assert.equal(match.paid, true);
  assert.equal(match.productId, "gift-set");
  assert.equal(match.amountMatches, true);
});

test("conflicting passback or amount is not shown as that product", () => {
  const conflict = assessAlipayReturn({
    verified: true,
    tradeStatus: "TRADE_SUCCESS",
    signedPassback: "gift-set",
    queryPassback: "paypal-test-cent",
    queryAmount: "98.00",
    catalogAmount: "98.00",
  });
  assert.equal(conflict.productId, "");
  assert.equal(conflict.amountMatches, false);

  const amountConflict = assessAlipayReturn({
    verified: true,
    tradeStatus: "TRADE_SUCCESS",
    signedPassback: "dianhong-classic",
    queryAmount: "28.00",
    signedAmount: "0.01",
    catalogAmount: "28.00",
  });
  assert.equal(amountConflict.productId, "");
});

test("unpaid trade does not confirm a product", () => {
  const result = assessAlipayReturn({
    verified: true,
    tradeStatus: "WAIT_BUYER_PAY",
    signedPassback: "dianhong-classic",
    queryAmount: "28.00",
    catalogAmount: "28.00",
  });
  assert.equal(result.paid, false);
  assert.equal(result.productId, "");
  assert.equal(result.amountMatches, true);
});

test("query is allowed only with a signature and a trade id", () => {
  assert.equal(canQueryAlipayReturn(true, "", ""), false);
  assert.equal(canQueryAlipayReturn(true, "FQ1", ""), true);
  assert.equal(canQueryAlipayReturn(true, "", "2024"), true);
});

test("cny amounts compare on two decimal places", () => {
  assert.equal(normalizeCnyAmount("28"), "28.00");
  assert.equal(cnyAmountsEqual("28.0", "28.00"), true);
  assert.equal(cnyAmountsEqual("28.001", "28.00"), false);
  assert.equal(cnyAmountsEqual("98.00", "0.01"), false);
});
