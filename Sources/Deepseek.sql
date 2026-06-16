---daily raw report : [CAMPAIGN_NAME] | Date: :custom_date
WITH qu_ans AS (
    SELECT
        *
    FROM
        CROSSTAB(
            $$
            SELECT
                c.id contact_id,
                c.contact_date,
                c.location_id,
                c.campaign_id,
                c.contact_no,
                c.user_id,
                c.otp,
                c."start",
                c."end",
                si.sku_name,
                spms.sku_name,
                mt."name" AS ptr,
                csdm.question_id,
                csdm.answer
            FROM
                ecrm.contacts c
                JOIN ecrm.contact_survey_data_maps csdm ON c.id = csdm.contact_id
                LEFT JOIN ecrm.materials mt ON mt.id = c.giveable AND mt.is_deleted IS FALSE
                LEFT JOIN ecrm.sku_items si ON si.id = c.product
                LEFT JOIN ecrm.sku_items spms ON spms.id = c.secondary_brand
            WHERE
                c.campaign_id = :campaign_id
                --------Date Filter-----------
                AND c.contact_date = :custom_date
--              AND c.contact_date = current_date - 1
--              AND c.contact_date = current_date
--              AND c.contact_date BETWEEN '2025-01-21' AND '2025-01-23'
                AND csdm.question_id IN (1,2,22,3,4,5,7,57,8,9,10,11,12,13,14,15,16,17)
            ORDER BY
                c.id, csdm.question_id
            $$,
            $$VALUES
                ('1'), ('2'), ('22'), ('3'), ('4'), ('5'), ('7'), ('57'),
                ('8'), ('9'), ('10'), ('11'), ('12'), ('13'), ('14'),
                ('15'), ('16'), ('17')
            $$
        ) AS ct (
            contact_id INT,
            contact_date DATE,
            location_id INT,
            campaign_id INT,
            contact_no INT,
            user_id INT,
            otp VARCHAR,
            start_time TIME,
            end_time TIME,
            primary_brand VARCHAR,
            secondary_brand VARCHAR,
            ptr VARCHAR,
            "1" VARCHAR, "2" VARCHAR, "22" VARCHAR, "3" VARCHAR,
            "4" VARCHAR, "5" VARCHAR, "7" VARCHAR, "57" VARCHAR,
            "8" VARCHAR, "9" VARCHAR, "10" VARCHAR, "11" VARCHAR,
            "12" VARCHAR, "13" VARCHAR, "14" VARCHAR, "15" VARCHAR,
            "16" VARCHAR, "17" VARCHAR
        )
)

SELECT
    q.contact_id AS "Contact ID",
    l."region" AS "Region",
    l."area" AS "Area",
    l."territory" AS "Territory",
    l."point" AS "Distributorspoint",
    l."route" AS "Routes",
    l."cluster" AS "Cluster Name",
    l."outlet" AS "Outlet Name",
    br.username AS "User Name",
    ui.full_name AS "BR name",
    br.uid AS "BR code",
   
   CASE
        WHEN l."region" IN ('Dhaka South', 'Sylhet') THEN 'Asiatic Trade Marketing Services Limited'
        WHEN l."region" IN ('Khulna', 'Barishal', 'Rajshahi') THEN 'Integrated Marketing Service Ltd.'
        ELSE 'IMSL'
    END AS "Agency",
   
   cam."name" AS "Campaign Name",
    q.contact_date AS "Contact Date",
    q.contact_no AS "Consumer Number",
    COALESCE(q."5") AS "Consumers Name",
    age(q.contact_date, q."4"::DATE)::VARCHAR AS "Consumer Age",
    COALESCE(q."7") AS "Consumer Address",
    q."57" AS "Consumer Occupation",
    q.primary_brand AS "Primary Brand",
    q.secondary_brand AS "Secondary Brand",
    pb.sku_name AS "Previous Brand",
    COALESCE(q.ptr, 'None') AS "PTR",
    (q.start_time)::VARCHAR AS "Contact Start",
    (q.end_time)::VARCHAR AS "Contact End",
    ((q.end_time - q.start_time)::TIME)::VARCHAR AS "Contact Duration",
    COALESCE(q."10") AS "lifestyle_and_product_av",
    COALESCE(q."11") AS "asking_about_av_likeability",
    COALESCE(q."12") AS "asking_about_pack_likeability",
    COALESCE(q."13") AS "asking_about_trial",
    COALESCE(q."15") AS "asking_about_ptr_likeability",
    COALESCE(q."16") AS "asking_about_product_likeability",
    cl.cluster_type AS "Cluster Type"
FROM
    qu_ans q
    LEFT JOIN ecrm.all_locations_region_to_outlet l ON q.location_id = l.outlet_id
    LEFT JOIN ecrm.sku_items pb ON q."22"::INT = pb.id
    LEFT JOIN ecrm.user_infos ui ON ui.user_id = br.id
    CROSS JOIN ecrm.users br
    CROSS JOIN ecrm.campaigns cam
    LEFT JOIN ecrm_tmp.luckies_cluster_id_list_161 cl ON cl.cluster_name = l.cluster AND cl.route = l.route
WHERE
    q.user_id = br.id
    AND br.id NOT IN (10839, 21878, 21879, 28195, 21880, 21881, 21882, 21883, 24135, 24693, 24698, 24701, 25059, 25060, 25061, 25063, 25065, 25412, 25456, 25064, 25062, 28195)
    AND q.campaign_id = cam.id
;