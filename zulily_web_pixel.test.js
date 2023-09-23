/**
 * @jest-environment jsdom
 */

// Fixes errors on jest methods
/* eslint-env jest */

// Mock the dataLayer array on the global window object to allow GTM to load
global.window.dataLayer = [];
global.document.createElement = jest.fn(() => ({
  set async(val) {}, // mock setter for async
  set src(val) {},   // mock setter for src
}));
global.document.getElementsByTagName = jest.fn(() => [{
  parentNode: {
    insertBefore: jest.fn(),
  },
}]);
// Mocking Shopify analytics
global.analytics = {
  subscribe: jest.fn()
};

debugger;

// Run the main script
require("zulily_web_pixel");

// Sample events have multiple line items, with multiple discount types
// Sample events are based on the same cart, with the same items
const beginCheckoutEvent = require("./events/begin_checkout_event.json");
const paymentInfoSubmittedEvent = require("./events/payment_info_submitted_event.json");
const shippingInfoSubmittedEvent = require("./events/shipping_info_submitted_event.json");

describe('__elevar_web_pixel library', () => {

  // Mock dataLayer
  let dataLayerMock;

  beforeEach(() => {
    dataLayerMock = [];
    Object.defineProperty(window, 'dataLayer', {
      value: dataLayerMock,
      writable: true,
    });
    // Mock localStorage
    jest.spyOn(window.localStorage.__proto__, 'getItem').mockImplementation((key) => {
      return JSON.stringify(['event123']);
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize GTM correctly', () => {
    window.__elevar_web_pixel.initializeGTM();
    // Check if the script element has been created for GTM
    expect(document.querySelector("script[src^='https://www.googletagmanager.com/gtm.js?id=']")).not.toBeNull();
  });

  it('should retrieve referring event ID', async () => {
    const eventId = await window.__elevar_web_pixel.getReferringEventId();
    expect(eventId).toBe('event123');
  });

  it('should format items correctly', () => {
    const mockEvent = {
      data: {
        checkout: {
          lineItems: [
            {
              variant: {
                sku: 'SKU123',
                id: 'VARIANT123',
                product: {
                  id: 'PRODUCT123',
                  vendor: 'VENDOR123'
                },
                price: {
                  amount: 99.99
                }
              },
              title: 'Test Product',
              category: 'Test Category',
              quantity: 1
            }
          ]
        }
      }
    };

    const items = window.__elevar_web_pixel.getFormattedItems(mockEvent);
    expect(items).toEqual([{
      "item_id": "SKU123",
      "item_variant_id": "VARIANT123",
      "item_product_id": "PRODUCT123",
      "item_name": "Test Product",
      "item_brand": "VENDOR123",
      "item_category": "Test Category",
      "item_variant": "Test Product",
      "quantity": 1,
      "price": 99.99
    }]);
  });

  // Similar tests can be written for onCheckoutStarted, onShippingInfoSubmitted, 
  // and onPaymentInfoSubmitted where you mock necessary methods and check if 
  // window.dataLayer receives the expected data.

  // Example:
  it('should handle checkout_started event correctly', async () => {
    const mockEvent = {
      id: 'eventID123',
      data: {
        checkout: {
          // your mock data here
        }
      }
    };

    await window.__elevar_web_pixel.onCheckoutStarted(mockEvent);

    // Check the data pushed into dataLayer
    expect(dataLayerMock).toContainEqual({
      event: 'dl_begin_checkout',
      // ... other expected fields
    });
  });

  // Similar tests for other functions...

});
