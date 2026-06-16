WITH qu_ans AS (
    SELECT *
    FROM CROSSTAB(
        $$
        SELECT
            c.id AS contact_id,
            c.contact_date,
            c.location_id,
            c.campaign_id,
            c.contact_no,
            c.user_id,
            c.otp,
            c."start",
            c."end",
            si.sku_name  AS primary_brand,
            spms.sku_name AS secondary_brand,
            mt."name"  AS ptr,
            csdm.question_id,
            csdm.answer
        FROM ecrm.contacts c
        JOIN ecrm.contact_survey_data_maps csdm
            ON c.id = csdm.contact_id
        LEFT JOIN ecrm.materials mt
            ON mt.id = c.giveable
            AND mt.is_deleted IS FALSE
        LEFT JOIN ecrm.sku_items si
            ON si.id = c.product
        LEFT JOIN ecrm.sku_items spms
            ON spms.id = c.secondary_brand
        WHERE
            c.campaign_id = 186
            AND csdm.question_id IN (
                1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12, 13, 14,
                15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25,
                26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36,
                37, 38, 40, 41, 42, 43, 44, 45, 57
            )
        ORDER BY c.id, csdm.question_id
        $$,
        $$
        VALUES
            ('1'),('2'),('3'),('4'),('5'),('7'),
            ('8'),('9'),('10'),('11'),('12'),('13'),('14'),
            ('15'),('16'),('17'),('18'),('19'),('20'),('21'),
            ('22'),('23'),('24'),('25'),('26'),('27'),('28'),
            ('29'),('30'),('31'),('32'),('33'),('34'),('35'),
            ('36'),('37'),('38'),('40'),('41'),('42'),('43'),
            ('44'),('45'),('57')
        $$
    ) AS ct (
        contact_id      INT,
        contact_date    DATE,
        location_id     INT,
        campaign_id     INT,
        contact_no      BIGINT,
        user_id         INT,
        otp             VARCHAR,
        start_time      TIME,
        end_time        TIME,
        primary_brand   VARCHAR,
        secondary_brand VARCHAR,
        ptr             VARCHAR,

        "1"  VARCHAR, "2"  VARCHAR, "3"  VARCHAR, "4"  VARCHAR,
        "5"  VARCHAR, "7"  VARCHAR, "8"  VARCHAR, "9"  VARCHAR,
        "10" VARCHAR, "11" VARCHAR, "12" VARCHAR, "13" VARCHAR,
        "14" VARCHAR, "15" VARCHAR, "16" VARCHAR, "17" VARCHAR,
        "18" VARCHAR, "19" VARCHAR, "20" VARCHAR, "21" VARCHAR,
        "22" VARCHAR, "23" VARCHAR, "24" VARCHAR, "25" VARCHAR,
        "26" VARCHAR, "27" VARCHAR, "28" VARCHAR, "29" VARCHAR,
        "30" VARCHAR, "31" VARCHAR, "32" VARCHAR, "33" VARCHAR,
        "34" VARCHAR, "35" VARCHAR, "36" VARCHAR, "37" VARCHAR,
        "38" VARCHAR, "40" VARCHAR, "41" VARCHAR, "42" VARCHAR,
        "43" VARCHAR, "44" VARCHAR, "45" VARCHAR, "57" VARCHAR
    )
)

SELECT
	q.contact_id AS "Contact ID",
	l.region AS "Region",
	l.area AS "Area",
	l.territory AS "Territory",
	l.point AS "Distributorspoint",
	l.route AS "Routes",
	l.cluster AS "Cluster Name",
	l.outlet AS "Outlet Name",
	br.username AS "User Name",
	ui.full_name AS "BR Name",
	br.uid AS "BR Code",

    CASE
        WHEN l.region IN ('Dhaka South', 'Sylhet')
            THEN 'Asiatic Trade Marketing Services Limited'
        WHEN l.region IN ('Khulna', 'Barishal', 'Rajshahi')
            THEN 'Integrated Marketing Service Ltd.'
        ELSE 'IMSL' END AS "Agency",

	cam.name AS "Campaign Name",
	q.contact_date AS "Contact Date",
	q.contact_no AS "Consumer Number",
	COALESCE(q."5", q."15", q."25") AS "Consumer Name",
    CASE
        WHEN q."4" ~ '^\d{4}-\d{2}-\d{2}$'
        THEN age(q.contact_date, q."4"::date)::varchar
        ELSE NULL
	END AS "Consumer Age",
	COALESCE(q."7", q."16", q."26") AS "Consumer Address",
	q."57" AS "Consumer Occupation",
	q.primary_brand AS "Primary Brand",
	q.secondary_brand AS "Secondary Brand",
	pb.sku_name AS "Previous Brand",
	COALESCE(q.ptr, 'None') AS "PTR",
	q.start_time :: varchar AS "Contact Start",
	q.end_time :: varchar AS "Contact End",
	((q.end_time - q.start_time) :: time) :: varchar AS "Contact Duration",

	COALESCE(q."10", q."19", q."29") AS "Lifestyle And Product AV",
	COALESCE(q."40", q."42", q."44") AS "AV Likeability",
	COALESCE(q."11", q."20", q."30") AS "Asking About Trial",
	COALESCE(q."12", q."21", q."31") AS "Giveable",
	COALESCE(q."41", q."43", q."45") AS "Product Likeability",
	COALESCE(q."13", q."23", q."32") AS "BS AV",
	COALESCE(q."14", q."24", q."38") AS "Option Selection",

	q."33" AS "Pack Or Stick PTR Receiver",
	q."34" AS "Puzzle Game",
	q."35" AS "Reward Distribution",
	q."36" AS "Chorki Serial",
	q."37" AS "Lookup"

FROM qu_ans q

LEFT JOIN ecrm.all_locations_region_to_outlet l
    ON q.location_id = l.outlet_id

LEFT JOIN ecrm.sku_items pb
    ON q."22" ~ '^[0-9]+$'
    AND q."22"::INT = pb.id

LEFT  JOIN ecrm.users br
    ON q.user_id = br.id

LEFT  JOIN ecrm.user_infos ui
    ON ui.user_id = br.id

LEFT  JOIN ecrm.campaigns cam
    ON q.campaign_id = cam.id

WHERE br.id NOT IN (
    10839, 21878, 21879, 28195,
    21880, 21881, 21882, 21883,
    24135, 24693, 24698, 24701,
    25059, 25060, 25061, 25063,
    25065, 25412, 25456, 25064,
    25062
)

LIMIT 100;
-----------==========================================================================================================




--==================================================================================================================

WITH qu_ans AS (
    SELECT *
    FROM CROSSTAB(
        $$
        SELECT
            c.id AS contact_id,
            c.contact_date,
            c.location_id,
            c.campaign_id,
            c.contact_no,
            c.user_id,
            c.otp,
            c."start",
            c."end",
            si.sku_name AS primary_brand,
            spms.sku_name AS secondary_brand,
            mt."name" AS ptr,
            csdm.question_id,
            csdm.answer
        FROM ecrm.contacts c
        JOIN ecrm.contact_survey_data_maps csdm ON c.id = csdm.contact_id
        LEFT JOIN ecrm.materials mt ON mt.id = c.giveable AND mt.is_deleted IS FALSE
        LEFT JOIN ecrm.sku_items si ON si.id = c.product
        LEFT JOIN ecrm.sku_items spms ON spms.id = c.secondary_brand
        WHERE c.campaign_id = 186  -- Keep as 161 for daily raw report
            AND c.contact_date = '2026-04-05'  -- Keep date filter
            AND csdm.question_id IN (1,2,3,4,5,7,8,9,10,11,12,13,14,15,16,17,22,57)
        ORDER BY c.id, csdm.question_id
        $$,
        $$VALUES ('1'),('2'),('3'),('4'),('5'),('7'),('8'),('9'),('10'),
                 ('11'),('12'),('13'),('14'),('15'),('16'),('17'),('22'),('57')$$
    ) AS ct (
        contact_id INT, contact_date DATE, location_id INT, campaign_id INT,
        contact_no BIGINT, user_id INT, otp VARCHAR, start_time TIME, end_time TIME,
        primary_brand VARCHAR, secondary_brand VARCHAR, ptr VARCHAR,
        "1" VARCHAR, "2" VARCHAR, "3" VARCHAR, "4" VARCHAR, "5" VARCHAR,
        "7" VARCHAR, "8" VARCHAR, "9" VARCHAR, "10" VARCHAR, "11" VARCHAR,
        "12" VARCHAR, "13" VARCHAR, "14" VARCHAR, "15" VARCHAR, "16" VARCHAR,
        "17" VARCHAR, "22" VARCHAR, "57" VARCHAR
    )
)
SELECT
    q.contact_id AS "Contact ID",
    l.region AS "Region",
    l.area AS "Area",
    l.territory AS "Territory",
    l.point AS "Distributorspoint",
    l.route AS "Routes",
    l.cluster AS "Cluster Name",
    l.outlet AS "Outlet Name",
    br.username AS "User Name",
    ui.full_name AS "BR Name",
    br.uid AS "BR Code",
    CASE
        WHEN l.region IN ('Dhaka South', 'Sylhet') THEN 'Asiatic Trade Marketing Services Limited'
        WHEN l.region IN ('Khulna', 'Barishal', 'Rajshahi') THEN 'Integrated Marketing Service Ltd.'
        ELSE 'IMSL'
    END AS "Agency",
    cam.name AS "Campaign Name",
    q.contact_date AS "Contact Date",
    q.contact_no AS "Consumer Number",
    COALESCE(q."5", q."15") AS "Consumer Name",  -- Fixed: Only Q5 and Q15 exist in 161
    CASE
        WHEN q."4" ~ '^\d{4}-\d{2}-\d{2}$' THEN age(q.contact_date, q."4"::date)::varchar
        ELSE NULL
    END AS "Consumer Age",
    COALESCE(q."7", q."16") AS "Consumer Address",  -- Fixed: Only Q7 and Q16 exist
    q."57" AS "Consumer Occupation",
    q.primary_brand AS "Primary Brand",
    q.secondary_brand AS "Secondary Brand",
    pb.sku_name AS "Previous Brand",
    COALESCE(q.ptr, 'None') AS "PTR",
    q.start_time::varchar AS "Contact Start",
    q.end_time::varchar AS "Contact End",
    ((q.end_time - q.start_time)::time)::varchar AS "Contact Duration",
    q."10" AS "Lifestyle And Product AV",  -- Only one journey in 161
    q."11" AS "Asking About Trial",
    q."12" AS "Giveable",
    q."13" AS "BS AV"
FROM qu_ans q
LEFT JOIN ecrm.all_locations_region_to_outlet l ON q.location_id = l.outlet_id
LEFT JOIN ecrm.sku_items pb ON q."22" ~ '^[0-9]+$' AND q."22"::INT = pb.id  -- Fixed: Safe cast
LEFT JOIN ecrm.users br ON q.user_id = br.id  -- Fixed: Proper JOIN
LEFT JOIN ecrm.user_infos ui ON ui.user_id = br.id  -- Fixed: Proper JOIN
LEFT JOIN ecrm.campaigns cam ON q.campaign_id = cam.id  -- Fixed: Proper JOIN
WHERE br.id NOT IN (10839, 21878, 21879, 28195, 21880, 21881, 21882, 21883, 24135, 24693, 24698, 24701, 25059, 25060, 25061, 25063, 25065, 25412, 25456, 25064, 25062)
ORDER BY q.contact_id
LIMIT 100;jm