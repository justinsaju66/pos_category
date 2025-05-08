from odoo import models, fields, api

class PosSession(models.Model):
    _inherit = 'pos.session'

    category_discount = fields.Boolean(
        string="Session Discount Limit", compute="_compute_discount_limit", store=True)
    select_category_id = fields.Many2one(
        'pos.category',
        string='Selected Category',
        help='Category selected for POS operations'
    )
    max_discount = fields.Float(
        string='Max Discount',
        help='Maximum discount allowed for products in the selected category'
    )

    @api.depends('config_id')
    def _compute_discount_limit(self):
        param = self.env['ir.config_parameter'].sudo()
        enabled = param.get_param('pos_category.category_discount', 'False') == 'True'
        select_id = int(param.get_param('pos_category.select_category_id', '0'))
        amount = float(param.get_param('pos_category.max_discount', '0'))

        for session in self:
            session.category_discount = enabled
            session.select_category_id = self.env['pos.category'].browse(select_id) if select_id else False
            session.max_discount = amount if enabled else 0.0

    @api.model
    def _load_pos_data_fields(self, config_id):
        params = super()._load_pos_data_fields(config_id)
        params += ['category_discount', 'select_category_id', 'max_discount']
        return params
