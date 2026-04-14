let Common = require('app/dy/Common.js');
let storage = require('common/storage.js');
let statistics = require('common/statistics.js');
let T = require('app/dy/T.js');

const Comment = {
    tag: undefined,//当前的tag标签
    containers: [],//本次遍历的内容  主要用于去重
    /**
     * 返回昵称控件，也可以通过TextView的第一个的方式来返回，注意这个可以被点击，另外如果isVisibleToUser为false也能点击
     * @returns Object
     */
    getNicknameTag(tag) {
        if (tag) {
            return tag.children().findOne(Common.id('title'));
        }
        return this.tag.children().findOne(Common.id('title'));
    },

    /**
     * 返回评论内容控件
     * @returns Object
     */
    getContentTag() {
        return this.tag.children().findOne(UiSelector().className('android.widget.TextView').filter(v => {
            return v.bounds().width() > Device.width() * 0.6;
        }));
    },

    /**
     * 返回回复控件
     * @param {Object} tag 
     * @returns 
     */
    getBackTag(tag) {
        if (tag) {
            return tag.children().findOne(UiSelector().className('android.widget.Button').text(T('回复')));
        }

        return this.tag.children().findOne(UiSelector().className('android.widget.Button').text(T('回复')));
    },

    /**
     * 获取点赞控件  注意它的父控件可以直接使用click方法点击
     * @param {Object} tag 
     * @returns 
     */
    getZanTag(tag) {
        if (tag) {
            return tag.children().findOne(UiSelector().className('android.widget.Button').filter(v => {
                return v.bounds().left > Device.width() / 2;
            }));
        }
        return this.tag.children().findOne(UiSelector().className('android.widget.Button').filter(v => {
            return v.bounds().left > Device.width() / 2;
        }));
    },

    /**
     * 是否是作者
     * @returns boolean
     */
    isAuthor() {
        return this.tag.children().findOne(UiSelector().text(T('创作者'))) ? true : false;
    },

    /**
     * 返回昵称  如果是动画图片可能会识别不正常
     * @returns string|false
     */
    getNickname() {
        let tag = this.getNicknameTag();
        if (tag) {
            return tag.text();
        }
        return false;
    },

    /**
     * 返回评论内容
     * @returns string|false
     */
    getContent() {
        let tag = this.getContentTag();
        if (tag) {
            return tag.text();
        }
        return false;
    },

    /**
     * 获取点赞数量
     * @returns number
     */
    getZanCount() {
        let tag = this.getZanTag();
        return tag ? Common.numDeal(tag.desc()) : 0;
    },

    /**
     * 是否已点赞
     * @returns boolean
     */
    isZan(image) {
        let tag = this.getZanTag();
        if (!tag) {
            return false;
        }

        if (image) {
            let isZan = Images.getColor(image, tag.bounds().left + tag.bounds().width() / 4, tag.bounds().centerY());
            return Common.rgbToColorName(isZan) == '红';
        }

        return false;
    },

    /**
     * 点赞
     * @param {Object} data 
     * @returns 
     */
    clickZan(data) {
        let zanTag = this.getZanTag(data.tag);
        if (zanTag && !zanTag.isVisibleToUser()) {
            return false;
        }
        zanTag && Common.click(zanTag, 0.1);
        statistics.zanComment();
        return true;
    },

    /**
     * 往上滑
     * @returns boolean
     */
    swipeTop() {
        return Common.swipeCommentListOp();
    },

    /**
     * 返回评论内容（外层控件、昵称、评论内容、Ip、是否点赞、点赞数、作者）
     * @returns array
     */
    getList() {
        let parent = UiSelector().className('androidx.viewpager.widget.ViewPager').isVisibleToUser(true).findOne();
        let contains = parent.children().find(UiSelector().className('android.widget.FrameLayout').filter(v => {
            return v.bounds().width() >= Device.width() - 10;
        }).isVisibleToUser(true));

        Log.log("quantity：", contains.length);
        let contents = [];
        let data = {};

        let image = undefined;
        if (Access.isMediaProjectionEnable()) {
            image = Images.capture();
        }
        for (let i in contains) {
            this.tag = contains[i];//主要给当前方法使用的
            Log.log("tag", this.tag);
            data = {
                tag: contains[i],
                nickname: this.getNickname(),
                content: this.getContent(),
                zanCount: this.getZanCount(),
                isZan: this.isZan(image),
                isAuthor: this.isAuthor(),
            }
            Log.log("Data", data);
            if (data.nickname === false) {
                Log.log('has not nickname');
                continue;
            }

            if (this.containers && this.containers.length > 100) {
                this.containers.shift();
            }

            if (this.containers.includes(data.nickname + '_' + data.content)) {
                continue;
            }

            contents.push(data);
            this.containers.push(data.nickname + '_' + data.content);
        }
        return contents;
    },

    /**
     * 关闭评论窗口
     * @returns boolean
     */
    closeCommentWindow() {
        let closeTag = UiSelector().desc(T('关闭')).isVisibleToUser(true).clickable(true).findOne();
        if (!closeTag) {
            return false;
        }
        return Common.click(closeTag, 0.1);
    },

    /**
     * 进入用户主页
     * @param {Object} data 
     * @returns boolean
     */
    intoUserPage(data) {
        let headTag = this.getNicknameTag(data.tag);
        if (!headTag.isVisibleToUser()) {
            Common.log('has not headTag');
            return false;
        }
        let res = Common.click(headTag, 0.2);
        Common.sleep(3000 + 1000 * Math.random());
        return res;
    },

    /**
     * 回复
     * @param {object} data 
     * @param {string} msg 
     */
    backMsg(data, msg) {
        let backTag = this.getBackTag(data.tag);
        Log.log(backTag.bounds());
        Common.click(backTag, 0.2);
        Common.sleep(2500 + 500 * Math.random());

        let iptTag = UiSelector().className('android.widget.EditText').filter(v => {
            return v.isEditable();
        }).isVisibleToUser(true).findOne();

        if (!iptTag) {
            Common.back(1, 1000);
            Log.log('has not input field');
            return true;
        }
        iptTag.setText(msg);
        Common.sleep(500 + Math.random() * 1000);

        let submitTag = UiSelector().className('android.widget.TextView').text(T('发送')).isVisibleToUser(true).findOne();
        let res = Common.click(submitTag, 0.2);
        Common.sleep(2000 * Math.random());
        return res;
    },

    /**
     * 评论视频
     * @param {string} msg 
     * @returns boolean
     */
    commentMsg(msg) {
        let iptTag = UiSelector().className('android.widget.EditText').isVisibleToUser(true).filter(v => {
            return v.isEditable();
        }).findOne();

        Common.click(iptTag, 0.2);
        Common.sleep(1500 + 500 * Math.random());
        iptTag = UiSelector().className('android.widget.EditText').isVisibleToUser(true).filter(v => {
            return v.isEditable();
        }).findOne();

        //获取是否评论图片
        Log.log("comment with emoji rate：" + storage.get("setting_comment_with_photo", "int"));
        if (storage.get("setting_comment_with_photo", "int") > Math.random() * 100) {
            this.commentImage();
            Common.click(iptTag, 0.2);
            Common.sleep(100);
        }

        Log.log('msg', msg);
        iptTag.setText(msg);
        Common.sleep(500 + Math.random() * 1000);

        let btnTag = UiSelector().className('android.widget.Button').clickable(true).filter(v => {
            return v.bounds().left > Device.width() / 2 && v.bounds().top > Device.height() / 3;
        }).isVisibleToUser(true).findOne();
        Common.click(btnTag, 0.25);
        Common.sleep(2000 + 500 * Math.random());
        statistics.comment();

        //查看dg0位置有没有下来
        iptTag = UiSelector().className('android.widget.EditText').isVisibleToUser(true).filter(v => {
            return v.isEditable();
        }).findOne();
        if (iptTag && iptTag.bounds().top < Device.height() * 2 / 3) {
            Common.back();
            Common.sleep(1000);
            Log.log("click error, back");
        }

        Common.sleep(1000 * Math.random());
        return true;
    },

    /**
     * 表情评论
     * @returns boolean
     */
    commentImage() {
        let imgTag = UiSelector().desc(T('贴纸')).isVisibleToUser(true).findOne();
        Log.log("imgTag", imgTag);
        Common.click(imgTag, 0.2);

        Common.sleep(1500 + 1000 * Math.random());
        let customTag = UiSelector().desc(T('添加到收藏')).isVisibleToUser(true).findOne();
        if (!customTag) {
            Common.sleep(2000);
            customTag = UiSelector().desc(T('添加到收藏')).isVisibleToUser(true).findOne();
        }
        Common.click(customTag, 0.2);
        Common.sleep(1000 + 500 * Math.random());

        console.log("find emoji");
        let parent = UiSelector().className('android.widget.GridView').isVisibleToUser(true).findOne();
        let imgs = parent.children().find(UiSelector().className('android.widget.ImageView').isVisibleToUser(true));
        if (imgs.length === 0) {
            return false;
        }

        console.log("emoji count：" + imgs.length);
        let rand = Math.round(Math.random() * (imgs.length - 1));
        console.log('click which one：' + rand);
        console.log(imgs[rand]);
        let res = Common.click(imgs[rand], 0.1);
        Common.sleep(1000);
        return res;
    },

    zanComment(zanCount, meNickname) {
        //随机点赞 评论回复
        let contains = [];//防止重复的
        let rps = 0;//大于2 则退出
        let opCount = 5;

        while (true) {
            Log.log('get comment list-start');
            let comments = this.getList();
            Log.log('got the comment list：' + comments.length);
            if (comments.length === 0) {
                break;
            }

            let rpCount = 0;
            for (let comment of comments) {
                //移除了comment.content
                if (contains.includes(comment.nickname)) {
                    rpCount++;
                    continue;
                }

                Log.log('is author？', comment.isAuthor, comment.nickname);
                if (comment.nickname === meNickname || comment.isAuthor) {
                    Log.log('ignore this author\'s or myself comment');
                    continue;
                }

                rps = 0;//只要有一个不在列表，则清零
                contains.push(comment.nickname);

                Log.log('had zan the comment', comment.tag);
                try {
                    this.clickZan(comment);
                    Common.sleep(1000 + 1000 * Math.random());
                    // statistics.zanComment();//赞评论数量加1
                } catch (e) {
                    Log.log(e);
                }

                zanCount--;
                if (zanCount <= 0) {
                    break;
                }
            }

            if (rpCount === comments.length) {
                rps++;
            } else {
                opCount--;
            }

            if (rps >= 2 || opCount <= 0) {
                Log.log(rps + ':' + opCount);
                break;
            }

            Log.log('swipe comment list');
            this.swipeTop();
            Common.sleep(2000 + 1000 * Math.random());
        }

        Log.log('back to video');
        Common.sleep(300);
        Common.back();

        //漏洞修复  如果此时还在评论页面，则再一次返回
        this.closeCommentWindow();
        Common.sleep(500 + 500 * Math.random());
    }
}

module.exports = Comment;
