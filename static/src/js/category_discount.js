/** @odoo-module **/
import { patch } from "@web/core/utils/patch";
import { PaymentScreen } from "@point_of_sale/app/screens/payment_screen/payment_screen";
import { _t } from "@web/core/l10n/translation";
import { rpc } from "@web/core/network/rpc";

patch(PaymentScreen.prototype, {
    async validateOrder(isForceValidate) {
        const session = this.pos.config.current_session_id;

        // ✅ Only proceed if category discount check is enabled
        if (session?.category_discount) {
            const selectedCategoryId = session?.select_category_id?.id;
            console.log('Selected Category ID:', selectedCategoryId);
            const maxAllowedDiscount = session?.max_discount ?? 0;

            const order = this.pos.get_order();
            let totalCategoryDiscount = 0;

            for (const line of order.get_orderlines()) {
                const product = line.get_product();
                console.log(`Product: ${product.display_name || product.name}`);

                if (product.pos_categ_ids?.length) {
                    product.pos_categ_ids.forEach(cat => {
                        console.log(` - Category ID: ${cat.id}, Name: ${cat.name || 'N/A'}`);

                        if (cat.id === selectedCategoryId) {
                            console.log(` - This product is in the selected category from POS settings!`);

                            const unitPrice = line.get_unit_price();
                            const discount = line.get_discount();
                            const quantity = line.get_quantity();
                            const lineDiscountAmount = (unitPrice * discount / 100) * quantity;
                            totalCategoryDiscount += lineDiscountAmount;
                        } else {
                            console.log(` - This product is NOT in the selected category from POS settings.`);
                        }
                    });
                } else {
                    console.log(` - Product has no categories assigned.`);
                }
            }

            if (totalCategoryDiscount > 0) {
                if (totalCategoryDiscount > maxAllowedDiscount) {
                    await this.notification.add(_t(`Discount for selected category exceeds the allowed limit of ${maxAllowedDiscount}`), {
                        title: "Validation Error",
                        type: "warning"
                    });
                    return;
                }

                await rpc("/pos/check_and_update_category_discount", {
                    session_id: session.id,
                    used_discount: totalCategoryDiscount,
                });
            }
        }

        return super.validateOrder(isForceValidate);
    }
});
