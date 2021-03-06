"use strict";

/**
 * Get availability for in store pickup
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @param {dw.catalog.ProductVariationModel} variationModel - The product's variation model
 * @returns {boolean} - if selected variant product is available return selected variant
 *    availability otherwise return master product availability
 */
function getAvailableForInStorePickup(apiProduct, variationModel) {
    var isSelectedVariantAvailableForInStorePickup = variationModel
        && variationModel.selectedVariant
        && variationModel.selectedVariant.custom
        && variationModel.selectedVariant.custom.storePickup
        ? variationModel.selectedVariant.custom.storePickup
        : false;
    var isMasterProductAvailableForInStorePickup = apiProduct.custom
        && apiProduct.custom.storePickup
        ? apiProduct.custom.storePickup
        : false;

    return variationModel && variationModel.selectedVariant
        ? isSelectedVariantAvailableForInStorePickup
        : isMasterProductAvailableForInStorePickup;
}

module.exports = function (object, apiProduct, variationModel) {
    Object.defineProperty(object, "availableForInStorePickup", {
        enumerable: true,
        value: getAvailableForInStorePickup(apiProduct, variationModel)
    });
};
