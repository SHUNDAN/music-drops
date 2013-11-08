#!/bin/sh



#cd "$MB_ROOT_DIR"
#echo "$MB_ROOT_DIR"
#cd db
#sqlite3 mockbu.db <<END
#update pop set like_count_speed = CAST(like_count_speed / 1.1 AS INT) where like_count_speed is not null;
#END



# execute.
mysql -umockbu -pmockbu mockbu -e "update pop set like_count_speed = (like_count_speed / 2) where like_count_speed is not null;"
