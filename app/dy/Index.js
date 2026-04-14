let Common = require('app/dy/Common.js');
let T = require('app/dy/T.js');

const Index = {
    /**
     * 判断在哪个页面
     * @returns {object}
     */
    InXPageTag() {
        try {
            let tag = UiSelector().className('android.widget.FrameLayout').filter(v => {
                return !!(v.isSelected() && v.children().findOne(UiSelector().filter(v => {
                    return v.text() && [T('首页'), T('好友'), T('收件箱'), T('主页')].indexOf(v.text()) != -1;
                })));
            }).isVisibleToUser(true).findOne();

            let child = tag.children().findOne(UiSelector().filter(v => {
                return v.text() && [T('首页'), T('好友'), T('收件箱'), T('主页')].indexOf(v.text()) != -1;
            }));
            console.log('在那个页面', child.text());
            return child;
        } catch (e) {
            throw new Error(e.stack);
        }
    },
    /**
     * 进入主页
     * @returns boolean
     */
    intoHome() {
        Log.log('判断页面是否在主页');
        let tag = this.InXPageTag();
        if (tag.text().indexOf(T('首页')) != -1) {
            return true;
        }

        Log.log('准备点击首页');
        tag = UiSelector().text(T('首页')).findOne();
        let res = Common.click(tag, 0.2);//注意，首次打开抖音，这个clickable是false
        Common.sleep(8000 + Math.random() * 2000);//不能太短，否则视频刷新容易出问题（延迟很大）
        Log.log('点击home');
        return res;
    },

    /**
     * 进入消息页面
     * @returns {boolean}
     */
    intoMyMessage() {
        let tag = this.InXPageTag();
        if (tag.text().indexOf(T('收件箱')) != -1) {
            return true;
        }

        tag = tag = UiSelector().text(T('收件箱')).filter(v => {
            return v.bounds().top > Device.height() * 0.7 && v.bounds().left >= Device.width() / 2 && v.parent().isVisibleToUser();
        }).findOne();
        let res = Common.click(tag, 0.1);
        Common.sleep(3000 + 1000 * Math.random());
        Log.log('点击message');
        return res;
    },

    /**
     * 进入我的页面
     * @returns {boolean}
     */
    intoMyPage() {
        let tag = this.InXPageTag();
        if (tag.text().indexOf(T('主页')) != -1) {
            return true;
        }

        tag = UiSelector().text(T('主页')).filter(v => {
            return v.bounds().top > Device.height() * 0.8 && v.bounds().left > Device.width() * 0.5 && v.parent().isVisibleToUser();
        }).findOne();
        let res = Common.click(tag, 0.2);
        Common.sleep(1000 + 1000 * Math.random());
        Log.log('click me' + ":" + tag.bounds().left + "::" + tag.bounds().top);
        return res;
    },

    /**
     * 进入喜欢的视频列表
     * @returns {boolean}
     */
    intoLikeVideo() {
        //首先知道喜欢的菜单
        let likeTag = UiSelector().desc(T('赞过的作品')).findOne();
        if (!likeTag) {
            return false;
        }

        Common.click(likeTag, 0.2);
        Common.sleep(3000 + 2000 * Math.random());
        let parent = UiSelector().className('android.widget.GridView').isVisibleToUser(true).findOne();
        if (!parent) {
            Common.log('not found video parent\'s tag');
            return false;
        }

        let videoTag = parent.children().findOne(UiSelector().className('android.widget.FrameLayout').clickable(true));
        if (!videoTag) {
            Common.log('not found video tag');
            return false;
        }
        let res = Common.click(videoTag, 0.2);
        Log.log(videoTag);
        Common.sleep(5000 + 2000 * Math.random());
        return res;
    },

    /**
     * 是否在城市或者探索（无法区分本地和探索）
     * @returns {boolean}
     */
    isCity() {
        if (!Common.id('long_press_layout').isVisibleToUser(true).findOne()) {
            return false;//同城视频和推荐视频都有
        }

        if (!UiSelector().id('android:id/text1').text(T('推荐')).findOne()) {
            return false;
        }
        return true;
    },

    /**
     * 进入同城、探索
     * @param {number} type 
     * @returns {boolean}
     */
    intoLocal(type = 0) {
        Log.log('into local or explore', type);
        let recommendTag = UiSelector().id('android:id/text1').text(type == 0 ? T('本地') : T('探索')).findOne();
        let res = Common.click(recommendTag, 0.2);
        Common.sleep(3000 + 2000 * Math.random());

        let parent = UiSelector().className('androidx.recyclerview.widget.RecyclerView').isVisibleToUser(true).findOne();
        let container = parent.children().findOne(UiSelector().className('android.widget.RelativeLayout').isVisibleToUser(true).clickable(true));
        Common.click(container, 0.25);
        Common.sleep(5000 + 2000 * Math.random());
        Common.log('click video in local or explore');//首次需要等待视频加载
        return res;
    },

    intoRecommend(type = 0) {
        Log.log('into recommend or STEM', type);
        let recommendTag = UiSelector().id('android:id/text1').text(type == 0 ? T('推荐') : T('STEM')).findOne();
        let res = Common.click(recommendTag, 0.2);
        Common.sleep(3000 + 2000 * Math.random());
        return res;
    },


    /**
     * 从主页进入搜索页
     * @returns {boolean}
     */
    intoSearchPage() {
        let tag = UiSelector().id('android:id/text1').text(T('推荐')).findOne();
        let searchTag = UiSelector().className('android.widget.ImageView').filter(v => {
            return v.bounds().centerX() > tag.bounds().right && v.bounds().centerY() > tag.bounds().top && v.bounds().centerY() < tag.bounds().bottom;
        }).findOne();
        Common.log(searchTag);
        if (!searchTag) {
            Log.log('can\'t find search tag, click recommend tag');
            let res = Common.click(tag, 0.2);
            Common.sleep(2000 + 1000 * Math.random());
            return res;
        }

        searchTag = UiSelector().className('android.widget.ImageView').filter(v => {
            return v.bounds().centerX() > tag.bounds().right && v.bounds().centerY() > tag.bounds().top && v.bounds().centerY() < tag.bounds().bottom;
        }).findOne();

        let res = Common.click(searchTag, 0.2);
        Common.sleep(2000 + 1000 * Math.random());
        return res;
    },

    /**
     * 判断是否在推荐页
     * @returns {boolean}
     */
    inRecommend() {
        if (!Common.id('long_press_layout').isVisibleToUser(true).findOne()) {
            return false;//同城视频和推荐视频都有
        }

        if (!UiSelector().id('android:id/text1').text(T('推荐')).findOne()) {
            return false;
        }
        return true;
    }
}

module.exports = Index;
