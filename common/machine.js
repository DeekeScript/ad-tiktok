let storage = require('common/storage.js');
let machine = {
    db() {
        return Storage;
    },

    clear() {
        this.db().clear();
        System.toast('成功');
    },

    getDate() {
        let d = new Date();
        return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
    },

    getMsg(type) {
        let speechs = storage.getSpeech();
        if (!speechs || speechs.length === 0) {
            return undefined;
        }

        let tmp = [];
        // type 为0 则是评论，为1是私信；只取启用的话术（enabled 不为 false，兼容老数据无 enabled）
        for (let i in speechs) {
            if (speechs[i]['type'] === type && speechs[i]['enabled'] !== false) {
                tmp.push(speechs[i].content);
            }
        }

        if (tmp.length === 0) {
            return undefined;
        }

        let rd = Math.round(Math.random() * (tmp.length - 1));
        return { msg: tmp[rd] };
    },

    douyinExist(account) {
        let res = this.db().getBoolean('douyinExist_' + account);
        if (res) {
            return true;
        }
        return false;
    },

    douyinExistUpdate(account) {
        this.db().putBoolean('douyinExist_' + account, true);
    },

    videoExist(nickname, title) {
        let res = this.db().getBoolean('videoExist_' + nickname + '_' + title);
        if (res) {
            return true;
        }
        this.db().putBoolean('videoExist_' + nickname, true);
        return false;
    },

    //存一个月的内容
    accountFreGt(nickname) {
        let key = 'accountFreGt_' + nickname;
        let result = this.db().get(key);
        let current = Date.parse(new Date()) / 1000;
        if (!result) {
            this.db().put(key, JSON.stringify([current]));
            return { code: 1 };
        }

        let res = JSON.parse(result);//存的时间戳
        if (res.length === 0) {
            this.db().put(key, JSON.stringify([current]));
            return { code: 1 };
        }


        while (res.length && current - res[0] * 1 > 30 * 86400) {
            res.splice(0, 1);
        }

        if (res.length >= 5) {
            return { code: 0 };
        }

        let k = 0;
        for (let i in res) {
            if (current - res[i] * 1 < 86400) {
                k++;
            }
        }

        if (k >= 2) {
            return { code: 0 };
        }
        this.db().put(key, JSON.stringify([current]));
        return { code: 1 };
    },

    getFansSettingRate() {
        return {
            privateRate: this.get('fansSetting_privateRate', "int"),
            focusRate: this.get('fansSetting_focusRate', "int"),
            zanRate: this.get('fansSetting_zanRate', "int"),
            commentRate: this.get('fansSetting_commentRate', "int"),
            fansMinCount: this.get('fansSetting_fansMinCount', "int"),
            fansMaxCount: this.get('fansSetting_fansMaxCount', "int"),
            worksMinCount: this.get('fansSetting_worksMinCount', "int"),
            worksMaxCount: this.get('fansSetting_worksMaxCount', "int"),
            opCount: this.get('fansSetting_opCount', "int"),
            account: this.get('fansSetting_account'),
        }
    },

    getFocusSettingRate() {
        return {
            privateRate: this.get('focusSetting_privateRate', "int"),
            focusRate: this.get('focusSetting_focusRate', "int"),
            zanRate: this.get('focusSetting_zanRate', "int"),
            commentRate: this.get('focusSetting_commentRate', "int"),
            fansMinCount: this.get('focusSetting_fansMinCount', "int"),
            fansMaxCount: this.get('focusSetting_fansMaxCount', "int"),
            worksMinCount: this.get('focusSetting_worksMinCount', "int"),
            worksMaxCount: this.get('focusSetting_worksMaxCount', "int"),
            opCount: this.get('focusSetting_opCount', "int"),
            account: this.get('focusSetting_account'),
        }
    },

    getFansIncSettingRate() {
        return {
            task_dy_fans_inc_accounts: this.get("task_dy_fans_inc_accounts") || '',
            task_dy_fans_inc_head_zan_rate: this.get("task_dy_fans_inc_head_zan_rate", "int") || 0,
            task_dy_fans_inc_video_zan_rate: this.get("task_dy_fans_inc_video_zan_rate", "int") || 0,
            task_dy_fans_inc_comment_rate: this.get("task_dy_fans_inc_comment_rate", "int") || 0,
            task_dy_fans_inc_collection_rate: this.get("task_dy_fans_inc_collection_rate", "int") || 0,
            task_dy_fans_inc_user_page_wait: this.get("task_dy_fans_inc_user_page_wait", "int") || 0,
            task_dy_fans_inc_user_video_wait: this.get("task_dy_fans_inc_user_video_wait", "int") || 0,
            task_dy_fans_inc_comment_zan_count: 5,//5连赞
        }
    },

    getSearchUserSettingRate() {
        return {
            privateRate: this.get('searchUserSetting_privateRate', "int"),
            focusRate: this.get('searchUserSetting_focusRate', "int"),
            zanRate: this.get('searchUserSetting_zanRate', "int"),
            commentRate: this.get('searchUserSetting_commentRate', "int"),
            fansMinCount: this.get('searchUserSetting_fansMinCount', "int"),
            fansMaxCount: this.get('searchUserSetting_fansMaxCount', "int"),
            worksMinCount: this.get('searchUserSetting_worksMinCount', "int"),
            worksMaxCount: this.get('searchUserSetting_worksMaxCount', "int"),
            opCount: this.get('searchUserSetting_opCount', "int"),
            keyword: this.get('searchUserSetting_keyword'),
        }
    },

    //这里返回的字段要一直，只是值不一致
    getTokerData(type) {
        //type 2 轻松拓客， 默认设置参数
        if (type == 2) {
            return {
                toker_view_video_second: this.get('task_dy_qingsong_tuoke_interval', 'int'),
                toker_view_video_keywords: "",
                toker_zan_rate: 70,
                toker_comment_rate: 60,
                toker_focus_rate: 5,
                toker_comment_area_zan_rate: 80,
                toker_run_hour: [
                    '0', '1', '2', '3', '4',
                    '5', '6', '7', '8', '9',
                    '10', '11', '12', '13', '14',
                    '15', '16', '17', '18', '19',
                    '20', '21', '22', '23'
                ],
            }
        }

        if (!type) {
            return {
                toker_view_video_second: this.get('toker_view_video_second', 'int'),
                toker_view_video_keywords: this.get('toker_view_video_keywords'),
                toker_zan_rate: this.get('toker_zan_rate', 'int'),
                toker_comment_rate: this.get('toker_comment_rate', 'int'),
                toker_focus_rate: this.get('toker_focus_rate', 'int'),
                toker_private_msg_rate: this.get('toker_private_msg_rate', 'int'),
                toker_comment_area_zan_rate: this.get('toker_comment_area_zan_rate', 'int'),
                toker_run_hour: this.getArray('toker_run_hour'),
            }
        }

        return {
            toker_view_video_second: this.get('toker_city_view_video_second', 'int'),
            toker_view_video_keywords: this.get('toker_city_view_video_keywords'),
            toker_zan_rate: this.get('toker_city_zan_rate', 'int'),
            toker_comment_rate: this.get('toker_city_comment_rate', 'int'),
            toker_focus_rate: this.get('toker_city_focus_rate', 'int'),
            toker_private_msg_rate: this.get('toker_city_private_msg_rate', 'int'),
            toker_comment_area_zan_rate: this.get('toker_city_comment_area_zan_rate', 'int'),
            toker_run_hour: this.getArray('toker_city_run_hour'),
        }
    },

    //尽量 文件名 + key的模式
    get(key, type) {
        if (type == undefined) {
            type = "string";
        }
        let db = this.db();
        Log.log("key:" + key + ":type:" + type);
        if (type == "string") {
            return db.get(key);
        } else if (type == 'int') {
            return db.getInteger(key);
        } else if (type == 'float') {
            return db.getDouble(key);
        } else if (type == 'object') {
            return db.getObj(key);
        } else if (type == 'bool') {
            return db.getBoolean(key);
        }

        return undefined;
    },

    getArray(key) {
        let db = this.db();
        return db.getArray(key);
    },

    isFloat(num) {
        return num % 1 !== 0;
    },

    //尽量 文件名 + key的模式
    set(key, value) {
        let db = this.db();
        if (typeof value == 'string') {
            db.put(key, value);
        } else if (typeof value == 'boolean') {
            db.putBoolean(key, value);
        } else if (typeof value == 'object') {
            db.putDouble(key, value);
        } else if (typeof value == 'undefined' || value == null) {
            db.putObj(key, value);
        } else if (Number.isInteger(value)) {
            db.putInteger(key, value);
        } else if (this.isFloat(value)) {
            db.putDouble(key, value);
        } else {
            db.putObj(key, value);
        }

        return true;
    }
};

module.exports = machine;
