def _org(client,headers,name):
    response=client.post("/api/v1/organizations/",json={"name":name},headers=headers)
    assert response.status_code==201
    return response.json()["id"]

def _user(client,email):
    response=client.post("/api/v1/auth/register",json={"email":email,"password":"Password123!",
        "full_name":email.split("@")[0]})
    assert response.status_code==201
    return response.json()["id"]

def test_competitor_match_requires_name_and_same_organization(client,auth_headers):
    org1,org2=_org(client,auth_headers,"First"),_org(client,auth_headers,"Second")
    product=client.post("/api/v1/products/",headers=auth_headers,json={"name":"Product","sku":"P-1",
        "organization_id":org1,"cost_price":"10","base_price":"20"}).json()
    competitor=client.post("/api/v1/competitors/",headers=auth_headers,json={
        "name":"Store","organization_id":org2}).json()
    missing=client.post("/api/v1/competitors/match",headers=auth_headers,json={
        "competitor_id":competitor["id"],"product_id":product["id"]})
    assert missing.status_code==422
    cross=client.post("/api/v1/competitors/match",headers=auth_headers,json={
        "competitor_id":competitor["id"],"product_id":product["id"],"name":"Listing"})
    assert cross.status_code==404

def test_sales_organization_and_quantity_validation(client,auth_headers):
    org1,org2=_org(client,auth_headers,"Sales A"),_org(client,auth_headers,"Sales B")
    product=client.post("/api/v1/products/",headers=auth_headers,json={"name":"Sale Product","sku":"SALE-1",
        "organization_id":org1,"cost_price":"10","base_price":"20"}).json()
    mismatch=client.post("/api/v1/sales/",headers=auth_headers,json={
        "organization_id":org2,"product_id":product["id"],"quantity":1})
    assert mismatch.status_code==400
    invalid=client.post("/api/v1/sales/",headers=auth_headers,json={
        "organization_id":org1,"product_id":product["id"],"quantity":-1})
    assert invalid.status_code==422

def test_members_cannot_add_members_or_assign_admin(client,auth_headers,otp_mailbox):
    org=_org(client,auth_headers,"Role Org")
    member_id=_user(client,"role-member@example.com")
    other_id=_user(client,"role-other@example.com")
    added=client.post("/api/v1/organizations/{}/members".format(org),headers=auth_headers,
        json={"user_id":member_id,"role":"member"})
    assert added.status_code==201
    login=client.post("/api/v1/auth/login",json={"email":"role-member@example.com",
        "password":"Password123!"})
    verified=client.post("/api/v1/auth/verify-otp",json={
        "challenge_id":login.json()["challenge_id"],
        "otp":otp_mailbox["role-member@example.com"]})
    member_headers={"Authorization":"Bearer "+verified.json()["access_token"]}
    forbidden=client.post("/api/v1/organizations/{}/members".format(org),headers=member_headers,
        json={"user_id":other_id,"role":"admin"})
    assert forbidden.status_code==403
