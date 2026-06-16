--live observation
WITH qu_ans AS
  (SELECT *
   FROM crosstab($$
       select
	       jcsm.joint_call_id,
	       jcsm.question_id,
		   jcsm.answer
       FROM     ecrm.joint_calls jc
       JOIN     ecrm.joint_calls_survey_data_maps jcsm
       ON       jc.id = jcsm.joint_call_id
       WHERE    jc.campaign_id = 161
       ORDER BY jcsm.joint_call_id, jcsm.question_id
	$$,
    $$
    values  ('1'),
            ('2'),
            ('3'),
            ('4'),
            ('5'),
			('6'),
            ('7'),
            ('8'),
            ('9'),
            ('10'),
            ('11'),
            ('12')
    $$) AS ct (joint_call_id int,
                   "1"varchar,
                   "2" varchar,
                   "3" varchar,
                   "4" varchar,
                   "5" varchar,
                   "6" varchar,
                   "7" varchar,
                   "8" varchar,
                   "9" varchar,
                   "10" varchar,
                   "11" varchar,
                   "12" varchar
))
SELECT
		jc.id "Contact ID",
        re."name" AS "Region",
        ar."name" AS "Area",
        ter."name" AS "Territory",
        po."name" AS "Distributorspoint",
        cm."name" "Campaign Name",
        sup.username "Sup ID",
        sup_i.full_name "Sup Name",
        br.username "BR ID",
        br_i.full_name "BR Name",
        jc.contact_date "Contact Date",
        q."1" "ra_correct_cluster",
        q."2" "ra_correct_attire",
        q."3" "shop_owner_permission",
        q."4" "exists_third_part_app",
        q."5" "choosing_correct_consumer_profile",
        q."6" "telling_about_luckies_citrus",
        q."7" "telling_about_luckies_citrus2",
        q."8" "showing_av",
        q."9" "showing_pack",
        q."10" "asking_about_trial",
        q."11" "telling_about_ptr",
        q."12" "telling_about_luckies_citrus3"
FROM qu_ans q
LEFT JOIN ecrm.joint_calls jc ON q.joint_call_id = jc.id
LEFT JOIN ecrm.locations ou ON jc.location_id = ou.id
LEFT JOIN ecrm.locations cl ON ou.parent = cl.id
LEFT JOIN ecrm.locations ro ON cl.parent = ro.id
LEFT JOIN ecrm.locations po ON ro.parent = po.id
LEFT JOIN ecrm.locations ter ON po.parent = ter.id
LEFT JOIN ecrm.locations ar ON ter.parent = ar.id
LEFT JOIN ecrm.locations re ON ar.parent = re.id
LEFT JOIN ecrm.users br ON jc .ff_id = br.id
LEFT JOIN ecrm.user_infos br_i ON br.id = br_i.user_id
LEFT JOIN ecrm.users sup ON jc.user_id = sup.id
LEFT JOIN ecrm.user_infos sup_i ON sup.id = sup_i.user_id,apsis_data.distributorspoint dp,apsis_data.company co,ecrm.campaigns cm
WHERE
	jc.contact_date = '2023-08-01'
-- 	jc.contact_date = CURRENT_DATE
--  AND jc.contact_date = CURRENT_DATE-1
--	AND jc.contact_date between '2025-01-21' and  '2025-01-23'
    AND po.source_id = dp.id
    AND dp.dsid = co.id
    AND jc.campaign_id = cm.id
    AND jc.campaign_id = 161
GROUP BY
        jc.id,
        re."name",
        ar."name",
        ar.type,
        ter.type,
        po.type,
        ro.type,
        ro.NAME,
        ter."name",
        co."name",
        po."name",
        sup.username,
        sup_i.full_name,
        br.username,
        br_i.full_name,
        jc.contact_date,
        cm."name",
        q."1",
        q."2",
        q."3",
        q."4",
        q."5",
        q."6",
        q."7",
        q."8",
        q."9",
        q."10",
        q."11",
        q."12",
        q."13",
        
;