import frappe

def reset_pos_profile_perms():
    frappe.set_user('Administrator')

    # Reset custom DocPerm - remove the URY Cashier one we added earlier
    # It might be conflicting with standard permission resolution
    custom_perms = frappe.db.sql("""
        SELECT name FROM `tabCustom DocPerm`
        WHERE parent = 'POS Profile'
    """, as_dict=True)
    print('Custom DocPerms:', custom_perms)

    # Delete all custom perms on POS Profile and let standard perms work
    for p in custom_perms:
        frappe.delete_doc('Custom DocPerm', p.name, ignore_permissions=True)
        print(f'Deleted custom perm: {p.name}')

    frappe.db.commit()

    # Now add proper System Manager write access
    # Standard perms already have Accounts Manager and Accounts User with read
    # Add System Manager explicitly
    new_perm = frappe.get_doc({
        'doctype': 'Custom DocPerm',
        'parent': 'POS Profile',
        'parenttype': 'DocType',
        'parentfield': 'permissions',
        'role': 'System Manager',
        'permlevel': 0,
        'read': 1,
        'write': 1,
        'create': 1,
        'delete': 1,
    })
    new_perm.insert(ignore_permissions=True)

    # URY Cashier - read only
    cashier_perm = frappe.get_doc({
        'doctype': 'Custom DocPerm',
        'parent': 'POS Profile',
        'parenttype': 'DocType',
        'parentfield': 'permissions',
        'role': 'URY Cashier',
        'permlevel': 0,
        'read': 1,
        'write': 0,
        'create': 0,
        'delete': 0,
    })
    cashier_perm.insert(ignore_permissions=True)

    frappe.db.commit()

    # Clear all caches
    frappe.clear_cache()
    print('Permissions reset. Custom perms:')
    result = frappe.db.sql("SELECT role, `read`, `write`, `create` FROM `tabCustom DocPerm` WHERE parent = 'POS Profile'", as_dict=True)
    for r in result:
        print(' ', r)

    # Test access as admin@ury.local
    frappe.set_user('admin@ury.local')
    try:
        result = frappe.get_list('POS Profile', fields=['name'], limit=5)
        print('POS Profile list as admin@ury.local:', result)
    except Exception as e:
        print('Still error:', e)
    finally:
        frappe.set_user('Administrator')
