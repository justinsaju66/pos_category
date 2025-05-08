from odoo import models, api

class PosConfig(models.Model):
    _inherit = 'pos.config'

    @api.model
    def _load_pos_data_fields(self, config_id):
        fields = super()._load_pos_data_fields(config_id)
        fields.append('select_category_id')
        return fields
