let Common = require('app/dy/Common.js');
let Video = require('app/dy/Video.js');
let Comment = require('app/dy/Comment.js');
let statistics = require('common/statistics.js');
let T = require('app/dy/T.js');

const User = {
    /**
     * 返回到用户主页
     * @returns {boolean}
     */
    backHome() {
        let i = 5;
        do {
            if (!UiSelector().className('android.widget.ImageView').desc(T('通知')).isVisibleToUser(true).exists()) {
                Common.back();
                System.sleep(1000);
                continue;
            }
            Log.log('back to user page');
            return true;
        } while (i-- > 0);
        Log.log('back to user page failed');
        return false;
    },

    /**
     * 判断是否在用户主页
     * @returns {boolean}
     */
    inUserHome() {
        let settingTag = UiSelector().className('android.widget.ImageView').desc(T('通知')).isVisibleToUser(true).exists();
        if (settingTag) {
            Log.log('already in user page');
            return true;
        }
        Common.log('not in user page');
        return false;
    },

    /**
     * 用户页面进入私信页面
     * @returns {boolean}
     */
    intoPrivatePage() {
        if (this.isBlackUser()) {
            return false;
        }

        let settingTag = UiSelector().desc(T('分享')).className('android.widget.ImageView').isVisibleToUser(true).findOne() || UiSelector().text(T('分享')).className('android.widget.ImageView').isVisibleToUser(true).findOne();
        if (!settingTag) {
            Log.log('cant found share button');
            return false;
        }

        Common.click(settingTag, 0.2);
        Log.log("private msg");
        Common.sleep(700 + 500 * Math.random());

        let sendTag = UiSelector().text(T('发送消息')).className('android.widget.TextView').isVisibleToUser(true).findOne();
        if (!sendTag) {
            throw new Error('cant found private msg button');
        }

        let res = Common.click(sendTag, 0.2);
        Common.sleep(2000 + 1000 * Math.random());
        return res;
    },

    /**
     * 发送私信
     * @param {string} msg 
     * @param {boolean} inMsgPage 是否已经在私信页面
     * @param {boolean} noBackHome 不返回主界面
     * @returns {boolean}
     */
    privateMsg(msg, inMsgPage = false, noBackHome = false) {
        try {
            if (!inMsgPage && !this.intoPrivatePage()) {
                return false;
            }

            let textTag = UiSelector().className('android.widget.EditText').filter(v => {
                return v.isEditable();
            }).isVisibleToUser(true).findOne();
            if (!textTag) {
                throw new Error('cant found private input field');//可能是企业号，输入框被隐藏了
            }
            textTag.setText(msg);
            Common.sleep(500 + 500 * Math.random());

            let sendTextTag = UiSelector().desc(T('发送')).isVisibleToUser(true).clickable(true).findOne();
            if (!sendTextTag || !sendTextTag.click()) {
                throw new Error('send msg failed');
            }

            Common.sleep(500 + 500 * Math.random());
            Log.log("private msg send complete");
            statistics.privateMsg();
            if (!noBackHome) {
                this.backHome();
            }
            return true;
        } catch (e) {
            Log.log(e);
            if (!noBackHome) {
                this.backHome();
            }
        }
        return false;
    },

    /**
     * 返回用户昵称  注意考虑滑动用户界面的时候，昵称跑到手机外，无法获取
     * @returns {string}
     */
    getNickname() {
        let parent = Common.id('viewpager').isVisibleToUser(true).findOne();
        if (!parent) {
            throw new Error('cant found user nickname');
        }

        let nicknameTag = parent.children().findOne(UiSelector().className('android.widget.Button').isVisibleToUser(true).textMatches(/[\s\S]+/));
        console.log(nicknameTag);
        if (nicknameTag) {
            return nicknameTag.text();
        }

        throw new Error('cant found user nickname2');
    },

    /**
     * 机构 媒体等账号 公司
     * @returns {boolean}
     */
    isCompany() {
        return UiSelector().className('android.widget.ImageView').isVisibleToUser(true).desc(T('认证徽章')).exists();
    },

    /**
     * 获取抖音号
     * @returns {string}
     */
    getDouyin() {
        let parent = Common.id('viewpager').isVisibleToUser(true).findOne();
        if (!parent) {
            throw new Error('cant found user account');
        }

        let nicknameTag = parent.children().findOne(UiSelector().className('android.widget.Button').isVisibleToUser(true).textContains('@'));
        if (nicknameTag) {
            return nicknameTag.text();
        }

        throw new Error('get account failed');
    },

    /**
     * 获取”获赞“数量
     * @returns {number}
     */
    getZanCount() {
        let parent = Common.id('viewpager').isVisibleToUser(true).findOne();
        if (!parent) {
            throw new Error('cant found user zan count');
        }

        let zanTag = parent.children().findOne(UiSelector().className('android.widget.TextView').text(T('赞')));
        if (!zanTag) {
            Common.log('no zan count');
            return 0;
        }

        let zanCountTag = zanTag.parent().children().findOne(UiSelector().className('android.widget.TextView').isVisibleToUser(true));
        return Common.numDeal(zanCountTag.text());
    },

    /**
     * 返回关注控件
     * @returns {object}
     */
    getFocusTag() {
        let parent = Common.id('viewpager').isVisibleToUser(true).findOne();
        let focusTag = parent.children().findOne(UiSelector().className('android.widget.TextView').text(T('关注')));

        return focusTag.parent().children().findOne(UiSelector().className('android.widget.TextView').isVisibleToUser(true));
    },

    /**
     * 获取”关注“数量
     * @returns {number}
     */
    getFocusCount() {
        return Common.numDeal(this.getFocusTag().text());
    },

    getFansTag() {
        let parent = Common.id('viewpager').isVisibleToUser(true).findOne();
        let fansTag = parent.children().findOne(UiSelector().className('android.widget.TextView').text(T('粉丝')));

        return fansTag.parent().children().findOne(UiSelector().className('android.widget.TextView').isVisibleToUser(true));
    },

    /**
     * 获取”粉丝“数量
     * @returns {number}
     */
    getFansCount() {
        return Common.numDeal(this.getFansTag().text());
    },

    /**
     * 获取介绍
     * @returns {string}
     */
    getIntroduce() {
        let parent = Common.id('viewpager').isVisibleToUser(true).findOne();
        let msgTag = parent.children().findOne(UiSelector().text(T('消息')));
        let bottomTag = UiSelector().filter(v => {
            return v.bounds().top > msgTag.bounds().bottom;
        }).className('android.widget.HorizontalScrollView').findOne();

        let textTags = UiSelector().textMatches(/[\s\S]+/).filter(v => {
            return v.bounds().top >= msgTag.bounds().bottom && v.bounds().bottom <= bottomTag.bounds().top;
        }).find();

        let str = '';
        for (let i in textTags) {
            str += "\n" + textTags[i].text();
        }
        return str.substring(1);
    },

    /**
     * 获取作品数控件
     * @returns {object}
     */
    getWorksTag() {
        let worksTag = UiSelector().className('android.widget.TextView').isVisibleToUser(true).descContains(T('作品')).findOne();
        console.log("worksTag", worksTag);
        if (!worksTag) {
            return {
                text: function () {
                    return 0;
                }
            }
        }
        return worksTag;
    },

    /**
     * 获取作品数量
     * @returns {number}
     */
    getWorksCount() {
        let tag = UiSelector().className('android.widget.Button').text(T('还没有视频')).isVisibleToUser(true).exists();
        return tag ? 0 : 1;//当前只能判断是否有作品，不能判断作品数量
    },

    /**
     * 黑名单账号（封禁和注销账号）
     * @returns {boolean}
     */
    isBlackUser() {
        //帐号已被封禁
        if (UiSelector().textContains(T('封禁')).isVisibleToUser(true).findOnce()) {
            return true;
        }

        //注销了
        if (UiSelector().textContains(T('注销')).isVisibleToUser(true).findOnce()) {
            return true;
        }
        return false;
    },

    /**
     * 是否是私密账号、注销账号、封禁账号
     * @returns {boolean}
     */
    isPrivate() {
        Log.log("is private account,Deactivate account, suspend account？");
        if (UiSelector().textContains(T('私密账号')).isVisibleToUser(true).findOnce()) {
            return true;
        }

        if (this.isBlackUser()) {
            return true;
        }
        Log.log("is not private account,Deactivate account, suspend account");
        return false;
    },

    /**
     * 是否已关注
     * @returns {boolean}
     */
    isFocus() {
        let parent = Common.id('viewpager').isVisibleToUser(true).findOne();
        let focusTag = parent.children().findOne(UiSelector().text(T('关注'))) || parent.children().findOne(UiSelector().text(T('回关')));
        return !focusTag;
    },

    /**
     * 关注
     * @returns {boolean}
     */
    focus() {
        if (this.isFocus()) {
            Log.log('had focused');
            return true;
        }

        let parent = Common.id('viewpager').isVisibleToUser(true).findOne();
        //需要排除“关注数量“下面的”关注“
        let focusTag = parent.children().findOne(UiSelector().text(T('关注')).filter(v => {
            return !v.parent().children().findOne(UiSelector().textMatches(/\d+/).isVisibleToUser(true));
        }).isVisibleToUser(true)) || parent.children().findOne(UiSelector().text(T('回关')).filter(v => {
            return !v.parent().children().findOne(UiSelector().textMatches(/\d+/).isVisibleToUser(true));
        }).isVisibleToUser(true));
        
        if (focusTag) {
            let res = Common.click(focusTag, 0.2);
            statistics.focus();
            Common.sleep(500 + 500 * Math.random());
            return res;
        }

        throw new Error('cant found focus button');
    },

    /**
     * 取消关注
     * @returns {boolean}
     */
    cancelFocus() {
        let parent = Common.id('viewpager').isVisibleToUser(true).findOne();
        let focusTag = parent.children().findOne(UiSelector().text(T('关注'))) || parent.children().findOne(UiSelector().text(T('回关')));
        if (focusTag) {
            return false;
        }

        let msgTag = UiSelector().textContains(T('消息')).isVisibleToUser(true).findOne();
        let tag = UiSelector().className('android.widget.LinearLayout').filter(v => {
            return v.bounds().left >= msgTag.bounds().right && v.bounds().centerY() > msgTag.bounds().top && v.bounds().centerY() < msgTag.bounds().bottom;
        }).clickable(true).findOne();

        Common.click(tag, 0.2);
        Common.sleep(1500 + 500 * Math.random());
        let cancelBtn = UiSelector().className('android.widget.TextView').text(T('取消关注')).findOne();
        if (cancelBtn) {
            let res = Common.click(cancelBtn, 0.2);
            Common.sleep(1000 + 500 * Math.random());
            return res;
        }

        return false;
    },

    /**
     * 返回用户数据
     * @returns {object}
     */
    getUserInfo() {
        let res = {};
        res = {
            nickname: this.getNickname(),
            douyin: this.getDouyin(),
            // introduce: this.getIntroduce(),
            // zanCount: this.getZanCount(),
            // focusCount: this.getFocusCount(),
            // fansCount: this.getFansCount(),
            worksCount: 0,
            // openWindow: 0,//开启橱窗
            // isCompany: this.isCompany(),//是否是机构 公司
            isPrivate: this.isPrivate(),
        };

        if (res.isPrivate) {
            return res;
        }

        let newRes = {
            worksCount: this.getWorksCount(),
            // openWindow: this.openWindow(),
        };

        for (let i in newRes) {
            res[i] = newRes[i];
        }
        return res;
    },

    contents: [],
    /**
     * 取消关注列表
     * @param {object} machine 
     * @returns {boolean}
     */
    cancelFocusList(machine) {
        let focus = this.getFocusTag();
        if (!focus) {
            Common.toast('cant found focus tag');
            throw new Error('cant found focus tag');
        }

        Common.click(focus, 0.2);
        Common.sleep(4000 + 1000 * Math.random());
        while (true) {
            let parent = Common.id('viewpager').isVisibleToUser(true).findOne();
            let containers = parent.children().find(UiSelector().className('android.widget.LinearLayout').isVisibleToUser(true));
            if (containers.length === 0) {
                Log.log('containers length eq 0');
                FloatDialogs.toast('cant found focus list');
                throw new Error('cant found focus list');
            }

            for (let i in containers) {
                let focusTag = containers[i].children().findOne(UiSelector().className('android.widget.Button').text(T('已关注')));
                if (!focusTag) {
                    Log.log('cant found focus tag');
                    continue;
                }

                let nicknameTag = containers[i].children().findOne(UiSelector().className('android.widget.TextView').isVisibleToUser(true));
                if (!nicknameTag) {
                    Log.log('cant found nickname tag');
                    continue;
                }

                let nickname = nicknameTag.text();
                Log.log("nickname: " + nickname);
                if (this.contents.includes(nickname)) {
                    continue;
                }

                Log.log(this.contents.length, this.contents.includes(nickname));
                Common.click(nicknameTag, 0.2);
                Common.sleep(2000 + 1000 * Math.random());
                this.cancelFocus();
                this.contents.push(nickname);
                while (!UiSelector().id('android:id/text1').textContains(T('关注')).selected(true).isVisibleToUser(true).findOne()) {
                    Common.back(1, 500, 500);
                }
                Common.sleep(500);
            }

            Log.log('scroll');
            if (!Common.swipeFocusListOp()) {
                return true;
            }
            Common.sleep(1500 + 1000 * Math.random());
        }
    },

    /**
     * 设置用户昵称
     * @param {array} contents 
     * @param {string} account 
     * @param {string} nickname 
     * @param {object} machine 
     */
    fansIncListOp(contents, account, nickname, machine) {
        nickname = Encrypt.md5(nickname);
        machine.set('task_dy_toker_fans_inc_main_' + account + '_' + nickname, true);
        contents.push(nickname);
        Common.sleep(500 + 500 * Math.random());
    },

    /**
     * 快速涨粉
     * @param {function} getMsg 
     * @param {object} machine 
     * @param {object} settingData 
     * @param {array} contents 
     * @param {string} meNickname 
     * @returns {boolean}
     */
    fansIncList(getMsg, machine, settingData, contents, meNickname) {
        let account = settingData.account;
        let fansTag = this.getFansTag();
        Common.click(fansTag, 0.2);
        Common.sleep(2000 + 1000 * Math.random());

        let arr = [];
        while (true) {
            let parent = Common.id('viewpager').isVisibleToUser(true).findOne();
            let containers = parent.children().find(UiSelector().className('android.widget.LinearLayout').isVisibleToUser(true));
            Log.log("containers length：" + containers.length);
            if (containers.length === 0) {
                Log.log('containers length eq 0');
                Common.log('cant found fans list');
                throw new Error('cant found fans list');
            }

            for (let i in containers) {
                //看看是否有关注或者已关注按钮
                let focusTag = containers[i].children().findOne(UiSelector().className('android.widget.Button').textContains(T('关注')));
                if (!focusTag) {
                    Log.log('may me or not user');
                    continue;
                }

                let nicknameTag = containers[i].children().findOne(UiSelector().className('android.widget.TextView').isVisibleToUser(true));
                if (!nicknameTag) {
                    Log.log('cant found nickname tag');
                    continue;
                }

                let nickname = nicknameTag.text();
                if (machine.get('task_dy_toker_inc_main_' + account + '_' + nickname, 'bool')) {
                    Log.log('repeat');
                    continue;
                }

                //进入用户首页
                Common.click(nicknameTag, 0.2);
                Common.sleep(3000 + 1000 * Math.random());

                if (this.isPrivate()) {
                    Log.log('is private user');
                    this.fansIncListOp(contents, account, nickname, machine);
                    Common.back();
                    Common.sleep(500 + 500 * Math.random());
                    continue;
                }

                //查看是否休眠
                if (settingData.task_dy_fans_inc_user_page_wait > 0) {
                    Common.sleep(1000 * settingData.task_dy_fans_inc_user_page_wait);
                }

                let rateCurrent = Math.random() * 100;
                this.fansIncListOp(contents, account, nickname, machine);
                //查看粉丝和作品数是否合格
                let worksCount = 0;

                Log.log("get works count");
                try {
                    worksCount = this.getWorksCount() * 1;
                } catch (e) {
                    Log.log(e);
                }

                Log.log("debug", "number of works: " + worksCount);
                if (worksCount == 0) {
                    Common.back();
                    Common.sleep(500 + 500 * Math.random());
                    continue;
                }

                rateCurrent -= settingData.task_dy_fans_inc_head_zan_rate * 1;
                if (Video.intoUserVideo()) {
                    Common.sleep(1000 * settingData.task_dy_fans_inc_user_video_wait * 1);//视频休眠
                    Log.log("watch video, wait some second: " + settingData.task_dy_fans_inc_user_video_wait);//视频休眠
                    if (rateCurrent <= settingData.task_dy_fans_inc_video_zan_rate * 1) {
                        !Video.isZan() && Video.clickZan();
                        Common.sleep(500 + 500 * Math.random());
                        this.backHome();
                        Common.back(1, 500, 500);
                        continue;
                    }

                    rateCurrent -= settingData.task_dy_fans_inc_video_zan_rate * 1;
                    if (rateCurrent <= settingData.task_dy_fans_inc_comment_rate * 1) {
                        let videoTitle = Video.getContent();
                        Video.openComment(!!Video.getCommentCount());
                        Comment.commentMsg(getMsg(0, videoTitle).msg);
                        Common.sleep(1000 + 1000 * Math.random());
                        Comment.zanComment(settingData.task_dy_fans_inc_comment_zan_count * 1, meNickname);
                        Common.sleep(500 + 500 * Math.random());
                        this.backHome();
                        Common.back(1, 500, 500);
                        continue;
                    }

                    rateCurrent -= settingData.task_dy_fans_inc_comment_rate * 1;
                    if (rateCurrent <= settingData.task_dy_fans_inc_collection_rate * 1) {
                        Video.collect();
                        this.backHome();
                        Common.back(1, 500, 500);
                        continue;
                    }

                    Common.sleep(500 + 500 * Math.random());
                    this.backHome();
                    Common.back(1, 500, 500);
                    continue;
                }
            }

            Log.log('scroll');
            if (!Common.swipeFansListOp()) {
                return true;
            }
            Common.sleep(1500);
        }
    },

    /**
     * type=0关注截流，type=1粉丝截流
     * @param {number} type 
     * @param {function} getMsg 
     * @param {object} machine 
     * @param {object} settingData 
     * @param {array} contents 
     * @param {string} meNickname 
     * @returns 
     */
    focusUserList(type, getMsg, machine, settingData, contents, meNickname) {
        let account = settingData.account;
        let tag = type == 0 ? this.getFocusTag() : this.getFansTag();
        Common.click(tag);
        Common.sleep(2000 + 1000 * Math.random());

        while (true) {
            let parent = Common.id('viewpager').isVisibleToUser(true).findOne();
            let containers = parent.children().find(UiSelector().className('android.widget.LinearLayout').isVisibleToUser(true));
            Log.log("containers length：" + containers.length);

            if (containers.length === 0) {
                Log.log('containers length eq 0');
                throw new Error('containers length eq 0');
            }

            for (let i in containers) {
                let focusTag = containers[i].children().findOne(UiSelector().className('android.widget.Button').textContains(T('关注')));
                if (!focusTag) {
                    Log.log('may me or not user');
                    continue;
                }

                let nicknameTag = containers[i].children().findOne(UiSelector().className('android.widget.TextView').isVisibleToUser(true));
                if (!nicknameTag) {
                    Log.log('had not nickname');
                    continue;
                }
                let nickname = nicknameTag.text();
                Log.log("nickname", nickname);
                if (machine.get('task_dy_toker_focus_' + account + '_' + nickname, 'bool')) {
                    Log.log('重复');
                    continue;
                }

                //进入用户首页
                Common.click(nicknameTag, 0.2);
                statistics.viewUser();
                Common.sleep(3000 + 2000 * Math.random());

                if (this.isPrivate()) {
                    Log.log('is private user');
                    machine.set('task_dy_toker_focus_' + account + '_' + nickname, true);
                    Common.back();
                    Common.sleep(1000);
                    continue;
                }

                //查看粉丝和作品数是否合格
                let worksCount = this.getWorksCount() * 1;
                if (worksCount < settingData.worksMinCount * 1 || worksCount > settingData.worksMaxCount * 1) {
                    Log.log('number of works is not in range', worksCount, settingData.worksMinCount, settingData.worksMaxCount);
                    machine.set('task_dy_toker_focus_' + account + '_' + nickname, true);
                    Common.back();
                    Common.sleep(1000);
                    continue;
                }

                //查看粉丝和作品数是否合格
                let fansCount = 0;

                try {
                    fansCount = this.getFansCount() * 1;
                } catch (e) {
                    Log.log(e);
                    continue;
                }

                if (fansCount < settingData.fansMinCount * 1 || fansCount > settingData.fansMaxCount * 1) {
                    Log.log('fans count is not in range', fansCount, settingData.fansMinCount, settingData.fansMaxCount);
                    machine.set('task_dy_toker_focus_' + account + '_' + nickname, true);
                    Common.back();
                    Common.sleep(1000);
                    continue;
                }

                if (Math.random() * 100 <= settingData.focusRate * 1) {
                    this.focus();
                }

                if (Math.random() * 100 <= settingData.privateRate * 1) {
                    this.privateMsg(getMsg(1, nickname).msg);
                }

                let commentRate = Math.random() * 100;
                let zanRate = Math.random() * 100;

                if ((commentRate <= settingData.commentRate * 1 || zanRate <= settingData.zanRate * 1) && Video.intoUserVideo()) {
                    if (zanRate <= settingData.zanRate * 1) {
                        !Video.isZan() && Video.clickZan();
                    }

                    if (commentRate <= settingData.commentRate * 1) {
                        let videoTitle = Video.getContent();
                        Video.openComment(!!Video.getCommentCount());
                        Comment.commentMsg(getMsg(0, videoTitle).msg);
                        Common.sleep(1000 + 1000 * Math.random());
                        Comment.zanComment(5, meNickname);
                    }

                    Common.back(1, 800);
                }

                machine.set('task_dy_toker_focus_' + account + '_' + nickname, true);
                settingData.opCount--;
                if (settingData.opCount <= 0) {
                    return true;
                }

                Common.back(1, 1500);
                contents.push(nickname);
                if (UiSelector().desc(T('分享')).clickable(true).filter((v) => {
                    return v && v.bounds().top < Device.height() / 5 && v.bounds().left > Device.width() / 2;
                }).isVisibleToUser(true).className('android.widget.ImageView').findOnce()) {
                    Log.log('fund share button, back');
                    Common.back(1, 800);//偶尔会出现没有返回回来的情况，这里加一个判断
                }
                Common.sleep(500 + 500 * Math.random());
            }

            Log.log('scroll');
            let res = type === 1 ? Common.swipeFansListOp() : Common.swipeFocusListOp();
            Common.sleep(1500);
            if (!res) {
                Log.log('scroll bottom');
                return true;
            }
        }
    },

    /**
     * 进入关注列表 我的，不是其他的关注列表
     * @returns {boolean}
     */
    intoFocusList() {
        let focusTag = this.getFocusTag();
        return Common.click(focusTag, 0.2);
    },

    /**
     * 粉丝回访
     * @param {array} nicknames 
     * @returns {boolean}
     */
    viewFansList(nicknames) {
        let fans = this.getFansTag();
        if (!fans) {
            throw new Error('cant found fans tag');
        }

        Common.click(fans);
        Common.sleep(2000 + 1000 * Math.random());
        let contents = [];
        while (true) {
            let parent = UiSelector().className('androidx.recyclerview.widget.RecyclerView').isVisibleToUser(true).findOne();
            let containers = parent.children().find(UiSelector().className('android.widget.LinearLayout').isVisibleToUser(true));
            if (containers.length === 0) {
                Log.log('containers length rq 0');
            }

            for (let i in containers) {
                let nicknameTag = containers[i].children().findOne(UiSelector().className('android.widget.TextView').isVisibleToUser(true));
                if (!nicknameTag) {
                    Log.log('cant found nickname tag');
                    continue;
                }

                let nickname = containers[i].text();
                Log.log('nickname:' + nickname);
                if (nicknames.includes(nickname)) {
                    continue;
                }

                Common.click(containers[i], 0.2);
                Common.sleep(2000 + 3000 * Math.random());
                nicknames.push(nickname);
                contents.push(nickname);
                Common.back(1, 500, 500);
            }

            Log.log('scroll');
            if (!Common.swipeFansListOp()) {
                return true;
            }
            Common.sleep(500);
        }
    },

    /**
     * 从用户页面点击头像，进入直播间
     * @returns {boolean}
     */
    intoLive() {
        let header = UiSelector().text(T('直播')).isVisibleToUser(true).findOne();
        Log.log(header);
        return Common.click(header, 0.2);
    },
}

module.exports = User;
