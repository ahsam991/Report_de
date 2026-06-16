WITH qu_ans AS (
    SELECT *
    FROM CROSSTAB(
        $$
        SELECT
            scsdm.sup_contact_id,
            scsdm.question_id,
            scsdm.answer
        FROM ecrm.supervisor_contacts sc
        JOIN ecrm.supervisor_contact_survey_data_maps scsdm 
            ON sc.id = scsdm.sup_contact_id
        WHERE sc.campaign_id = 183
        ORDER BY scsdm.sup_contact_id, scsdm.question_id
        $$,
        $$
        VALUES ('1'), ('2'), ('3'), ('4'), ('5'), ('6'), 
               ('7'), ('8'), ('9'), ('10'), ('11'), ('12'), 
               ('13'), ('14'), ('20')
        $$
    ) AS ct (
        sup_contact_id INT,
        "1" VARCHAR,
        "2" VARCHAR,
        "3" VARCHAR,
        "4" VARCHAR,
        "5" VARCHAR,
        "6" VARCHAR,
        "7" VARCHAR,
        "8" VARCHAR,
        "9" VARCHAR,
        "10" VARCHAR,
        "11" VARCHAR,
        "12" VARCHAR,
        "13" VARCHAR,
        "14" VARCHAR,
        "20" VARCHAR
    )
)
SELECT
    sc.id AS "Contact id",
    sup.username AS "FFSup id",
    sup_i.full_name AS "FFSup Name",
    sc.contact_date AS "Verified Date",
    re.name AS "Region",
    ar.name AS "Area",
    co.name AS "Distribution House",
    ter.name AS "Territory",
    po_loc.name AS "Distributors Point",
    br.username AS "BR id",
    _cats.display_label AS "BR Type",
    br_i.full_name AS "BR Name",
    cm.name AS "Campaign Name",
    q."1" AS "receive_call",
    q."2" AS "continue_conversation",
    q."3" AS "correct_consumer_name",
    q."4" AS "correct_consumer_age",
    q."5" AS "correct_primary_brand",
    q."6" AS "contacted_by_ra",
    q."7" AS "telling_about_coolcranch_variant",
    q."8" AS "telling_about_luckies_citrus",
    q."9" AS "asking_about_av",
    q."10" AS "asking_about_trial",
    q."11" AS "consumer_trial",
    q."12" AS "asking_about_ptr",
    q."13" AS "received_ptr",
    q."14" AS "telling_about_citrus_availability",
    q."20" AS "not_want_to_talk"
FROM qu_ans q
JOIN ecrm.supervisor_contacts sc ON q.sup_contact_id = sc.id
JOIN ecrm.users sup ON sc.user_id = sup.id
JOIN ecrm.user_infos sup_i ON sup_i.user_id = sup.id
JOIN ecrm.contacts c ON sc.br_id = c.user_id 
    AND sc.contact = c.contact_no 
    AND sc.contact_date = c.contact_date
    AND sc.campaign_id = c.campaign_id
JOIN ecrm.locations ou ON c.location_id = ou.id
JOIN ecrm.locations cl ON ou.parent = cl.id
JOIN ecrm.locations ro ON cl.parent = ro.id
JOIN ecrm.locations po_loc ON ro.parent = po_loc.id
JOIN ecrm.locations ter ON po_loc.parent = ter.id
JOIN ecrm.locations ar ON ter.parent = ar.id
JOIN ecrm.locations re ON ar.parent = re.id
LEFT JOIN apsis_data.distributorspoint dp ON po_loc.source_id = dp.id
LEFT JOIN apsis_data.company co ON dp.dsid = co.id
JOIN ecrm.users br ON sc.br_id = br.id
JOIN ecrm.user_infos br_i ON br_i.user_id = br.id
JOIN settings._cats ON br_i.employment_type = _cats.id
JOIN ecrm.campaigns cm ON sc.campaign_id = cm.id
WHERE cm.id = 183
    AND sc.contact_date = '2026-03-24'  -- Change this to a valid date
--  AND sc.contact_date = CURRENT_DATE
--  AND sc.contact_date = CURRENT_DATE-1
--  AND sc.contact_date BETWEEN '2025-01-21' AND '2025-01-23'
;