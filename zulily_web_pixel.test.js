/**
 * @jest-environment jsdom
 */
require("zulily_web_pixel");

debugger;
console.log(window.testing_a);
global.browser = {
  localStorage: {
    getItem: jest.fn(),
  },
};

window.dataLayer = {
  push: jest.fn(),
};

const mockAnalytics = {
  subscribe: jest.fn(),
};

// Tests
describe('getReferringEventId', () => {
  it('should retrieve the correct referring event id', async () => {
    global.browser.localStorage.getItem.mockResolvedValueOnce(JSON.stringify(['id1', 'id2']));
    const eventId = await getReferringEventId();
    expect(eventId).toBe('id1');
  });

  it('should return undefined for invalid data', async () => {
    global.browser.localStorage.getItem.mockResolvedValueOnce('invalid_data');
    const eventId = await getReferringEventId();
    expect(eventId).toBeUndefined();
  });

  // ... more scenarios
});

describe('getFormattedItems', () => {
  it('should correctly format items', () => {
    const mockEvent = {
      data: {
        checkout: {
          lineItems: [
            {
              variant: {
                sku: '123',
                id: 'id1',
                product: {
                  id: 'productId1',
                  vendor: 'vendor1',
                },
                price: {
                  amount: '100',
                },
              },
              title: 'Product 1',
              category: 'Category 1',
              quantity: 1,
            },
            // ... more products
          ],
        },
      },
    };
    const items = getFormattedItems(mockEvent);
    expect(items).toEqual([
      {
        "item_id": '123',
        // ... other attributes
      },
      // ... more formatted products
    ]);
  });
});

describe('analytics subscriptions', () => {
  it('should push the correct data on checkout_started', async () => {
    const mockEvent = {
      id: 'eventId1',
      data: {
        checkout: {
          lineItems: [],
          totalPrice: {
            amount: '100',
          },
          subtotalPrice: {
            amount: '80',
          },
          currencyCode: 'USD',
        },
      },
    };
    global.browser.localStorage.getItem.mockResolvedValueOnce(JSON.stringify(['id1', 'id2']));

    await mockAnalytics.subscribe.mock.calls[0][1](mockEvent); // assuming 'checkout_started' is the first subscription
    expect(window.dataLayer.push).toHaveBeenCalledWith({
      event: 'dl_begin_checkout',
      referring_event_id: 'id1',
      event_id: 'eventId1',
      items: [],
      cart_total: '100',
      subtotal: '80',
      ecommerce: {
        currencyCode: 'USD',
      },
    });
  });

  // ... more tests for other analytics subscriptions
});
