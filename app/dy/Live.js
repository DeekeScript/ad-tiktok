let Common = require('app/dy/Common.js');
let statistics = require('common/statistics');
let T = require('app/dy/T.js');

let Live = {
    /**
     * 获取在线观众数量控件
     * 
     * @returns {UiObject}
     */
    getUserCountTag() {
        return UiSelector().descContains(T('次观看')).filter(v => {
            return v.bounds().centerX() > Device.width() / 2 && v.bounds().bottom < Device.height() / 5;
        }).isVisibleToUser(true).findOne();
    },

    /**
     * 打开在线观众列表
     * @returns {boolean}
     */
    openUserList() {
        let tag = this.getUserCountTag();
        let res = Common.click(tag, 0.1);
        Common.sleep(7000);
        return res;
    },

    /**
     * 获取在线观众列表  【这里面比较坑，内容拿不到了，只能点击后获取列表内容】
     * 第一个View是用户登录信息，在列表最底部，需要单独处理
     * @returns {UiObject[]}
     */
    getUserTags() {
        System.setAccessibilityMode('!fast');
        let tags = UiSelector().className('android.view.ViewGroup').filter(v => {
            return v.bounds().left <= 5 && v.bounds().width() > Device.width() - 10 && v.bounds().height() > Device.height() / 20 && v.bounds().height() < Device.height() / 8;
        }).isVisibleToUser(true).find();
        System.setAccessibilityMode('fast');
        return tags;
    },

    /**
     * 获取用户列表控件
     * @returns {Object[]}
     */
    getUsers() {
        let tags = this.getUserTags();
        if (tags.length === 0) {
            System.sleep(2000);
            tags = this.getUserTags();
        }
        Log.log("粉丝列表：" + tags.length);
        return tags;
    },

    /**
     * 获取用户昵称
     * @param tag
     * @returns {string}
     */
    getNickname() {
        let userTag = UiSelector().className('android.widget.Button').isVisibleToUser(true).filter(v => {
            return v.desc() && v.bounds().height() < Device.height() / 10;
        }).findOne() || UiSelector().className('android.widget.Button').isVisibleToUser(true).filter(v => {
            return v.text() && v.bounds().height() < Device.height() / 10;
        }).findOne();
        return userTag ? (userTag.desc() || userTag.text() || '') : '';
    },

    /**
     * 进入粉丝页面
     * @returns {boolean}
     */
    intoFansPage() {
        let parent = UiSelector().className('android.widget.ScrollView').isVisibleToUser(true).findOne();
        let nicknameTag = parent.children().findOne(UiSelector().className('android.widget.TextView').isVisibleToUser(true));
        let container = UiSelector().className('android.view.View').descMatches(/[\s\S]+/).isVisibleToUser(true).findOne();

        let x = container.bounds().left + (nicknameTag.bounds().left - container.bounds().left) * (0.4 + 0.3 * Math.random());
        let y = container.bounds().top + container.bounds().height() / 2 * (0.2 + 0.6 * Math.random());
        let res = Gesture.click(x, y);
        statistics.viewUser();
        Log.log('点击弹窗');
        Common.sleep(3000 + 1000 * Math.random());
        return res;
    },

    /**
     * 滑动粉丝列表
     * @returns {boolean}
     */
    swipeFansList() {
        let container = UiSelector().className('android.widget.LinearLayout').filter(v => {
            return v.bounds().height() > Device.height() / 3 && v.bounds().left <= 5 && v.bounds().width() > Device.width() - 10;
        }).findOne();
        if (!container) {
            return Common.swipe(0, 1, 5);
        }

        let left = container.bounds().left + container.bounds().width() * (0.2 + Math.random() * 0.6);
        let bottom = container.bounds().top + container.bounds().height() * (0.6 + 0.1 * Math.random());
        let top = container.bounds().top + container.bounds().height() * (0.1 + 0.1 * Math.random());
        return Gesture.swipe(left, bottom, left, top, 250 + 100 * Math.random());
    },

    /**
     * 循环点击
     * @param {number} times 
     * @returns {boolean}
     */
    loopClick(times) {
        try {
            let left = Device.width() * (0.35 + 0.3 * Math.random());
            let top = Device.height() / 3 + Device.height() / 4 * Math.random();
            for (let i = 0; i < times; i++) {
                console.log('click like button');
                Gesture.press(left, top + i, 50 + 50 * Math.random());
                System.sleep(200);
            }
        } catch (e) {
            Log.log(e);
        }

        if (!this.getUserCountTag()) {
            return false;
        }
        return true;
    },

    /**
     * 直播间评论带表情
     * @param {string} msg 
     * @param {boolean} withEmoji 
     */
    comment(msg, withEmoji) {
        let iptTag = UiSelector().className('android.widget.EditText').clickable(true).isVisibleToUser(true).findOnce();
        if (iptTag) {
            Common.click(iptTag, 0.2);
            Common.sleep(2000);
        }

        iptTag = UiSelector().className('android.widget.EditText').filter(v => {
            return v.isEditable();
        }).isVisibleToUser(true).findOnce();

        iptTag.setText(msg);
        Common.sleep(1000 + 1000 * Math.random());

        //是否带表情
        if (withEmoji) {
            let emojiTag = UiSelector().className('android.widget.ImageView').clickable(true).filter(v => {
                return v.bounds().left > iptTag.bounds().right + v.bounds().width() / 2 &&  //排除第一个收藏表情按钮
                    v.bounds().centerY() > iptTag.bounds().top &&
                    v.bounds().centerY() < iptTag.bounds().bottom &&
                    v.bounds().right < Device.width() - 10; //排除发送按钮
            }).findOne();

            if (emojiTag) {
                Common.click(emojiTag, 0.2);
                Common.sleep(1000 + 500 * Math.random());
                let emjs = UiSelector().className('android.widget.FrameLayout').isVisibleToUser(true).filter(v => {
                    return v.desc() && v.desc().indexOf('[') == 0 && v.desc().indexOf(']') > 0;
                }).find();

                let count = 1 + Math.floor(Math.random() * 3);
                while (count-- > 0) {
                    let emj = emjs[Math.floor(Math.random() * emjs.length)];
                    emj.click();//这里必须这样，否则可能点击到发送按钮
                    Common.sleep(500 + 500 * Math.random());
                }
            }
        }

        let btnTag = UiSelector().className('android.widget.ImageView').clickable(true).filter(v => {
            return v.bounds().centerX() > iptTag.bounds().right && v.bounds().centerY() > iptTag.bounds().top && v.bounds().centerY() < iptTag.bounds().bottom && v.bounds().right > Device.width() - 10;
        }).findOne();
        Common.click(btnTag, 0.2);
        Common.sleep(1500 + 500 * Math.random());
    },

    /**
     * 循环弹幕
     * @param {string} msg 
     * @param {boolean} withEmoji 
     */
    loopComment(msg, withEmoji) {
        try {
            this.comment(msg, withEmoji);
        } catch (e) {
            Log.log(e);
        }
    }
}

module.exports = Live;
