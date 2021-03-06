"use strict";

var server = require("server");
server.extend(module.superModule);

var PBHelpers = require("*/cartridge/scripts/checkout/priceBooksHelpers");

server.replace("AddProduct", function (req, res, next) {
    var BasketMgr = require("dw/order/BasketMgr");
    var Resource = require("dw/web/Resource");
    var URLUtils = require("dw/web/URLUtils");
    var Transaction = require("dw/system/Transaction");
    var CartModel = require("*/cartridge/models/cart");
    var ProductLineItemsModel = require("*/cartridge/models/productLineItems");
    var cartHelper = require("*/cartridge/scripts/cart/cartHelpers");
    var LoggerUtils = require("*/cartridge/scripts/utils/LoggerUtils");

    PBHelpers.updatePriceBooks(req);

    var currentBasket = BasketMgr.getCurrentOrNewBasket();
    var previousBonusDiscountLineItems = currentBasket.getBonusDiscountLineItems();
    var productId = req.form.pid;
    var storeId = req.form.storeId ? req.form.storeId : null;
    var childProducts = Object.hasOwnProperty.call(req.form, "childProducts")
        ? JSON.parse(req.form.childProducts)
        : [];
    var options = req.form.options ? JSON.parse(req.form.options) : [];
    var quantity;
    var result;
    var pidsObj;

    if (currentBasket) {
        Transaction.wrap(function () {
            if (!req.form.pidsObj) {
                quantity = parseInt(req.form.quantity, 10);
                result = cartHelper.addProductToCart(
                    currentBasket,
                    productId,
                    quantity,
                    childProducts,
                    options,
                    storeId,
                    req
                );
            } else {
                // product set
                pidsObj = JSON.parse(req.form.pidsObj);
                result = {
                    error: false,
                    message: Resource.msg("text.alert.addedtobasket", "product", null)
                };

                pidsObj.forEach(function (PIDObj) {
                    quantity = parseInt(PIDObj.qty, 10);
                    var pidOptions = PIDObj.options ? JSON.parse(PIDObj.options) : {};
                    var PIDObjResult = cartHelper.addProductToCart(
                        currentBasket,
                        PIDObj.pid,
                        quantity,
                        childProducts,
                        pidOptions,
                        PIDObj.storeId,
                        req
                    );
                    if (PIDObjResult.error) {
                        result.error = PIDObjResult.error;
                        result.message = PIDObjResult.message;
                    }
                });
            }
            if (!result.error) {
                cartHelper.ensureAllShipmentsHaveMethods(currentBasket);
            }
        });
    }

    var quantityTotal = ProductLineItemsModel.getTotalQuantity(currentBasket.productLineItems);
    var cartModel = new CartModel(currentBasket);

    var urlObject = {
        url: URLUtils.url("Cart-ChooseBonusProducts").toString(),
        configureProductstUrl: URLUtils.url("Product-ShowBonusProducts").toString(),
        addToCartUrl: URLUtils.url("Cart-AddBonusProducts").toString()
    };

    var newBonusDiscountLineItem =
        cartHelper.getNewBonusDiscountLineItem(
            currentBasket,
            previousBonusDiscountLineItems,
            urlObject,
            result.uuid
        );
    if (newBonusDiscountLineItem) {
        var allLineItems = currentBasket.allProductLineItems;
        var collections = require("*/cartridge/scripts/util/collections");
        collections.forEach(allLineItems, function (pli) {
            if (pli.UUID === result.uuid) {
                Transaction.wrap(function () {
                    pli.custom.bonusProductLineItemUUID = "bonus";
                    pli.custom.preOrderUUID = pli.UUID;
                });
            }
        });
    }

    LoggerUtils.sessionInfo("Added product to cart: " + productId + ", qty: " + parseInt(req.form.quantity, 10));

    res.json({
        quantityTotal: quantityTotal,
        message: result.message,
        cart: cartModel,
        newBonusDiscountLineItem: newBonusDiscountLineItem || {},
        error: result.error,
        pliUUID: result.uuid
    });

    next();
});

module.exports = server.exports();
