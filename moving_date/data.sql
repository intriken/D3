


select *
from (SELECT uuid, dd.day_rw
      FROM user_testdw.dim_user u
      join user_testdw.dim_day dd
      where current_ind = 1
      and user_brand_affiliation = 'test'
      and cast(created_date as date) = '2018-10-01'
      and dd.day_rw >= '2018-10-01'
) u
left join (select fgt.user_uuid consumer_id,
        fgt.brand,
        count(distinct fgt.order_id) purchases,
        sum(fgt.nob) nob,
        sum(fgt.nor) nor,
        sum(fgt.gp) gp,
        sum(fgt.ogp) ogp,
        sum(case when fgt.action ='authorize' then fgt.units else 0 end) units,
        sum(fgt.activation) activation,
        sum(fgt.reactivation) reactivation,
        fgt.dt purchase_date,
        fgt.utm_campaign send_id
      from test.transactions fgt
      where fgt.region='na'
        and lower(fgt.transaction_type) ='order'
        and fgt.platform_key = 1
        and fgt.attribution_type = '3.1'
        and lower(fgt.traffic_source)='email'
        and fgt.country_id  in (235,40)
        and fgt.dt >= date_sub(current_date, 3)
        and fgt.transaction_amount <> 0
      group by fgt.user_uuid, fgt.utm_campaign, fgt.dt, fgt.brand
) f on u.uuid = f.consumer_id and u.
