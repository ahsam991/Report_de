---daily raw report
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
                c.campaign_id = 189
                --------Date Filter-----------
			 and c.contact_date=current_date -1

                AND csdm.question_id IN (1,2,22,3,4,5,7,57)
            ORDER BY
                c.id, csdm.question_id
            $$,
            $$VALUES
      		('1'),
      		('2'),
      		('22'),
      		('3'),
      		('4'),
      		('5'),
      		('7'),
      		('57')
      		
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
			"1" VARCHAR,
			"2" VARCHAR,
			"22" VARCHAR,
			"3" VARCHAR,
			"4" VARCHAR,
			"5" VARCHAR,
			"57" VARCHAR

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
    age(q.contact_date , q."4"::date)::VARCHAR AS "Consumer Age",
    q."57" AS "Consumer Occupation",
    q.primary_brand AS "Primary Brand",
    q.secondary_brand AS "Secondary Brand",
    pb.sku_name as "Previous Brand",
    CASE
      WHEN q.ptr IS NULL THEN 'None'
        ELSE q.ptr
    END AS "PTR",
    (q.start_time)::VARCHAR AS "Contact Start",
    (q.end_time)::VARCHAR AS "Contact End",
    ((q.end_time - q.start_time)::TIME)::VARCHAR AS "Contact Duration"
FROM
    qu_ans q
    LEFT JOIN ecrm.all_locations_region_to_outlet l ON q.location_id = l.outlet_id
    LEFT JOIN ecrm.sku_items pb ON q."22"::INT = pb.id,

    ecrm.user_infos ui,
    ecrm.users br,
    ecrm.campaigns cam
WHERE
    q.user_id = br.id
    AND ui.user_id = br.id
    AND br.id NOT IN (
        10839, 21878, 21879, 28195, 21880, 21881, 21882, 21883,24135, 24693, 24698, 24701, 25059, 25060, 25061, 25063, 25065, 25412, 25456, 25062, 28195,25064)
    AND q.campaign_id = cam.id
;