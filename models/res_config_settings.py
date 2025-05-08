from odoo import models, fields

class ResConfigSettings(models.TransientModel):
    _inherit = 'res.config.settings'

    category_discount = fields.Boolean(
        string='Enable Category Discount',
        config_parameter='pos_category.category_discount',
    )
    select_category_id = fields.Many2one(
        'pos.category',
        string='Selected Category',
        config_parameter='pos_category.select_category_id',
    )
    max_discount = fields.Float(
        string='Max Discount',
        config_parameter='pos_category.max_discount',
    )

    def get_values(self):
        res = super().get_values()
        icp = self.env['ir.config_parameter'].sudo()
        category_id = int(icp.get_param('pos_category.select_category_id', default='0'))
        category = self.env['pos.category'].browse(category_id)
        res.update(
            category_discount=icp.get_param('pos_category.category_discount', default='False') == 'True',
            select_category_id=category if category.exists() else False,
            max_discount=float(icp.get_param('pos_category.max_discount', default='0.0'))
        )
        return res

    def set_values(self):
        res = super().set_values()
        self.env['ir.config_parameter'].sudo().set_param(
            'pos_category.category_discount', str(self.category_discount)
        )
        self.env['ir.config_parameter'].sudo().set_param(
            'pos_category.select_category_id', str(self.select_category_id.id or 0)
        )
        self.env['ir.config_parameter'].sudo().set_param(
            'pos_category.max_discount', str(self.max_discount)
        )
        return res
