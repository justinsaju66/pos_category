/** @odoo-module **/

import { PaymentScreen } from "@point_of_sale/app/screens/payment_screen/payment_screen";
import { patch } from "@web/core/utils/patch";
import { usePos } from "@point_of_sale/app/store/pos_hook";
import { _t } from "@web/core/l10n/translation";
import { rpc } from "@web/core/network/rpc";

patch(PaymentScreen.prototype, {
    setup() {
        super.setup();
        this.pos = usePos();
    },

    async validateOrder(isForceValidate) {
        const session = this.pos.config.current_session_id;
        const order = this.pos.get_order();

        // === SESSION DISCOUNT CHECK ===
        const session_discount_limit = session?.session_discount_limit ?? false;
        const session_discount_limit_amount = session?.session_discount_limit_amount ?? 0;

        if (session_discount_limit) {
            let totalLineDiscount = 0;
            let totalGlobalDiscount = 0;
            const discountProductId = this.pos.config.discount_product_id?.id;

            order.get_orderlines().forEach(line => {
                if (line.product_id?.id === discountProductId) {
                    totalGlobalDiscount += Math.abs(line.get_price_with_tax());
                } else {
                    const unitPrice = line.get_unit_price();
                    const discount = line.get_discount();
                    const quantity = line.get_quantity();
                    totalLineDiscount += (unitPrice * discount / 100) * quantity;
                }
            });

            const totalDiscount = totalLineDiscount + totalGlobalDiscount;

            if (totalDiscount > session_discount_limit_amount || session_discount_limit_amount <= 0) {
                await this.notification.add(_t("Session discount limit exceeded."), {
                    title: "Validation Error",
                    type: "warning"
                });
                return;
            }

            await rpc("/pos/update_session_discount_limit", {
                session_id: session.id,
                used_discount: totalDiscount
            });
        }

        // === CATEGORY DISCOUNT CHECK ===
        if (session?.category_discount) { // Check if category discount is enabled
            const selectedCategoryId = session?.select_category_id?.name || session?.select_category_id;
            console.log(selectedCategoryId);
            const maxAllowedDiscount = session?.max_discount ?? 0;
            console.log(maxAllowedDiscount);
            let totalCategoryDiscount = 0;

            // Loop through the order lines and calculate the discount for products in the selected category
            order.get_orderlines().forEach(line => {
                const productCategoryId = line.product?.pos_categ_id?.[0];
                console.log(productCategoryId)

                // Only apply discount validation if the product's category matches the selected category
                if (productCategoryId === selectedCategoryId) {
                    const unitPrice = line.get_unit_price();
                    const discount = line.get_discount();
                    const quantity = line.get_quantity();
                    const lineDiscountAmount = (unitPrice * discount / 100) * quantity;
                    totalCategoryDiscount += lineDiscountAmount;
                }
            });

            // Apply the discount check only if there is any discount for the selected category
            if (totalCategoryDiscount > 0) {
                if (totalCategoryDiscount > maxAllowedDiscount) {
                    await this.notification.add(_t("Discount for selected category exceeds the allowed limit of " + maxAllowedDiscount), {
                        title: "Validation Error",
                        type: "warning"
                    });
                    return;
                }

                // ✅ Update used category discount in the backend only for the selected category
                await rpc("/pos/check_and_update_category_discount", {
                    session_id: session.id,
                    used_discount: totalCategoryDiscount,
                });
            }
        }

        return super.validateOrder(isForceValidate);
    }
});
