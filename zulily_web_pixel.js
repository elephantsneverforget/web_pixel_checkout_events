/* global browser, analytics */
window.__elevar_web_pixel = {
  initializeGTM: function () {
    (function (w, d, s, l, i) {
      w[l] = w[l] || [];
      w[l].push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
      var f = d.getElementsByTagName(s)[0],
        j = d.createElement(s),
        dl = l != "dataLayer" ? "&l=" + l : "";
      j.async = true;
      j.src = "https://www.googletagmanager.com/gtm.js?id=" + i + dl;
      f.parentNode.insertBefore(j, f);
    })(window, document, "script", "dataLayer", "GTM-M89ZLX2N");
  },

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

  detDiscountCodes: function (event) {
    const codes = event?.data?.checkout?.discountApplications?.map(
      (discountCode) => discountCode?.title
    );
    return JSON.stringify(codes);
  },

  getLineItemDiscounts: function (event) {
    const lineItems = event?.data?.checkout?.lineItems || [];
    let discount = 0;
    lineItems.forEach((lineItem) => {
      const lineItemDiscountAllocations = lineItem?.discountAllocations;
      lineItemDiscountAllocations.forEach((lineItemDiscountAllocation) => {
        discount += lineItemDiscountAllocation?.amount?.amount;
      });
    });
    return discount;
  },

  getTotalShippingDiscount: function (event) {
    const discountApplications =
      event?.data?.checkout?.discountApplications || [];
    const shippingDiscountApplications = discountApplications.filter(
      (discountApplication) =>
        discountApplication?.targetType === "SHIPPING_LINE"
    );

    const shippingDiscountApplicationsPercentBased =
      shippingDiscountApplications.filter(
        (discountApplication) =>
          typeof discountApplication?.value?.percentage !== "undefined"
      );

    const shippingDiscountApplicationsFixedAmountBased =
      shippingDiscountApplications.filter(
        (discountApplication) =>
          typeof discountApplication?.value?.amount !== "undefined"
      );

    const percentBasedDiscounts =
      shippingDiscountApplicationsPercentBased.reduce(
        (acc, shippingDiscountAllocation) => {
          const percentDiscount = shippingDiscountAllocation?.value?.percentage;
          const totalShippingCost =
            event?.data?.checkout?.shippingLine?.price?.amount;
          const discount = (percentDiscount / 100) * totalShippingCost;
          return acc + Number(discount);
        },
        0
      );

    const fixedBasedDiscounts =
      shippingDiscountApplicationsFixedAmountBased.reduce(
        (acc, shippingDiscountAllocation) => {
          return acc + Number(shippingDiscountAllocation?.value?.amount);
        },
        0
      );

    return percentBasedDiscounts + fixedBasedDiscounts;
  },

  getShippingDiscountReasons: function (event) {
    const discountApplications =
      event?.data?.checkout?.discountApplications || [];
    const shippingDiscountApplications = discountApplications.filter(
      (discountApplication) =>
        discountApplication?.targetType === "SHIPPING_LINE"
    );

    const reasons = shippingDiscountApplications.map((discountApplication) => {
      return discountApplication?.title ?? "Unknown";
    });

    return reasons.length > 0 ? JSON.stringify(reasons) : undefined;
  },

  getFormattedItems: function (event) {
    const products = event?.data?.checkout?.lineItems || [];
    return products.map(function (product) {
      return {
        item_id: product?.variant?.sku,
        item_variant_id: product?.variant?.id,
        item_product_id: product?.variant?.product?.id,
        item_name: product?.title,
        item_brand: product?.variant?.product?.vendor,
        item_category: product?.category,
        item_variant: product?.variant?.title ?? product?.title,
        quantity: product?.quantity,
        price: product?.variant?.price?.amount,
      };
    });
  },

  getBaseDLEvent: async function (event) {
    return {
      marketing: {
        user_id: await browser.cookie.get("_shopify_y"),
      },
      user_properties: {
        customer_id: await browser.localStorage.getItem(
          "__zulily_shopify_customer_id"
        ),
      },
      encrypted_ip: await browser.localStorage.getItem("__zulily_ip_address"),
      referring_event_id: await this.getReferringEventId(),
      cart_total: event?.data?.checkout?.totalPrice?.amount,
      subtotal: event?.data?.checkout?.subtotalPrice?.amount,
      event_id: event?.id,
      items: this.getFormattedItems(event),
      discount_codes: this.detDiscountCodes(event),
      shipping_discount: this.getTotalShippingDiscount(event),
      shipping_discount_reasons: this.getShippingDiscountReasons(event),
      line_item_discount: this.getLineItemDiscounts(event),
      total: event?.data?.checkout?.totalPrice?.amount,
      ecommerce: {
        currencyCode: event?.data?.checkout?.currencyCode,
      },
    };
  },

  onCheckoutStarted: async function (event) {
    window.dataLayer.push({
      ...(await this.getBaseDLEvent(event)),
      event: "dl_begin_checkout",
    });
  },

  onShippingInfoSubmitted: async function (event) {
    window.dataLayer.push({
      ...(await this.getBaseDLEvent(event)),
      event: "dl_add_shipping_info",
    });
  },

  onPaymentInfoSubmitted: async function (event) {
    window.dataLayer.push({
      ...(await this.getBaseDLEvent(event)),
      event: "dl_add_payment_info",
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
