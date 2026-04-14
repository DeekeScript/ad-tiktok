let Common = require('app/dy/Common.js');
let User = require('app/dy/User.js');
let statistics = require('common/statistics');
let Video = require('app/dy/Video.js');
let Comment = require('app/dy/Comment.js');
let T = require('app/dy/T.js');

const Search = {
    contents: [],
    /**
     * type = 0 视频  type = 1 用户  需要先进入搜索页  2 综合
     * @param {string} keyword 
     * @param {number} type 
     * @returns 
     */
    intoSearchList(keyword, type) {
        if (!type) {
            type = 0;
        }

        //开始搜索
        let iptTag = UiSelector().className('android.widget.EditText').editable(true).isVisibleToUser(true).findOne();
        iptTag.setText(keyword);
        Common.sleep(1000 + 500 * Math.random());

        //找到搜索按钮
        let searchBtnTag = UiSelector().className('android.widget.TextView').isVisibleToUser(true).clickable(true).text(T('搜索')).findOne() || UiSelector().className('android.widget.TextView').clickable(true).isVisibleToUser(true).desc(T('搜索')).findOne();
        Log.log('searchBtnTag', searchBtnTag);
        Common.click(searchBtnTag, 0.2);
        Common.sleep(4000 + 2000 * Math.random());
        if (type == 2) {
            return true;
        }
        let videoTag;
        let rp = 3;
        while (!videoTag) {
            let parent = UiSelector().className('android.widget.HorizontalScrollView').isVisibleToUser(true).findOne();
            if (type === 0) {
                videoTag = parent.children().findOne(UiSelector().text(T('视频')));
            } else if (type === 1) {
                videoTag = parent.children().findOne(UiSelector().text(T('用户')));
            }

            if (rp-- <= 0 || videoTag) {
                break;
            }

            Common.swipeSearchTabToLeft();
            Common.sleep(1500);
        }

        if (!videoTag) {
            console.log('cant find user tab');
            throw new Error('cant find video or user tab;type=' + type);
        }

        console.log('into user page or video page：', videoTag);
        let res = Common.click(videoTag, 0.2);
        Common.sleep(3500 + 1500 * Math.random());
        return res;
    },

    /**
     * 从搜索列表进入详情
     * @returns {boolean}
     */
    intoSearchVideo() {
        let tag = UiSelector().className('android.widget.GridView').isVisibleToUser(true).findOne();
        let videoTag = tag.children().findOne(UiSelector().className('android.widget.FrameLayout').clickable(true).isVisibleToUser(true));
        if (videoTag) {
            Common.click(videoTag, 0.2);
            return true;
        }
        throw new Error('cant find video in search list');
    },

    /**
     * 从搜索页进入用户主页
     * @param {string} keyword 
     * @returns {boolean}
     */
    intoSeachUser(keyword) {
        Log.log("find account begin", keyword);
        let userTag = UiSelector().className('android.widget.TextView').filter(v => {
            return v.parent().className() == 'android.widget.RelativeLayout';
        }).isVisibleToUser(true).textContains('group_xchats').findOne();

        if (!userTag) {
            Common.log('cant found account: ' + keyword);
            return false;
        }

        let res = Common.click(userTag, 0.2);
        Common.sleep(3000 + 2000 * Math.random());
        return res;
    },

    /**
     * 搜索列表进入直播间
     * @param {string} douyin 
     * @returns {boolean}
     */
    intoLiveRoom(douyin) {
        let tag = UiSelector().text(T('直播')).filter(v => {
            return v.parent().className() == 'android.widget.Button';
        }).isVisibleToUser(true).findOne();

        if (!tag) {
            Common.log('cant found account: ' + douyin);
            return false;
        }

        Common.click(tag, 0.2);
        Common.sleep(7000 + 2000 * Math.random());
        return true;
    },

    /**
     * 主页进入搜索视频详情
     * @param {string} keyword 
     */
    homeIntoSearchVideo(keyword) {
        Search.intoSearchList(keyword, 0);
        Search.intoSearchVideo();
    },

    /**
     * 主页进入搜索用户页面
     * @param {string} keyword 
     */
    homeIntoSearchUser(keyword) {
        Search.intoSearchList(keyword, 1);
        Search.intoSeachUser(keyword);
    },

    /**
     * 进入搜索后的用户直播间
     * @param {string} douyin 
     * @param {number} type 
     * @returns 
     */
    intoUserLiveRoom(douyin, type) {
        this.intoSearchList(douyin, type);
        return this.intoLiveRoom(douyin);
    },

    /**
     * 搜索，进入用户页面，再进入视频页面
     * @param {string} douyin 
     * @param {number} type 
     * @returns {boolean}
     */
    intoUserVideoPage(douyin, type) {
        this.intoSearchList(douyin, type);
        this.intoSeachUser(douyin);
        Common.sleep(3000);
        return Video.intoUserVideo();
    },


    notInList() {
        let i = 3;
        while (i-- > 0) {
            let parent = UiSelector().className('android.widget.HorizontalScrollView').isVisibleToUser(true).findOne()
            let userTabTag = parent.children().findOne(UiSelector().text(T('用户')));

            if (userTabTag.parent().isSelected()) {
                Log.log('in user page');
                return true;
            }

            Common.sleep(5000);
        }

        Common.back();//偶尔会出现没有返回回来的情况，这里加一个判断
        Common.sleep(2000);
        Log.log('不在用户页面， 返回');
    },

    /**
     * 
     * @param {function} getAccounts 
     * @param {function} decCount 
     * @param {function} setAccount 
     * @param {function} getMsg 
     * @param {object} params 
     * @returns {boolean}
     */
    userList(getAccounts, decCount, setAccount, getMsg, params) {
        let settingData = params.settingData;
        Log.log('deal user list begin');
        let errorCount = 0;

        let rects = [];
        while (true) {
            let parent = UiSelector().className('androidx.viewpager.widget.ViewPager').isVisibleToUser(true).findOne();
            let tags = parent.children().find(UiSelector().className('android.widget.RelativeLayout').isVisibleToUser(true));
            if (tags.length === 0) {
                errorCount++;
                Log.log('user list lengs eq 0');
            } else {
                errorCount = 0;
            }

            try {
                for (let i in tags) {
                    this.notInList();
                    let accountTag = tags[i].children().findOne(UiSelector().className('android.widget.TextView').isVisibleToUser(true));
                    let account = accountTag.text();
                    if (!account || rects.includes(accountTag.text())) {
                        continue;
                    }

                    Common.click(tags[i], 0.2);
                    rects.push(accountTag.text());
                    Common.sleep(3000 + 1500 * Math.random());
                    //看看有没有视频，有的话，操作评论一下，按照20%的频率即可
                    statistics.viewUser();
                    let isPrivateAccount = User.isPrivate();
                    Log.log(account, 'account');
                    if (!account) {
                        Log.log('click user nickname, but not into user page, continue');
                        continue;
                    }

                    if (this.contents.includes(account) || getAccounts(account)) {
                        Common.back();
                        Log.log('repeat account', account);
                        Common.sleep(1000 + 500 * Math.random());
                        continue;
                    }

                    Log.log('is or not private account' + isPrivateAccount);
                    if (isPrivateAccount) {
                        Common.back();
                        Log.log('private account');
                        Common.sleep(1000 + 500 * Math.random());
                        if (decCount() <= 0) {
                            Log.log('operation complete');
                            return true;
                        }
                        setAccount(account);
                        this.contents.push(account);
                        continue;
                    }

                    //查看粉丝和作品数是否合格
                    let worksCount = User.getWorksCount();
                    if (worksCount < settingData.worksMinCount || worksCount > settingData.worksMaxCount) {
                        Log.log('The number of works does not meet the criteria', worksCount, settingData.worksMinCount, settingData.worksMaxCount);
                        setAccount(account);
                        Common.back();
                        Common.sleep(1000 + 500 * Math.random());
                        continue;
                    }

                    //查看粉丝和作品数是否合格
                    let fansCount = 0;
                    try {
                        fansCount = User.getFansCount();
                    } catch (e) {
                        Log.log(e);
                        Log.log('get fans count faild');
                        Common.back();
                        Common.sleep(1000 + 500 * Math.random());
                        continue;//大概率是没有点击进去
                    }

                    if (fansCount < settingData.fansMinCount * 1 || fansCount > settingData.fansMaxCount * 1) {
                        Log.log('粉丝数不符合', fansCount, settingData.fansMinCount, settingData.fansMaxCount);
                        setAccount(account);
                        Common.back();
                        Common.sleep(1000 + 500 * Math.random());
                        continue;
                    }

                    let nickname = User.getNickname();
                    Log.log('get nickname', nickname);

                    if (Math.random() * 100 <= settingData.focusRate * 1) {
                        User.focus();
                        Log.log('focus user');
                    }

                    if (Math.random() * 100 <= settingData.privateRate * 1) {
                        User.privateMsg(getMsg(1, nickname).msg);
                        Log.log('private msg');
                    }

                    let commentRate = Math.random() * 100;
                    let zanRate = Math.random() * 100;

                    Log.log('will into video', commentRate, zanRate);
                    if ((commentRate < settingData.commentRate * 1 || zanRate < settingData.zanRate * 1) && Video.intoUserVideo()) {
                        //点赞
                        Log.log('点赞频率检测', zanRate, settingData.zanRate * 1);
                        if (zanRate <= settingData.zanRate * 1) {
                            Video.clickZan();
                            Log.log('click like button');
                        }

                        //随机评论视频
                        Log.log('评论频率检测', commentRate, settingData.commentRate * 1);
                        if ((commentRate <= settingData.commentRate * 1)) {
                            let msg = getMsg(0, Video.getContent());
                            if (msg) {
                                Log.log('open comment window');
                                Comment.commentMsg(msg.msg);///////////////////////////////////操作  评论视频
                                Log.log('commented success');
                                Common.sleep(1000 + 500 * Math.random());//回到视频页面
                            }
                        }
                        User.backHome();
                        Log.log('go to home to check');
                    } else {
                        Log.log('not into video');
                    }

                    let r = decCount();
                    Log.log('r', r);
                    if (r <= 0) {
                        return true;
                    }

                    setAccount(account);
                    Log.log(account, getAccounts(account));
                    this.contents.push(account);
                    Common.back();
                    Log.log('back user list, may not success');
                    Common.sleep(1000 + 500 * Math.random());//用户页到列表页
                    this.notInList();
                    Common.sleep(1000 + 500 * Math.random());
                }
            } catch (e) {
                errorCount++;
                //查看是不是不在视频页面，不是则返回
                this.gotoVedioPage();
            }

            if (errorCount >= 3) {
                throw new Error('Already sent 3 times with errors, stop operation');
            }

            if (!Common.swipeSearchUserOp()) {
                Common.log('operation completed');
                Log.log('scroll faild, mean successed');
                return true;
            }
            Common.sleep(2000 + 1000 * Math.random());
        }
    },

    gotoVedioPage() {
        let k = 3;
        while (k-- > 0) {
            let closeTag = UiSelector().desc(T('关闭')).isVisibleToUser(true).clickable(true).findOne();
            if (closeTag) {
                Common.click(closeTag, 0.1);
                Common.sleep(1000 + 500 * Math.random());
                Common.log('in comment window, close it');
            }
        }
    }
}

module.exports = Search;
