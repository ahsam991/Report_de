WITH qu_ans AS
  (SELECT *
   FROM CROSSTAB(
    $$
    SELECT
        scsdm.sup_contact_id,
        scsdm.question_id,
        scsdm.answer
    FROM ecrm.supervisor_contacts sc
    JOIN ecrm.supervisor_contact_survey_data_maps scsdm ON sc.id = scsdm.sup_contact_id
    WHERE
        sc.campaign_id = 186
    ORDER BY
        scsdm.sup_contact_id,
        scsdm.question_id
    $$,
    $$
    VALUES  ('1'),
            ('2'),
            ('20'),
            ('3'),
            ('4'),
            ('5'),
            ('6'),
            ('7'),
            ('8'),
            ('9'),
            ('10'),
            ('11'),
            ('12'),
            ('13'),
            ('14'),
            ('15'),
            ('16'),
            ('17'),
            ('18'),
            ('19'),
            ('21'),
            ('22')
    $$)
    AS ct (sup_contact_id INT,
            "1" varchar,
            "2" varchar,
            "20" varchar,
            "3" varchar,
            "4" varchar,
            "5" varchar,
            "6" varchar,
            "7" varchar,
            "8" varchar,
            "9" varchar,
            "10" varchar,
            "11" varchar,
            "12" varchar,
            "13" varchar,
            "14" varchar,
            "15" varchar,
            "16" varchar,
            "17" varchar,
            "18" varchar,
            "19" varchar,
            "21" varchar,
            "22" varchar
            

))
SELECT
       sc.id AS "Contact id",
       sup.username AS "FFSup id",
       sup_i.full_name AS "FFSup Name",
       sc.contact_date AS "Verified Date",
       re.name AS "Region",
       ar.name AS "Area",
       co.name AS "Distribution House",
       ter.name AS "Territory",
       po.name AS "Distributors Point",
       br.username AS "BR id",
       _cats.display_label AS "BR Type",
       br_i.full_name AS "BR Name",
       cm.name AS "Campaign Name",
       q."1" AS "receive_call",
       q."2" AS "continue_conversation",
       q."20" AS "not_want_to_talk",
       q."3" AS "correct_consumer_name",
       q."4" AS "correct_consumer_age",
       q."5" AS "correct_primary_brand",
       q."6" AS "contacted_by_ra",
       q."7" AS "telling_about_luckies",
       q."8" AS "showing_av",
       q."9" AS "showing_pack",
       q."10" AS "asking_about_trial",
       q."11" AS "telling_about_ptr",
       q."12" AS "accepted_ptr_offer",
       q."13" as "asking_about_stick_trial",
       q."14" as "telling_about_ptr_offer",
       q."15" as "telling_about_derby_plus_3",
       q."16" as "telling_about_break_station_comms",
       q."17" as "showing_bs_av",
       q."18" as "telling_about_chorki_offer",
       q."19" as "telling_about_subscription_card",
       q."21" as "telling_about_break_station",
       q."22" as "giving_thanks"
       

FROM qu_ans q,
     ecrm.supervisor_contacts sc,
     ecrm.contacts c ,
     ecrm.locations ou,
     ecrm.locations cl,
     ecrm.locations ro,
     ecrm.locations po,
     ecrm.locations ter,
     ecrm.locations ar,
     ecrm.locations re,
     apsis_data.distributorspoint dp,
     apsis_data.company co,
     ecrm.users sup,
     ecrm.user_infos sup_i,
     ecrm.users br,
     ecrm.user_infos br_i,
     ecrm.campaigns cm,
     settings._cats
WHERE q.sup_contact_id = sc.id
    AND sc.br_id = br.id
    AND c.location_id = ou.id
    AND sc.user_id = sup.id
    AND sup_i.user_id = sup.id
    AND br_i.user_id = br.id
    AND sc.campaign_id = cm.id
    AND ou.parent = cl.id
    AND cl.parent = ro.id
    AND ro.parent = po.id
    AND po.source_id = dp.id
    AND dp.dsid = co.id
    AND po.parent = ter.id
    AND ter.parent = ar.id
    AND ar.parent = re.id
    AND sc.br_id = c.user_id
    AND sc.contact = c.contact_no
    AND sc.contact_date = c.contact_date
    AND sc.campaign_id = c.campaign_id
    AND br_i.employment_type = _cats.id
    AND cm.id = 184
--------DATE FILTER-----------------
 	and sc.contact_date = '2026-02-24'
--  AND sc.contact_date = CURRENT_DATE
--  AND sc.contact_date = CURRENT_DATE-1
--	AND sc.contact_date between '2025-01-21' and  '2025-01-23'
  ;