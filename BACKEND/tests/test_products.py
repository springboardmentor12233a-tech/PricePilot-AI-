def test_organization_and_product_flow(client, auth_headers):
    """Test creating an organization, category, product, variant, and inventory update."""
    # 1. Create Organization
    org_resp = client.post(
        "/api/v1/organizations/",
        json={"name": "Acme Retailers", "description": "Retail Store"},
        headers=auth_headers,
    )
    assert org_resp.status_code == 201
    org = org_resp.json()
    org_id = org["id"]
    assert org["name"] == "Acme Retailers"
    assert org["slug"] == "acme-retailers"

    # 2. Create Category
    cat_resp = client.post(
        "/api/v1/categories/",
        json={"name": "Electronics", "organization_id": org_id},
        headers=auth_headers,
    )
    assert cat_resp.status_code == 201
    category = cat_resp.json()
    category_id = category["id"]
    assert category["name"] == "Electronics"

    # 3. Create Product
    prod_resp = client.post(
        "/api/v1/products/",
        json={
            "name": "Wireless Noise Canceling Headphones",
            "sku": "HEADPHONE-001",
            "organization_id": org_id,
            "category_id": category_id,
            "brand": "AudioTech",
            "cost_price": "100.00",
            "base_price": "150.00",
            "currency": "INR",
        },
        headers=auth_headers,
    )
    assert prod_resp.status_code == 201
    product = prod_resp.json()
    product_id = product["id"]
    assert product["name"] == "Wireless Noise Canceling Headphones"
    assert product["sku"] == "HEADPHONE-001"

    # 4. Fetch Products List
    list_resp = client.get(f"/api/v1/products/organization/{org_id}", headers=auth_headers)
    assert list_resp.status_code == 200
    assert len(list_resp.json()) == 1

    # 5. Create Variant
    variant_resp = client.post(
        f"/api/v1/products/{product_id}/variants",
        json={
            "name": "Matte Black",
            "sku": "HEADPHONE-001-BLK",
            "attributes": {"color": "black"},
            "cost_price": "100.00",
            "price": "160.00",
        },
        headers=auth_headers,
    )
    assert variant_resp.status_code == 201
    variant = variant_resp.json()
    assert variant["name"] == "Matte Black"

    # 6. Update Base Inventory
    inv_resp = client.put(
        f"/api/v1/products/{product_id}/inventory",
        json={"quantity_on_hand": 50, "reorder_level": 10},
        headers=auth_headers,
    )
    assert inv_resp.status_code == 200
    inv = inv_resp.json()
    assert inv["quantity_on_hand"] == 50
    assert inv["available_quantity"] == 50
    assert inv["is_low_stock"] is False
