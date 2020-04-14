
create table test.vlb_sankey_consumers
  STORED AS ORC tblproperties ("orc.compress" = "SNAPPY","auto.purge"="true") as
SELECT uuid consumer_id
FROM user_testdw.dim_user
where current_ind = 1
  and user_brand_affiliation = 'test'
  and substr(user_src_created_date,0, 10) = '2018-10-01';




create table test.vlb_sankey_sessions
  STORED AS ORC tblproperties ("orc.compress" = "SNAPPY","auto.purge"="true") as
select traffic_source, server_sub_platform, dt session_date, avg(average_session_length) average_session_length, count(*) instances
from test.sessions s
join test.vlb_sankey_consumers u on s.user_uuid = u.consumer_id
where region = 'na'
and brand = 'test'
and dt between '2018-10-01' and '2018-10-30'
group by  traffic_source, server_sub_platform,  dt;


select server_sub_platform, traffic_source, sum(INSTANCEs) from test.vlb_sankey_sessions group by server_sub_platform, traffic_source;

drop table test.vlb_sankey_dvs;
create table test.vlb_sankey_dvs
  STORED AS ORC tblproperties ("orc.compress" = "SNAPPY","auto.purge"="true") as
select event_date, traffic_source, grt_l2_cat_description, sum(instances) instances, sum(cpv) cpv, sum(bbc) bbc
from (select event_date, cookie_first_traf_source traffic_source, deal_uuid, count(deal_uuid) instances, count(case when confirm_page_views <> 0 then deal_uuid end) cpv, count(case when buy_button_clicks <> 0 then deal_uuid end) bbc
      from user_testdw.traffic sf
      join test.vlb_sankey_consumers u on lower(sf.cookie_last_user_uuid) = u.consumer_id
      where event_date between '2018-10-01' and '2018-10-30'
      group by event_date, cookie_first_traf_source, deal_uuid
) sf
join user_edwprod.dim_gbl_deal_lob dl on sf.deal_uuid = dl.deal_id
group by event_date, traffic_source, grt_l2_cat_description;

select traffic_source, grt_l2_cat_description, sum(cpv) cpvs, sum(INSTANCEs) from test.vlb_sankey_dvs group by traffic_source, grt_l2_cat_description;



create table test.vlb_sankey_orders
  STORED AS ORC tblproperties ("orc.compress" = "SNAPPY","auto.purge"="true") as
select grt_l2_cat_description, order_date, count(distinct fgt.order_id) purchases
from test.transactions fgt
join test.vlb_sankey_consumers u on user_uuid = u.consumer_id
where fgt.region='na'
and lower(fgt.transaction_type) ='order'
and fgt.platform_key = 1
and fgt.attribution_type = '3.1'
and lower(fgt.traffic_source)='email'
and fgt.country_id in (235,40)
and fgt.dt between '2018-10-01' and '2018-10-30'
and fgt.brand = 'test'
group by order_date, grt_l2_cat_description;
