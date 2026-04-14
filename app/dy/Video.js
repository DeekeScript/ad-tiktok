let Common = require('app/dy/Common.js');
let statistics = require('common/statistics.js');
let T = require('app/dy/T.js');

const Video = {
    /**
     * 滑动视频  （非fast模式下运行，否则视频划不动）
     * @returns {boolean}
     */
    next() {
        //推荐页面滑动视频
        let w = Device.width();
        let h = Device.height();

        let x = w * (0.45 + Math.random() * 0.1);
        let startY = h * (0.80 + Math.random() * 0.05);
        let endY = h * (0.20 + Math.random() * 0.05);

        let duration = 250 + Math.random() * 150;

        return Gesture.swipe(x, startY, x, endY, duration);
    },

    /**
     * 获取点赞标签
     * @returns {object}
     */
    getZanTag() {
        let tag = UiSelector().className('android.widget.Button').descContains(T('点赞')).filter(v => {
            return v.desc().indexOf(T('视频')) !== -1;//若没有点赞，则是“点赞视频”，若点赞了，则展示“点赞的视频”
        }).clickable(true).isVisibleToUser(true).findOne();

        Log.log(tag);
        if (tag) {
            //900 1208 180 201
            console.log(tag.bounds().left, tag.bounds().top, tag.bounds().width(), tag.bounds().height());
            return tag;
        }

        throw new Error('cant funds like tag');
    },

    /**
     * 获取点赞数量  注意：如果已经点赞，则没有点赞数量
     * @returns {number}
     */
    getZanCount() {
        let zan = this.getZanTag();
        return Common.numDeal(zan.desc());
    },

    /**
     * 是否已赞
     * @returns {boolean}
     */
    isZan() {
        let zan = this.getZanTag();
        return zan.desc().indexOf(T('点赞的视频')) !== -1;//点赞的视频
    },

    /**
     * 点赞
     * @returns {boolean}
     */
    clickZan() {
        let zanTag = this.getZanTag();
        if (zanTag) {
            let res = Common.click(zanTag, 0.2);
            statistics.zan();
            return res;
        }
        Log.log('click like tag failed');
        return false;
    },

    /**
     * 获取评论标签
     * @returns {object}
     */
    getCommentTag() {
        let tag = UiSelector().className('android.widget.Button').descContains(T('阅读或添加评论')).clickable(true).isVisibleToUser(true).findOne();
        Log.log("comment tag：", tag.desc(), tag);
        if (tag) {
            return tag;
        }

        throw new Error('cant find comment tag');
    },

    /**
     * 获取评论数量
     * @returns {number}
     */
    getCommentCount() {
        let comment = this.getCommentTag();
        return Common.numDeal(comment.desc());
    },

    /*
     * 打开评论
     * @param {number} type
     * @returns {boolean}
     */
    openComment(type) {
        let comment = this.getCommentTag();
        let res = Common.click(comment, 0.3);
        if (type) {
            Common.sleep(2000 + 1500 * Math.random());
        } else {
            Common.sleep(2000 + 1000 * Math.random());
            Common.back();
        }

        return res;
    },

    /*
     * 获取收藏控件
     * @returns {object}
     */
    getCollectTag() {
        let tag = UiSelector().className('android.widget.Button').descContains(T('将此视频添加到或移出收藏')).isVisibleToUser(true).findOne();
        if (tag) {
            return tag;
        }

        throw new Error('cant find collect tag');
    },

    /*
     * 获取收藏数量
     * @returns {number}
     */
    getCollectCount() {
        return 0;//暂时无法获取收藏数量，先返回0
    },

    /*
     * 收藏
     * @returns {boolean}
     */
    collect() {
        let tag = this.getCollectTag();
        return Common.click(tag, 0.2);
    },

    /*
     * 是否收藏
     * @returns {boolean}
     */
    isCollect() {
        if (Access.isMediaProjectionEnable()) {
            let tag = this.getCollectTag();
            let image = Images.capture();
            let color = Images.getColor(image, tag.bounds().centerX(), tag.bounds().top + tag.bounds().height() * 0.35);
            Log.log('collect tag color:', color, Common.rgbToColorName(color));
            return Common.rgbToColorName(color) == '黄';
        }

        Common.log('capture permission is not granted, can not determine whether it is collected');
        return false;
    },

    /*
     * 分享控件获取
     * @returns {object}
     */
    getShareTag() {
        let tag = UiSelector().className('android.widget.Button').descContains(T('分享视频')).clickable(true).isVisibleToUser(true).findOne();
        if (tag) {
            return tag;
        }

        throw new Error('cant find share tag');
    },

    /*
     * 获取分享数量
     * @returns {number}
     */
    getShareCount() {
        let share = this.getShareTag();
        return Common.numDeal(share.desc());
    },

    /*
     * 获取视频内容控件
     * @returns {object}
     */
    getContentTag() {
        let tag = Common.id('desc').isVisibleToUser(true).findOne();
        if (tag) {
            console.log("视频标题内容：", tag);
            return tag;
        }

        return false;//极端情况是可以没有内容的
    },

    /**
     * 获取视频内容
     * @returns {object}
     */
    getContent() {
        let tag = this.getContentTag();
        return tag ? tag.text() : '';
    },

    /**
     * 获取标题上方的昵称控件
     * @returns {object}
     */
    getTitleTag() {
        let tag = Common.id('title').isVisibleToUser(true).findOnce();
        if (tag) {
            return tag;
        }
        throw new Error('cant funds title tag');
    },

    /**
     * 获取标题上的昵称
     * @returns {string}
    */
    getAtNickname() {
        let tag = this.getTitleTag();
        if (!tag) {
            return null;
        }

        return this.getTitleTag().text();
    },

    getAvatarTag() {
        let tag = Common.id('user_avatar').isVisibleToUser(true).findOnce();
        if (tag) {
            return tag;
        }
        throw new Error('cant find avatar tag');
    },

    /**
     * 获取用户的视频的发布时间
     * @returns {object}
     */
    getTimeTag() {
        //· 03-19
        let tag = UiSelector().textContains('· ').filter(v => {
            return v.text().indexOf('· ') === 0 && v.id().indexOf('desc') === -1;
        }).isVisibleToUser(true).findOne();
        if (tag) {
            return tag;
        }
        throw new Error('cant find time tag');
    },

    /**
     * 获取用户的视频的发布时间
     * @returns {string}
     */
    getTime() {
        //发布时间：2025-09-29 07:00 IP属地：湖北
        let tag = this.getTimeTag();
        return tag.text().replace('· ', '');
    },

    /**
     * 是否直播中
     * @returns {boolean}
     */
    isLiving() {
        //两种方式，一种是屏幕上展示，一种是头像
        if (UiSelector().text(T('点击进入直播间')).isVisibleToUser(true).exists()) {
            return true;
        }

        console.log("直播1检测完成");
        let tag = UiSelector().text(T('直播')).filter((v) => {
            return v && v.bounds() && v.bounds().top > Device.height() / 3 && v.bounds().top < Device.height() * 0.7 && v.bounds().left > Device.width() * 0.8;
        }).isVisibleToUser(true).exists();

        console.log("直播2检测完成");
        return tag;
    },

    /**
     * 有没有【点击查看、查看详情】 有的话大概率是广告  广告的话，不能操作广告主
     * @returns {boolean}
     */
    viewDetail() {
        return false;//暂时没有看到相关广告
    },

    /**
     * 进入用户主页
     * @returns {boolean}
     */
    intoUserPage() {
        let nicknameTag = this.getTitleTag();
        Log.log(nicknameTag);
        let res = Common.click(nicknameTag, 0.2);
        Common.sleep(3000 + Math.random() * 1000);
        statistics.viewUser();//目标视频数量加1
        return res;
    },

    /**
     * 同城进入用户主页
     * @returns {boolean}
     */
    intoLocalUserPage() {
        let nicknameTag = this.getTitleTag();
        Log.log(nicknameTag);
        let res = Common.click(nicknameTag, 0.2);
        Common.sleep(3000 + Math.random() * 1000);
        statistics.viewUser();//目标视频数量加1
        return res;
    },

    /**
     * 获取用户昵称  不再通过头像获取，因为经常出问题
     * @returns {string}
     */
    getNickname() {
        return this.getAtNickname();
    },

    /**
     * 获取视频发布时间 返回距离当前时间的秒数（过去）
     * @return {number}
     */
    getInTime() {
        let time = this.getTime();
        let incSecond = 0;
        if (time.indexOf(T('分钟前')) !== -1) {
            incSecond = parseInt(time.replace(T('分钟前'), '')) * 60;
        } else if (time.indexOf(T('小时前')) !== -1) {
            incSecond = parseInt(time.replace(T('小时前'), '')) * 3600;
        } else if (time.indexOf(T('刚刚')) !== -1) {
            incSecond = 0;
        } else if (time.indexOf(T('天前')) !== -1) {
            incSecond = parseInt(time.replace(T('天前'), '')) * 86400;
        } else if (time.indexOf(T('周前')) !== -1) {
            incSecond = parseInt(time.replace(T('周前'), '')) * 86400 * 7;
        } else if (time.indexOf(T('昨天')) !== -1) {
            let times = time.replace(T('昨天'), '').split(':');
            incSecond = 86400 - parseInt(times[0]) * 3600 - parseInt(times[1]) * 60 + (new Date()).getHours() * 3600 + (new Date()).getMinutes() * 60;
        } else if (/[\d]{2}\-[\d]{2}/.test(time)) {
            time = time.replace('日', '').replace('月', '-');
            time = (new Date()).getFullYear() + '-' + time;
            incSecond = Date.parse(new Date()) / 1000 - (new Date(time)).getTime() / 1000;//日期
        }
        return incSecond;
    },

    /**
     * 获取视频的详细信息
     * @param {object} params 
     * @returns {object}
     */
    getInfo(params) {
        if (!params) {
            params = {};
        }

        let info = {
            zanCount: params && params['zanCount'] ? this.getZanCount() : 0,
            commentCount: params && params['commentCount'] ? this.getCommentCount() : 0,
            shareCount: params && params['shareCount'] ? this.getShareCount() : 0,
        }

        if (!params['nickname']) {
            info.nickname = this.getNickname();
        } else {
            info.nickname = params['nickname'];
        }

        if (!params['title']) {
            info.title = this.getContent();
        } else {
            info.title = params['title'];
        }

        return info;
    },

    /**
     * 获取进度条
     * @return {object}
     */
    getProcessBar() {
        return UiSelector().className('android.widget.SeekBar').isVisibleToUser(true).findOne();
    },

    /**
     * 进入非顶置的最小赞视频
     * @return {boolean}
     */
    intoUserVideo() {
        //没有视频
        let tag = UiSelector().className('android.widget.Button').text(T('还没有视频')).isVisibleToUser(true).exists();
        if (tag) {
            return false;
        }

        let workTag = UiSelector().descContains(T('作品')).className('android.widget.ImageView').isVisibleToUser(true).findOne();
        if (!workTag) {
            return false;
        }

        let bottom = Device.height() - 200 - Math.random() * 300;
        let top = bottom - 400 - Math.random() * 200;
        let left = Device.width() * 0.1 + Math.random() * (Device.width() * 0.8);
        Gesture.swipe(left, bottom, left, top, 300);
        Common.sleep(2200 + 300 * Math.random());

        //这里需要判断是否是商家
        if (!workTag.parent().isSelected()) {
            Common.click(workTag, 0.2);
            Log.log('点击workTag');
            Common.sleep(3000);
        }

        let parent = UiSelector().className('android.widget.GridView').isVisibleToUser(true).findOne();
        let container = parent.children().findOne(UiSelector().className('android.widget.FrameLayout').filter(v => {
            return !v.children().findOne(UiSelector().text(T('已置顶')));
        }));
        if (!container) {
            return false;
        }

        let res = Common.click(container, 0.2);
        Common.sleep(4000 + Math.random() * 1000);
        statistics.viewVideo();
        statistics.viewTargetVideo();
        return res;
    },

    /**
     * 慢点
     * @returns {boolean}
     */
    videoSlow() {
        Common.sleep(1000 + Math.random() * 500);
        return true;
    },
}


module.exports = Video;
