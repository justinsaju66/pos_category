from odoo import http
from odoo.http import request

class POSCategoryDiscountController(http.Controller):

    @http.route('/pos/update_category_discount', type='json', auth='user')
    def update_category_discount(self, session_id, category_id, used_discount):
        session = request.env['pos.session'].browse(session_id)
        if session:
            field_name = f"category_discount_{category_id}_used"
            current = getattr(session, field_name, 0)
            session.write({field_name: current + used_discount})
        return True
