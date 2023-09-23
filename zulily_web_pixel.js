/* global browser, analytics */
window.__elevar_web_pixel = {
  initializeGTM: function() {
    (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','GTM-M89ZLX2N');
},

  // Utility to get the Referring Event ID
  getReferringEventId: async function () {
    try {
      const eventIds = await JSON.parse(
        await browser.localStorage.getItem("__zulily_pv_event_id_array")
      );
      const latestEventId = eventIds[0];
      return latestEventId;
    } catch (e) {
      console.log("Couldn't retrieve referring event id");
      return undefined;
    }
  },

  // Utility to get formatted items
  getFormattedItems: function (event) {
    const products = event.data.checkout.lineItems;
    return products.map(function (product) {
      return {
        item_id: product.variant.sku,
        item_variant_id: product.variant.id,
        item_product_id: product.variant.product.id,
        item_name: product.title,
        item_brand: product.variant.product.vendor,
        item_category: product.category,
        item_variant: product.variant.title ?? product.title,
        quantity: product.quantity,
        price: product.variant.price.amount,
      };
    });
  },

  // Callbacks for analytics subscription
  onCheckoutStarted: async function (event) {
    console.log("test_checkout_started");
    const reid = await this.getReferringEventId();
    window.dataLayer.push({
      event: "dl_begin_checkout",
      referring_event_id: reid,
      event_id: event.id,
      items: this.getFormattedItems(event),
      cart_total: event.data.checkout.totalPrice.amount,
      subtotal: event.data.checkout.subtotalPrice.amount,
      ecommerce: {
        currencyCode: event.data.checkout.currencyCode,
      },
    });
  },

  onShippingInfoSubmitted: async function (event) {
    const reid = await this.getReferringEventId();
    window.dataLayer.push({
      event: "dl_add_shipping_info",
      referring_event_id: reid,
      ecommerce: {
        currencyCode: event.data.checkout.currencyCode,
      },
    });
  },

  onPaymentInfoSubmitted: async function (event) {
    const reid = await this.getReferringEventId();
    window.dataLayer.push({
      event: "dl_add_payment_info",
      referring_event_id: reid,
      ecommerce: {
        currencyCode: event.data.checkout.currencyCode,
      },
    });
  },
};

// Initialize GTM
window.__elevar_web_pixel.initializeGTM();

// Attach callbacks to the web pixel analytics subscriptions
analytics.subscribe(
  "checkout_started",
  window.__elevar_web_pixel.onCheckoutStarted.bind(window.__elevar_web_pixel)
);
analytics.subscribe(
  "checkout_shipping_info_submitted",
  window.__elevar_web_pixel.onShippingInfoSubmitted.bind(
    window.__elevar_web_pixel
  )
);
analytics.subscribe(
  "payment_info_submitted",
  window.__elevar_web_pixel.onPaymentInfoSubmitted.bind(
    window.__elevar_web_pixel
  )
);
