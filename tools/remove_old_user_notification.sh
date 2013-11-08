#!/bin/sh

cd "$MB_ROOT_DIR"
echo "$MB_ROOT_DIR"

node tools/remove_old_user_notification.js >> logs/remove_old_user_notification_`date "+%Y%m%d_%H%M%S"`.log

exit 0
