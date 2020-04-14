select concat_ws('|', flow) flows, count(*) instances
from (select bcookie, collect_list(grt_l2_cat_name) flow
      from (select bcookie, grt_l2_cat_description, row_number() over (partition by bcookie, dt order by session_start_time) session_row
            from test.sessions
            where dt = '2019-02-10'
            and region = 'na'
            and grt_l2_cat_description is not null
      ) a
      where session_row < 7
      group by bcookie
) a
group by flow
order by size(flow) desc
;

select concat_ws('|', flow) flows, count(*) instances
from (select consumer_id, collect_list(grt_l2_cat_description) flow, count(*) how_much
      from (SELECT user_uuid consumer_id, grt_l2_cat_description, row_number() over (partition by user_uuid order by transaction_datetime) purchase_num
            from test.transactions
            where region='na'
              and lower(transaction_type) ='order'
              and platform_key = 1
              and country_id  in (235,40)
              and dt >= '2018-01-01'
              and transaction_amount <> 0
              and attribution_type = '3.1'
              and grt_l2_cat_description is not null
    ) a
    where purchase_num <= 3
    group by consumer_id
) a
where how_much > 1
group by flow
;


drop table test.purchaser_flow purge;
create table test.purchaser_flow
  STORED AS ORC tblproperties ("orc.compress" = "SNAPPY") as
select purchase_num, division, grt_l2_cat_name, grt_l3_cat_name, last_grt_l2_cat_name, last_grt_l3_cat_name, avg(days_between) avg_days_between, count(*) purchases
from (select consumer_id, division, order_datetime, last_order_datetime, (unix_timestamp(order_datetime) - unix_timestamp(last_order_datetime))/60/60/24 days_between, grt_l2_cat_name, last_grt_l2_cat_name, grt_l3_cat_name, last_grt_l3_cat_name, purchase_num
      from (select user_uuid consumer_id,
              order_datetime,
              division,
              grt_l2_cat_name,
              grt_l3_cat_name,
              lag(order_datetime) over (partition by user_uuid order by order_datetime) last_order_datetime,
              lag(grt_l2_cat_name) over (partition by user_uuid order by order_datetime) last_grt_l2_cat_name,
              lag(grt_l3_cat_name) over (partition by user_uuid order by order_datetime) last_grt_l3_cat_name,
              row_number() over (partition by user_uuid order by order_datetime) purchase_num
            from (select user_uuid, order_id, max(coalesce(deal_division_permalink, click_page_division, 'unknown')) division, max(grt_l2_cat_name) grt_l2_cat_name, max(grt_l3_cat_name) grt_l3_cat_name, min(order_datetime) order_datetime
            from test.transactions
            where region='na'
              and dt >= '2018-01-01'
              and attribution_type = '3.1'
              and lower(transaction_type) ='order'
              and platform_key = 1
              and country_id  in (235,40)
              and transaction_amount <> 0
              and grt_l2_cat_name is not null
              and grt_l3_cat_name is not null
              and action = 'authorize'
              and user_uuid is not null
              -- and user_uuid = '5e584250-eb46-11e7-b61b-5254198b31e0'
              group by user_uuid, order_id
            ) f
      ) f
) f
group by division, purchase_num, grt_l2_cat_name, last_grt_l2_cat_name, grt_l3_cat_name, last_grt_l3_cat_name
sort by purchase_num, purchases desc;
