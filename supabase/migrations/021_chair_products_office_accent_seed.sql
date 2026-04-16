-- Urban Ladder office accent chairs (from Office Furnitures line). Idempotent re-seed by product_url.

DELETE FROM chair_products WHERE product_url = ANY(ARRAY[
$d$https://www.urbanladder.com/product/portia-fabric-accent-chair-in-calico-peony-white-colour-7520519$d$,
$d$https://www.urbanladder.com/product/doris-fabric-accent-chair-in-dark-grey-colour-7520498$d$
]);

INSERT INTO chair_products (
  category, name, brand, colour, warranty_in_months, country_of_origin,
  length, width, height, net_weight, description,
  generic_name, primary_material_type, primary_material_subtype, primary_room, seating_capacity, product_model_name,
  price, images_url, product_url
) VALUES
($d$Collection / Office Furnitures$d$, $d$Portia Fabric Accent Chair in Calico Peony White Colour$d$, $d$Urban Ladder$d$, $d$Calico Peony White$d$, 12, NULL, $d$68$d$, $d$65$d$, $d$70$d$, $d$20.00 kg$d$, $d$Buy Portia Fabric Accent Chair in Calico Peony White Colour & Get upto 70% off by Urban Ladder with 0% EMI, Free Delivery, Free Installation, shop at over 50+ Stores Nationwide.$d$, $d$Accent chair$d$, $d$Fabric$d$, NULL, NULL, NULL, NULL, 12999, $d$https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/100x0/yZedF_hiBl-1.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/100x0/NluN-fDkgJ-2.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/yZedF_hiBl-1.jpg$d$, $d$https://www.urbanladder.com/product/portia-fabric-accent-chair-in-calico-peony-white-colour-7520519$d$),
($d$Collection / Office Furnitures$d$, $d$Doris Fabric Accent Chair in Dark Grey Colour$d$, $d$Urban Ladder$d$, $d$Dark Grey$d$, 12, NULL, $d$46$d$, $d$46$d$, $d$87$d$, $d$8.00 kg$d$, $d$Buy Doris Fabric Accent Chair in Dark Grey Colour & Get upto 70% off by Urban Ladder with 0% EMI, Free Delivery, Free Installation, shop at over 50+ Stores Nationwide.$d$, $d$Accent chair$d$, $d$Fabric$d$, NULL, NULL, NULL, NULL, 7999, $d$https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/100x0/G0wjJGTNUok-1.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/100x0/9uDt81PTki8-2.jpg | https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/G0wjJGTNUok-1.jpg$d$, $d$https://www.urbanladder.com/product/doris-fabric-accent-chair-in-dark-grey-colour-7520498$d$);
