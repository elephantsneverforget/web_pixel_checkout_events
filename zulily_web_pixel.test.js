/**
 * @jest-environment jsdom
 */

// Fixes errors on jest methods
/* eslint-env jest */

/* global browser */
// Mock the dataLayer array on the global window object to allow GTM to load
global.window.dataLayer = [];
global.document.createElement = jest.fn(() => ({
  set async(val) {}, // mock setter for async
  set src(val) {}, // mock setter for src
}));
global.document.getElementsByTagName = jest.fn(() => [
  {
    parentNode: {
      insertBefore: jest.fn(),
    },
  },
]);
// Mocking Shopify analytics
global.analytics = {
  subscribe: jest.fn(),
};

global.browser = {
  localStorage: {
    getItem: jest.fn(),
  },
};

debugger;

// Run the main script
require("zulily_web_pixel");

// Sample events have multiple line items, with multiple discount types
// Sample events are based on the same cart, with the same items
const beginCheckoutEvent = require("./event_samples/begin_checkout_event.json");
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
    // Mock localStorage
    global.browser.localStorage.getItem.mockResolvedValue(
      '["284eed8a-1189-48d0-9933-740a2db544fb","e5c51d1d-0a7a-4931-9c81-1f14e528eb2c","2ae30e44-6da9-4995-aef7-1a11415cd38d"]'
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should initialize GTM correctly", () => {
    window.__elevar_web_pixel.initializeGTM();
    expect(
      document.querySelector(
        "script[src^='https://www.googletagmanager.com/gtm.js?id=']"
      )
    ).not.toBeNull();
  });

  it("should retrieve the correct referring event ID", async () => {
    const eventId = await window.__elevar_web_pixel.getReferringEventId();
    expect(eventId).toBe("284eed8a-1189-48d0-9933-740a2db544fb");
  });

  it("should calculate the correct total shipping discount when discount is percentage based", async () => {
    const totalDiscount = await window.__elevar_web_pixel.getTotalShippingDiscount(
      beginCheckoutEvent
    );
    expect(totalDiscount).toBe(7.25);
  });

  it("should calculate the correct total shipping discount when discount is amount based", async () => {
    const totalDiscount = await window.__elevar_web_pixel.getTotalShippingDiscount(
      beginCheckoutEventWithAmountBasedDiscount
    );
    expect(totalDiscount).toBe(5);
  });

  it("should handle the checkout_started event", async () => {
    await window.__elevar_web_pixel.onCheckoutStarted(beginCheckoutEvent);
    expect(dataLayerMock[0]).toStrictEqual({
      event: "dl_begin_checkout",
      ecommerce: {
        currencyCode: "USD",
      },
    });
  });

  it("should handle the shipping info submitted event", async () => {
    await window.__elevar_web_pixel.onShippingInfoSubmitted(
      shippingInfoSubmittedEvent
    );
    expect(dataLayerMock[0]).toStrictEqual({
      event: "dl_add_shipping_info",
      // ... other expected fields
    });
  });

  // Fires after the order is submitted
  it("should handle the payment info submitted event", async () => {
    await window.__elevar_web_pixel.onPaymentInfoSubmitted(
      paymentInfoSubmittedEvent
    );
    expect(dataLayerMock[0]).toStrictEqual({
      event: "dl_add_payment_info",
      // ... other expected fields
    });
  });
});
