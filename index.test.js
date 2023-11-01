/**
 * @jest-environment jsdom
 */

// Fixes errors on jest methods
/* eslint-env jest */

// SETUP MOCKS ----------------------------
// Mock the dataLayer array on the global window object to allow GTM to load

global.window.dataLayer = [];

global.document.getElementsByTagName = jest.fn(() => [
  {
    parentNode: {
      insertBefore: jest.fn(),
    },
  },
]);

global.window.location.pathname.includes = jest.fn(() => true);

// Mocking Shopify analytics
global.analytics = {
  subscribe: jest.fn(),
};

// Mocking localStorage in the web pixel
global.browser = {
  cookie: {
    get: jest.fn().mockResolvedValue("_shopify_y"),
  },
};
// SETUP MOCKS END -------------------------

// Run the main script
require("zulily_web_pixel");

const buildExpectedDLPayload = (event, overrrides) => {
  return {
    cart_total: 258.93,
    total: 258.93,
    subtotal: 263.94,
    shipping_discount: 7.25,
    shipping_discount_reasons: '["Auto shipping discount"]',
    discount_codes:
      '["20% off all products","coupon","Auto shipping discount"]',
    line_item_discount: 92.38,
    marketing: {
      user_id: "_shopify_y",
    },
    items: [
      {
        item_id: "LS-WTLWPM271F1632",
        item_variant_id: "14519112269942",
        item_product_id: "1614323155062",
        item_name:
          "2017 Louisville Slugger C271 MLB Maple Wood Bat: WTLWPM271F16",
        item_brand: "Louisville Slugger",
        item_category: undefined,
        item_variant: '32"',
        price: 99.95,
        quantity: 1,
      },
      {
        item_brand: "Easton",
        item_category: undefined,
        item_id: "EA-A121367WPL",
        item_name:
          "2016 Easton Stealth Hyperskin Fastpitch Batting Gloves: A121367",
        item_product_id: "1614320992374",
        item_variant: "White/Purple / Large",
        item_variant_id: "14519102406774",
        price: 39.99,
        quantity: 2,
      },
      {
        item_brand: "Easton",
        item_category: undefined,
        item_id: "EA-A11175933",
        item_name: "2017 Easton Z-Core XL BBCOR Baseball Bat: BB17ZX",
        item_product_id: "1614318403702",
        item_variant: '33" 30 oz',
        item_variant_id: "14519090446454",
        price: 149.99,
        quantity: 1,
      },
    ],
    ecommerce: {
      currencyCode: "USD",
    },
    ...overrrides,
  };
};

// Sample events have multiple line items, with multiple discount types
// Sample events are based on the same cart, with the same items
const beginCheckoutEvent = require("./event_samples/begin_checkout_event.json");
const beginCheckoutEventWithoutDiscounts = require("./event_samples/begin_checkout_event_without_discounts.json");
const beginCheckoutEventWithAmountBasedDiscount = require("./event_samples/begin_checkout_event_with_amount_based_discount.json");
const paymentInfoSubmittedEvent = require("./event_samples/payment_info_submitted_event.json");
const shippingInfoSubmittedEvent = require("./event_samples/shipping_info_submitted_event.json");

describe("__elevar_web_pixel library", () => {
  // Mock dataLayer
  let dataLayerMock;

  beforeEach(() => {
    dataLayerMock = [];
    Object.defineProperty(window, "dataLayer", {
      value: dataLayerMock,
      writable: true,
    });

    global.browser = {
      cookie: {
        get: jest.fn().mockResolvedValue("_shopify_y"),
      },
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // TODO: test for GTM being loaded
  // it("should initialize GTM correctly when script is run", () => {
  //   expect(global.window.__elevar_web_pixel.initializeGTM)();
  // });

  it("should calculate the correct total shipping discount when discount is percentage based", async () => {
    const totalDiscount =
      await window.__elevar_web_pixel.getTotalShippingDiscount(
        beginCheckoutEvent
      );
    expect(totalDiscount).toBe(7.25);
  });

  it("should calculate the correct total shipping discount when discount is amount based", async () => {
    const totalDiscount =
      await window.__elevar_web_pixel.getTotalShippingDiscount(
        beginCheckoutEventWithAmountBasedDiscount
      );
    expect(totalDiscount).toBe(5);
  });

  it("should calculate a discount of 0 when no shipping discount is applied", async () => {
    const totalDiscount =
      await window.__elevar_web_pixel.getTotalShippingDiscount(
        beginCheckoutEventWithoutDiscounts
      );
    expect(totalDiscount).toBe(0);
  });

  it("should calculate the correct line item discounts if line item discounts are applied", async () => {
    const totalDiscount = await window.__elevar_web_pixel.getLineItemDiscounts(
      beginCheckoutEvent
    );
    expect(totalDiscount).toBe(92.38);
  });

  it("should calculate the correct line item discounts if no line item discounts are applied", async () => {
    const totalDiscount = await window.__elevar_web_pixel.getLineItemDiscounts(
      beginCheckoutEventWithoutDiscounts
    );
    expect(totalDiscount).toBe(0);
  });

  it("should calculate the correct shipping discount reasons", async () => {
    const discountReasons =
      await window.__elevar_web_pixel.getShippingDiscountReasons(
        beginCheckoutEventWithAmountBasedDiscount
      );
    expect(discountReasons).toBe('["Auto shipping discount"]');
  });

  it("should handle the begin checkout event", async () => {
    await window.__elevar_web_pixel.onCheckoutStarted(beginCheckoutEvent);
    expect(dataLayerMock[0]).toStrictEqual({
      event: "dl_begin_checkout",
      event_id: "sh-c7c47dda-73ED-48EF-9E11-5E6651AF06AD",
      ...buildExpectedDLPayload(beginCheckoutEvent, {
        cart_total: 258.92,
        total: 258.92,
      }),
    });
  });

  it("should handle the shipping info submitted event", async () => {
    await window.__elevar_web_pixel.onShippingInfoSubmitted(
      shippingInfoSubmittedEvent
    );
    expect(dataLayerMock[0]).toStrictEqual({
      event: "dl_add_shipping_info",
      event_id: "sh-c7c62007-7FD4-47CD-6CDC-0B1DC76A2ABD",
      ...buildExpectedDLPayload(beginCheckoutEvent),
    });
  });

  // Fires after the order is submitted
  it("should handle the payment info submitted event", async () => {
    await window.__elevar_web_pixel.onPaymentInfoSubmitted(
      paymentInfoSubmittedEvent
    );
    expect(dataLayerMock[0]).toStrictEqual({
      event: "dl_add_payment_info",
      event_id: "sh-c7c6eea4-4EE4-45CA-0A1A-B015EDECD7BC",
      ...buildExpectedDLPayload(beginCheckoutEvent),
    });
  });
});
