# -*- coding: utf-8 -*-


{
    'name': "Pos Discount",
    'version': '1.0',
    'depends': ['base','point_of_sale'],
    'author': "Author Name",
    'category': 'all',
    'sequence':3,
    'description': """
    Description text
    """,
    # data files always loaded at installation
    'data': [
           'views/res_config_settings_views.xml',
           'views/pos_session_views.xml',
    ],
    "assets": {
        'point_of_sale._assets_pos': [
            'pos_category/static/src/js/category_discount.js',
        ],
    },

    'application': True,
    'installable': True,
    'auto_install': False,
    'license': 'LGPL-3',
}
